// lib/userProfile.ts
// Firestore에 유저 데이터 저장/불러오기

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid:          string;
  email:        string;
  displayName:  string;
  photoURL:     string;
  // 학습 설정
  learnLang:    string;   // 학습 언어 코드 (e.g. 'en-US')
  nativeLang:   string;   // 모국어 코드
  tutorId:      string;   // 선택한 튜터
  // 진도
  xp:           number;
  streak:       number;
  lastActive:   string;   // YYYY-MM-DD
  activityDates: string[]; // 출석 날짜 배열
  completedLessons: string[];
  // 진단
  placementDone?:  boolean;
  placementLevel?: string;
  placementTrack?: string;
  emailNotifications?: boolean;
  pushNotifications?:  boolean;
  // 메타
  createdAt:    any;
  updatedAt:    any;
}

const DEFAULT_PROFILE: Omit<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL' | 'createdAt'> = {
  learnLang:        'en-US',
  nativeLang:       'ko-KR',
  tutorId:          't01',
  xp:               0,
  streak:           0,
  lastActive:       '',
  activityDates:    [],
  completedLessons: [],
  updatedAt:        null,
};

/** 유저 프로필 불러오기 — 없으면 null */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { ...DEFAULT_PROFILE, ...snap.data() } as UserProfile : null;
}

/** 신규 유저 프로필 생성 */
export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
): Promise<UserProfile> {
  const profile: UserProfile = {
    uid, email, displayName, photoURL,
    ...DEFAULT_PROFILE,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', uid), profile);
  return profile;
}

/** 프로필 부분 업데이트 — setDoc merge 사용으로 필드 없어도 안전하게 저장 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** 오늘 활동 기록 + 스트릭 계산 후 저장 */
export async function recordActivity(uid: string, profile: UserProfile): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const existing = Array.isArray(profile.activityDates) ? profile.activityDates : [];
  const dates = [...new Set([...existing, today])].sort();

  // 연속일 계산
  let streak = 0;
  let cursor = new Date(today);
  for (const d of [...dates].reverse()) {
    const diff = (cursor.getTime() - new Date(d).getTime()) / 86400000;
    if (diff <= 1) { streak++; cursor = new Date(d); }
    else break;
  }

  await updateUserProfile(uid, { activityDates: dates, streak, lastActive: today });
  return streak;
}

/** localStorage → Firestore 마이그레이션 (첫 로그인 시) */
export async function migrateFromLocalStorage(uid: string) {
  const xp      = parseInt(localStorage.getItem('mt_xp') || '0', 10);
  const done    = JSON.parse(localStorage.getItem('mt_done') || '[]') as string[];
  const dates   = JSON.parse(localStorage.getItem('mt_activity_dates') || '[]') as string[];
  const learn   = localStorage.getItem('mt_learn_lang') || 'en-US';
  const native  = localStorage.getItem('mt_native_lang') || 'ko-KR';
  const tutorId = localStorage.getItem('mt_tutor_id') || 't01';

  if (xp || done.length || dates.length) {
    await updateUserProfile(uid, {
      xp, completedLessons: done, activityDates: dates,
      learnLang: learn, nativeLang: native, tutorId,
    });
  }
}

// ─── 구독 필드 추가 ──────────────────────────────────────────────────────────
// UserProfile에 subscription 캐시 필드 추가
export interface UserProfileWithSub extends UserProfile {
  planId?: string;        // 'free' | 'monthly' | 'biannual' | 'annual'
  planStatus?: string;    // 'active' | 'canceled' etc
  emailNotifications?: boolean;
  telegramChatId?: string;
  telegramConnected?: boolean;
}
