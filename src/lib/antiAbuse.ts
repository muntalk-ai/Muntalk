// lib/antiAbuse.ts — XP 이상치 탐지 (PR-H)
// 서버(/api/xp/award)가 강제하는 임계값. 클라이언트(xpClient)는 사전 체크용으로만 사용
// (클라이언트 검사는 우회 가능하므로 보안 경계가 아님 — 진짜 게이트는 서버 + Firestore rules).

export const XP_LIMITS = {
  /** 1회 award 최대 XP — 합법 플레이의 세션 누적치를 크게 상회 */
  MAX_XP_PER_AWARD: 2000,
  /** 분당 XP 상한 — 게임 최고속 연타(약 150/min)의 2배 여유 */
  MAX_XP_PER_MIN: 300,
  /** XP가 인정되는 최소 세션 길이 (이하면 "즉시 완료"로 간주) */
  MIN_SESSION_SEC: 3,
  /** 분당 XP 검사를 적용하는 최소 세션 길이 (짧은 세션의 오탐 방지) */
  MIN_SEC_FOR_RATE_CHECK: 10,
  /** UID당 시간당 award 횟수 상한 */
  MAX_AWARDS_PER_HOUR: 60,
  /** UID당 일일 XP 상한 — 헤비 유저(4시간+ 플레이)도 닿지 않는 수준 */
  MAX_XP_PER_DAY: 30000,
  /** 1시간 내 같은 IP에서 award를 요청한 UID 수 상한 (다계정 파밍 탐지) */
  MAX_UIDS_PER_IP_PER_HOUR: 5,
} as const;

export interface XpAwardInput {
  xp: number;
  sessionSec?: number; // 세션 길이(초). 없으면 시간 기반 검사 생략
  source: string;      // 'games' | 'lesson' | 'review' | 'roleplay' | 'guest_migration'
}

export interface SanityResult {
  ok: boolean;
  reason?: string; // 'invalid_xp' | 'award_cap' | 'instant' | 'rate'
}

/** 순수 함수 — 서버와 클라이언트가 동일한 임계값 공유 */
export function checkXpSanity(input: XpAwardInput): SanityResult {
  const { xp, sessionSec } = input;
  if (!Number.isFinite(xp) || xp <= 0) {
    return { ok: false, reason: 'invalid_xp' };
  }
  if (xp > XP_LIMITS.MAX_XP_PER_AWARD) {
    return { ok: false, reason: `award_cap:${xp}` };
  }
  if (sessionSec != null) {
    if (sessionSec < XP_LIMITS.MIN_SESSION_SEC) {
      return { ok: false, reason: `instant:${sessionSec}s` };
    }
    if (sessionSec >= XP_LIMITS.MIN_SEC_FOR_RATE_CHECK) {
      const perMin = (xp / sessionSec) * 60;
      if (perMin > XP_LIMITS.MAX_XP_PER_MIN) {
        return { ok: false, reason: `rate:${perMin.toFixed(0)}/min` };
      }
    }
  }
  return { ok: true };
}
