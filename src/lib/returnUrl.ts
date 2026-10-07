// UX-infra: 로그인/회원가입 복귀 경로 (returnUrl)
// ?next=/lingua/microtalk 형태로 전달 — 내부 경로만 허용 (open redirect 방지).
const FALLBACK = '/lingua';
// 신규 가입자 전용 폴백: 대시보드 대신 플레이스먼트(레벨 진단)로 직행 —
// 가입 후 "뭘 해야 하지" 상태에서 이탈하는 활성화 문제 대응 (2026-10-07)
const SIGNUP_FALLBACK = '/lingua/placement';
const KEY = 'mt_next';

function sanitize(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return FALLBACK;
}

// 현재 요청의 복귀 경로를 반환.
// OAuth redirect 복귀 시 sessionStorage에 보관된 값을 우선 사용한다.
export function getNextPath(): string {
  if (typeof window === 'undefined') return FALLBACK;
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    sessionStorage.removeItem(KEY);
    return sanitize(stored);
  }
  return sanitize(new URLSearchParams(window.location.search).get('next'));
}

// 신규 가입자 전용 복귀 경로: 명시적 목적지가 없으면 플레이스먼트로 직행.
// (로그인 페이지는 기존 getNextPath 유지 — 재방문자는 대시보드가 맞음)
export function getSignupNextPath(): string {
  if (typeof window === 'undefined') return SIGNUP_FALLBACK;
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    sessionStorage.removeItem(KEY);
    return sanitize(stored);
  }
  const next = new URLSearchParams(window.location.search).get('next');
  return next ? sanitize(next) : SIGNUP_FALLBACK;
}

// OAuth redirect 직전에 복귀 경로를 보관 (redirect 후 쿼리 파라미터가 소실되므로).
export function stashNextPath(path: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, sanitize(path));
}
