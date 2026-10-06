// lib/apiGuard.ts — 서버 전용 API 가드 (PR-F)
// Firebase ID Token 인증 + 인메모리 레이트리밋 + 타임아웃 fetch.
// Vercel 서버리스의 per-instance 메모리 한계를 감안한 1차 방어선 (과도 설계 금지).

import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

function getAdminAuth() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel 환경변수에서 \n 처리 필수
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as admin.ServiceAccount),
    });
  }
  return admin.auth();
}

export interface Identity {
  uid: string;
  email?: string;
}

/**
 * `Authorization: Bearer <Firebase ID token>` 검증.
 * 토큰이 없거나 유효하지 않으면 null (게스트 경로에서 IP 기반 제한과 병행).
 */
export async function getIdentity(req: NextRequest): Promise<Identity | null> {
  const m = /^Bearer (.+)$/i.exec(req.headers.get('authorization') || '');
  if (!m) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(m[1]);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

// ── 인메모리 토큰 버킷 ──────────────────────────────────────────────
interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  // 메모리 상한을 위한 opportunistic 정리
  if (buckets.size > 10000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count < max) {
    b.count += 1;
    return { ok: true, retryAfterSec: 0 };
  }
  return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  const ip = fwd?.split(',')[0]?.trim();
  return ip || 'unknown';
}

export function apiError(
  error: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error, ...extra }, { status });
}

/** 하드 타임아웃이 있는 fetch (기본 30s) — Gemini/TTS 행(hang) 방지. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 30000,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * 안전 에러 응답 — 서버 로그에는 원문을 기록하고, 클라이언트에는
 * 내부 동작이 드러나지 않는 일반 메시지만 반환 (2차 감사 #8).
 */
export function apiSafeError(logPrefix: string, e: unknown, status = 500) {
  console.error(logPrefix, e);
  return NextResponse.json({ error: 'Internal server error' }, { status });
}

/** 특권 엔드포인트용 어드민 이메일 화이트리스트 (send-email). */
export function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || 'muntalkofficial@gmail.com')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

// ── 영속 일일 사용량 상한 (PR #111) ──────────────────────────────────
// Vercel 서버리스는 인스턴스별 인메모리 카운터가 공유되지 않으므로,
// 일일 상한은 Firestore에 저장한다 (Admin SDK → security rules 우회,
// 별도 콘솔 작업 불필요). 일일 키이므로 문서 ID에 UTC 날짜를 포함.
// 상수는 env로 오버라이드 가능.
function numEnv(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

/** 로그인 유저: TTS 200회/일 */
export const DAILY_CAP_TTS_USER = numEnv('DAILY_CAP_TTS_USER', 200);
/** 게스트: TTS 30회/일 */
export const DAILY_CAP_TTS_GUEST = numEnv('DAILY_CAP_TTS_GUEST', 30);
/** 로그인 유저: Gemini 텍스트 300회/일 */
export const DAILY_CAP_GEMINI_USER = numEnv('DAILY_CAP_GEMINI_USER', 300);
/** 게스트: Gemini 텍스트 60회/일 */
export const DAILY_CAP_GEMINI_GUEST = numEnv('DAILY_CAP_GEMINI_GUEST', 60);

const DAILY_USAGE_COLLECTION = 'api_daily_usage';

function getAdminDb() {
  getAdminAuth(); // 앱 초기화 보장
  return admin.firestore();
}

function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

/**
 * 유저당 일일 상한 체크 (영속 카운터, 트랜잭션으로 원자적 증가).
 * - identityKey: `uid:<uid>` 또는 `ip:<ip>` 형태 (호출자가 구성)
 * - 상한 초과 시 ok:false + 자정(UTC)까지 남은 초 반환
 * - Firestore 장애 시 fail-open (분당 인메모리 제한이 1차 방어선으로 유지)
 */
export async function checkDailyLimit(
  scope: 'tts' | 'gemini',
  identityKey: string,
  max: number,
): Promise<{ ok: boolean; retryAfterSec: number; remaining: number }> {
  const day = utcDayKey();
  const docId = `${scope}:${identityKey}:${day}`;
  try {
    const db = getAdminDb();
    const ref = db.collection(DAILY_USAGE_COLLECTION).doc(docId);
    const allowed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const count = snap.exists ? Number(snap.data()?.count ?? 0) : 0;
      if (count >= max) return false;
      tx.set(
        ref,
        { count: count + 1, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );
      return true;
    });
    if (!allowed) {
      const msLeft = Date.parse(day + 'T00:00:00Z') + 86_400_000 - Date.now();
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil(msLeft / 1000)), remaining: 0 };
    }
    return { ok: true, retryAfterSec: 0, remaining: -1 }; // remaining은 참고용(트랜잭션 내 계산 생략)
  } catch (e) {
    console.error('[apiGuard] checkDailyLimit failed (fail-open):', e);
    return { ok: true, retryAfterSec: 0, remaining: -1 };
  }
}
