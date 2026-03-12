// app/api/send-daily/route.ts
// 매일 09:00 KST (00:00 UTC) 실행 — 이메일 + 텔레그램 동시 발송
// vercel.json: { "crons": [{ "path": "/api/send-daily", "schedule": "0 0 * * *" }] }

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
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

async function sendTelegram(chatId: string, html: string) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch {}
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Lingua AI <noreply@yourdomain.com>',
        to: [to], subject, html,
      }),
    });
    return res.ok;
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  // Vercel Cron 인증
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db    = getAdminDb();
  const today = new Date().toISOString().slice(0, 10);
  let   emailSent = 0, telegramSent = 0, streakWarnings = 0;

  try {
    const usersSnap = await db.collection('users').get();

    for (const userDoc of usersSnap.docs) {
      const u = userDoc.data();
      if (!u.email) continue;

      const name       = u.displayName || 'there';
      const streak     = u.streak || 0;
      const lastActive = u.lastActive || '';
      const isAtRisk   = lastActive !== today && streak >= 3;

      // SRS 카드 (오늘 복습 대상)
      let dueCount  = 0;
      let sentences: Array<{ word: string; translation: string; sentence?: string }> = [];
      try {
        const cardsSnap = await db
          .collection('users').doc(userDoc.id)
          .collection('srs_cards')
          .where('nextReview', '<=', today)
          .limit(10).get();
        dueCount  = cardsSnap.size;
        sentences = cardsSnap.docs.slice(0, 5).map(d => ({
          word: d.data().word, translation: d.data().translation, sentence: d.data().exampleSentence,
        }));
      } catch {}

      if (dueCount === 0 && !isAtRisk) continue;

      // ── 메시지 본문 ──────────────────────────────────────────────
      let emailSubject: string;
      let emailHtml:    string;
      let telegramHtml: string;

      if (isAtRisk) {
        emailSubject = `🔥 Don't break your ${streak}-day streak, ${name}!`;
        emailHtml = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#EF4444,#F97316);padding:36px;text-align:center;">
    <div style="font-size:52px;margin-bottom:10px;">🔥</div>
    <h1 style="color:#fff;margin:0;font-size:24px;">Streak at risk!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">${streak}-day streak ends at midnight</p>
  </div>
  <div style="padding:32px;text-align:center;">
    <p style="font-size:15px;color:#374151;">Hi ${name}! You have <strong>${dueCount} cards</strong> waiting. Just 5 minutes to save your streak!</p>
    <a href="${APP_URL}/lingua" style="display:inline-block;margin-top:16px;padding:14px 36px;background:linear-gradient(135deg,#EF4444,#F97316);color:#fff;text-decoration:none;border-radius:16px;font-weight:bold;font-size:15px;">💪 Save My Streak</a>
  </div>
  <div style="padding:16px 32px;background:#FEF2F2;text-align:center;font-size:11px;color:#94A3B8;">
    <a href="${APP_URL}/profile" style="color:#6366F1;">Manage notifications</a>
  </div>
</div>`;
        telegramHtml = `🔥 <b>Streak Alert, ${name}!</b>\n\nYour <b>${streak}-day streak</b> ends tonight!\nYou have <b>${dueCount}</b> cards due.\n\n<a href="${APP_URL}/lingua">💪 Save My Streak →</a>`;
        streakWarnings++;
      } else {
        const wordRows = sentences.map(s =>
          `<tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;">
            <b style="color:#6366F1;font-size:15px;">${s.word}</b><br>
            <span style="color:#374151;">${s.sentence || ''}</span><br>
            <span style="color:#94A3B8;font-size:13px;">${s.translation}</span>
          </td></tr>`
        ).join('');

        const telegramWords = sentences.map(s =>
          `📖 <b>${s.word}</b> — ${s.translation}${s.sentence ? `\n    <i>${s.sentence}</i>` : ''}`
        ).join('\n\n');

        emailSubject = `📚 ${dueCount} words ready for review!`;
        emailHtml = `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:36px;text-align:center;">
    <div style="font-size:44px;margin-bottom:10px;">🌍</div>
    <h1 style="color:#fff;margin:0;font-size:22px;">Daily Review Ready!</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Hi ${name}! ${dueCount} cards are waiting · 🔥 ${streak} day streak</p>
  </div>
  <div style="padding:28px 32px;">
    <h3 style="color:#0F172A;margin:0 0 16px;">Today's words</h3>
    <table style="width:100%;border-collapse:collapse;">${wordRows}</table>
    <div style="text-align:center;margin-top:24px;">
      <a href="${APP_URL}/lingua/review" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;text-decoration:none;border-radius:16px;font-weight:bold;font-size:15px;">▶️ Start Reviewing</a>
    </div>
  </div>
  <div style="padding:16px 32px;background:#F8FAFC;text-align:center;font-size:11px;color:#94A3B8;">
    <a href="${APP_URL}/profile" style="color:#6366F1;">Manage notifications</a>
  </div>
</div>`;
        telegramHtml = `🌍 <b>Daily Review, ${name}!</b>\n\n🔥 Streak: <b>${streak} days</b>  📚 Due: <b>${dueCount}</b>\n\n<b>Today's words:</b>\n\n${telegramWords}\n\n<a href="${APP_URL}/lingua/review">▶️ Start Reviewing →</a>`;
      }

      // ── 발송 ────────────────────────────────────────────────────
      // 이메일
      if (u.emailNotifications !== false && u.email) {
        const ok = await sendEmail(u.email, emailSubject, emailHtml);
        if (ok) emailSent++;
      }

      // 텔레그램
      if (u.telegramConnected && u.telegramChatId) {
        await sendTelegram(u.telegramChatId, telegramHtml);
        telegramSent++;
      }
    }

    return NextResponse.json({
      success: true,
      emailSent, telegramSent, streakWarnings,
      total: usersSnap.size,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
