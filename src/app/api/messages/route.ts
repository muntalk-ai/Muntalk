import { NextResponse } from 'next/server';

// Gemini API proxy
// Request body: { prompt: string, temperature?: number }
// Response:     { text: string } | { error: string }

export async function POST(req: Request) {
  try {
    const { prompt, temperature = 0.7 } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || '';
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[/api/gemini] error:', JSON.stringify(data));
      return NextResponse.json({ error: data?.error?.message || 'Gemini API error' }, { status: res.status });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return NextResponse.json({ text });
  } catch (err) {
    console.error('/api/gemini error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
