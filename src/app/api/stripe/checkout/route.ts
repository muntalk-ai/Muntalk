// app/api/stripe/checkout/route.ts
// Stripe 결제 세션 생성
// npm install stripe

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const PRICE_IDS: Record<string, string> = {
  monthly:  process.env.STRIPE_PRICE_MONTHLY  || '',
  biannual: process.env.STRIPE_PRICE_BIANNUAL || '',
  annual:   process.env.STRIPE_PRICE_ANNUAL   || '',
};

export async function POST(req: NextRequest) {
  try {
    const { planId, uid, email } = await req.json();
    const priceId = PRICE_IDS[planId];
    if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode:        'subscription',
      line_items:  [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
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
    console.error('Stripe checkout error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
