import { NextRequest, NextResponse } from 'next/server';
import {
  getIdentity, checkRateLimit, clientIp, apiError, fetchWithTimeout, apiSafeError,
} from '@/lib/apiGuard';
import { getAdminDb } from '@/lib/serverAuth';
import { LEARN_LANGUAGES } from '@/data/languages';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Grammar Hub — native-language explanations.
// POST { chapterId, learnLang, nativeLang } (BCP-47 codes).
// Source priority: Firestore `grammar_nl/{learnBase}_{nativeBase}__{chapterId}`
//   → Gemini generates structured JSON → schema-validate → cache → return.
// Grammar terms & example sentences stay in the learning language;
// only the explanations are written in the learner's native language.

const baseOf = (code: string) => code.split('-')[0].toLowerCase();
const SUPPORTED = new Set(LEARN_LANGUAGES.map((l) => baseOf(l.code)));

// First label wins per base language (regional variants share the base name).
const BASE_LABEL: Record<string, string> = {};
for (const l of LEARN_LANGUAGES) {
  const b = baseOf(l.code);
  if (!BASE_LABEL[b]) BASE_LABEL[b] = l.label;
}
const langName = (code: string) => BASE_LABEL[baseOf(code)] || code;

// Gemini model fallback chain — same as /api/gemini (env-managed).
const MODELS = (process.env.GEMINI_MODEL || 'gemini-3.8-flash,gemini-2.5-flash')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

export interface NlExplanation {
  subtitle: string;
  keyPoint: string;
  useCases: { label: string; note: string }[];
  mistakes: { note: string }[];
  tip: string;
  quiz: { explanation: string }[];
  exampleTranslations: string[];
}

// ── Chapter loading (same source priority as /api/grammar/chapters) ─────────

async function loadChapter(learnBase: string, chapterId: string): Promise<any> {
  try {
    const snap = await getAdminDb().collection('grammar_cache').doc(learnBase).get();
    if (snap.exists) {
      const data = snap.data() as { chapters?: any[] };
      const ch = (data.chapters || []).find((c) => c?.id === chapterId);
      if (ch) return ch;
    }
  } catch {
    // Firestore unavailable → static pack.
  }
  const file = await readFile(
    join(process.cwd(), 'public', 'grammar', `${learnBase}.json`),
    'utf8',
  );
  const parsed = JSON.parse(file);
  const chapters = Array.isArray(parsed) ? parsed : parsed.chapters;
  const ch = (chapters || []).find((c: any) => c?.id === chapterId);
  if (!ch) throw new Error('chapter-not-found');
  return ch;
}

// ── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(ch: any, learnName: string, nativeName: string): string {
  // Slim the chapter: the model only needs the fields it must explain.
  const slim = {
    id: ch.id,
    title: ch.title,
    level: ch.level,
    subtitle: ch.subtitle,
    keyPoint: ch.keyPoint,
    useCases: (ch.useCases || []).map((u: any) => ({ label: u.label, example: u.example })),
    examples: (ch.examples || []).map((e: any) => e.en),
    mistakes: (ch.mistakes || []).map((m: any) => ({ wrong: m.wrong, right: m.right })),
    tip: ch.tip || '',
    quiz: (ch.quiz || []).map((q: any) => ({ question: q.question, options: q.options })),
  };
  return `You are a grammar explainer for language learners.
The learner is studying ${learnName}. Their native language is ${nativeName}.

Below is a grammar chapter as JSON. Write the explanations in ${nativeName}.
STRICT RULES:
- Grammar terms, example sentences, quiz questions and options stay in ${learnName} EXACTLY as given — never translate them.
- Every explanation must be in ${nativeName}: clear, concise, appropriate for CEFR level ${ch.level}.
- Array fields must keep the SAME count and order as the input chapter.
- Return ONLY valid JSON matching the schema below. No markdown fences, no commentary.

SCHEMA:
{
  "subtitle": "one-liner in ${nativeName}",
  "keyPoint": "1-2 sentence key point in ${nativeName}",
  "useCases": [{"label": "short label in ${nativeName}", "note": "one-sentence when-to-use note in ${nativeName}"}],
  "mistakes": [{"note": "why it is wrong, in ${nativeName}"}],
  "tip": "pro tip in ${nativeName} (empty string if the chapter has no tip)",
  "quiz": [{"explanation": "why the answer is correct, in ${nativeName}"}],
  "exampleTranslations": ["translation of example 1 in ${nativeName}"]
}

CHAPTER:
${JSON.stringify(slim)}`;
}

