// lib/apiClient.ts — 클라이언트용 fetch 래퍼 (PR-F)
// 로그인 상태면 Firebase ID Token을 Authorization 헤더에 자동 첨부.
// 비로그인(게스트)이면 토큰 없이 요청 → 서버에서 IP 기반 제한 적용.
// 절대 요청을 깨뜨리지 않음: 토큰 발급 실패 시 그냥 일반 fetch로 폴백.
import { auth } from './firebase';

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken().catch(() => null);
      if (token) {
        const headers = new Headers(init.headers);
        headers.set('Authorization', `Bearer ${token}`);
        init = { ...init, headers };
      }
    }
  } catch {
    /* 토큰 첨부 실패는 무시하고 요청 계속 */
  }
  return fetch(input, init);
}
