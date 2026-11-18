// lib/firestoreRetry.ts — retry transient Firestore read failures (MunTalk QA H-9)
//
// The 2026-11-15 QA error log has 9 "Firebase offline" rows. Firestore
// one-shot reads (`getDoc`/`getDocs`) reject with code `unavailable` when
// the client is briefly offline; several call sites (AuthContext profile
// load, admin Users/Logs fetch) made a single attempt and either swallowed
// the failure silently or let it surface as an unhandled rejection.
//
// Retry ONLY transient errors — `unavailable` / `deadline-exceeded` / an
// offline message. Permission errors, missing-index errors and anything else
// fail fast on the first attempt, exactly as before. 3 attempts total with
// short backoff (400ms, 800ms); a sustained outage still surfaces the error
// to the caller instead of hanging.
export function isTransientFirestoreError(e: unknown): boolean {
  const code = (e as { code?: unknown } | null)?.code;
  if (code === 'unavailable' || code === 'deadline-exceeded') return true;
  const msg = e instanceof Error ? e.message : String(e ?? '');
  return /client is offline|network request failed/i.test(msg);
}

export async function withFirestoreRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (!isTransientFirestoreError(e) || attempt === maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
  throw lastError;
}
