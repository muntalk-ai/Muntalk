// lib/leagueConfig.ts — 리그 티어 설정 (순수 데이터, 서버/클라이언트 공용)
// PR-H: 서버 라우트(/api/xp/award)가 클라이언트 Firebase SDK 없이 import할 수 있도록
// lib/league.ts에서 분리. 값 변경 시 여기를 수정하면 양쪽에 반영된다.

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
