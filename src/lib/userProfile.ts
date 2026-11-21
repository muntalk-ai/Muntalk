// lib/userProfile.ts
// Firestore에 유저 데이터 저장/불러오기

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { awardXp } from './xpClient';
import { lpGet, lpGetAs, lpGetIntAs, lpGetJsonAs, lpSetAs, claimLocalProgress, isLocalProgressOwner } from './localProgress';
import type { LearningPurpose } from './purpose';
import { isLearningPurpose } from './purpose';
import { UI_LANGUAGES } from '@/data/languages';

/** 브라우저 로케일에서 모국어 코드 감지 (신규 가입 기본값용)
 *  navigator.language(e.g. 'vi', 'vi-VN')를 UI_LANGUAGES 코드와 매칭.
 *  매칭 실패 시 기본값 'en-US'. SSR 가드 포함. */
export function detectBrowserNativeLang(): string {
  const FALLBACK = 'en-US';
  try {
    if (typeof navigator === 'undefined' || !navigator.language) return FALLBACK;
    const nav = navigator.language.toLowerCase();
    const codes = UI_LANGUAGES.map(l => l.code);
    // 1) 정확히 일치 (대소문자 무시)
    const exact = codes.find(c => c.toLowerCase() === nav);
    if (exact) return exact;
    // 2) 언어 subtag만 일치 (e.g. 'vi' -> 'vi-VN', 'pt' -> 'pt-BR')
    const subtag = nav.split('-')[0];
    const prefix = codes.find(c => c.toLowerCase().startsWith(subtag + '-'));
    if (prefix) return prefix;
  } catch { /* ignore */ }
  return FALLBACK;
}

/** 학습 언어 해석 체인 (resolveNativeLang과 동일 패턴)
 *  프로필(Firestore, 단일 진실 공급원) → localStorage('mt_learn_lang', 읽기 캐시) → 'en-US'.
 *  단, PR-126 회귀 방지: 프로필이 아직 시드 기본값('en-US')인데 캐시에 기본값이
 *  아닌 값이 있으면 캐시가 이긴다. 시드 프로필은 '선택한 적 없음'을 뜻하고,
 *  캐시의 값은 사용자가 어딘가에서 고른 선택이기 때문이다 (게스트 선택 후
 *  로그인 시 이관 누락, 저장 실패 등으로 프로필이 기본값에 머무는 경우).
 *  프로필이 기본값이 아닌 값이면 의도적 선택으로 간주해 프로필이 이긴다.
 *  레슨·게임·코치 등 모든 기능이 이 함수로 학습 언어를 읽는다 — 어느 한 곳이
 *  localStorage만 보거나 'en-US'으로 직행하면 안 된다 (QA S-5). */
export function resolveLearnLang(profileLearn?: string | null): string {
  try {
    if (typeof window !== 'undefined') {
      // 계정별 로컬 캐시 — 현재 세션 uid 기준 (게스트는 공용 키).
      const ls = lpGet('mt_learn_lang');
      if (ls && ls !== 'en-US' && (!profileLearn || profileLearn === 'en-US')) return ls;
    }
  } catch { /* ignore */ }
  if (profileLearn) return profileLearn;
  try {
    if (typeof window !== 'undefined') {
      const ls = lpGet('mt_learn_lang');
      if (ls) return ls;
    }
  } catch { /* ignore */ }
  return 'en-US';
}

/** 학습 목적 해석 체인 — 프로필 → localStorage('mt_purpose') → 미설정.
 *  Starter의 목적 게이트와 프로필 페이지가 같은 값을 봐야 한다 (QA S-5). */
export function resolvePurpose(profilePurpose?: LearningPurpose | null): LearningPurpose | undefined {
  if (isLearningPurpose(profilePurpose)) return profilePurpose;
  try {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('mt_purpose');
      if (isLearningPurpose(s)) return s;
    }
  } catch { /* ignore */ }
  return undefined;
}

/** 모국어 해석 체인 (배치 테스트 페이지와 동일 패턴)
 *  프로필 → localStorage('mt_native_lang') → 브라우저 언어 감지 → 'en-US'.
 *  'ko-KR' 하드코딩 기본값 없음. SSR 가드 포함. */