// ── Schema validation ──────────────────────────────────────────────────────

function validate(exp: any, ch: any): exp is NlExplanation {
  if (!exp || typeof exp !== 'object') return false;
  const isStr = (v: any) => typeof v === 'string' && v.length > 0;
  const len = (a: any) => (Array.isArray(a) ? a.length : -1);
  if (!isStr(exp.subtitle) || !isStr(exp.keyPoint)) return false;
  if (typeof exp.tip !== 'string') return false;
  if (len(exp.useCases) !== len(ch.useCases)) return false;
  if (len(exp.mistakes) !== len(ch.mistakes)) return false;
  if (len(exp.quiz) !== len(ch.quiz)) return false;
  if (len(exp.exampleTranslations) !== len(ch.examples)) return false;
  if (!exp.useCases.every((u: any) => isStr(u?.label) && isStr(u?.note))) return false;
  if (!exp.mistakes.every((m: any) => isStr(m?.note))) return false;
  if (!exp.quiz.every((q: any) => isStr(q?.explanation))) return false;
  if (!exp.exampleTranslations.every(isStr)) return false;
  return true;
}

// ── Gemini generation ──────────────────────────────────────────────────────

async function generate(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      }, 60000);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text.trim()) return text;
      }

      const errData = await res.json().catch(() => ({}));
      console.warn(`[grammar-explain] ${model} failed: ${res.status}`, errData);

      // API key invalid — no point trying other models
      if (res.status === 400 || res.status === 403) {
        throw new Error(`Gemini API error: ${res.status}`);
      }
    } catch (e: any) {
      console.error(`[grammar-explain] ${model} exception:`, e.message);
      if (/Gemini API error|not configured/.test(e.message)) throw e;
    }
  }
  throw new Error('All Gemini models failed');
}

// ── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { chapterId, learnLang, nativeLang } = body;

    if (typeof chapterId !== 'string' || !chapterId.trim()) {
      return apiError('Missing chapterId', 400);
    }
    const learnBase = baseOf(String(learnLang || 'en-US'));
    const nativeBase = baseOf(String(nativeLang || ''));
    if (!SUPPORTED.has(learnBase)) return apiError('Unsupported learn language', 400);
    if (!nativeBase) return apiError('Missing nativeLang', 400);
    // Same-language requests are pointless (client hides the toggle); reject defensively.
    if (nativeBase === learnBase) return apiError('Native language equals learning language', 400);

    // ── PR-F: abuse guards (public learning content — generous limit) ──
    const id = await getIdentity(req);
    const rlKey = id ? `grammar-exp:uid:${id.uid}` : `grammar-exp:ip:${clientIp(req)}`;
    const rl = checkRateLimit(rlKey, 60, 60_000);
    if (!rl.ok) return apiError('Rate limit exceeded', 429, { retryAfterSec: rl.retryAfterSec });

    const docId = `${learnBase}_${nativeBase}__${chapterId}`;
    const col = getAdminDb().collection('grammar_nl');

    // 1. Cache hit.
    try {
      const snap = await col.doc(docId).get();
      if (snap.exists) {
        return NextResponse.json({ ...(snap.data() as object), source: 'cache' });
      }
    } catch {
      // Firestore unavailable → generate without cache.
    }

    // 2. Load the chapter to explain.
    let ch: any;
    try {
      ch = await loadChapter(learnBase, chapterId);
    } catch {
      return apiError('Chapter not found', 404);
    }

    // 3. Generate.
    const prompt = buildPrompt(ch, langName(learnBase), langName(nativeBase));
    let raw: string;
    try {
      raw = await generate(prompt);
    } catch (e: any) {
      return apiError(e.message || 'Generation failed', 503);
    }

    let exp: any;
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
      exp = JSON.parse(cleaned);
    } catch {
      console.error('[grammar-explain] invalid JSON for', docId);
      return apiError('Generation returned invalid JSON', 502);
    }
    if (!validate(exp, ch)) {
      console.error('[grammar-explain] schema mismatch for', docId);
      return apiError('Generation failed schema validation', 502);
    }

    // 4. Cache and return.
    const record = {
      ...exp,
      chapterId,
      learnBase,
      nativeBase,
      updatedAt: new Date().toISOString(),
    };
    try {
      await col.doc(docId).set(record);
    } catch (e) {
      console.error('[grammar-explain] cache write failed', docId, e);
    }
    return NextResponse.json({ ...record, source: 'generated' });
  } catch (e) {
    return apiSafeError('[grammar-explain] route error:', e);
  }
}
