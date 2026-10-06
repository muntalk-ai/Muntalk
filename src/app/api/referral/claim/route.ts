// app/api/referral/claim/route.ts — 추천인 리워드 지급 (PR #114)
// 추천받은 유저가 레슨 N개 완료 시 호출 (레슨 완료 핸들러에서).
// 서버가 모든 조건을 검증하고, 추천인에게 XP를 직접 지급한다.
// - 추천받은 유저당 1회 (referralRewardPaid 플래그, 트랜잭션 내 멱등성)
// - 자기 추천 불가
// - 추천인 일일 상한 (soft cap)
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { verifyRequestUid, getAdminDb, rateLimit } from '@/lib/serverAuth';
import { REFERRAL_REWARDS } from '@/lib/referral';

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

/** POST — 본인(referred user)이 호출 */
export async function POST(req: NextRequest) {
  const uid = await verifyRequestUid(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    const snap = await db.doc(`users/${uid}`).get();
    const data = snap.data() ?? {};

    const refUid = data.referredBy;
    if (!refUid || typeof refUid !== 'string') {
      return NextResponse.json({ ok: false, reason: 'no_referrer' });
    }
    // 어뷰징 방지: 자기 추천 불가
    if (refUid === uid) {
      return NextResponse.json({ ok: false, reason: 'self_referral' });
    }
    // 추천받은 유저당 1회
    if (data.referralRewardPaid) {
      return NextResponse.json({ ok: false, reason: 'already_paid' });
    }
    const lessons = Array.isArray(data.completedLessons) ? data.completedLessons.length : 0;
    if (lessons < REFERRAL_REWARDS.LESSONS_REQUIRED) {
      return NextResponse.json({ ok: false, reason: 'not_yet', lessons });
    }

    // 추천인 일일 상한 (어뷰징 방지 soft cap)
    if (
      !rateLimit(
        `referral:day:${refUid}`,
        REFERRAL_REWARDS.MAX_REWARDS_PER_DAY_PER_REFERRER,
        86_400_000,
      )
    ) {
      return NextResponse.json({ ok: false, reason: 'referrer_daily_cap' }, { status: 429 });
    }

    // 원자적 지급: paid 플래그 + 추천인 XP + 리그 주간 XP를 한 트랜잭션으로
    const weekStart = getWeekStart();
    const xp = REFERRAL_REWARDS.REFERRER_XP;
    let paid = false;
    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(db.doc(`users/${uid}`));
      if (userSnap.data()?.referralRewardPaid) return; // 동시 호출 멱등성
      tx.set(db.doc(`users/${uid}`), { referralRewardPaid: true }, { merge: true });
      tx.set(
        db.doc(`users/${refUid}`),
        { xp: admin.firestore.FieldValue.increment(xp) },
        { merge: true },
      );
      const leagueRef = db.doc(`user_leagues/${refUid}`);
      const leagueSnap = await tx.get(leagueRef);
      if (!leagueSnap.exists || (leagueSnap.data()?.weekStart as string) !== weekStart) {
        tx.set(leagueRef, {
          tier: 'bronze',
          leagueId: `bronze_${weekStart}`,
          weeklyXp: xp,
          weekStart,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        tx.set(
          leagueRef,
          {
            weeklyXp: admin.firestore.FieldValue.increment(xp),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
      paid = true;
    });
    if (!paid) {
      return NextResponse.json({ ok: false, reason: 'already_paid' });
    }

    // 감사 로그
    await db.collection(`xp_awards/${refUid}/awards`).add({
      xp,
      source: 'referral_reward',
      ip: null,
      meta: { referredUid: uid },
      ok: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, awarded: xp });
  } catch (e) {
    console.error('[referral/claim] failed:', (e as Error).message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
