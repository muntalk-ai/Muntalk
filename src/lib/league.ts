// lib/league.ts
// 듀오링고 스타일 리그 시스템

import {
  doc, getDoc, setDoc, updateDoc, collection,
  getDocs, query, orderBy, limit, where,
  serverTimestamp, increment, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'sapphire' | 'ruby' | 'emerald' | 'amethyst' | 'pearl' | 'obsidian' | 'diamond';

export const LEAGUE_CONFIG: Record<LeagueTier, {
  name: string; emoji: string; color: string; bg: string;
  minRank: number; // 유지 최소 순위 (이 아래면 강등)
  promoteRank: number; // 승격 순위
  size: number; // 리그당 인원
}> = {
  bronze:   { name: 'Bronze',   emoji: '🥉', color: '#CD7F32', bg: '#FDF3E7', minRank: 20, promoteRank: 3,  size: 20 },
  silver:   { name: 'Silver',   emoji: '🥈', color: '#94A3B8', bg: '#F1F5F9', minRank: 20, promoteRank: 3,  size: 20 },
  gold:     { name: 'Gold',     emoji: '🥇', color: '#F59E0B', bg: '#FFFBEB', minRank: 15, promoteRank: 3,  size: 20 },
  sapphire: { name: 'Sapphire', emoji: '💎', color: '#3B82F6', bg: '#EFF6FF', minRank: 15, promoteRank: 3,  size: 20 },
  ruby:     { name: 'Ruby',     emoji: '❤️', color: '#EF4444', bg: '#FEF2F2', minRank: 15, promoteRank: 3,  size: 20 },
  emerald:  { name: 'Emerald',  emoji: '💚', color: '#10B981', bg: '#ECFDF5', minRank: 10, promoteRank: 3,  size: 15 },
  amethyst: { name: 'Amethyst', emoji: '💜', color: '#8B5CF6', bg: '#F5F3FF', minRank: 10, promoteRank: 3,  size: 15 },
  pearl:    { name: 'Pearl',    emoji: '🤍', color: '#64748B', bg: '#F8FAFC', minRank: 10, promoteRank: 3,  size: 15 },
  obsidian: { name: 'Obsidian', emoji: '🖤', color: '#1E293B', bg: '#F1F5F9', minRank: 5,  promoteRank: 3,  size: 10 },
  diamond:  { name: 'Diamond',  emoji: '💠', color: '#06B6D4', bg: '#ECFEFF', minRank: 999, promoteRank: 999, size: 10 },
};

export const TIER_ORDER: LeagueTier[] = [
  'bronze','silver','gold','sapphire','ruby','emerald','amethyst','pearl','obsidian','diamond'
];

export interface LeagueMember {
  uid: string;
  displayName: string;
  photoURL: string;
  weeklyXp: number;
  tier: LeagueTier;
  leagueId: string;
}

export interface UserLeague {
  tier: LeagueTier;
  leagueId: string;
  weeklyXp: number;
  weekStart: string; // YYYY-MM-DD (월요일)
  lastUpdated: any;
  lastWeekResult?: WeekResult; // 지난주 정산 결과 (모달 표시용)
}

export interface WeekResult {
  rank: number;
  totalMembers: number;
  oldTier: LeagueTier;
  newTier: LeagueTier;
  moved: 'up' | 'down' | 'stay';
  weekStart: string; // 정산된 주의 weekStart
  seen: boolean;
}

/** 이번 주 월요일 날짜 */
export function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

/** 티어+주별 공용 리그 ID — 같은 티어 유저는 한 리그에서 실제 경쟁 */
export function canonicalLeagueId(tier: LeagueTier, weekStart: string): string {
  return `${tier}_${weekStart}`;
}

/** 유저를 리그에 배정 (없으면 Bronze 자동 생성) */
export async function ensureLeague(uid: string, displayName: string, photoURL: string): Promise<UserLeague> {
  const ref = doc(db, 'user_leagues', uid);
  const snap = await getDoc(ref);
  const weekStart = getWeekStart();

  if (snap.exists()) {
    const data = snap.data() as UserLeague;
    // 새 주가 시작됐으면 정산 + 새 리그로 이동
    if (data.weekStart !== weekStart) {
      return await rolloverToNewWeek(ref, uid, displayName, photoURL, data, weekStart);
    }
    // 마이그레이션: 구 랜덤 leagueId → 공용 canonical 리그로 이동
    const canonical = canonicalLeagueId(data.tier, weekStart);
    if (data.leagueId !== canonical) {
      await setDoc(doc(db, 'leagues', canonical, 'members', uid), {
        uid, displayName, photoURL, weeklyXp: data.weeklyXp || 0, tier: data.tier, leagueId: canonical,
      });
      const updated: UserLeague = { ...data, leagueId: canonical, lastUpdated: serverTimestamp() };
      await updateDoc(ref, updated as any);
      return updated;
    }
    return data;
  }

  // 새 유저 → Bronze 공용 리그
  const leagueId = canonicalLeagueId('bronze', weekStart);
  const fresh: UserLeague = {
    tier: 'bronze', leagueId, weeklyXp: 0, weekStart, lastUpdated: serverTimestamp(),
  };
  await setDoc(ref, fresh);
  await setDoc(doc(db, 'leagues', leagueId, 'members', uid), {
    uid, displayName, photoURL, weeklyXp: 0, tier: 'bronze', leagueId,
  });
  return fresh;
}

/** 주간 정산: 지난주 순위 → 승격/강등 → 새 티어 리그로 이동 */
async function rolloverToNewWeek(
  ref: any, uid: string, displayName: string, photoURL: string,
  data: UserLeague, weekStart: string,
): Promise<UserLeague> {
  // 1. 지난주 최종 순위
  let rank = -1, total = 0;
  try {
    const members = await getLeagueMembers(data.leagueId);
    total = members.length;
    rank = members.findIndex(m => m.uid === uid) + 1;
  } catch { /* 리그 조회 실패 시 stay 처리 */ }

  // 2. 승격/강등 판정 (구 랜덤 리그의 1인 순위 같은 무의미한 경쟁은 제외)
  const cfg = LEAGUE_CONFIG[data.tier];
  const idx = TIER_ORDER.indexOf(data.tier);
  let newTier: LeagueTier = data.tier;
  let moved: 'up' | 'down' | 'stay' = 'stay';
  if (total >= 3 && rank > 0) {
    if (rank <= cfg.promoteRank && data.tier !== 'diamond') {
      newTier = TIER_ORDER[idx + 1]; moved = 'up';
    } else if (rank > cfg.minRank && data.tier !== 'bronze') {
      newTier = TIER_ORDER[idx - 1]; moved = 'down';
    }
  }

  const newLeagueId = canonicalLeagueId(newTier, weekStart);
  const result: WeekResult = {
    rank: rank > 0 ? rank : total, totalMembers: total,
    oldTier: data.tier, newTier, moved,
    weekStart: data.weekStart, seen: false,
  };
  const updated: UserLeague = {
    tier: newTier, leagueId: newLeagueId, weeklyXp: 0,
    weekStart, lastUpdated: serverTimestamp(), lastWeekResult: result,
  };
  await setDoc(ref, updated);
  await setDoc(doc(db, 'leagues', newLeagueId, 'members', uid), {
    uid, displayName, photoURL, weeklyXp: 0, tier: newTier, leagueId: newLeagueId,
  });
  return updated;
}

/** 주간 정산 모달 확인 처리 */
export async function markWeekResultSeen(uid: string): Promise<void> {
  const ref = doc(db, 'user_leagues', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as UserLeague;
  if (!data.lastWeekResult || data.lastWeekResult.seen) return;
  await updateDoc(ref, { lastWeekResult: { ...data.lastWeekResult, seen: true } });
}

/** 주간 XP 추가 */
export async function addWeeklyXp(uid: string, xp: number): Promise<void> {
  const ref = doc(db, 'user_leagues', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as UserLeague;
  await updateDoc(ref, { weeklyXp: (data.weeklyXp || 0) + xp, lastUpdated: serverTimestamp() });
  // 리그 멤버 문서도 업데이트
  await updateDoc(doc(db, 'leagues', data.leagueId, 'members', uid), {
    weeklyXp: (data.weeklyXp || 0) + xp,
  });
}

/** 내 리그 멤버 목록 (주간 XP 순) */
export async function getLeagueMembers(leagueId: string): Promise<LeagueMember[]> {
  const ref = collection(db, 'leagues', leagueId, 'members');
  const snap = await getDocs(query(ref, orderBy('weeklyXp', 'desc')));
  return snap.docs.map(d => d.data() as LeagueMember);
}

/** 내 리그 정보 */
export async function getUserLeague(uid: string): Promise<UserLeague | null> {
  const snap = await getDoc(doc(db, 'user_leagues', uid));
  return snap.exists() ? (snap.data() as UserLeague) : null;
}

/** 이번 주 내 순위 */
export async function getMyRank(uid: string): Promise<number> {
  const league = await getUserLeague(uid);
  if (!league) return -1;
  const members = await getLeagueMembers(league.leagueId);
  return members.findIndex(m => m.uid === uid) + 1;
}

/** 승격/강등 체크 메시지 */
export function getPromotionMessage(rank: number, tier: LeagueTier): { type: 'promote' | 'demote' | 'safe' | 'danger'; message: string } {
  const config = LEAGUE_CONFIG[tier];
  const tierIdx = TIER_ORDER.indexOf(tier);

  if (rank <= config.promoteRank && tier !== 'diamond') {
    const next = TIER_ORDER[tierIdx + 1];
    return { type: 'promote', message: `🎉 Top ${config.promoteRank}! You'll advance to ${LEAGUE_CONFIG[next].name} next week!` };
  }
  if (rank > config.minRank && tier !== 'bronze') {
    const prev = TIER_ORDER[tierIdx - 1];
    return { type: 'demote', message: `⚠️ At risk of dropping to ${LEAGUE_CONFIG[prev].name}. Earn more XP!` };
  }
  if (rank <= config.promoteRank + 3) {
    return { type: 'safe', message: `📈 Keep going! You're close to promotion zone.` };
  }
  return { type: 'safe', message: `🛡️ You're safe from demotion. Push higher!` };
}
