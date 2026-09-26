// lib/xpClient.ts — 클라이언트 XP 지급 헬퍼 (PR-H)
// XP는 더 이상 Firestore에 직접 쓰지 않는다. 모든 지급은 POST /api/xp/award 로.
// 서버가 이상치 검사·레이트리밋·실제 증가를 수행한다.

import { auth } from './firebase';
import { checkXpSanity, type XpAwardInput } from './antiAbuse';

export interface AwardXpInput extends XpAwardInput {
  /** 게임 ID 등 추적용 메타데이터 */
  meta?: Record<string, unknown>;
}

export interface AwardXpResult {
  ok: boolean;
  awarded: number;
  reason?: string;
}

/**
 * 서버에 XP 지급 요청. 실패해도 예외를 던지지 않고 {ok:false} 반환
 * (게임 플레이 흐름이 깨지지 않도록).
 */
export async function awardXp(input: AwardXpInput): Promise<AwardXpResult> {
  // 클라이언트 사전 체크 (우회 가능하므로 서버가 최종 게이트)
  const sanity = checkXpSanity(input);
  if (!sanity.ok) {
    console.warn('[xp] blocked by local sanity check:', sanity.reason);
    return { ok: false, awarded: 0, reason: sanity.reason };
  }
  const user = auth.currentUser;
  if (!user) {
    // 게스트는 XP 지급 대상이 아님 (게스트 제한은 trialTimer가 담당)
    return { ok: false, awarded: 0, reason: 'guest' };
  }
  try {
    const token = await user.getIdToken();
    const res = await fetch('/api/xp/award', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        source: input.source,
        xp: input.xp,
        sessionSec: input.sessionSec,
        meta: input.meta ?? {},
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('[xp] award rejected:', res.status, data.reason);
      return { ok: false, awarded: 0, reason: data.reason || `http_${res.status}` };
    }
    return (await res.json()) as AwardXpResult;
  } catch (e) {
    console.warn('[xp] award request failed:', (e as Error).message);
    return { ok: false, awarded: 0, reason: 'network' };
  }
}
