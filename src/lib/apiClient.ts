// lib/apiClient.ts — 클라이언트용 fetch 래퍼 (PR-F + PR-G)
// 로그인 상태면 Firebase ID Token을 Authorization 헤더에 자동 첨부.
// 비로그인(게스트)이면 토큰 없이 요청 → 서버에서 IP 기반 제한 적용.
// 절대 요청을 깨뜨리지 않음: 토큰 발급 실패 시 그냥 일반 fetch로 폴백.
//
// PR-G: 선택적 `timeoutMs` 지원 — 지정 시 AbortController로 하드 타임아웃을 걸고
// 시간 초과 시 ApiTimeoutError를 던짐. 미지정 시 기존 동작과 완전히 동일.
import { auth } from './firebase';

export class ApiTimeoutError extends Error {
  readonly code = 'TIMEOUT';
  readonly timeoutMs: number;
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'ApiTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export type ApiFetchInit = RequestInit & { timeoutMs?: number };

export async function apiFetch(
  input: RequestInfo | URL,
  init: ApiFetchInit = {},
): Promise<Response> {
  const { timeoutMs, ...rest } = init;
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken().catch(() => null);
      if (token) {
        const headers = new Headers(rest.headers);
        headers.set('Authorization', `Bearer ${token}`);
        (rest as RequestInit).headers = headers;
      }
    }
  } catch {
    /* 토큰 첨부 실패는 무시하고 요청 계속 */
  }
  if (!timeoutMs || timeoutMs <= 0) {
    return fetch(input, rest);
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: ctrl.signal });
  } catch (e) {
    if (ctrl.signal.aborted) throw new ApiTimeoutError(timeoutMs);
    throw e;
  } finally {
    clearTimeout(t);
  }
}
