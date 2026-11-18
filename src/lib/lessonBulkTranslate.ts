// lib/lessonBulkTranslate.ts — 레슨 벌크 번역 공유 로직
//
// LessonPlayer의 벌크 번역(프롬프트 + 검증 + Gemini 호출 + 캐시 저장)을
// 추출한 순수 모듈. LessonPlayer와 Word Games가 함께 사용한다.
// QA M-1/M-2/M-5/M-6/M-4 대응 검증 규칙이 여기에 있다.
//
// - LessonPlayer: 레슨 진입 시 1개 레슨 번역 (기존 동작 그대로)
// - Word Games: 레벨의 여러 레슨을 캐시 우선으로 모아 학습 언어 단어셋 구성
//
// 클라이언트 번들에 포함되므로 firebase-admin 등 서버 전용 모듈을 절대 import하지 말 것.

import { apiFetch } from '@/lib/apiClient';
import { LESSON_TRANSLATION_CACHE_VERSION } from '@/lib/lessonTranslationCache';

export const HANGUL_RE = /[\uAC00-\uD7A3\u3131-\u318E]/;

export interface BulkVocabItem {
  word: string;
  /** Required — validateBulkTranslation rejects items without one */
  phonetic: string;
  meaning: string;
  example: string;
  exampleKo?: string;
}

export interface BulkQuizItem {
  q: string;
  options: string[];
  answer: number;
  answerText?: string;
}

export interface BulkTranslation {
  vocab: BulkVocabItem[];
  quiz: BulkQuizItem[];
}

interface SourceLesson {
  id?: string;
  title?: string;
  vocab?: Array<{ word: string; meaning: string; example: string }>;
  quiz?: Array<{ q: string; options: string[]; answer: number }>;
}

// -- Bulk translation validation (Option A hardening) --------------------------
// Returns an error description string, or null when the payload is acceptable.

