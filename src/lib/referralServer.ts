// lib/referralServer.ts — 추천 프로그램 서버 전용 헬퍼 (PR #114)
// 'server-only' 경계: Admin SDK 사용. 클라이언트에서 import 금지.
import * as admin from 'firebase-admin';
import { getAdminDb } from './serverAuth';
import { REFERRAL_REWARDS } from './referral';

// ── 리그 주 계산 (api/xp/award/route.ts와 동일 로직) ──
function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export interface CreditXpResult {
  ok: boolean;
  reason?: string;
}

/**
 * 특정 UID에게 XP 지급 (추천 리워드 전용).
 * /api/xp/award와 달리 "인증된 본인"이 아닌 "제3자(추천인)"에게 지급하므로
 * 별도 서버 헬퍼로 분리. 호출 측에서 어뷰징 검증을 선행해야 한다.
 */
export async function creditReferralXp(
  uid: string,
  xp: number,
  source: 'referral_welcome' | 'referral_reward',
  meta: Record<string, unknown> = {},
): Promise<CreditXpResult> {
  if (!Number.isFinite(xp) || xp <= 0 || xp > 2000) {
    return { ok: false, reason: 'invalid_xp' };
  }
  const db = getAdminDb();
  const weekStart = getWeekStart();
  try {
    await db.runTransaction(async (tx) => {
      // 프로필 XP 증가
      tx.set(
        db.doc(`users/${uid}`),
        { xp: admin.firestore.FieldValue.increment(xp) },
        { merge: true },
      );
      // 리그 주간 XP (문서 없거나 주가 바뀌면 새로 생성)
      const leagueRef = db.doc(`user_leagues/${uid}`);
      const snap = await tx.get(leagueRef);
      if (!snap.exists || (snap.data()?.weekStart as string) !== weekStart) {
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
    });
    // 감사 로그 (트랜잭션 밖)
    await db.collection(`xp_awards/${uid}/awards`).add({
      xp,
      source,
      ip: null,
      meta,
      ok: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
  } catch (e) {
    console.error('[referral] creditXp failed:', (e as Error).message);
    return { ok: false, reason: 'transaction_failed' };
  }
}

/** 추천인 UID 조회 (referral_codes/{code} → uid) */
export async function resolveReferralCode(code: string): Promise<string | null> {
  try {
    const db = getAdminDb();
    const snap = await db.doc(`referral_codes/${code}`).get();
    if (!snap.exists) return null;
    const uid = snap.data()?.uid;
    return typeof uid === 'string' && uid.length > 0 ? uid : null;
  } catch (e) {
    console.error('[referral] resolve failed:', (e as Error).message);
    return null;
  }
}

export { REFERRAL_REWARDS };
