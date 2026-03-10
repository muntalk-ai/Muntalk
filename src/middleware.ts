// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 완전 공개 경로
const PUBLIC_PATHS = ['/', '/login', '/signup', '/pricing', '/lingua'];

// 비로그인 허용 — 단, A1 첫 레슨(a1-1-1)만
// /lingua/learn/a1/a1-1/a1-1-1 형태만 허용, 나머지 learn/* 는 로그인 필요
const GUEST_LESSON_PATTERN = /^\/lingua\/learn\/a1\/a1-1\/a1-1-1(\/.*)?(\?.*)?$/;

// 로그인 필요 경로 prefix
const PROTECTED_PREFIXES = [
  '/profile',
  '/lingua/dashboard',
  '/lingua/learn',   // 기본은 차단 — 위 패턴 예외 처리
  '/lingua/words',
  '/lingua/tutors',
  '/lingua/league',
  '/lingua/review',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로 → 통과
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '?'))) {
    return NextResponse.next();
  }

  const needsAuth = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  // /lingua/learn/* 중 게스트 허용 레슨 예외 처리
  if (pathname.startsWith('/lingua/learn') && GUEST_LESSON_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  // Firebase Auth는 클라이언트 사이드 → 쿠키로 완전 보호 불가
  // 각 페이지의 useAuthGuard() / useAuth()에서 !user 시 /login redirect
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
