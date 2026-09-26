// app/api/xp/award/route.ts — 서버 측 XP 지급 엔드포인트 (PR-H)
// 클라이언트가 Firestore에 직접 XP를 쓰는 구조(T4 취약점)를 대체.
// 모든 XP 지급은 이 엔드포인트를 통해서만 이루어지며,
// Firestore rules가 클라이언트의 xp/weeklyXp 직접 쓰기를 차단한다.

import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { verifyRequestUid, getAdminDb, rateLimit, rateSum, clientIp } from '@/lib/serverAuth';
import { checkXpSanity, XP_LIMITS } from '@/lib/antiAbuse';
import { LEAGUE_CONFIG, TIER_ORDER, type LeagueTier } from '@/lib/leagueConfig';

// ── 리그 주 계산 (lib/league.ts의 pure 로직과 동일) ──
function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}
function canonicalLeagueId(tier: string, weekStart: string): string {
  return `${tier}_${weekStart}`;
}

// ── 다계정 파밍 탐지: 1시간 내 같은 IP에서 award 요청한 UID 집합 ──
const ipUids = new Map<string, { uids: Set<string>; resetAt: number }>();
function trackIpUid(ip: string, uid: string): number {
  const now = Date.now();
  if (ipUids.size > 10000) {
    for (const [k, e] of ipUids) if (e.resetAt <= now) ipUids.delete(k);
  }
  const e = ipUids.get(ip);
  if (!e || e.resetAt <= now) {
    ipUids.set(ip, { uids: new Set([uid]), resetAt: now + 3600_000 });
    return 1;
  }
  e.uids.add(uid);
  return e.uids.size;
}

