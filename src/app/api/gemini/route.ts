import { NextRequest, NextResponse } from 'next/server';

// 완전히 단순화된 Gemini route
// Firebase 의존성 제거 — API 키만 있으면 작동

const MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, temperature = 0.7 } = body;

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
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens: 4096 },
          }),
        });

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
