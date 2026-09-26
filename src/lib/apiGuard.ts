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

/** 특권 엔드포인트용 어드민 이메일 화이트리스트 (send-email). */
export function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || 'muntalkofficial@gmail.com')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
