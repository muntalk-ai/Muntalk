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
  // 유지율 엔진 (Phase 3)
  streakFreezes: number;      // 보유 스트릭 프리즈 수
  lastFreezeUsedAt?: string;  // 마지막 프리즈 사용일 (YYYY-MM-DD)
  certificates?: string[];    // 수료한 CEFR 레벨 id 목록
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
  streakFreezes:    1,
  certificates:     [],
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

export interface ActivityResult {
  streak: number;
  freezeUsed: boolean;    // 오늘 프리즈가 소모됐는지
  freezeEarned: boolean;   // 오늘 프리즈를 획득했는지 (7일 마일스톤)
}

/** 오늘 활동 기록 + 스트릭 계산 후 저장 (프리즈 브리징 포함) */
export async function recordActivity(uid: string, profile: UserProfile): Promise<ActivityResult> {
  const today = new Date().toISOString().slice(0, 10);
  const existing = Array.isArray(profile.activityDates) ? profile.activityDates : [];

  // 오늘 이미 기록되어 있으면 streak 재계산만 하고 저장 생략 (중복 write 방지)
  const alreadyToday = existing.includes(today);
  const oldStreak = profile.streak || 0;
  let freezes = profile.streakFreezes ?? 1;

  const dates0 = [...new Set([...existing, today])].sort();

  // 연속일 계산 (헬퍼)
  const calcStreak = (ds: string[]) => {
    let s = 0;
    let cursor = new Date(today);
    for (const d of [...ds].reverse()) {
      const diff = (cursor.getTime() - new Date(d).getTime()) / 86400000;
      if (diff <= 1) { s++; cursor = new Date(d); }
      else break;
    }
    return s;
  };

  // activityDates가 없거나 비어있는데 streak은 있는 경우 → 데이터 손실로 간주
  // 기존 streak을 보존하면서 오늘 날짜만 추가
  if (existing.length === 0 && oldStreak > calcStreak(dates0)) {
    // 오늘 날짜 기록하되 streak은 기존 값 유지 (1로 리셋하지 않음)
    await updateUserProfile(uid, { activityDates: [today], lastActive: today });
    return { streak: oldStreak, freezeUsed: false, freezeEarned: false };
  }

  // ── Streak Freeze 브리징: 오늘 이전의 빈 날짜를 프리즈로 메움 ──
  // (잃을 스트릭이 있을 때만, 하루당 프리즈 1개 소모)
  let freezeUsed = false;
  const bridged: string[] = [];
  {
    const dateSet = new Set(dates0);
    const cursor = new Date(today);
    cursor.setDate(cursor.getDate() - 1); // 어제부터 역행
    while (freezes > 0) {
      const ds = cursor.toISOString().slice(0, 10);
      if (dateSet.has(ds)) break; // 체인이 자연스럽게 이어짐
      const hasEarlier = [...dateSet].some(d => d < ds);
      if (!hasEarlier) break; // 더 이전 기록이 없으면 지킬 스트릭 없음
      freezes -= 1;
      freezeUsed = true;
      bridged.push(ds);
      dateSet.add(ds);
      cursor.setDate(cursor.getDate() - 1);
    }
  }
  const dates = [...new Set([...dates0, ...bridged])].sort();
  const streak = calcStreak(dates);

  // ── 프리즈 획득: 7일 마일스톤마다 +1 (최대 5개) ──
  let freezeEarned = false;
  if (streak > oldStreak && Math.floor(streak / 7) > Math.floor(oldStreak / 7) && freezes < 5) {
    freezes += 1;
    freezeEarned = true;
  }

  if (!alreadyToday || freezeUsed || freezeEarned) {
    await updateUserProfile(uid, {
      activityDates: dates,
      streak,
      lastActive: today,
      streakFreezes: freezes,
      ...(freezeUsed ? { lastFreezeUsedAt: today } : {}),
    });
  }
  return { streak, freezeUsed, freezeEarned };
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

// --- 구독 필드 추가 ----------------------------------------------------------
// UserProfile에 subscription 캐시 필드 추가
export interface UserProfileWithSub extends UserProfile {
  planId?: string;        // 'free' | 'monthly' | 'biannual' | 'annual'
  planStatus?: string;    // 'active' | 'canceled' etc
  emailNotifications?: boolean;
  telegramChatId?: string;
  telegramConnected?: boolean;
}
