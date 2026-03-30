// app/api/stripe/portal/route.ts
// Stripe 고객 포털 — 구독 취소/플랜 변경

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
  try {
    const { uid } = await req.json();
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
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
