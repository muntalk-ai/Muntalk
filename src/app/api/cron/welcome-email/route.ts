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
  return `
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
  <h2 style="color:#4f46e5">👋 Hi ${firstName}, still there?</h2>
  <p>You signed up for <strong>MunTalk</strong> yesterday — your AI English speaking coach is ready when you are.</p>
  <p>Most people quit before their <strong>first 30 seconds</strong>. Don't be most people 🙂</p>
  <p>Tap below and say your first sentence out loud. It takes 30 seconds, no pressure:</p>
  <p style="margin:24px 0">
    <a href="https://www.muntalk.com/lingua/placement"
       style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold">
      🎤 Start my first 30 seconds
    </a>
  </p>
  <p style="color:#6b7280;font-size:13px">Built solo by Jay — reply to this email anytime, I read everything.</p>
</div>`;
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
