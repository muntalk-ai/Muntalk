import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebaseAdmin'; // 서버 전용 Admin DB 사용

const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];
const RETRY_DELAYS = [800, 2000, 4000];
const FREE_DAILY_CHAT_LIMIT = 5; 

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

// -- Chat usage helpers (Admin SDK 문법으로 수정됨) ----------------------
async function getChatUsage(uid: string): Promise<{ date: string; count: number }> {
  try {
    // Admin SDK: .collection().doc().get() 방식
    const snap = await db.collection('chat_usage').doc(uid).get();
    const today = new Date().toISOString().slice(0, 10);
    
    if (snap.exists) {
      const d = snap.data() as { date: string; count: number };
      if (d.date === today) return d;
    }
  } catch (err) {
    console.error('getChatUsage error:', err);
  }
  return { date: new Date().toISOString().slice(0, 10), count: 0 };
}

async function incrementChatUsage(uid: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const current = await getChatUsage(uid);
  
  // Admin SDK: .set() 방식
  await db.collection('chat_usage').doc(uid).set({
    date: today,
    count: current.date === today ? current.count + 1 : 1,
  });
}

async function getPlanId(uid: string): Promise<string> {
  try {
    const snap = await db.collection('subscriptions').doc(uid).get();
    if (snap.exists) return (snap.data() as any).planId || 'free';
  } catch (err) {}
  return 'free';
}

// ----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { prompt, temperature = 0.7, uid, purpose } = await req.json();

    const isPlacement = purpose === 'placement';
    const isGuest = !uid;

    if (!isPlacement && !isGuest) {
      const planId = await getPlanId(uid);
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'muntalkofficial@gmail.com';
      
      // Admin SDK로 유저 프로필 확인
      const userSnap = await db.collection('users').doc(uid).get();
      const userEmailFromProfile = userSnap.data()?.email as string | undefined;

      if (userEmailFromProfile === ADMIN_EMAIL) {
        // 관리자 통과
      } else if (planId === 'free') {
        const usage = await getChatUsage(uid);
        const today = new Date().toISOString().slice(0, 10);
        const todayCount = usage.date === today ? usage.count : 0;
        
        if (todayCount >= FREE_DAILY_CHAT_LIMIT) {
          return NextResponse.json(
            {
              error: 'CHAT_LIMIT_REACHED',
              message: `Free trial allows ${FREE_DAILY_CHAT_LIMIT} AI chats per day.`,
              used: todayCount,
              limit: FREE_DAILY_CHAT_LIMIT,
            },
            { status: 429 }
          );
        }
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    for (const model of MODELS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { res, data } = await callGemini(apiKey, model, prompt, temperature);

          if (res.ok) {
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (!isPlacement && uid) {
              const planId2 = await getPlanId(uid).catch(() => 'free');
              if (planId2 === 'free') {
                await incrementChatUsage(uid).catch(() => {});
              }
            }
            return NextResponse.json({ text });
          }
          
          if (res.status === 503 || res.status === 429) {
            if (attempt < 2) { await sleep(RETRY_DELAYS[attempt]); continue; }
            break;
          }
          return NextResponse.json({ error: 'Gemini Error' }, { status: res.status });
        } catch (fetchErr) {
          if (attempt < 2) { await sleep(RETRY_DELAYS[attempt]); continue; }
          break;
        }
      }
    }

    return NextResponse.json({ error: 'Overloaded' }, { status: 503 });

  } catch (err: any) {
    console.error('/api/gemini error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}