export function resolveNativeLang(profileNative?: string | null): string {
  if (profileNative) return profileNative;
  try {
    if (typeof window !== 'undefined') {
      const ls = lpGet('mt_native_lang');
      if (ls) return ls;
    }
  } catch { /* ignore */ }
  return detectBrowserNativeLang();
}

export interface UserProfile {
  uid:          string;
  email:        string;
  displayName:  string;
  photoURL:     string;
  // 학습 설정
  learnLang:    string;   // 학습 언어 코드 (e.g. 'en-US')
  nativeLang:   string;   // 모국어 코드
  tutorId:      string;   // 선택한 튜터
  // 언어 설정 확정 여부 — 신규 가입 시 자동 감지/기본값으로 채워지므로,
  // LangSetupPrompt에서 사용자가 직접 선택하면 true. 기존 유저(필드 없음)는
  // DEFAULT_PROFILE 병합으로 true 취급 → 팝업 안 뜸.
  langsConfirmed?: boolean;
  // 진도
  xp:           number;
  streak:       number;
  lastActive:   string;   // YYYY-MM-DD
  activityDates: string[]; // 출석 날짜 배열
  completedLessons: string[];
  // 문법 허브 완료 챕터 (QA M-10) — 서버에 저장해 기기 간에도 유지.
  // 로컬 mt_grammar_done과 합집합으로 병합한다.
  completedGrammar?: string[];
  // 유지율 엔진 (Phase 3)
  streakFreezes: number;      // 보유 스트릭 프리즈 수
  lastFreezeUsedAt?: string;  // 마지막 프리즈 사용일 (YYYY-MM-DD)
  certificates?: string[];    // 수료한 CEFR 레벨 id 목록
  // 진단
  placementDone?:  boolean;
  placementLevel?: string;
  placementTrack?: string;
  // 구독 캐시 (Stripe 웹훅·관리자 Grant가 users 문서에도 함께 씀 —
  // /profile이 이 값을 보여준다. QA S-3: subscriptions 문서와 달라질
  // 수 있어 게이팅은 양쪽을 함께 본다)
  planId?:       string;   // 'free' | 'monthly' | 'biannual' | 'annual'
  planStatus?:   string;   // 'active' | 'canceled' etc
  // 학습 목적 (B-11) — optional: 기존 유저 문서에 변경 불필요
  purpose?:        LearningPurpose | null; // B-11: null = 미설정(초기화)
  purposeSetAt?:   string;   // ISO 날짜 (YYYY-MM-DD)
  purposeSkippedAt?: string; // QA M-16: 목적 게이트 'Skip for now' 날짜 (YYYY-MM-DD) — 있으면 게이트를 다시 띄우지 않음
  emailNotifications?: boolean;
  pushNotifications?:  boolean;
  timezone?: string;   // IANA 타임존 (저녁 푸시 리마인드용, 로그인 시 갱신)
  // 추천 프로그램 (PR #114) — optional: 기존 유저 문서에 변경 불필요
  referralCode?:       string;   // 내 추천 코드 (예: "KX7Q2M9A")
  referredBy?:         string;   // 나를 초대한 유저 UID
  referralRewardPaid?: boolean;  // 추천인 리워드 지급 완료 여부 (추천받은 유저당 1회)
  referralCount?:      number;   // 내가 초대한 가입자 수
  // 메타
  createdAt:    any;
  updatedAt:    any;
}

const DEFAULT_PROFILE: Omit<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL' | 'createdAt'> = {
  learnLang:        'en-US',
  nativeLang:       'ko-KR',
  tutorId:          't01',
  langsConfirmed:   true, // 기존 유저(필드 없음)는 확정 취급 — 팝업 스킵
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
    nativeLang: detectBrowserNativeLang(),
    langsConfirmed: false, // 신규 가입 — LangSetupPrompt에서 직접 선택할 때까지 미확정
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

// UX-infra #10: 기기 로컬 타임존 기준 YYYY-MM-DD 날짜 키.
// (UTC 기준이면 KST 심야 학습자의 스트릭이 끊기는 문제 발생)
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 오늘 활동 기록 + 스트릭 계산 후 저장 (프리즈 브리징 포함)
 *
 *  ⚠️ 호출 규칙: 레슨/세션 완료 등 **의미 있는 학습 활동이 실제로 발생했을 때만** 호출.
 *  로그인/화면 방문 시점에는 호출 금지 (방문만으로 스트릭이 기록되는 것을 방지).
 *
 *  날짜 기준: 모든 날짜 키는 기기 로컬 타임존 기준 YYYY-MM-DD (localDateKey).
 *  UI 측에서도 반드시 localDateKey로 생성/비교해야 일관되게 동작함.
 */
