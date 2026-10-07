// app/api/referral/attach/route.ts — 신규 유저에 추천인 연결 + 웰컴 XP (PR #114)
// ensureFirstLoginSetup에서 첫 로그인 시 1회 호출.
// - referredBy 연결 (유저당 1회 — 트랜잭션으로 멱등성 보장)
// - 추천인 referralCount 증가
// - 신규 유저에게 웰컴 보너스 XP 서버 직접 지급 (원자적)
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { verifyRequestUid, getAdminDb } from '@/lib/serverAuth';
import { isValidReferralCode, REFERRAL_REWARDS } from '@/lib/referral';
import { creditReferralXp, resolveReferralCode } from '@/lib/referralServer';

/** POST { code } */
export async function POST(req: NextRequest) {
  const uid = await verifyRequestUid(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let code: unknown;
  try {
    code = (await req.json()).code;
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_request' }, { status: 400 });
  }
  if (!isValidReferralCode(code)) {
    return NextResponse.json({ ok: false, reason: 'invalid_code' });
  }
  try {
    const refUid = await resolveReferralCode(code);
    if (!refUid) {
      return NextResponse.json({ ok: false, reason: 'invalid_code' });
    }
    // 어뷰징 방지: 자기 추천 불가
    if (refUid === uid) {
      return NextResponse.json({ ok: false, reason: 'self_referral' });
    }

    const db = getAdminDb();
    let attached = false;
    await db.runTransaction(async (tx) => {
      const userRef = db.doc(`users/${uid}`);
      const snap = await tx.get(userRef);
      // 추천받은 유저당 1회 — 이미 연결되어 있으면 스킵
      if (snap.data()?.referredBy) return;
      tx.set(userRef, { referredBy: refUid }, { merge: true });
      tx.set(
        db.doc(`users/${refUid}`),
        { referralCount: admin.firestore.FieldValue.increment(1) },
        { merge: true },
      );
      attached = true;
    });
    if (!attached) {
      return NextResponse.json({ ok: false, reason: 'already_attached' });
    }

    // 웰컴 보너스 — 서버 직접 지급 (attach와 같은 요청에서 원자적으로 처리)
    const credit = await creditReferralXp(
      uid,
      REFERRAL_REWARDS.WELCOME_XP,
      'referral_welcome',
      { referredBy: refUid },
    );
    return NextResponse.json({
      ok: true,
      welcomeXp: credit.ok ? REFERRAL_REWARDS.WELCOME_XP : 0,
    });
  } catch (e) {
    console.error('[referral/attach] failed:', (e as Error).message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
