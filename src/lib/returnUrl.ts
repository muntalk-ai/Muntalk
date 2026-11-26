// UX-infra: 로그인/회원가입 복귀 경로 (returnUrl)
// ?next=/lingua/microtalk 형태로 전달 — 내부 경로만 허용 (open redirect 방지).
const FALLBACK = '/lingua';
// 신규 가입자 전용 폴백 (2026-11-26 변경): 레벨 테스트 대신 첫 레슨(Starter)으로 직행.
// 2026-10-07부터 플레이스먼트로 보냈지만 신규 가입자 거의 전원이 첫 레슨을
// 완료하지 못했다(XP 0). 가입 직후 시험보다 짧은 첫 성공을 먼저 주고,
// Starter 완료 화면에서 레벨 테스트를 권한다(건너뛰기 가능).
// ?onboarding=1 → LessonPlayer 완료 화면에 "Find your level" 카드 표시.
// 명시적 ?next= / 보관된 복귀 경로는 그대로 우선한다.
// 신규 가입자 첫 목적지 — 한 곳에서만 정의한다. SIGNUP_FALLBACK과 웰컴 메일
// CTA가 둘 다 이 상수를 쓴다 (2026-11-26 Jay 결정: /lingua/starter).
// 목적지를 바꾸려면 이 한 줄만 바꾸면 된다. 예: '/lingua/microtalk?onboarding=1'.
// ?onboarding=1 → 목적지 페이지 완료 화면에 레벨 테스트 권유 카드가 뜬다.
export const FIRST_LESSON_PATH = '/lingua/starter?onboarding=1';
const SIGNUP_FALLBACK = FIRST_LESSON_PATH;
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

// 신규 가입자 전용 복귀 경로: 명시적 목적지가 없으면 첫 레슨으로 직행.
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

// 보관된 복귀 경로를 꺼내서 소비한다. 없으면 호출자가 준 폴백을 반환한다.
// (getNextPath의 폴백은 /lingua라서 Exchange 페이지에서는 쓸 수 없다 —
//  setup 저장 후에는 원래 가려던 Exchange 경로로 돌아가야 한다.)
export function takeStashedNextPath(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const stored = sessionStorage.getItem(KEY);
  if (stored) {
    sessionStorage.removeItem(KEY);
    return sanitize(stored);
  }
  return fallback;
}
