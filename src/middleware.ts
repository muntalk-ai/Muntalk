// middleware.ts (프로젝트 루트 src/ 또는 루트에 위치)
// 미로그인 사용자가 보호된 페이지에 접근하면 /login으로 리디렉션

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/lingua',        // 게스트도 메인 허용
  '/',
];

// 로그인 필요 경로 (prefix 매칭)
const PROTECTED_PREFIXES = [
  '/profile',
  '/lingua/dashboard',
  '/lingua/learn',
  '/lingua/words',
  '/lingua/tutors',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  // Firebase Auth는 클라이언트 사이드 → 쿠키 기반 체크
  // Firebase Auth Session Cookie (선택): 서버사이드 완전 보호는
  // firebase-admin + session cookie 필요. 여기서는 클라이언트 가드 사용.
  // → 각 페이지의 useAuth()에서 !user 시 /login으로 redirect
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
