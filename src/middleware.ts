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

  // ── Muntuz manifest (TWA): the Muntuz Android app (com.muntuz.app)
  // points its webManifestUrl at /manifest.webmanifest on the muntuz host.
  // Serve the Muntuz-branded manifest there; every other host keeps the
  // MunTalk manifest (the plain public/ file, no rewrite).
  if (isMuntuz && pathname === '/manifest.webmanifest') {
    return NextResponse.rewrite(new URL('/manifest-muntuz.webmanifest', request.url));
  }

  // ── Muntuz logo (2026-11-23, new Muntuz badge): the shared logo files
  // (/logo.png, /apple-touch-icon.png, /icon-maskable.png) also serve
  // muntalk.com, so they must NOT be overwritten. On the Muntuz host they
  // rewrite to the Muntuz-only copies instead — this covers every consumer
  // of the shared paths at once (Exchange header, setup header, LevelHub
  // nav, OG/Twitter images, TWA iconUrl/maskableIconUrl, both manifests).
  // muntalk.com and every other host keep the shared files unchanged.
  // Since 2026-11-23 (favicon/OG follow-up) the favicon and the FCM push
  // icon also rewrite on the Muntuz host: /favicon.ico and /icon-192x192.png
  // serve /logo-muntuz.png (no dedicated Muntuz copies exist for them).
  // A PNG served at the .ico path is fine — browsers use a PNG favicon
  // based on content-type. The shared files themselves are never touched,
  // so muntalk.com keeps the old badge everywhere.
  if (isMuntuz && pathname === '/logo.png') {
    return NextResponse.rewrite(new URL('/logo-muntuz.png', request.url));
  }
  if (isMuntuz && pathname === '/apple-touch-icon.png') {
    return NextResponse.rewrite(new URL('/apple-touch-icon-muntuz.png', request.url));
  }
  if (isMuntuz && pathname === '/icon-maskable.png') {
    return NextResponse.rewrite(new URL('/icon-maskable-muntuz.png', request.url));
  }
  if (isMuntuz && pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/logo-muntuz.png', request.url));
  }
  if (isMuntuz && pathname === '/icon-192x192.png') {
    return NextResponse.rewrite(new URL('/logo-muntuz.png', request.url));
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
  // '/' (Muntuz host → /muntuz), '/manifest.webmanifest'
  // (Muntuz host → /manifest-muntuz.webmanifest), and the shared logo
  // paths (Muntuz host → Muntuz-only copies, see above), plus
  // '/favicon.ico' and '/icon-192x192.png' (Muntuz host → /logo-muntuz.png).
  // Every other branch above returns NextResponse.next(), so no other
  // path needs to invoke it.
  matcher: ['/', '/manifest.webmanifest', '/logo.png', '/apple-touch-icon.png', '/icon-maskable.png', '/favicon.ico', '/icon-192x192.png'],
};
