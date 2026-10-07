// app/api/cron/streak-reminder/route.ts
// Vercel Cron (hourly): 각 유저의 로컬 저녁 8시에 스트릭 리마인드 푸시 발송.
// - FCM 토큰 보유 + 오늘 미학습 + 최근 14일 내 활동 + 오늘 미발송인 경우만
// - 문구는 전부 오리지널 작성 (타사 카피 차용 없음)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REMINDER_HOUR = 20; // 로컬 저녁 8시

function localParts(timezone: string): { hour: number; dateKey: string } {
  const now = new Date();
  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: timezone }).format(now),
    10,
  );
  // en-CA → YYYY-MM-DD
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone,
  }).format(now);
  return { hour, dateKey };
}

function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    const tokenSnap = await adminDb.collection('fcm_tokens').get();
    for (const tokenDoc of tokenSnap.docs) {
      const uid = tokenDoc.id;
      const fcmToken = (tokenDoc.data() as { token?: string }).token;
      if (!fcmToken) { skipped++; continue; }

      try {
        const userSnap = await adminDb.collection('users').doc(uid).get();
        if (!userSnap.exists) { skipped++; continue; }
        const u = userSnap.data() as {
          timezone?: string;
          activityDates?: string[];
          streak?: number;
          lastStreakReminderAt?: string;
        };

        const tz = u.timezone;
        if (!tz) { skipped++; continue; }
        let hour = -1;
        let todayKey = '';
        try {
          ({ hour, dateKey: todayKey } = localParts(tz));
        } catch { skipped++; continue; }
        if (hour !== REMINDER_HOUR) { skipped++; continue; }

        // 오늘 이미 학습했으면 스킵
        const dates = Array.isArray(u.activityDates) ? u.activityDates : [];
        if (dates.includes(todayKey)) { skipped++; continue; }

        // 최근 14일 내 활동 없으면 스킵 (완전 이탈 유저에게 스팸 방지)
        const cutoff = addDays(todayKey, -14);
        const recent = dates.some(d => d >= cutoff);
        if (!recent) { skipped++; continue; }

        // 오늘 이미 리마인드 발송했으면 스킵
        if (u.lastStreakReminderAt === todayKey) { skipped++; continue; }

        const streak = u.streak ?? 0;
        const title = '🌍 MunTalk reminder';
        const body = streak > 0
          ? `Your ${streak}-day streak ends tonight. Just 5 minutes keeps it alive 🔥`
          : `You haven't practiced today yet. 5 minutes is all it takes 🙂`;

        await adminMessaging.send({
          token: fcmToken,
          notification: { title, body },
          webpush: {
            notification: {
              title, body,
              icon: 'https://www.muntalk.com/logo.png',
            },
            fcmOptions: { link: 'https://www.muntalk.com/lingua' },
          },
        });
        await userSnap.ref.set({ lastStreakReminderAt: todayKey }, { merge: true });
        sent++;
      } catch (e) {
        errors.push(`${uid}: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }
    return NextResponse.json({ ok: true, sent, skipped, errors });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
