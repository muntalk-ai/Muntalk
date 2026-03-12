import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
];
const RETRY_DELAYS = [800, 2000, 4000];
const FREE_DAILY_CHAT_LIMIT = 5; // 14일 체험: 5회/일

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

// ── Chat usage helpers (서버사이드 Firestore 직접 접근) ──────────────────────
async function getChatUsage(uid: string): Promise<{ date: string; count: number }> {
  try {
    const snap = await getDoc(doc(db, 'chat_usage', uid));
    const today = new Date().toISOString().slice(0, 10);
    if (snap.exists()) {
      const d = snap.data() as { date: string; count: number };
      if (d.date === today) return d;
    }
  } catch {}
  return { date: new Date().toISOString().slice(0, 10), count: 0 };
}

async function incrementChatUsage(uid: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const current = await getChatUsage(uid);
  await setDoc(doc(db, 'chat_usage', uid), {
    date:  today,
    count: current.date === today ? current.count + 1 : 1,
  });
}

async function getPlanId(uid: string): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'subscriptions', uid));
    if (snap.exists()) return snap.data().planId || 'free';
  } catch {}
  return 'free';
}

// ────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { prompt, temperature = 0.7, uid, purpose } = await req.json();

    // ── placement 테스트는 로그인/제한 없이 허용 ───────────────────────────
    const isPlacement = purpose === 'placement';

    // ── 채팅 제한 체크 (placement 제외) ────────────────────────────────────
    if (!isPlacement) {
      if (!uid) {
        return NextResponse.json(
          { error: 'LOGIN_REQUIRED', message: 'Please log in to use the AI tutor.' },
          { status: 401 }
        );
      }

      const planId = await getPlanId(uid);
      if (planId === 'free') {
        const usage = await getChatUsage(uid);
        const today = new Date().toISOString().slice(0, 10);
        const todayCount = usage.date === today ? usage.count : 0;
        if (todayCount >= FREE_DAILY_CHAT_LIMIT) {
          return NextResponse.json(
            {
              error: 'CHAT_LIMIT_REACHED',
              message: `Free trial allows ${FREE_DAILY_CHAT_LIMIT} AI chats per day. Upgrade to Premium for unlimited chats.`,
              used: todayCount,
              limit: FREE_DAILY_CHAT_LIMIT,
            },
            { status: 429 }
          );
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const apiKey = process.env.GEMINI_API_KEY
      || process.env.NEXT_PUBLIC_GEMINI_API_KEY
      || process.env.GOOGLE_GEMINI_API_KEY
      || '';

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not set in .env.local' }, { status: 500 });
    }

    // Try each model with retries
    for (const model of MODELS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { res, data } = await callGemini(apiKey, model, prompt, temperature);

          if (res.ok) {
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            // 성공 시 사용 횟수 증가 (placement 제외)
            if (!isPlacement && uid) {
              const planId2 = await getPlanId(uid).catch(() => 'free');
              if (planId2 === 'free') {
                await incrementChatUsage(uid).catch(() => {});
              }
            }
            if (attempt > 0 || model !== MODELS[0]) {
              console.log(`[/api/gemini] success model=${model} attempt=${attempt + 1}`);
            }
            return NextResponse.json({ text });
          }

          const status = res.status;
          const errMsg = data?.error?.message || 'Gemini API error';

          if (status === 503 || status === 429) {
            console.warn(`[/api/gemini] ${status} model=${model} attempt=${attempt + 1}: ${errMsg}`);
            if (attempt < 2) { await sleep(RETRY_DELAYS[attempt]); continue; }
            console.warn(`[/api/gemini] giving up on model=${model}`);
            break;
          }

          console.error(`[/api/gemini] fatal model=${model}: ${status} ${errMsg}`);
          return NextResponse.json({ error: errMsg }, { status });

        } catch (fetchErr: any) {
          console.error(`[/api/gemini] fetch error model=${model} attempt=${attempt + 1}:`, fetchErr.message);
          if (attempt < 2) { await sleep(RETRY_DELAYS[attempt]); continue; }
          break;
        }
      }
    }

    return NextResponse.json(
      { error: 'Gemini is temporarily overloaded. Please try again in a moment.' },
      { status: 503 }
    );

  } catch (err: any) {
    console.error('/api/gemini error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
