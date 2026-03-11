/**
 * trialPolicy.ts
 * 14일 무료 체험 정책 관리
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │  FREE TRIAL (14일)          │  PREMIUM                  │
 * ├─────────────────────────────┼───────────────────────────┤
 * │  언어       최대 3개        │  65개 전체                │
 * │  AI 채팅    5회/일          │  무제한                   │
 * │  단원       언어당 첫 3단원  │  전체                     │
 * │  트랙진단   무제한          │  무제한                   │
 * │  레벨진단   1회             │  무제한                   │
 * │  학습기록   7일             │  전체                     │
 * │  오프라인   ❌              │  ✅                       │
 * │  시험대비   ❌              │  ✅                       │
 * └─────────────────────────────┴───────────────────────────┘
 */

import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// ── 상수 ────────────────────────────────────────────────────
export const TRIAL_DAYS          = 14;
export const TRIAL_MAX_LANGUAGES = 3;
export const TRIAL_MAX_UNITS     = 3;   // 언어당 첫 N단원
export const TRIAL_DAILY_CHATS   = 5;
export const TRIAL_STATS_DAYS    = 7;   // 학습기록 보관 일수

// ── Firestore 문서 타입 ──────────────────────────────────────
export interface TrialData {
  startedAt:    string;   // ISO — 첫 로그인 시각
  expiresAt:    string;   // ISO — startedAt + 14일
  languages:    string[]; // 선택한 언어 코드 목록 (최대 3)
  chatUsage:    { date: string; count: number };
  levelTestDone: boolean; // 레벨 진단 1회 사용 여부
}

// ── 날짜 유틸 ────────────────────────────────────────────────
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function todayKST(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// ── Trial 초기화 (첫 로그인 시 호출) ────────────────────────
export async function initTrial(uid: string): Promise<TrialData> {
  const ref  = doc(db, 'trials', uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return snap.data() as TrialData;

  const now      = new Date();
  const trial: TrialData = {
    startedAt:    now.toISOString(),
    expiresAt:    addDays(now, TRIAL_DAYS).toISOString(),
    languages:    [],
    chatUsage:    { date: todayKST(), count: 0 },
    levelTestDone: false,
  };
  await setDoc(ref, trial);
  return trial;
}

// ── Trial 상태 조회 ──────────────────────────────────────────
export async function getTrialData(uid: string): Promise<TrialData | null> {
  try {
    const snap = await getDoc(doc(db, 'trials', uid));
    return snap.exists() ? (snap.data() as TrialData) : null;
  } catch { return null; }
}

// ── 만료 여부 ────────────────────────────────────────────────
export function isTrialExpired(trial: TrialData): boolean {
  return new Date() > new Date(trial.expiresAt);
}

// ── 남은 일수 ────────────────────────────────────────────────
export function trialDaysRemaining(trial: TrialData): number {
  const ms = new Date(trial.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// ── 언어 추가 (3개 초과 시 false 반환) ──────────────────────
export async function addTrialLanguage(uid: string, langCode: string): Promise<boolean> {
  const trial = await getTrialData(uid);
  if (!trial) return false;
  if (trial.languages.includes(langCode)) return true; // 이미 추가됨
  if (trial.languages.length >= TRIAL_MAX_LANGUAGES) return false; // 초과

  await updateDoc(doc(db, 'trials', uid), {
    languages: [...trial.languages, langCode],
  });
  return true;
}

// ── 언어 접근 가능 여부 ──────────────────────────────────────
export function canAccessLanguage(trial: TrialData, langCode: string): boolean {
  if (isTrialExpired(trial)) return false;
  return trial.languages.includes(langCode) || trial.languages.length < TRIAL_MAX_LANGUAGES;
}

// ── 단원 접근 가능 여부 (첫 3단원만) ────────────────────────
export function canAccessLesson(
  trial: TrialData,
  lessonIndex: number // 0-based, 전체 커리큘럼 기준
): boolean {
  if (isTrialExpired(trial)) return false;
  return lessonIndex < TRIAL_MAX_UNITS;
}

// ── AI 채팅 가능 여부 ────────────────────────────────────────
export async function canChat(uid: string): Promise<{ allowed: boolean; remaining: number }> {
  const trial = await getTrialData(uid);
  if (!trial || isTrialExpired(trial)) return { allowed: false, remaining: 0 };

  const today = todayKST();
  const count = trial.chatUsage.date === today ? trial.chatUsage.count : 0;
  const remaining = Math.max(0, TRIAL_DAILY_CHATS - count);
  return { allowed: remaining > 0, remaining };
}

// ── AI 채팅 사용 기록 ────────────────────────────────────────
export async function incrementChatUsage(uid: string): Promise<void> {
  const trial = await getTrialData(uid);
  if (!trial) return;
  const today = todayKST();
  const count = trial.chatUsage.date === today ? trial.chatUsage.count + 1 : 1;
  await updateDoc(doc(db, 'trials', uid), {
    chatUsage: { date: today, count },
  });
}

// ── 레벨 진단 사용 기록 ──────────────────────────────────────
export async function markLevelTestDone(uid: string): Promise<void> {
  await updateDoc(doc(db, 'trials', uid), { levelTestDone: true });
}

// ── 프리미엄 여부 확인 ───────────────────────────────────────
export async function isPremium(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'subscriptions', uid));
    if (!snap.exists()) return false;
    const data = snap.data();
    return data.planId !== 'free' && data.status === 'active';
  } catch { return false; }
}

// ── 종합 접근 권한 체크 ──────────────────────────────────────
export interface AccessResult {
  allowed:   boolean;
  reason?:   'expired' | 'language_limit' | 'lesson_limit' | 'chat_limit' | 'level_test_done' | 'premium_only';
  trial?:    TrialData;
  daysLeft?: number;
}

export async function checkAccess(
  uid: string | null,
  type: 'lesson' | 'chat' | 'language' | 'level_test',
  meta?: { langCode?: string; lessonIndex?: number }
): Promise<AccessResult> {
  if (!uid) return { allowed: false, reason: 'expired' };

  // 프리미엄이면 전부 허용
  if (await isPremium(uid)) return { allowed: true };

  const trial = await getTrialData(uid) || await initTrial(uid);

  if (isTrialExpired(trial)) return { allowed: false, reason: 'expired', trial };

  const daysLeft = trialDaysRemaining(trial);

  switch (type) {
    case 'language':
      if (!canAccessLanguage(trial, meta?.langCode || ''))
        return { allowed: false, reason: 'language_limit', trial, daysLeft };
      return { allowed: true, trial, daysLeft };

    case 'lesson':
      if (!canAccessLesson(trial, meta?.lessonIndex ?? 0))
        return { allowed: false, reason: 'lesson_limit', trial, daysLeft };
      return { allowed: true, trial, daysLeft };

    case 'chat': {
      const { allowed, remaining } = await canChat(uid);
      if (!allowed) return { allowed: false, reason: 'chat_limit', trial, daysLeft };
      return { allowed: true, trial, daysLeft };
    }

    case 'level_test':
      if (trial.levelTestDone)
        return { allowed: false, reason: 'level_test_done', trial, daysLeft };
      return { allowed: true, trial, daysLeft };

    default:
      return { allowed: true, trial, daysLeft };
  }
}
