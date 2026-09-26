// app/api/stripe/portal/route.ts
// Stripe 고객 포털 — 구독 취소/플랜 변경
// 2차 감사 #1 [Critical]: ID Token 필수 + 본인 uid만 허용 + rate limit

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  getIdentity, checkRateLimit, apiError, apiSafeError,
} from '@/lib/apiGuard';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY || '{}')) });
  }
  return getFirestore();
}

export async function POST(req: NextRequest) {
  // ── 2차 감사 #1: 인증 필수 (타인 uid로 포털 발급 → 구독 취소 공격 차단) ──
  const id = await getIdentity(req);
  if (!id) return apiError('Unauthorized', 401);
  const rl = checkRateLimit(`stripe-portal:uid:${id.uid}`, 10, 60_000);
  if (!rl.ok) return apiError('Rate limit exceeded', 429, { retryAfterSec: rl.retryAfterSec });

  try {
    // uid는 토큰에서 확정 — 클라이언트 주장 무시
    const uid = id.uid;
    const db      = getAdminDb();
    const snap    = await db.collection('subscriptions').doc(uid).get();

    if (!snap.exists) return NextResponse.json({ error: 'No subscription found' }, { status: 404 });

    const { stripeCustomerId } = snap.data()!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer:   stripeCustomerId,
      return_url: `${appUrl}/profile`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return apiSafeError('[stripe/portal] route error:', e);
  }
}
