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
}

/** 이번 주 월요일 날짜 */
export function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

/** 유저를 리그에 배정 (없으면 Bronze 자동 생성) */
export async function ensureLeague(uid: string, displayName: string, photoURL: string): Promise<UserLeague> {
  const ref = doc(db, 'user_leagues', uid);
  const snap = await getDoc(ref);
  const weekStart = getWeekStart();

  if (snap.exists()) {
    const data = snap.data() as UserLeague;
    // 새 주가 시작됐으면 XP 리셋
    if (data.weekStart !== weekStart) {
      const updated: UserLeague = { ...data, weeklyXp: 0, weekStart, lastUpdated: serverTimestamp() };
      await updateDoc(ref, updated);
      // 리그 멤버 XP도 리셋
      await setDoc(doc(db, 'leagues', data.leagueId, 'members', uid), {
        uid, displayName, photoURL, weeklyXp: 0, tier: data.tier, leagueId: data.leagueId,
      });
      return updated;
    }
    return data;
  }

  // 새 유저 → Bronze 리그 배정
  const leagueId = `bronze_${weekStart}_${Math.floor(Math.random() * 100)}`;
  const newLeague: UserLeague = {
    tier: 'bronze', leagueId, weeklyXp: 0, weekStart, lastUpdated: serverTimestamp(),
  };
  await setDoc(ref, newLeague);
  await setDoc(doc(db, 'leagues', leagueId, 'members', uid), {
    uid, displayName, photoURL, weeklyXp: 0, tier: 'bronze', leagueId,
  });
  return newLeague;
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
