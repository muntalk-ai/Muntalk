// lib/clearLocalAccountData.ts — remove this device's copies of a deleted
// account's data (audit C2).
//
// Per-account keys (PR #257 / #258) embed the uid: `mt_xp_<uid>`,
// `muntuz_exchange_chats_v1_uid:<uid>`, etc. After the server deletes the
// account we drop every localStorage key that contains the uid, plus the
// adoption markers that point at it. Guest (shared) keys are left alone.

export function clearLocalAccountData(uid: string): void {
  if (typeof window === 'undefined' || !uid) return;
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.includes(uid)) {
        doomed.push(key);
        continue;
      }
      // Adoption markers store the owning uid as their value.
      if (key === 'mt_progress_adopted_by' || key === 'muntuz_exchange_chats_adopted_v1') {
        if ((localStorage.getItem(key) || '').includes(uid)) doomed.push(key);
      }
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* storage unavailable: nothing to clear */
  }
}
