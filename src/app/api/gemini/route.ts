import { NextRequest, NextResponse } from 'next/server';
import {
  getIdentity, checkRateLimit, clientIp, apiError, fetchWithTimeout,
} from '@/lib/apiGuard';

// 완전히 단순화된 Gemini route
// Firebase 의존성 제거 — API 키만 있으면 작동

// Gemini model fallback chain — configurable via GEMINI_MODEL (comma-separated).
// Defaults use current models only: gemini-1.5-flash / gemini-2.0-flash are retired (404).
const MODELS = (process.env.GEMINI_MODEL || 'gemini-3.8-flash,gemini-2.5-flash')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, temperature = 0.7 } = body;

    // ── PR-F: abuse guards ──
    // 로그인 유저: UID 기준 분당 60회. 게스트(Micro-Talk 등): IP 기준 분당 20회.
    const id = await getIdentity(req);
    const rlKey = id ? `gemini:uid:${id.uid}` : `gemini:ip:${clientIp(req)}`;
    const rl = checkRateLimit(rlKey, id ? 60 : 20, 60_000);
    if (!rl.ok) return apiError('Rate limit exceeded', 429, { retryAfterSec: rl.retryAfterSec });

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return apiError('Missing prompt', 400);
    }
    if (prompt.length > 8000) {
      return apiError('Prompt too long (max 8000 chars)', 413);
    }
    const temp = Math.min(2, Math.max(0, Number(temperature) || 0));

    const apiKey = process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      console.error('[gemini] GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    for (const model of MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: temp, maxOutputTokens: 4096 },
          }),
        }, 30000);

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          return NextResponse.json({ text });
        }

        const errData = await res.json().catch(() => ({}));
        console.warn(`[gemini] ${model} failed: ${res.status}`, errData);

        // API key invalid — no point trying other models
        if (res.status === 400 || res.status === 403) {
          return NextResponse.json(
            { error: `Gemini API error: ${res.status} — check GEMINI_API_KEY in Vercel` },
            { status: 500 }
          );
        }

      } catch (e: any) {
        console.error(`[gemini] ${model} exception:`, e.message);
      }
    }

    return NextResponse.json(
      { error: 'All Gemini models failed' },
      { status: 503 }
    );

  } catch (err: any) {
    console.error('[gemini] route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
