// app/api/stripe/webhook/route.ts
// Stripe 웹훅 — 결제 완료/취소/갱신 처리
// Stripe CLI로 로컬 테스트: stripe listen --forward-to localhost:3000/api/stripe/webhook

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY || '{}')) });
  }
  return getFirestore();
}

export async function POST(req: NextRequest) {
  const sig  = req.headers.get('stripe-signature') || '';
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (e: any) {
    console.error('Webhook signature failed:', e.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = getAdminDb();

  const saveSubscription = async (
    uid: string,
    planId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    status: string,
    currentPeriodEnd: number,
    cancelAtPeriodEnd: boolean,
  ) => {
    await db.collection('subscriptions').doc(uid).set({
      planId, status, stripeCustomerId, stripeSubscriptionId,
      currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
      cancelAtPeriodEnd,
      updatedAt: new Date().toISOString(),
    });
    // 유저 프로필에도 planId 캐시
    await db.collection('users').doc(uid).update({ planId, planStatus: status });
  };

  try {
    switch (event.type) {

      // 결제 완료
      case 'checkout.session.completed': {
        const session  = event.data.object as Stripe.Checkout.Session;
        const uid      = session.metadata?.uid;
        const planId   = session.metadata?.planId;
        if (!uid || !planId) break;

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await saveSubscription(
          uid, planId,
          session.customer as string,
          sub.id, 'active',
          (sub as any).current_period_end,
          (sub as any).cancel_at_period_end,
        );
        console.log(`✅ Subscription activated: ${uid} → ${planId}`);
        break;
      }

      // 갱신 성공
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const sub     = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const uid     = sub.metadata?.uid;
        const planId  = sub.metadata?.planId;
        if (!uid || !planId) break;

        await saveSubscription(
          uid, planId,
          invoice.customer as string,
          sub.id, 'active',
          (sub as any).current_period_end,
          (sub as any).cancel_at_period_end,
        );
        break;
      }

      // 결제 실패
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const sub     = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const uid     = sub.metadata?.uid;
        if (!uid) break;
        await db.collection('subscriptions').doc(uid).update({
          status: 'past_due', updatedAt: new Date().toISOString(),
        });
        await db.collection('users').doc(uid).update({ planStatus: 'past_due' });
        break;
      }

      // 구독 취소
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const uid = sub.metadata?.uid;
        if (!uid) break;
        await db.collection('subscriptions').doc(uid).update({
          planId: 'free', status: 'canceled', updatedAt: new Date().toISOString(),
        });
        await db.collection('users').doc(uid).update({ planId: 'free', planStatus: 'canceled' });
        break;
      }

      // 구독 업데이트 (플랜 변경)
      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription;
        const uid    = sub.metadata?.uid;
        const planId = sub.metadata?.planId;
        if (!uid || !planId) break;
        await saveSubscription(
          uid, planId,
          sub.customer as string,
          sub.id, sub.status,
          (sub as any).current_period_end,
          (sub as any).cancel_at_period_end,
        );
        break;
      }
    }
  } catch (e: any) {
    console.error('Webhook handler error:', e);
  }

  return NextResponse.json({ received: true });
}
