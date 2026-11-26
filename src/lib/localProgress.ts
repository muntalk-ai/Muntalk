// lib/localProgress.ts — 계정별 로컬 진도 저장소
//
// 문제: mt_xp / mt_done 등 진도·설정 키가 기기 공용 localStorage에 계정
// 구분 없이 저장돼, 같은 기기에서 다른 계정으로 로그인하면 전 계정의
// XP·스트릭·완료 레슨·언어 설정이 새 계정에 딸려 들어갔다. 로그인
// 마이그레이션(migrateFromLocalStorage / migrateExistingUserGuestData)이
// 그 기기 값을 새 계정 프로필로 복사하기까지 했다.
//
// 해결: 로그인 상태에서는 키를 uid별로 분리한다 (`mt_xp_<uid>`).
// 게스트는 기존 공용 키를 그대로 쓴다. 게스트로 플레이하다 가입한
// 경우를 위해, 공용 키 데이터는 첫 로그인한 계정이 1회만 이어받는다
// (아래 claimLocalProgress). 이어받은 뒤 공용 키는 지운다.
//
// 잔여 한계 (1회성): 공용 키 데이터에는 소유자 정보가 없어서, 수정
// 전 기기에 남아 있던 게스트 진도는 배포 후 처음 로그인한 계정이
// 이어받는다. 그 뒤로는 다른 계정이 그 데이터를 이어받을 수 없다
// (adoption marker가 막는다). 게스트 진도의 소유자 판별이 원천적으로
// 불가능한 구조라, 이 1회성 이어받기는 의도된 절충이다.

/** 계정별로 분리하는 로컬 키 목록. */
export const SCOPED_PROGRESS_KEYS = new Set([
  'mt_xp',
  'mt_streak',
  'mt_done',
  'mt_activity_dates',
  'mt_learn_lang',
  'mt_native_lang',
  'mt_tutor_id',
  'mt_lesson_progress',
  'mt_placement_level',
  'mt_track',
  'mt_placement_done',
  'mt_placement_source',
  'mt_migrated_xp',
  'mt_lang_chosen',
  // 2026-11-26 듀오링고식 온보딩: 하루 목표(분) + 내일 알림 의사 ('1'/'0')
  'mt_daily_goal_min',
  'mt_reminder_opt_in',
]);

/** 공용 키 데이터를 이어받은 계정 uid — 한 번만 설정된다. */
export const PROGRESS_ADOPTION_MARKER_KEY = 'mt_progress_adopted_by';

let currentUid: string | null = null;

/** AuthContext가 인증 상태 변경 시 가장 먼저 호출한다. */
export function setLocalProgressUid(uid: string | null): void {
  currentUid = uid;
}

export function getLocalProgressUid(): string | null {
  return currentUid;
}

/** uid가 있으면 uid별 키, 없으면(게스트) 기존 공용 키. */
export function scopedProgressKey(base: string, uid: string | null = currentUid): string {
  if (uid && SCOPED_PROGRESS_KEYS.has(base)) return `${base}_${uid}`;
  return base;
}

function readRaw(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore — 저장 실패가 동작을 막지 않는다 */
  }
}

function removeRaw(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ── 현재 세션 기준 접근 (UI 코드용; AuthContext가 uid를 미리 설정한다) ──

export function lpGet(base: string): string | null {
  return readRaw(scopedProgressKey(base));
}

export function lpSet(base: string, value: string): void {
  writeRaw(scopedProgressKey(base), value);
}

export function lpRemove(base: string): void {
  removeRaw(scopedProgressKey(base));
}

export function lpGetInt(base: string, fallback = 0): number {
  const n = parseInt(lpGet(base) || '', 10);
  return Number.isFinite(n) ? n : fallback;
}

export function lpGetJson<T>(base: string, fallback: T): T {
  try {
    const raw = lpGet(base);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ── 명시적 uid 기준 접근 (마이그레이션 코드용) ──

export function lpGetAs(base: string, uid: string | null): string | null {
  return readRaw(scopedProgressKey(base, uid));
}

export function lpSetAs(base: string, uid: string | null, value: string): void {
  writeRaw(scopedProgressKey(base, uid), value);
}

export function lpRemoveAs(base: string, uid: string | null): void {
  removeRaw(scopedProgressKey(base, uid));
}

export function lpGetIntAs(base: string, uid: string | null, fallback = 0): number {
  const n = parseInt(lpGetAs(base, uid) || '', 10);
  return Number.isFinite(n) ? n : fallback;
}

export function lpGetJsonAs<T>(base: string, uid: string | null, fallback: T): T {
  try {
    const raw = lpGetAs(base, uid);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ── 이어받기 (adoption) ──

/** 이 uid가 공용 키 데이터를 이어받을 수 있으면 true.
 *  마커가 없으면 아직 아무도 이어받지 않은 상태, 마커가 이 uid면 이미
 *  이어받은 상태다. 다른 uid가 마커를 갖고 있으면 false. */
export function isLocalProgressOwner(uid: string): boolean {
  const marker = readRaw(PROGRESS_ADOPTION_MARKER_KEY);
  return marker === null || marker === uid;
}

/** 공용 키 데이터를 이 uid의 키로 1회 이어받는다.
 *  - 마커가 없으면: 마커를 이 uid로 설정하고 공용 값을 uid 키로 옮긴 뒤
 *    공용 키를 지운다.
 *  - 마커가 이 uid면: 남은 공용 값(충돌로 못 옮긴 잔재)이 있으면 uid 키에
 *    합치고 공용 키를 지운다.
 *  - 마커가 다른 uid면: 아무것도 하지 않고 false를 반환한다.
 *  currentUid도 이 uid로 설정한다. 동기 함수라 AuthContext가 setUser
 *  전에 호출하면 이후 렌더·이펙트가 올바른 네임스페이스를 본다. */
export function claimLocalProgress(uid: string): boolean {
  setLocalProgressUid(uid);
  const marker = readRaw(PROGRESS_ADOPTION_MARKER_KEY);
  if (marker !== null && marker !== uid) return false;
  writeRaw(PROGRESS_ADOPTION_MARKER_KEY, uid);
  for (const base of SCOPED_PROGRESS_KEYS) {
    const shared = readRaw(base);
    if (shared === null) continue;
    const mineKey = scopedProgressKey(base, uid);
    const mine = readRaw(mineKey);
    if (mine === null) {
      writeRaw(mineKey, shared);
    } else if (base === 'mt_xp') {
      // 숫자 키는 큰 값을 유지한다.
      const a = parseInt(shared, 10);
      const b = parseInt(mine, 10);
      if (Number.isFinite(a) && (!Number.isFinite(b) || a > b)) writeRaw(mineKey, String(a));
    } else if (base === 'mt_done' || base === 'mt_activity_dates') {
      // 목록 키는 합집합으로 병합한다.
      try {
        const merged = [...new Set([...(JSON.parse(mine) as unknown[]), ...(JSON.parse(shared) as unknown[])])];
        writeRaw(mineKey, JSON.stringify(merged));
      } catch {
        /* ignore — 병합 실패 시 uid 키 값을 유지한다 */
      }
    }
    // 그 외 키(언어·튜터·placement 등)는 uid 키 값이 우선이고,
    // 없을 때만 위에서 공용 값을 옮겼다.
    removeRaw(base);
  }
  return true;
}

/** 로그아웃 시 호출 — 이후 접근은 게스트(공용 키) 기준이 된다. */
export function releaseLocalProgress(): void {
  currentUid = null;
}
