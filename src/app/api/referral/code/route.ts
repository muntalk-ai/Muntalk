// app/api/referral/code/route.ts — 내 추천 코드 조회/생성 (PR #114)
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { verifyRequestUid, getAdminDb } from '@/lib/serverAuth';
import { generateReferralCode, isValidReferralCode } from '@/lib/referral';

/** POST — 로그인 유저의 추천 코드 반환 (없으면 생성) */
export async function POST(req: NextRequest) {
  const uid = await verifyRequestUid(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const userSnap = await db.doc(`users/${uid}`).get();
    const existing = userSnap.data()?.referralCode;
    if (typeof existing === 'string' && isValidReferralCode(existing)) {
      return NextResponse.json({ ok: true, code: existing });
    }
    const displayName =
      (userSnap.data()?.displayName as string) || 'A friend';
    // 충돌 시 재시도 (8자리 32진 = 약 1조 조합이라 사실상 1회 성공)
    for (let i = 0; i < 5; i++) {
      const code = generateReferralCode();
      const codeRef = db.doc(`referral_codes/${code}`);
      if ((await codeRef.get()).exists) continue;
      await db.runTransaction(async (tx) => {
        tx.set(codeRef, {
          uid,
          displayName,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.set(db.doc(`users/${uid}`), { referralCode: code }, { merge: true });
      });
      return NextResponse.json({ ok: true, code });
    }
    return NextResponse.json({ error: 'Code generation failed' }, { status: 500 });
  } catch (e) {
    console.error('[referral/code] failed:', (e as Error).message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
