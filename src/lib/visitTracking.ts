// lib/visitTracking.ts
// Real visit + onboarding funnel measurement (2026-11-26).
//
// Why: the admin's "Visits / Last active / D1 / D7" read users/{uid}.activityDates,
// which recordActivity() writes ONLY when a lesson or roleplay is completed.
// A user who signs in and looks around without finishing a lesson stays at 0,
// so "revisit 0" actually meant "first lesson completed 0". These fields
// measure the visit itself, separately from learning activity.
//
// Fields written on users/{uid} (owner update via updateDoc — same owner-update
// rule the client already uses for timezone / displayName; xp is never touched;
// never creates the doc):
//   visitDates:        string[]  local YYYY-MM-DD, one per day the signed-in
//                                user opened any MunTalk page (cap 365)
//   lastSeen:          string    local YYYY-MM-DD of the latest visit
//   muntuzVisitDates:  string[]  same, but for visits on muntuz.com (kept
//   muntuzLastSeen:    string    separate so Muntuz traffic doesn't inflate
//                                MunTalk retention — shared backend)
//   funnel:            map of first-time ISO timestamps, set once each:
//     placementViewedAt, placementStartedAt, placementCompletedAt,
//     placementSkippedAt, firstLessonStartedAt, firstLessonCompletedAt
//     guestStarterStartedAt, guestStarterCompletedAt, guestMicrotalkCompletedAt
//       — guest milestones, written to uid-free localStorage by Starter /
//       Micro-Talk and attached to the profile once at signup (see
//       attachGuestFunnel); signupPromptShownAt / signupPromptAcceptedAt
//       record the SaveProgressCard being shown / tapped.
//   entrySource:       string — first-touch entry: 'starter' | 'microtalk' |
//                                'placement' | 'reel' (set once, guest only)
//
// Guest milestones are NOT uid-scoped in localStorage (guests have no uid).
// attachGuestFunnel runs only when this device's progress belongs to the
// signing-in account (isLocalProgressOwner, same trade-off as PR #258):
// on a shared device the first account to sign up inherits them.

// History starts at deploy — nothing is backfilled.
// Everything here is best-effort: a failed write never blocks the app.

import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import { isMuntuzHost } from './brand';
import { isLocalProgressOwner } from './localProgress';

const MAX_VISIT_DAYS = 365;

export type FunnelStep =
  | 'placementViewedAt'
  | 'placementStartedAt'
  | 'placementCompletedAt'
  | 'placementSkippedAt'
  | 'firstLessonStartedAt'
  | 'firstLessonCompletedAt'
  | 'guestStarterStartedAt'
  | 'guestStarterCompletedAt'
  | 'guestMicrotalkCompletedAt'
  | 'signupPromptShownAt'
  | 'signupPromptAcceptedAt';

function localDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function lsGet(key: string): string | null {
  try { return typeof window !== 'undefined' ? localStorage.getItem(key) : null; } catch { return null; }
}
function lsSet(key: string, value: string) {
  try { if (typeof window !== 'undefined') localStorage.setItem(key, value); } catch { /* ignore */ }
}

const inFlightVisit = new Set<string>();

/** Record today's visit for a signed-in user. Idempotent and cheap:
 *  a uid-scoped localStorage guard skips the write once today is recorded,
 *  so repeated page loads cost nothing. */
export async function recordVisit(uid: string): Promise<void> {
  if (!uid || typeof window === 'undefined') return;
  const muntuz = isMuntuzHost(window.location.hostname);
  const today = localDay();
  const guardKey = `mt_visit_logged_${muntuz ? 'muntuz_' : ''}${uid}`;
  if (lsGet(guardKey) === today) return;
  const flightKey = `${guardKey}:${today}`;
  if (inFlightVisit.has(flightKey)) return;
  inFlightVisit.add(flightKey);
  try {
    const datesField = muntuz ? 'muntuzVisitDates' : 'visitDates';
    const seenField = muntuz ? 'muntuzLastSeen' : 'lastSeen';
    const ref = doc(db, 'users', uid);
    // updateDoc (not setDoc): never creates the user doc. Creating a partial
    // doc before ensureFirstLoginSetup runs would make the app think the
    // profile already exists. arrayUnion keeps concurrent tabs safe.
    await updateDoc(ref, { [datesField]: arrayUnion(today), [seenField]: today });
    lsSet(guardKey, today);
    // Rare trim: keep the array bounded (only when it actually grew past the cap).
    try {
      const snap = await getDoc(ref);
      const arr = snap.exists() ? snap.data()[datesField] : null;
      if (Array.isArray(arr) && arr.length > MAX_VISIT_DAYS) {
        const trimmed = [...new Set(arr as string[])].sort().slice(-MAX_VISIT_DAYS);
        await updateDoc(ref, { [datesField]: trimmed });
      }
    } catch { /* ignore */ }
  } catch (e) {
    console.warn('[visit] record failed:', e);
  } finally {
    inFlightVisit.delete(flightKey);
  }
}

/** Mark a funnel milestone the first time it happens for this user.
 *  Never overwrites an existing timestamp. */
export async function markFunnelStep(uid: string | null | undefined, step: FunnelStep): Promise<void> {
  if (!uid || typeof window === 'undefined') return;
  const guardKey = `mt_funnel_${step}_${uid}`;
  if (lsGet(guardKey)) return;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return; // profile not created yet — try again next time
    const funnel = snap.data().funnel || {};
    if (!funnel[step]) {
      await updateDoc(ref, { [`funnel.${step}`]: new Date().toISOString() });
    }
    lsSet(guardKey, '1');
  } catch (e) {
    console.warn('[funnel] mark failed:', step, e);
  }
}

// Guest milestones live in uid-free localStorage (written by Starter /
// Micro-Talk / SaveProgressCard — same strings on both branches, no cross
// import so merge order doesn't matter). At signup, attach them once to
// the profile so the admin funnel can show guest lesson -> signup
// conversion. Only for the account that owns this device's progress
// (first account to sign up here); never overwrites existing values.
const GUEST_FUNNEL_KEYS: [string, FunnelStep][] = [
  ['mt_guest_starter_started_at', 'guestStarterStartedAt'],
  ['mt_guest_starter_completed_at', 'guestStarterCompletedAt'],
  ['mt_guest_microtalk_completed_at', 'guestMicrotalkCompletedAt'],
  ['mt_signup_prompt_shown_at', 'signupPromptShownAt'],
  ['mt_signup_prompt_accepted_at', 'signupPromptAcceptedAt'],
];
const ENTRY_SOURCE_KEY = 'mt_entry_source';

export async function attachGuestFunnel(uid: string): Promise<void> {
  if (!uid || typeof window === 'undefined') return;
  if (!isLocalProgressOwner(uid)) return;
  const guardKey = `mt_guest_funnel_attached_${uid}`;
  if (lsGet(guardKey)) return;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const funnel = data.funnel || {};
    const patch: Record<string, unknown> = {};
    for (const [localKey, funnelKey] of GUEST_FUNNEL_KEYS) {
      const v = lsGet(localKey);
      if (v && !funnel[funnelKey]) patch[`funnel.${funnelKey}`] = v;
    }
    const entrySource = lsGet(ENTRY_SOURCE_KEY);
    if (entrySource && !data.entrySource) patch.entrySource = entrySource;
    if (Object.keys(patch).length > 0) {
      await updateDoc(ref, patch);
    }
    lsSet(guardKey, '1');
  } catch (e) {
    console.warn('[funnel] attach guest failed:', e);
  }
}
