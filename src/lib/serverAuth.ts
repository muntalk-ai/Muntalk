// lib/serverAuth.ts — 서버 전용 인증/레이트리밋 헬퍼 (PR-H)
// NOTE: PR-F의 lib/apiGuard.ts와 역할이 겹치나, 해당 PR이 아직 미머지이므로
// PR-H는 자립적으로 동작하는 최소 구현을 둔다. PR-F 머지 후 통합 검토.
// Admin SDK 초기화는 lazy (핸들러 호출 시) — 빌드 시점의 페이지 데이터 수집이
// 환경변수 없이도 통과해야 하므로 모듈 로드 시점에 초기화하지 않는다.

import { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';

function getAdminAuth() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel 환경변수에서 \\n 처리 필수
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
      } as admin.ServiceAccount),
    });
  }
  return admin.auth();
}

export function getAdminDb() {
  getAdminAuth(); // 앱 초기화 보장
  return admin.firestore();
}

/** `Authorization: Bearer <Firebase ID token>` 검증 → uid 반환 (실패 시 null) */
export async function verifyRequestUid(req: NextRequest): Promise<string | null> {
  const m = /^Bearer (.+)$/i.exec(req.headers.get('authorization') || '');
  if (!m) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(m[1]);
    return decoded.uid;
  } catch {
    return null;
  }
}

// ── 인메모리 토큰 버킷 (Vercel 서버리스 per-instance 1차 방어선) ──
interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();

/** true = 허용(카운트 증가), false = 제한 초과 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 10000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count < max) {
    b.count += 1;
    return true;
  }
  return false;
}

/** 윈도우 내 누적 합계 (일일 XP 상한 등 합계 기반 제한용) */
const sums = new Map<string, { total: number; resetAt: number }>();
export function rateSum(key: string, add: number, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (sums.size > 10000) {
    for (const [k, s] of sums) if (s.resetAt <= now) sums.delete(k);
  }
  const s = sums.get(key);
  if (!s || s.resetAt <= now) {
    if (add > max) return false;
    sums.set(key, { total: add, resetAt: now + windowMs });
    return true;
  }
  if (s.total + add > max) return false;
  s.total += add;
  return true;
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || 'unknown';
}
