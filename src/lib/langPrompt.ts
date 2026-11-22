// lib/langPrompt.ts — 언어 설정 프롬프트(LangSetupPrompt) 공유 상태
// QA S-5/H-2: "Later"를 세션 메모리가 아니라 localStorage에 타임스탬프와 함께
// 저장하고, 명시적 언어 선택 여부를 별도로 추적한다. LevelHub의 수동 언어
// 모달과 LangSetupPrompt(유일한 자동 노출 프롬프트)가 같은 키를 본다.

/** "Later" 스누즈 저장 키 — 값은 Date.now() (ms) */
export const LANG_PROMPT_SNOOZE_KEY = 'mt_lang_prompt_snoozed';
/** 스누즈 유지 기간: 7일. 지나면 프롬프트가 다시 뜬다. */
export const LANG_PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
/** 명시적 언어 선택 여부 — saveLangPrefs / LangSetupPrompt 저장 시 '1'로 설정.
 *  DEFAULT_PROFILE의 'en-US'/'ko-KR' 기본값과 사용자가 직접 고른 값을 구분한다. */
export const LANG_CHOSEN_KEY = 'mt_lang_chosen';

function read(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** 스누즈 기간(7일) 안이면 true — 프롬프트를 띄우지 않는다. */
export function isLangPromptSnoozed(now = Date.now()): boolean {
  const raw = read(LANG_PROMPT_SNOOZE_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  if (!Number.isFinite(ts)) return false;
  return now - ts < LANG_PROMPT_SNOOZE_MS;
}

/** "Later" / 닫기 — 지금 시각을 스누즈 시작점으로 저장한다. */
export function snoozeLangPrompt(): void {
  write(LANG_PROMPT_SNOOZE_KEY, String(Date.now()));
}

/** 언어 확정 시 스누즈 해제 — 다음 로그인 때 프롬프트가 뜰 이유가 없다. */
export function clearLangPromptSnooze(): void {
  remove(LANG_PROMPT_SNOOZE_KEY);
}

/** 사용자가 언어를 직접 선택해 저장했음을 기록한다. */
export function markLangChosen(): void {
  write(LANG_CHOSEN_KEY, '1');
}

/** 명시적 선택 기록이 있으면 true. */
export function hasExplicitLangChoice(): boolean {
  return read(LANG_CHOSEN_KEY) === '1';
}
