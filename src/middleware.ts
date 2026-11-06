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

  // ── Muntuz.com host branch (landing as first screen, PR: feature/muntuz-root-landing)
  // muntuz.com / www.muntuz.com root ('/') rewrites to /muntuz — the redesigned
  // landing (Why Muntuz / How it works / Meet the house / waitlist) is the first
  // screen on the Muntuz host. The Exchange app lives at /exchange (linked from
  // the landing's "Start chatting" CTA). Every other path on the Muntuz host
  // passes through unchanged, so /exchange, /muntuz and the rest of the app keep
  // working. muntalk.com and every other host fall through to the normal rules
  // below unchanged.
  // (Previously, the root rewrote to /exchange — the Exchange app was the first
  // screen. PR #165 set that; this change moves the landing to the front door.)
  // Host detection: `request.nextUrl.hostname` is NOT reliable — a bare
  // `next start` server reports its own listen address (localhost) there
  // and ignores the Host header (verified 2026-10-30). Read the headers
  // directly instead: Vercel sets x-forwarded-host to the real domain,
  // and a plain Host header works everywhere else.
  const rawHost =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.hostname;
  const hostname = rawHost
    .split(',')[0]
    .trim()
    .split(':')[0]
    .toLowerCase();
  const isMuntuz = hostname === 'muntuz.com' || hostname === 'www.muntuz.com';
  if (isMuntuz && pathname === '/') {
    return NextResponse.rewrite(new URL('/muntuz', request.url));
  }

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
  // Root only: the only path this middleware ever rewrites is '/'
  // (Muntuz host → /muntuz). Every other branch above returns
  // NextResponse.next(), so no other path needs to invoke it.
  matcher: ['/'],
};
