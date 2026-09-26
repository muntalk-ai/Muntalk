// app/api/send-email/route.ts
// Resend로 이메일 발송 API
// npm install resend

import { NextRequest, NextResponse } from 'next/server';
import {
  getIdentity, checkRateLimit, isAdminEmail, apiError, fetchWithTimeout,
} from '@/lib/apiGuard';

export async function POST(req: NextRequest) {
  // ── PR-F: 어드민 인증 필수 + 분당 발송 상한 ──
  const id = await getIdentity(req);
  if (!id) return apiError('Unauthorized', 401);
  if (!isAdminEmail(id.email)) return apiError('Forbidden', 403);
  const rl = checkRateLimit(`send-email:${id.uid}`, 30, 60_000);
  if (!rl.ok) {
    return apiError('Rate limit exceeded', 429, { retryAfterSec: rl.retryAfterSec });
  }

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const res = await fetchWithTimeout('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Lingua AI <noreply@yourdomain.com>',
        to: [to],
        subject,
        html,
      }),
    }, 30000);

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });
    return NextResponse.json({ success: true, id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
