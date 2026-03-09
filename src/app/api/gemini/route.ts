import { NextResponse } from 'next/server';

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

const RETRY_DELAYS = [800, 2000, 4000]; // ms between retries

async function callGemini(apiKey: string, model: string, prompt: string, temperature: number) {
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
  return { res, data };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const { prompt, temperature = 0.7 } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY
      || process.env.NEXT_PUBLIC_GEMINI_API_KEY
      || process.env.GOOGLE_GEMINI_API_KEY
      || '';

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not set in .env.local' }, { status: 500 });
    }

    // Try each model with retries on 503
    for (const model of MODELS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { res, data } = await callGemini(apiKey, model, prompt, temperature);

          if (res.ok) {
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (attempt > 0 || model !== MODELS[0]) {
              console.log(`[/api/gemini] success with model=${model} attempt=${attempt + 1}`);
            }
            return NextResponse.json({ text });
          }

          const status = res.status;
          const errMsg = data?.error?.message || 'Gemini API error';

          // 503 or 429 → retry after delay
          if (status === 503 || status === 429) {
            console.warn(`[/api/gemini] ${status} on model=${model} attempt=${attempt + 1}: ${errMsg}`);
            if (attempt < 2) {
              await sleep(RETRY_DELAYS[attempt]);
              continue; // retry same model
            }
            // exhausted retries on this model, try next model
            console.warn(`[/api/gemini] giving up on model=${model}, trying next`);
            break;
          }

          // Other errors (400, 401, etc.) — don't retry
          console.error(`[/api/gemini] fatal error on model=${model}: ${status} ${errMsg}`);
          return NextResponse.json({ error: errMsg }, { status });

        } catch (fetchErr: any) {
          console.error(`[/api/gemini] fetch error model=${model} attempt=${attempt + 1}:`, fetchErr.message);
          if (attempt < 2) {
            await sleep(RETRY_DELAYS[attempt]);
            continue;
          }
          break;
        }
      }
    }

    // All models exhausted
    return NextResponse.json(
      { error: 'Gemini is temporarily overloaded. Please try again in a moment.' },
      { status: 503 }
    );

  } catch (err: any) {
    console.error('/api/gemini error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
