/**
 * trialTimer.ts
 * 
 * 무료 체험 시간 관리
 * ─────────────────────────────────────────────────────────────
 * 비로그인(guest)  : localStorage만 사용. 브라우저 닫아도 유지.
 *                    체험 시작 timestamp + 누적 사용 초(seconds) 저장.
 * 무료 회원(free)  : Firestore `trial_usage/{uid}` + localStorage 동기화.
 *                    매일 자정 KST 기준 리셋.
 * 프리미엄         : 제한 없음 — 이 모듈 사용 안 함.
 * ─────────────────────────────────────────────────────────────
 */

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const TRIAL_SECONDS = 10 * 60; // 10분

// ── localStorage keys ────────────────────────────────────────
const LS_GUEST_USED  = 'mt_trial_used_s';   // 누적 사용 초 (guest)
const LS_GUEST_DATE  = 'mt_trial_date';      // 마지막 사용 날짜 (free 회원용)
const LS_GUEST_START = 'mt_trial_active_ts'; // 현재 세션 시작 timestamp

// ── 오늘 날짜 문자열 (YYYY-MM-DD, KST) ──────────────────────
function todayKST(): string {
  return new Date(Date.now() + 9 * 3600 * 1000)
    .toISOString().slice(0, 10);
}

// ── 게스트: localStorage 기반 ────────────────────────────────

export interface TrialStatus {
  remainingSeconds: number;   // 남은 초
  usedSeconds: number;        // 이미 사용한 초
  isExpired: boolean;         // 완전 소진됐는지
  isGuest: boolean;
}

/** 게스트의 현재 체험 상태 읽기 */
export function getGuestTrialStatus(): TrialStatus {
  const used = parseInt(localStorage.getItem(LS_GUEST_USED) || '0', 10);
  const remaining = Math.max(0, TRIAL_SECONDS - used);
  return {
    remainingSeconds: remaining,
    usedSeconds: used,
    isExpired: remaining <= 0,
    isGuest: true,
  };
}

/** 게스트 누적 사용 초 기록 */
export function saveGuestUsedSeconds(seconds: number) {
  const clamped = Math.min(seconds, TRIAL_SECONDS);
  localStorage.setItem(LS_GUEST_USED, String(clamped));
}

// ── 무료 회원: Firestore 기반 ────────────────────────────────

export interface FreeTrialDoc {
  date:        string;  // YYYY-MM-DD
  usedSeconds: number;
}

/** 무료 회원 체험 상태 읽기 (Firestore → localStorage fallback) */
export async function getFreeTrialStatus(uid: string): Promise<TrialStatus> {
  const today = todayKST();
  try {
    const snap = await getDoc(doc(db, 'trial_usage', uid));
    if (snap.exists()) {
      const data = snap.data() as FreeTrialDoc;
      // 날짜가 오늘이 아니면 리셋
      const used = data.date === today ? data.usedSeconds : 0;
      // localStorage 동기화
      localStorage.setItem(LS_GUEST_USED, String(used));
      localStorage.setItem(LS_GUEST_DATE, today);
      const remaining = Math.max(0, TRIAL_SECONDS - used);
      return { remainingSeconds: remaining, usedSeconds: used, isExpired: remaining <= 0, isGuest: false };
    }
  } catch (e) {
    console.warn('[trialTimer] Firestore read failed, using localStorage', e);
  }
  // fallback to localStorage
  const lsDate = localStorage.getItem(LS_GUEST_DATE);
  const lsUsed = lsDate === today ? parseInt(localStorage.getItem(LS_GUEST_USED) || '0', 10) : 0;
  const remaining = Math.max(0, TRIAL_SECONDS - lsUsed);
  return { remainingSeconds: remaining, usedSeconds: lsUsed, isExpired: remaining <= 0, isGuest: false };
}

/** 무료 회원 사용 초 저장 */
export async function saveFreeTrialUsage(uid: string, usedSeconds: number) {
  const today = todayKST();
  const clamped = Math.min(usedSeconds, TRIAL_SECONDS);
  // localStorage 즉시 업데이트
  localStorage.setItem(LS_GUEST_USED, String(clamped));
  localStorage.setItem(LS_GUEST_DATE, today);
  // Firestore 비동기 저장
  try {
    await setDoc(doc(db, 'trial_usage', uid), {
      date:        today,
      usedSeconds: clamped,
      updatedAt:   new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[trialTimer] Firestore write failed', e);
  }
}

// ── 활성 세션 타이머 유틸 ────────────────────────────────────

/** 세션 시작 기록 */
export function markSessionStart() {
  localStorage.setItem(LS_GUEST_START, String(Date.now()));
}

/** 세션 시작 이후 경과 초 */
export function getSessionElapsedSeconds(): number {
  const ts = parseInt(localStorage.getItem(LS_GUEST_START) || '0', 10);
  if (!ts) return 0;
  return Math.floor((Date.now() - ts) / 1000);
}

/** 세션 클리어 */
export function clearSessionStart() {
  localStorage.removeItem(LS_GUEST_START);
}
