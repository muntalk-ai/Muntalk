// app/api/cron/welcome-email/route.ts
// Vercel Cron (daily): 가입 24시간 경과 + XP 0 + 미발송 유저에게 웰컴 메일 발송.
// vercel.json crons에서 호출. CRON_SECRET Bearer 인증 필수.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { fetchWithTimeout } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface WelcomeEmailUser {
  uid: string;
  email: string;
  displayName: string;
  nativeLang: string;
  createdAt?: { toDate?: () => Date } | null;
  xp?: number;
  lessonsDone?: number;
  completedLessons?: unknown[];
  welcomeEmailSent?: boolean;
}

function welcomeHtml(name: string): string {
  const firstName = (name || 'there').split(' ')[0];
  // Duolingo-style: single column, big rounded CTA, playful emoji anchors,
  // table layout + inline styles for Gmail/Apple Mail/Outlook.
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#F1F5F9;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Say your first English sentence out loud — it takes 30 seconds.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:20px;overflow:hidden;">
  <tr><td style="background-color:#4F46E5;padding:28px 32px;text-align:center;">
    <div style="font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;">🌍 MunTalk</div>
    <div style="font-family:Arial,sans-serif;font-size:13px;color:#C7D2FE;margin-top:4px;">Your AI English speaking coach</div>
  </td></tr>
  <tr><td style="padding:36px 32px 8px;text-align:center;">
    <div style="font-size:52px;line-height:1;">🎤</div>
    <h1 style="font-family:Arial,sans-serif;font-size:26px;font-weight:bold;color:#0F172A;margin:16px 0 8px;">Hi ${firstName}, your first<br/>30 seconds are waiting</h1>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#475569;margin:0;">
      You signed up yesterday — nice first step. Now comes the fun part:
      <strong style="color:#0F172A;">saying your first English sentence out loud.</strong>
      No pressure, no judgment, just you and your AI coach.
    </p>
  </td></tr>
  <tr><td style="padding:20px 32px;text-align:center;">
    <a href="https://www.muntalk.com/lingua/placement"
       style="display:inline-block;background-color:#4F46E5;color:#ffffff;font-family:Arial,sans-serif;font-size:17px;font-weight:bold;padding:16px 40px;border-radius:999px;text-decoration:none;">Start my first 30 seconds →</a>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#94A3B8;margin:12px 0 0;">Takes 30 seconds · Free forever plan</p>
  </td></tr>
  <tr><td style="padding:8px 32px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" style="text-align:center;padding:12px 8px;vertical-align:top;">
          <div style="font-size:28px;">💬</div>
          <div style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#0F172A;margin-top:6px;">Real conversations</div>
          <div style="font-family:Arial,sans-serif;font-size:12px;color:#64748B;margin-top:4px;">150+ roleplays, not boring drills</div>
        </td>
        <td width="33%" style="text-align:center;padding:12px 8px;vertical-align:top;">
          <div style="font-size:28px;">🗣️</div>
          <div style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#0F172A;margin-top:6px;">Instant feedback</div>
          <div style="font-family:Arial,sans-serif;font-size:12px;color:#64748B;margin-top:4px;">Pronunciation correction on the spot</div>
        </td>
        <td width="33%" style="text-align:center;padding:12px 8px;vertical-align:top;">
          <div style="font-size:28px;">🔥</div>
          <div style="font-family:Arial,sans-serif;font-size:13px;font-weight:bold;color:#0F172A;margin-top:6px;">Streaks that stick</div>
          <div style="font-family:Arial,sans-serif;font-size:12px;color:#64748B;margin-top:4px;">Small daily wins, big progress</div>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="padding:4px 32px 32px;text-align:center;">
    <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#475569;margin:0;background-color:#EEF2FF;border-radius:14px;padding:16px 20px;">
      👀 Most people quit <em>before</em> their first 30 seconds.<br/>Don't be most people 🙂
    </p>
  </td></tr>
  <tr><td style="padding:20px 32px 28px;text-align:center;border-top:1px solid #F1F5F9;">
    <p style="font-family:Arial,sans-serif;font-size:12px;line-height:1.8;color:#94A3B8;margin:0;">
      Built solo by Jay — reply to this email anytime, I read everything.<br/>
      <a href="https://www.muntalk.com" style="color:#4F46E5;text-decoration:none;">muntalk.com</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    const snap = await adminDb.collection('users').get();
    for (const doc of snap.docs) {
      const u = doc.data() as WelcomeEmailUser;
      if (!u.email || u.welcomeEmailSent) { skipped++; continue; }

      // createdAt 파싱 (Firestore Timestamp | string | number)
      let createdMs = 0;
      const ca: unknown = u.createdAt;
      if (ca && typeof ca === 'object' && 'toDate' in (ca as object)) {
        createdMs = ((ca as { toDate: () => Date }).toDate()).getTime();
      } else if (typeof ca === 'string') {
        createdMs = Date.parse(ca) || 0;
      } else if (typeof ca === 'number') {
        createdMs = ca;
      }
      const ageMs = now - createdMs;
      // 24시간~72시간 사이, XP 0, 레슨 미완료인 경우만
      const xp = u.xp ?? 0;
      const lessons = Array.isArray(u.completedLessons) ? u.completedLessons.length : (u.lessonsDone ?? 0);
      if (!createdMs || ageMs < DAY || ageMs > 3 * DAY || xp > 0 || lessons > 0) { skipped++; continue; }

      try {
        const res = await fetchWithTimeout('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'MunTalk <noreply@muntalk.com>',
            to: [u.email],
            subject: '👋 Your first 30 seconds are waiting',
            html: welcomeHtml(u.displayName),
          }),
        }, 30000);
        if (!res.ok) throw new Error(`Resend ${res.status}`);
        await doc.ref.set({ welcomeEmailSent: true, welcomeEmailSentAt: new Date() }, { merge: true });
        sent++;
      } catch (e) {
        errors.push(`${u.email}: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }
    return NextResponse.json({ ok: true, sent, skipped, errors });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
