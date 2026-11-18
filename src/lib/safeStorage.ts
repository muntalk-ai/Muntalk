// lib/safeStorage.ts — guarded localStorage access (MunTalk QA H-9)
//
// localStorage access throws a SecurityError ("Access is denied") when the
// browser blocks storage (private mode, blocked cookies, sandboxed/cloud
// browser frames). A bare `localStorage.getItem()` on a render path or in a
// click handler then surfaces as an uncaught client error — 4 such rows in
// the 2026-11-15 QA error log. Storage being blocked is environmental, not
// a product bug: every access site that runs without a user gesture (render
// initialisers, auth load, effect reads) must tolerate it.
//
// Use these helpers for load-path / render-path storage access. Callers that
// genuinely need the value treat `null` / `false` as "no stored value".
export function storageAvailable(): boolean {
  try {
    const probe = '__mt_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage blocked — nothing to remove */
  }
}