function normalizeForUniqueness(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .trim()
    .replace(/^[¿?¡!.,;:()"'\s]+/, '')
    .replace(/[¿?¡!.,;:()"'\s]+$/, '')
    .replace(/\s+/g, ' ');
}

// QA M-2/M-5: quiz frame must never name a language other than the target.
// Korean "…어로" forms + English "in …" forms for the common languages.
const LANG_NAME_PATTERNS: Array<{ lang: string; re: RegExp }> = [
  { lang: 'English', re: /영어로|in english|\benglish\b/i },
  { lang: 'Korean', re: /한국어로|in korean|\bkorean\b/i },
  { lang: 'Spanish', re: /스페인어로|in spanish|\bspanish\b/i },
  { lang: 'French', re: /프랑스어로|in french|\bfrench\b/i },
  { lang: 'German', re: /독일어로|in german|\bgerman\b/i },
  { lang: 'Japanese', re: /일본어로|in japanese|\bjapanese\b/i },
  { lang: 'Chinese', re: /중국어로|in chinese|\bchinese\b|in mandarin|\bmandarin\b/i },
  { lang: 'Portuguese', re: /포르투갈어로|in portuguese|\bportuguese\b/i },
  { lang: 'Italian', re: /이탈리아어로|in italian|\bitalian\b/i },
  { lang: 'Russian', re: /러시아어로|in russian|\brussian\b/i },
  { lang: 'Vietnamese', re: /베트남어로|in vietnamese|\bvietnamese\b/i },
  { lang: 'Thai', re: /태국어로|in thai|\bthai\b/i },
];

export function validateBulkTranslation(
  parsed: any,
  lsn: SourceLesson | undefined | null,
  targetLang?: string,
  nativeLang?: string,
): string | null {
  if (!parsed || typeof parsed !== 'object') return 'empty payload';
  const baseVocab = lsn?.vocab || [];
  const baseQuiz = lsn?.quiz || [];
  if (!Array.isArray(parsed.vocab) || parsed.vocab.length !== baseVocab.length) {
    return `vocab length mismatch (got ${Array.isArray(parsed.vocab) ? parsed.vocab.length : 'n/a'}, expected ${baseVocab.length})`;
  }
  for (let i = 0; i < parsed.vocab.length; i++) {
    const v = parsed.vocab[i];
    if (!v || !v.word || !v.meaning || !v.example) return `vocab[${i}] missing word/meaning/example`;
    if (!v.exampleKo) return `vocab[${i}] missing exampleKo`;
    if (!v.phonetic) return `vocab[${i}] missing phonetic`;
  }
  if (!Array.isArray(parsed.quiz) || parsed.quiz.length !== baseQuiz.length) {
    return `quiz length mismatch (got ${Array.isArray(parsed.quiz) ? parsed.quiz.length : 'n/a'}, expected ${baseQuiz.length})`;
  }
  for (let i = 0; i < parsed.quiz.length; i++) {
    const q = parsed.quiz[i];
    if (!q || !q.q || !Array.isArray(q.options) || q.options.length < 2) return `quiz[${i}] missing q/options`;
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
      return `quiz[${i}] answer index out of range (${q.answer})`;
    }
    // answerText must equal the correct option — catches silent option reordering
    if (!q.answerText || q.options[q.answer] !== q.answerText) {
      return `quiz[${i}] answer/answerText mismatch`;
    }
  }
  // Language-leakage scan: a Korean speaker learning a non-Korean language must
  // never see Hangul inside TARGET_* fields. Catches subword-level mixing
  // (e.g. "занадто") that prompt rules alone cannot block. phonetic is
  // intentionally excluded (Hangul-style pronunciation guide by design).
  if (nativeLang === 'Korean' && targetLang && targetLang !== 'Korean') {
    const targets: Array<[string, any]> = [];
    for (let i = 0; i < parsed.vocab.length; i++) {
      targets.push([`vocab[${i}].word`, parsed.vocab[i].word]);
      targets.push([`vocab[${i}].example`, parsed.vocab[i].example]);
    }
    for (let i = 0; i < parsed.quiz.length; i++) {
      const q = parsed.quiz[i];
      (q.options || []).forEach((o: any, j: number) => targets.push([`quiz[${i}].options[${j}]`, o]));
      targets.push([`quiz[${i}].answerText`, q.answerText]);
    }
    for (const [label, text] of targets) {
      if (typeof text === 'string' && HANGUL_RE.test(text)) {
        return `${label} contains Korean (target-language leakage)`;
      }
    }
  }
  // QA M-1: vocab words must be unique in the target language.
  // (Gemini collapses Hello/Hi → Hola/Hola, Goodbye/Bye → Adiós/Adiós.)
  {
    const seen = new Map<string, number>();
    for (let i = 0; i < parsed.vocab.length; i++) {
      const key = normalizeForUniqueness(parsed.vocab[i].word);
      if (seen.has(key)) {
        return `vocab[${i}].word duplicates vocab[${seen.get(key)}].word ("${parsed.vocab[i].word}")`;
      }
      seen.set(key, i);
    }
  }
  // QA M-2: quiz options must be unique within each question.
  for (let i = 0; i < parsed.quiz.length; i++) {
    const seen = new Map<string, number>();
    const options = parsed.quiz[i].options || [];
    for (let j = 0; j < options.length; j++) {
      const key = normalizeForUniqueness(options[j]);
      if (seen.has(key)) {
        return `quiz[${i}].options[${j}] duplicates options[${seen.get(key)}] ("${options[j]}")`;
      }
      seen.set(key, j);
    }
  }
  // QA M-2/M-5: the quiz question FRAME must be in the native language and
  // must name the TARGET language, never another language.
  // For Korean natives the frame must contain Hangul (catches a fully
  // untranslated English frame, e.g. B1 "Could you tell me more…?").
  for (let i = 0; i < parsed.quiz.length; i++) {
    const q = String(parsed.quiz[i].q || '');
    if (nativeLang === 'Korean' && !HANGUL_RE.test(q)) {
      return `quiz[${i}].q has no Korean frame ("${q.slice(0, 60)}")`;
    }
    if (targetLang) {
      const wrong = LANG_NAME_PATTERNS.find(
        (p) => p.lang !== targetLang && p.re.test(q),
      );
      if (wrong) {
        return `quiz[${i}].q names "${wrong.lang}" instead of the target language ("${q.slice(0, 60)}")`;
      }
    }
  }
  // QA M-4: for Korean natives every phonetic must be Hangul-readable.
  // (Enforces the prompt rule that already requires Hangul-style notation;
  // English-style respelling like "OH-lah" is rejected here.)
  if (nativeLang === 'Korean') {
    for (let i = 0; i < parsed.vocab.length; i++) {
      const ph = String(parsed.vocab[i].phonetic || '');
      if (!HANGUL_RE.test(ph)) {
        return `vocab[${i}].phonetic is not Hangul-style ("${ph.slice(0, 40)}")`;
      }
    }
  }
  return null;
}

// -- Prompt --------------------------------------------------------------------

export function buildLessonTranslatePrompt(
  lsn: SourceLesson,
  targetLang: string,
  nativeLang: string,
): string {
  // Slim payload — exclude tutorPrompt to reduce token count ~40%
  // NOTE: example is included so the model TRANSLATES it (never invents a new one)
  // topic is included so discourse markers/connectors can be disambiguated by context
  const vocabOnly = (lsn!.vocab || []).map((v: any) => ({ word: v.word, meaning: v.meaning, example: v.example }));
  const quizOnly = (lsn!.quiz || []).map((q: any) => ({ q: q.q, options: q.options, answer: q.answer }));
  const lessonPayload = { topic: (lsn as any)?.title || '', vocab: vocabOnly, quiz: quizOnly };
  return `Translate this lesson to ${targetLang}. Student speaks ${nativeLang}.

Input: ${JSON.stringify(lessonPayload)}

Return ONLY valid JSON, no markdown, no explanation:
{"vocab":[{"word":"TARGET_WORD","phonetic":"PRONUNCIATION","meaning":"NATIVE_GLOSS","example":"TARGET_SENTENCE","exampleKo":"NATIVE_TRANSLATION"}],"quiz":[{"q":"NATIVE_QUESTION","options":["TARGET_OPTION"],"answer":INDEX,"answerText":"TARGET_CORRECT_OPTION_TEXT"}]}

Rules:
- LANGUAGE PURITY (zero tolerance): every field whose schema label is TARGET_* (word, example, options, answerText) MUST be written 100% in ${targetLang}. Never output ${nativeLang}, English, or any other language in these fields — no code-switching, no parenthetical glosses, no mixed-language sentences, no exceptions. The ONLY fields allowed in ${nativeLang} are the NATIVE_* fields (meaning, exampleKo, q). (phonetic is intentionally a ${nativeLang}-readable pronunciation guide, not a translation.)
- vocab[i].word: the word/expression translated into ${targetLang}
- vocab[i].phonetic: pronunciation guide a ${nativeLang} speaker can read aloud. If ${nativeLang} is Korean, use Hangul-style notation (e.g. "봉주르"); otherwise simple romanization.
- vocab[i].meaning: 1-3 word gloss of the TARGET expression itself in ${nativeLang}. Do NOT translate the usage note from the input — give what the expression actually means (e.g. Korean "~인 것 같다" for "Il semblerait que"). When the expression carries register or pragmatic nuance, append a tag in ${nativeLang} (e.g. Korean "[격식]", "[비격식]", "[문어체]", "[구어]", "[빈정]", "[반어]", "[완곡]").
- Idioms: NEVER translate an idiom literally. If ${targetLang} has an equivalent idiom, use it; otherwise translate the actual meaning explanatorily (e.g. "kick the can down the road" must become "문제를 뒤로 미루다"-style meaning, never a literal kick/can rendering).
- Discourse markers / connectors (e.g. "Nevertheless", "That said", "What is more", "Notwithstanding"): use the lesson topic to choose the nuance that fits the context — do not default to one generic translation for every lesson.
- Grammar with no ${targetLang} equivalent (e.g. English inversion "Were it not for…", "Should you need…"): keep the original structure, translate the sentence naturally, and add a short grammar note in ${nativeLang} inside the meaning field (in parentheses) explaining the structure and the natural ${targetLang} equivalent.
- vocab[i].example: translate the GIVEN example sentence into ${targetLang}, keeping the same meaning. Do NOT invent a new sentence. It MUST be written in ${targetLang} — never in ${nativeLang}.
- vocab[i].exampleKo: translation of the example sentence into ${nativeLang}
- quiz[i].q: question in ${nativeLang} — the question FRAME must always be ${nativeLang}, even when quoting a ${targetLang} idiom or expression inside it (quote the expression, ask the question in ${nativeLang})
- quiz[i].options: answer choices in ${targetLang} — 100% ${targetLang} only, never ${nativeLang} or mixed
- quiz[i].answer: integer index (0-based) of the correct option
- quiz[i].answerText: the EXACT text of the correct option (must be identical to options[answer]) — this guards against option reordering
- QA UNIQUENESS (M-1/M-2): vocab words must ALL be different in ${targetLang}. If two source words translate to the same ${targetLang} word (e.g. Hello/Hi, Goodbye/Bye), use distinct natural alternatives for each — a different register, a fuller phrase, or a synonym — never output the same word twice. Likewise quiz options within each question must ALL be different in ${targetLang} — never repeat an option.
- QA QUESTION FRAME (M-2/M-5): if the source quiz question names a language (e.g. "in English"), rewrite the frame to name ${targetLang} instead. The frame must be in ${nativeLang} and must name the TARGET language, never English or any other language.
- QA CONTRAST ORDER (M-6): when the source contrasts two terms (A vs B, e.g. "Metaphor vs Simile"), keep the SAME order in the ${nativeLang} gloss and in the example — never swap them.
- QA PHONETIC (M-4): if ${nativeLang} is Korean, write phonetic ONLY in Hangul (e.g. "올라") — never English-style respelling like "OH-lah".
IMPORTANT: Output must be complete valid JSON. Do not truncate.`;
}

// -- Gemini call + JSON repair + validate + cache PUT ---------------------------

// 벌크 레슨 번역은 응답이 커서(실측 ~21s) 전역 AI_TIMEOUT_MS(35s)로는 여유가 부족함 — 이 호출 전용 90s 제한시간
export const LESSON_TRANSLATE_TIMEOUT_MS = 90_000;

function parseBulkJson(raw: string): any {
  // Step 1: strip markdown fences
  let clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```[\s\S]*$/i, '')
    .trim();

  // Step 2: extract JSON object if embedded in text
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (jsonMatch) clean = jsonMatch[0];

  // Step 3: parse with truncation recovery
  try {
    return JSON.parse(clean);
  } catch (e1) {
    // Try to fix truncated JSON — add closing brackets
    console.warn('[lesson] JSON truncated, attempting repair...');
    let fixed = clean;
    // Count open/close braces and brackets
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    // Remove trailing comma if any
    fixed = fixed.replace(/,\s*$/, '');
    // Close incomplete string
    const lastQuote = fixed.lastIndexOf('"');
    const secondLast = fixed.lastIndexOf('"', lastQuote - 1);
    if (lastQuote > secondLast && fixed.length - lastQuote > 30) {
      fixed = fixed.slice(0, lastQuote) + '"'; // truncate dangling string
    }
    // Append missing closing brackets/braces
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
    try {
      const parsed = JSON.parse(fixed);
      console.log('[lesson] ✅ JSON repaired successfully');
      return parsed;
    } catch (e2) {
      console.error('[lesson] JSON repair failed:', e2);
      throw new Error('Invalid JSON from Gemini: ' + String(e1));
    }
  }
}

export interface TranslateLessonBulkOpts {
  lesson: SourceLesson;
  /** Display name, e.g. "Spanish" / "Korean" (promptLangName) */
  targetLang: string;
  nativeLang: string;
  /** BCP-47 codes for the cache key, e.g. "es-ES" / "ko-KR" */
  langId: string;
  subLang: string;
  uid?: string | null;
}

export async function translateLessonBulk(
  opts: TranslateLessonBulkOpts,
  attempt = 0,
): Promise<BulkTranslation> {
  const { lesson: lsn, targetLang, nativeLang, langId, subLang, uid } = opts;
  const prompt = buildLessonTranslatePrompt(lsn, targetLang, nativeLang);
  let parsed: any;
  try {
    const res = await apiFetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid ?? null, prompt, temperature: 0.3 }),
      timeoutMs: LESSON_TRANSLATE_TIMEOUT_MS,
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const raw = data.text?.trim() ?? '';
    parsed = parseBulkJson(raw);
  } catch (e) {
    // 타임아웃/네트워크 실패 시 1회 재시도 (검증 실패 재시도와 attempt 카운터 공유 — 총 최대 2회 시도)
    if (attempt < 1) {
      console.warn('[lesson] Gemini API error — retrying once...', (e as Error)?.message || e);
      return translateLessonBulk(opts, attempt + 1);
    }
    throw e;
  }

  if (!parsed?.vocab && !parsed?.quiz) throw new Error('Empty lesson data');

  // Option A: validate bulk translation before accepting it
  const validationError = validateBulkTranslation(parsed, lsn, targetLang, nativeLang);
  if (validationError) {
    if (attempt < 1) {
      console.warn(`[lesson] validation failed (${validationError}) — retrying once...`);
      return translateLessonBulk(opts, attempt + 1);
    }
    throw new Error('Translation validation failed: ' + validationError);
  }

  // 검증 통과한 번역만 캐시에 저장 — fire-and-forget (UI 블로킹 금지, 실패 무시)
  const lessonId = lsn.id;
  if (lessonId && subLang && Array.isArray(parsed.vocab) && Array.isArray(parsed.quiz)) {
    apiFetch('/api/lesson-translation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'put',
        lessonId,
        targetLang: langId,
        nativeLang: subLang,
        version: LESSON_TRANSLATION_CACHE_VERSION,
        data: { vocab: parsed.vocab, quiz: parsed.quiz },
      }),
      timeoutMs: 5000,
    }).catch(() => { /* 캐시 저장 실패는 무시 — 다음 진입 때 재생성됨 */ });
  }

  return parsed as BulkTranslation;
}

// -- Cache read-through ---------------------------------------------------------

/** Firestore `lesson_translations` 캐시 조회 — 미스면 null (Gemini를 부르지 않음) */
export async function getCachedLessonTranslation(
  lessonId: string,
  targetLang: string,
  nativeLang: string,
): Promise<BulkTranslation | null> {
  try {
    const res = await apiFetch('/api/lesson-translation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get',
        lessonId,
        targetLang,
        nativeLang,
        version: LESSON_TRANSLATION_CACHE_VERSION,
      }),
      timeoutMs: 3500,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const cached = data?.hit ? data.data : null;
    if (cached && Array.isArray(cached.vocab) && Array.isArray(cached.quiz)) {
      return cached as BulkTranslation;
    }
    return null;
  } catch {
    return null;
  }
}

/** 캐시 우선 — 미스면 Gemini로 번역하고 캐시에 저장한다 */
export async function getLessonTranslation(
  opts: TranslateLessonBulkOpts,
): Promise<BulkTranslation> {
  const cached = await getCachedLessonTranslation(opts.lesson.id || '', opts.langId, opts.subLang);
  if (cached) return cached;
  return translateLessonBulk(opts);
}