export async function recordActivity(uid: string, profile: UserProfile): Promise<ActivityResult> {
  const today = localDateKey(new Date());
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
      const ds = localDateKey(cursor);
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

/** localStorage → Firestore 마이그레이션 (첫 로그인 시)
 *
 *  계정 분리: 이 함수는 이 uid의 로컬 키(`mt_xp_<uid>` 등)만 읽는다.
 *  claimLocalProgress가 먼저 공용 키 데이터를 이 uid 키로 이어받고
 *  마커를 설정한다. 다른 계정이 이미 이어받은 기기에서는
 *  isLocalProgressOwner가 false라 아무것도 이관하지 않는다 — 전
 *  계정의 진도가 새 계정 프로필로 복사되는 유출을 막는다. */
export async function migrateFromLocalStorage(uid: string) {
  if (!claimLocalProgress(uid) || !isLocalProgressOwner(uid)) return;
  const xp      = lpGetIntAs('mt_xp', uid);
  const done    = lpGetJsonAs<string[]>('mt_done', uid, []);
  const dates   = lpGetJsonAs<string[]>('mt_activity_dates', uid, []);
  const learn   = lpGetAs('mt_learn_lang', uid) || 'en-US';
  const native  = lpGetAs('mt_native_lang', uid) || detectBrowserNativeLang();
  const tutorId = lpGetAs('mt_tutor_id', uid) || 't01';
  // UX-infra #6: placement 결과도 이관 (기기 변경 시 소실 방지)
  const placementLevel = lpGetAs('mt_placement_level', uid);
  const placementTrack = lpGetAs('mt_track', uid);
  const placementDone  = lpGetAs('mt_placement_done', uid) === 'true';

  // QA S-5: 게스트가 언어만 고르고 XP/레슨이 없으면 위 조건이 전부 false라
  // 언어 선택이 Firestore로 이관되지 않고 프로필은 시드 기본값('en-US')인 채로
  // 남았다. 언어 선택 자체도 이관 조건에 포함한다.
  const hasLangChoice = !!lpGetAs('mt_learn_lang', uid) || !!lpGetAs('mt_native_lang', uid);
  if (xp || done.length || dates.length || placementLevel || placementTrack || placementDone || hasLangChoice) {
    // PR-H: XP는 서버 엔드포인트로만 지급 — updateUserProfile로 xp 직접 쓰기 금지.
    // (기존 코드는 게스트 localStorage 값을 그대로 덮어써 조작 벡터였음)
    if (xp > 0) {
      // QA S-6: 지급에 성공한 XP만 마커(mt_migrated_xp)에 기록한다.
      // 실패하면 마커를 전진시키지 않으므로 다음 로그인에 다시 시도한다.
      const res = await awardXp({ source: 'guest_migration', xp: Math.min(xp, 1000) });
      if (res.ok) {
        try { lpSetAs('mt_migrated_xp', uid, String(res.awarded || 0)); } catch { /* ignore */ }
      } else {
        console.warn('[profile] guest XP migration failed:', res.reason);
      }
    }
    await updateUserProfile(uid, {
      completedLessons: done, activityDates: dates,
      learnLang: learn, nativeLang: native, tutorId,
      ...(placementLevel ? { placementLevel } : {}),
      ...(placementTrack ? { placementTrack } : {}),
      ...(placementDone  ? { placementDone: true } : {}),
    });
  }
}

/** 기존 유저의 게스트 데이터 따라잡기 (QA S-2 동기화 지점)
 *
 *  기존 문제: migrateFromLocalStorage는 프로필이 없던 첫 로그인 때만 실행돼,
 *  이미 계정이 있는 유저가 게스트로 플레이한 뒤 로그인하면 게스트 XP/진도가
 *  서버에 절대 이관되지 않았다. (PR #208이 이 함수를 추가했지만, 호출 지점이
 *  ensureFirstLoginSetup의 첫-로그인 분기 안에만 있어 기존 유저에게는
 *  사실상 실행되지 않았다 — AuthContext에서 직접 호출하게 고친다.)
 *
 *  이중 지급 방지 설계 (PR #208의 마커 방식에서 수정):
 *  - PR #208의 `mt_migrated_xp` 마커는 로그인 상태에서 번 XP도 마커에
 *    반영하지 않으므로, 차분(localXp - 마커)은 이미 서버에 지급된 XP까지
 *    포함해 이중 지급할 수 있었다. 대신 서버 XP 자체를 기준으로 삼는다:
 *    delta = max(0, localXp - serverXp). 로그인 상태에서 번 XP는 이미
 *    서버에 있으므로 차분에 들어가지 않고, 게스트 XP·지급 실패분만
 *    따라잡는다. (드문 예외: 다른 기기에서 번 서버 XP가 로컬보다 크면
 *    해당 기기의 게스트 XP 일부가 이관되지 않을 수 있다 — 이중 지급보다
 *    안전한 방향으로 택한다.)
 *  - 1회 지급 상한 1000 XP (차분이 크면 로그인할 때마다 최대 1000씩 나눠
 *    이관된다). 세션 내 동시 실행은 in-flight 가드로 막는다 — 차분 공식이
 *    멱등이라 순차 재실행은 안전하지만, 동시에 같은 차분을 읽으면
 *    이중 지급이 될 수 있다.
 *  - 완료 레슨/활동 날짜는 합집합(union)으로 병합한다 — 로컬 목록으로 서버
 *    목록을 덮어쓰면 기존 진도가 날아가므로 절대 덮어쓰지 않는다.
 *  - 언어는 기본적으로 건드리지 않는다 — 기존 유저의 프로필 값이 우선이고
 *    로컬 기본값('en-US' 등)으로 덮어쓰면 선택한 언어가 날아간다.
 *    단, QA S-5 예외: 프로필 학습 언어가 시드 기본값('en-US')인 채로 명시적
 *    로컬 선택이 있으면 그 선택을 프로필로 올린다 (게스트 선택 유실 복구).
 */
const catchUpInFlight = new Set<string>();

export async function migrateExistingUserGuestData(uid: string, profile: UserProfile) {
  if (catchUpInFlight.has(uid)) return;
  catchUpInFlight.add(uid);
  try {
    // 계정 분리: 다른 계정이 공용 키 데이터를 이미 이어받은 기기에서는
    // 따라잡기를 하지 않는다 — 전 계정의 로컬 진도가 이 계정 프로필에
    // 합쳐지는 유출을 막는다. claim이 공용 값을 이 uid 키로 옮긴 뒤에야
    // 아래 읽기가 이 계정 자신의 값을 본다.
    if (!claimLocalProgress(uid) || !isLocalProgressOwner(uid)) return;
    const localXp = lpGetIntAs('mt_xp', uid);
    const done = lpGetJsonAs<string[]>('mt_done', uid, []);
    const dates = lpGetJsonAs<string[]>('mt_activity_dates', uid, []);
    const serverXp = profile.xp || 0;

    // 서버에 없는 로컬 증가분만 지급한다 (위 설계 노트 참조).
    const delta = Math.max(0, localXp - serverXp);
    if (delta > 0) {
      const res = await awardXp({ source: 'guest_migration', xp: Math.min(delta, 1000) });
      if (!res.ok) {
        console.warn('[profile] guest XP catch-up failed:', res.reason);
      }
    }

    const mergedDone = [...new Set([...(profile.completedLessons || []), ...done])];
    const mergedDates = [...new Set([...(profile.activityDates || []), ...dates])];
    if (mergedDone.length !== (profile.completedLessons || []).length ||
        mergedDates.length !== (profile.activityDates || []).length) {
      await updateUserProfile(uid, { completedLessons: mergedDone, activityDates: mergedDates });
    }

    // QA S-5: 게스트로 언어를 고른 뒤 로그인한 기존 유저 — 프로필 학습 언어가
    // 아직 시드 기본값('en-US')이면, 명시적 로컬 선택(mt_lang_chosen)을 프로필로
    // 올린다. 프로필이 기본값이 아니면 의도적 선택으로 간주해 건드리지 않는다.
    // (모국어도 함께 올린다 — 둘 다 '언어 설정이 한 번도 확정되지 않은' 상태의
    // 일부이기 때문. LevelHub 효과는 이후 프로필 값을 로컬 캐시에 다시 쓴다.)
    try {
      const { hasExplicitLangChoice } = await import('./langPrompt');
      if (hasExplicitLangChoice(uid) && profile.learnLang === 'en-US') {
        const localLearn = lpGetAs('mt_learn_lang', uid);
        const localNative = lpGetAs('mt_native_lang', uid);
        if (localLearn && localLearn !== 'en-US') {
          await updateUserProfile(uid, {
            learnLang: localLearn,
            ...(localNative && localNative !== profile.nativeLang ? { nativeLang: localNative } : {}),
          });
        }
      }
    } catch { /* ignore — 언어 이관 실패가 로그인 흐름을 막지 않는다 */ }
  } catch (e) {
    console.warn('[profile] guest catch-up migration failed:', e);
  } finally {
    catchUpInFlight.delete(uid);
  }
}

// --- 첫 로그인 셋업 보장 (idempotent) -----------------------------------------
// 이메일 가입(handleSignup)과 AuthContext의 onAuthStateChanged가 동시에 프로필
// 생성을 시도하던 레이스를 제거하기 위한 단일 진입점.
//  - 프로필이 없으면 생성, 이미 있으면 그대로 사용 (생성 overwrite 레이스 제거)
//  - trial 초기화 (initTrial은 doc 존재 시 no-op이라 항상 안전)
//  - localStorage → Firestore 마이그레이션은 "프로필이 없던 경우(=진짜 첫 로그인)"에만 1회
//  - 동시 호출은 같은 promise를 공유 → 중복 마이그레이션/XP 이중 지급 방지
const firstLoginSetupPromises = new Map<string, Promise<void>>();

export async function ensureFirstLoginSetup(
  uid: string,
  fallback: { email?: string; displayName?: string; photoURL?: string } = {},
): Promise<void> {
  const inFlight = firstLoginSetupPromises.get(uid);
  if (inFlight) { await inFlight; return; }
  const run = (async () => {
    const existing = await getUserProfile(uid);
    const isFirstLogin = !existing;
    if (isFirstLogin) {
      await createUserProfile(
        uid,
        fallback.email || '',
        fallback.displayName || 'Learner',
        fallback.photoURL || '',
      );
      // 추천 연결 (PR #114) — /r/{code} 방문 시 저장된 코드를 서버에서 검증·연결.
      // 웰컴 XP는 서버(/api/referral/attach)가 원자적으로 지급. 실패해도 가입 흐름은 계속.
      try {
        const { REFERRAL_CODE_KEY } = await import('./referral');
        const code = localStorage.getItem(REFERRAL_CODE_KEY);
        if (code) {
          const { apiFetch } = await import('./apiClient');
          await apiFetch('/api/referral/attach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          }).catch(() => {});
          // 코드는 1회성 — 결과와 무관하게 소비
          localStorage.removeItem(REFERRAL_CODE_KEY);
        }
      } catch { /* ignore */ }
    }
    // trial 보장 (이미 있으면 no-op)
    await import('./trialPolicy').then(({ initTrial }) => initTrial(uid)).catch(() => {});
    // 게스트 데이터 이관 — 첫 로그인이면 전체, 기존 유저면 따라잡기(차분+합집합).
    // QA S-6: 기존 유저가 게스트로 플레이한 뒤 로그인해도 이관이 안 되던 누락 수정.
    // 실패해도 가입/로그인 흐름은 계속 (다음 로그인에 다시 시도).
    if (isFirstLogin) {
      await migrateFromLocalStorage(uid).catch(() => {});
    } else if (existing) {
      await migrateExistingUserGuestData(uid, existing);
    }
    // 타임존 저장/갱신 (저녁 푸시 리마인드용 — 이동 시 자동 갱신)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) await updateUserProfile(uid, { timezone: tz } as Partial<UserProfile>);
    } catch { /* ignore */ }
  })();
  firstLoginSetupPromises.set(uid, run);
  try { await run; } finally { firstLoginSetupPromises.delete(uid); }
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