/** 어뷰징 플래그 기록 (서버 전용 — rules와 무관하게 Admin SDK로 기록) */
async function flagAbuse(uid: string, reason: string, detail: Record<string, unknown>) {
  const db = getAdminDb();
  try {
    await db.doc(`users/${uid}`).set(
      {
        abuseFlags: admin.firestore.FieldValue.arrayUnion(
          `${reason}@${new Date().toISOString().slice(0, 10)}`,
        ),
        abuseFlagCount: admin.firestore.FieldValue.increment(1),
        lastAbuseAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    // 어뷰징 시도도 감사 로그에 남김 (리그/이벤트 집계 제외 근거)
    await db.collection(`xp_awards/${uid}/awards`).add({
      ...detail,
      ok: false,
      reason,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('[xp/award] flagAbuse failed:', (e as Error).message);
  }
}

export async function POST(req: NextRequest) {
  // 1. 인증 — 비로그인(게스트)은 XP 지급 불가
  const uid = await verifyRequestUid(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. 입력 파싱
  let body: { source?: string; xp?: number; sessionSec?: number; meta?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { source = 'unknown', xp, sessionSec, meta = {} } = body;
  const ip = clientIp(req);

  // 3. 이상치 검사 (서버 강제 — 클라이언트 검사는 우회 가능)
  const sanity = checkXpSanity({ xp: xp as number, sessionSec: sessionSec as number | undefined, source });
  if (!sanity.ok) {
    await flagAbuse(uid, sanity.reason!, { source, xp, sessionSec, ip, meta });
    return NextResponse.json({ ok: false, awarded: 0, reason: sanity.reason }, { status: 422 });
  }
  const awardXp = xp as number;

  // 4. 레이트리밋 (UID 기준)
  if (!rateLimit(`xp:hour:${uid}`, XP_LIMITS.MAX_AWARDS_PER_HOUR, 3600_000)) {
    await flagAbuse(uid, 'hourly_cap', { source, xp: awardXp, sessionSec, ip, meta });
    return NextResponse.json({ ok: false, awarded: 0, reason: 'hourly_cap' }, { status: 429 });
  }
  if (!rateSum(`xp:day:${uid}`, awardXp, XP_LIMITS.MAX_XP_PER_DAY, 86400_000)) {
    await flagAbuse(uid, 'daily_cap', { source, xp: awardXp, sessionSec, ip, meta });
    return NextResponse.json({ ok: false, awarded: 0, reason: 'daily_cap' }, { status: 429 });
  }

  // 5. 다계정 파밍 탐지 (차단하지 않고 플래그만 — 공유 IP 오탐 여지)
  const uidCount = trackIpUid(ip, uid);
  if (uidCount > XP_LIMITS.MAX_UIDS_PER_IP_PER_HOUR) {
    await flagAbuse(uid, `multi_account:ip:${uidCount}`, { source, xp: awardXp, sessionSec, ip, meta });
  }

  // 6. 지급 (트랜잭션 — Admin SDK는 Firestore rules를 우회)
  try {
    const db = getAdminDb();
    const weekStart = getWeekStart();
    const userRef = db.doc(`users/${uid}`);
    const leagueRef = db.doc(`user_leagues/${uid}`);

    let memberLeagueId = '';
    let memberTier: LeagueTier = 'bronze';

    await db.runTransaction(async (tx) => {
      // 6a. 프로필 XP (문서 없어도 merge+increment로 생성 가능)
      tx.set(userRef, { xp: admin.firestore.FieldValue.increment(awardXp) }, { merge: true });

      // 6b. 리그 문서 확보 (없으면 생성, 주가 바뀌었으면 정산+롤오버)
      const leagueSnap = await tx.get(leagueRef);
      if (!leagueSnap.exists) {
        memberLeagueId = canonicalLeagueId('bronze', weekStart);
        tx.set(leagueRef, {
          tier: 'bronze',
          leagueId: memberLeagueId,
          weeklyXp: awardXp,
          weekStart,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const data = leagueSnap.data()!;
        const tier = (data.tier || 'bronze') as LeagueTier;
        memberTier = tier;
        if (data.weekStart !== weekStart) {
          // ── 주간 정산 + 롤오버 (클라이언트 rolloverToNewWeek과 동일 판정) ──
          let rank = -1;
          let total = 0;
          try {
            const membersSnap = await tx.get(
              db.collection(`leagues/${data.leagueId}/members`).orderBy('weeklyXp', 'desc'),
            );
            total = membersSnap.size;
            rank = membersSnap.docs.findIndex((d) => d.id === uid) + 1;
          } catch { /* 조회 실패 시 stay */ }
          const cfg = LEAGUE_CONFIG[tier];
          const idx = TIER_ORDER.indexOf(tier);
          let newTier: LeagueTier = tier;
          let moved: 'up' | 'down' | 'stay' = 'stay';
          if (total >= 3 && rank > 0) {
            if (rank <= cfg.promoteRank && tier !== 'diamond') {
              newTier = TIER_ORDER[idx + 1]; moved = 'up';
            } else if (rank > cfg.minRank && tier !== 'bronze') {
              newTier = TIER_ORDER[idx - 1]; moved = 'down';
            }
          }
          memberLeagueId = canonicalLeagueId(newTier, weekStart);
          memberTier = newTier;
          tx.set(leagueRef, {
            tier: newTier,
            leagueId: memberLeagueId,
            weeklyXp: awardXp,
            weekStart,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            lastWeekResult: { rank, totalMembers: total, oldTier: tier, newTier, moved, weekStart: data.weekStart, seen: false },
          });
        } else {
          memberLeagueId = data.leagueId;
          tx.set(
            leagueRef,
            {
              weeklyXp: admin.firestore.FieldValue.increment(awardXp),
              lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }
      }

      // 6c. 리그 멤버 문서 (순위표 표시용)
      tx.set(
        db.doc(`leagues/${memberLeagueId}/members/${uid}`),
        {
          uid,
          weeklyXp: admin.firestore.FieldValue.increment(awardXp),
          tier: memberTier,
          leagueId: memberLeagueId,
        },
        { merge: true },
      );
    });

    // 6d. 지급 감사 로그 (이벤트 자격 검증·어뷰징 조사용, 트랜잭션 밖에서 기록)
    await db.collection(`xp_awards/${uid}/awards`).add({
      xp: awardXp,
      source,
      sessionSec: sessionSec ?? null,
      ip,
      meta,
      ok: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, awarded: awardXp });
  } catch (e) {
    console.error('[xp/award] transaction failed:', (e as Error).message);
    return NextResponse.json({ error: 'Award failed' }, { status: 500 });
  }
}
