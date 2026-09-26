// UX-infra: 로그인/회원가입 복귀 경로 (returnUrl)
// ?next=/lingua/microtalk 형태로 전달 — 내부 경로만 허용 (open redirect 방지).
const FALLBACK = '/lingua';
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

// OAuth redirect 직전에 복귀 경로를 보관 (redirect 후 쿼리 파라미터가 소실되므로).
export function stashNextPath(path: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, sanitize(path));
}
