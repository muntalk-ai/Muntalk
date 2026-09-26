// app/api/stripe/checkout/route.ts
// Stripe 결제 세션 생성
// 2차 감사 #3 [High]: ID Token 필수 + metadata uid/email은 토큰에서 강제

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  getIdentity, checkRateLimit, apiError, apiSafeError,
} from '@/lib/apiGuard';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

const PRICE_IDS: Record<string, string> = {
  monthly:  process.env.STRIPE_PRICE_MONTHLY  || '',
  biannual: process.env.STRIPE_PRICE_BIANNUAL || '',
  annual:   process.env.STRIPE_PRICE_ANNUAL   || '',
};

export async function POST(req: NextRequest) {
  // ── 2차 감사 #3: 인증 필수 (무제한 세션 생성 + metadata uid 신뢰 차단) ──
  const id = await getIdentity(req);
  if (!id) return apiError('Unauthorized', 401);
  const rl = checkRateLimit(`stripe-checkout:uid:${id.uid}`, 10, 60_000);
  if (!rl.ok) return apiError('Rate limit exceeded', 429, { retryAfterSec: rl.retryAfterSec });

  try {
    const { planId } = await req.json();
    const priceId = PRICE_IDS[planId];
    if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    // uid/email은 클라이언트가 준 값을 무시하고 토큰에서 확정
    const uid = id.uid;
    const email = id.email || undefined;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode:        'subscription',
      line_items:  [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${appUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/pricing?canceled=true`,
      metadata:    { uid, planId },
      subscription_data: {
        metadata: { uid, planId },
        trial_period_days: undefined,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return apiSafeError('[stripe/checkout] route error:', e);
  }
}
