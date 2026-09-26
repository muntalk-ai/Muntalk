// lib/aiRetry.ts — AI 요청 실패 시 전역 재시도 인프라 (PR-G)
//
// 사용 패턴:
//   const failed = await runWithAiRetry(async () => {
//     const res = await apiFetch('/api/gemini', { ..., timeoutMs: AI_TIMEOUT_MS });
//     const data = await res.json();
//     setMessages(prev => [...prev, { role:'ai', text: data.text }]);
//   });
//   if (failed) setMessages(prev => [...prev, { role:'ai', text: '에러 안내…' }]);
//
// 재시도 가능한 오류(타임아웃·네트워크 장애)면 전역 `mt:ai-failure` 이벤트를
// 발생시켜 <AiFailureModal/>(layout에 1회 마운트)이 "다시 시도" 버튼을 보여줌.
// 재시도는 fn 전체를 다시 실행하므로 페이지 상태 업데이트도 정상 동작.
import { ApiTimeoutError } from './apiClient';

/** 클라이언트 측 AI 요청 하드 타임아웃 — 서버 30s보다 약간 길게 */
export const AI_TIMEOUT_MS = 35000;

export const AI_FAILURE_EVENT = 'mt:ai-failure';

export interface AiFailureDetail {
  retry: () => void;
}

export function isRetryableError(e: unknown): boolean {
  if (e instanceof ApiTimeoutError) return true;
  // 네트워크 단절·DNS 실패 등은 TypeError로 surface
  if (e instanceof TypeError) return true;
  return false;
}

export function notifyAiFailure(retry: () => void) {
  if (typeof window === 'undefined') return;
  const detail: AiFailureDetail = { retry };
  window.dispatchEvent(new CustomEvent<AiFailureDetail>(AI_FAILURE_EVENT, { detail }));
}

/**
 * fn 실행. 성공 → false 반환.
 * 실패 → true 반환 + 재시도 가능 오류면 전역 실패 모달에 재시도 콜백 등록.
 * (non-retryable 오류도 true를 반환하므로 호출부는 기존 에러 메시지를 그대로 표시)
 */
export async function runWithAiRetry(fn: () => Promise<void>): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch (e) {
    if (isRetryableError(e)) {
      notifyAiFailure(() => {
        // 재시도도 같은 경로로 — 또 실패하면 모달이 다시 뜸
        runWithAiRetry(fn).catch(() => {});
      });
    }
    return true;
  }
}
