// app/api/telegram/webhook/route.ts
// 텔레그램 봇 webhook — 유저가 /start 보내면 chat_id 저장

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY || '{}')) });
  }
  return getFirestore();
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendReply(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId   = message.chat?.id;
    const text     = message.text || '';
    const fromName = message.from?.first_name || 'there';

    // /start {uid} — 앱 연결
    if (text.startsWith('/start')) {
      const uid = text.split(' ')[1]?.trim();
      if (uid) {
        const db = getAdminDb();
        // 유저 문서에 telegramChatId 저장
        await db.collection('users').doc(uid).update({
          telegramChatId: String(chatId),
          telegramConnected: true,
        });
        await sendReply(chatId, `🌍 <b>Welcome to Lingua AI, ${fromName}!</b>

You're now connected! You'll receive:
📚 Daily vocabulary review
🔥 Streak reminders  
🏆 League updates

Type /help to see all commands.`);
      } else {
        await sendReply(chatId, `🌍 <b>Lingua AI Bot</b>

Connect your account via the app to receive study reminders!

Go to: Profile → Notifications → Connect Telegram`);
      }
    }

    // /review — 오늘 복습할 단어 보내기
    else if (text === '/review') {
      await sendReply(chatId, `📚 Open the app to start your review session!\n\n<a href="${process.env.NEXT_PUBLIC_APP_URL}/lingua/review">▶️ Start Reviewing</a>`);
    }

    // /streak — 스트릭 확인
    else if (text === '/streak') {
      // chat_id로 유저 찾기
      const db = getAdminDb();
      const snap = await db.collection('users').where('telegramChatId', '==', String(chatId)).limit(1).get();
      if (!snap.empty) {
        const user = snap.docs[0].data();
        await sendReply(chatId, `🔥 Your current streak: <b>${user.streak || 0} days</b>\n⭐ Total XP: <b>${(user.xp || 0).toLocaleString()}</b>`);
      } else {
        await sendReply(chatId, 'Connect your account first via the app!');
      }
    }

    // /stop — 알림 끄기
    else if (text === '/stop') {
      const db = getAdminDb();
      const snap = await db.collection('users').where('telegramChatId', '==', String(chatId)).limit(1).get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({ telegramConnected: false });
        await sendReply(chatId, '🔕 Notifications disabled. Type /start to re-enable anytime.');
      }
    }

    // /help
    else if (text === '/help') {
      await sendReply(chatId, `🌍 <b>Lingua AI Bot Commands</b>

/review — Open today's review
/streak — Check your streak & XP  
/stop   — Disable notifications
/help   — Show this message`);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Telegram webhook error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
