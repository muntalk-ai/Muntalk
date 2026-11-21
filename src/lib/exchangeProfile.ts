// Shared Exchange (Muntuz) human-profile fields + save logic.
//
// Used by both the Exchange Profile tab (src/app/exchange/page.tsx) and
// the onboarding setup page (src/app/exchange/setup/page.tsx) so the two
// forms can never drift apart. Field decisions are Jay's, 2026-11-05
// (PR #169, B안 — see goals/muntalk-exchange/files/
// human-exchange-profile-fields-analysis-2026-11-05.md):
//  - gender filter is free; age is collected as a birthdate and only the
//    derived age band is public; location is country-only.
//  - the exact birthdate lives in the owner-only private subcollection
//    `exchange_profiles/{uid}/private/identity` — never in the public doc
//    and never shown to anyone except the owner themself.
//  - Exchange is 18+ only. QA decision 9A (Jay, 2026-11-18): the
//    birthdate is NO LONGER required to save a profile — it is
//    collected at the first human match instead (People Rooms contact
//    or waitlist join, via saveBirthdate below), and matching stays
//    blocked until one is provided. A birthdate that IS entered is
//    still validated (missing/invalid/under-18 refuses that save).
//    AI chat is never gated on birthdate.
//
// No new Firestore rules are needed for this module: it writes the same
// collections the Profile tab already writes. (The private-identity rule
// itself is still pending console publish — see
// goals/muntalk-exchange/files/firestore-pending-publish-2026-11-05.md;
// until then the birthdate write fails with permission-denied and the
// public profile is still saved, exactly as the Profile tab behaves.)
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LEARN_LANGUAGES } from '@/data/languages';

export const GOALS = ['Conversation', 'Exam', 'Travel', 'Work', 'Friends'] as const;
export type LearningGoal = (typeof GOALS)[number];
export const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'] as const;
export type Gender = (typeof GENDERS)[number];
export const AGE_BANDS = ['18–24', '25–34', '35–44', '45+'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];
export const COMM_MODES = ['Text', 'Voice', 'Both'] as const;
export const CORRECTION_PREFS = ['Often', 'Sometimes', 'Never'] as const;
export const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'] as const;
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
// Language picker options for the Exchange profile forms (the setup page
// and the Profile tab share this module so the two forms cannot drift
// apart). Derived from the canonical lesson/TTS list LEARN_LANGUAGES
// (src/data/languages.ts, 100 entries): regional variants collapse to one
// base language — 'English (US)' / 'English (UK)' → 'English',
// 'Chinese (CN)' / 'Chinese (TW)' → 'Chinese' — giving the 93 supported
// languages. Values stay plain display names: the greeting copy
// (GREETING_BY_TARGET), partner flags (LANG_FLAG) and dictation
// (SPEECH_LANG) all key by display name, so BCP-47 codes must not be
// stored here.
export const LANGUAGES: readonly string[] = [
  ...new Set(LEARN_LANGUAGES.map((l) => l.label.replace(/ \([^)]*\)$/, ''))),
];
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const INTERESTS = ['Travel', 'Cooking', 'Football', 'Music', 'Movies', 'Reading', 'Hiking'] as const;
export const COUNTRIES = [
  'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada',
  'Chile', 'China', 'Colombia', 'Egypt', 'France', 'Germany', 'Hong Kong', 'India',
  'Indonesia', 'Iran', 'Ireland', 'Israel', 'Italy', 'Japan', 'Kazakhstan', 'Kenya',
  'Malaysia', 'Mexico', 'Mongolia', 'Morocco', 'Myanmar', 'Nepal', 'Netherlands',
  'New Zealand', 'Nigeria', 'Pakistan', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Russia', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain',
  'Sri Lanka', 'Switzerland', 'Taiwan', 'Thailand', 'Turkey', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uzbekistan', 'Vietnam',
  'Other',
];

export function calcAge(birthdate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const born = new Date(y, mo - 1, d);
  if (born.getFullYear() !== y || born.getMonth() !== mo - 1 || born.getDate() !== d) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() < mo - 1 || (now.getMonth() === mo - 1 && now.getDate() < d)) age -= 1;
  return age;
}

export function ageBandForAge(age: number): AgeBand | '' {
  if (age < 18) return '';
  if (age <= 24) return '18–24';
  if (age <= 34) return '25–34';
  if (age <= 44) return '35–44';
  return '45+';
}

export function utcLabel(offsetMin: number): string {
  const sign = offsetMin < 0 ? '-' : '+';
  const abs = Math.abs(offsetMin);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const mi = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${h}:${mi}`;
}

// Timezone is detected from the device, not typed in.
export function detectTimezone(): { timezone: string; utcOffsetMin: number } {
  try {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      utcOffsetMin: -new Date().getTimezoneOffset(),
    };
  } catch {
    return { timezone: 'UTC', utcOffsetMin: 0 };
  }
}

// Every field of the Exchange profile form, in one place.
export type ExchangeProfileForm = {
  nickname: string;
  nativeLang: string;
  targetLang: string;
  // Tandem-style: languages the user speaks fluently besides their
  // native language. Multi-select (chips) — a person can be fluent in
  // several languages. Stored as an array in the public profile doc.
  fluentLangs: string[];
  level: string;
  interests: string[];
  bio: string;
  learningGoal: LearningGoal;
  country: string;
  gender: Gender;
  birthdate: string;
  commMode: string;
  correctionPref: string;
  availDays: string[];
  availSlots: string[];
  availPerWeek: number;
  sameGenderOnly: boolean;
};

export function defaultExchangeProfileForm(): ExchangeProfileForm {
  return {
    nickname: '',
    nativeLang: 'English',
    targetLang: 'Korean',
    fluentLangs: [],
    level: 'Intermediate',
    interests: ['Travel', 'Cooking'],
    bio: '',
    learningGoal: 'Conversation',
    country: '',
    gender: 'Prefer not to say',
    birthdate: '',
    commMode: 'Both',
    correctionPref: 'Sometimes',
    availDays: ['Sat', 'Sun'],
    availSlots: ['Evening'],
    availPerWeek: 3,
    sameGenderOnly: false,
  };
}

// 18+ gate, shared by the profile save (only when a birthdate is
// entered) and by the first-human-match gate (saveBirthdate). The
// error strings are the ones the Profile tab has shown since PR #169
// — keep them identical so users see one consistent message wherever
// a birthdate is asked for.
export function validateBirthdate(
  birthdate: string
): { ok: true; age: number; band: AgeBand } | { ok: false; error: string } {
  if (!birthdate) {
    return {
      ok: false,
      error:
        'Add your date of birth to continue. Exchange is 18+ only — your exact birthdate is never shown to anyone.',
    };
  }
  const age = calcAge(birthdate);
  if (age === null) {
    return { ok: false, error: 'That date of birth does not look valid.' };
  }
  if (age < 18) {
    return { ok: false, error: 'You must be 18 or older to use MunTalk Exchange.' };
  }
  return { ok: true, age, band: ageBandForAge(age) as AgeBand };
}

export type SaveExchangeProfileResult =
  | { ok: true; band: AgeBand; timezone: string; utcOffsetMin: number; birthdateSaved: true }
  | {
      ok: true;
      band: AgeBand;
      timezone: string;
      utcOffsetMin: number;
      birthdateSaved: false;
      birthdateError: 'permission-denied' | 'other';
    }
  // QA decision 9A: saved without a birthdate — no age band was
  // (re)computed, so any band already on the public doc is left
  // untouched. The birthdate is collected at the first human match.
  | { ok: true; band: ''; timezone: string; utcOffsetMin: number; birthdateSaved: false; birthdateDeferred: true }
  | { ok: false; error: 'permission-denied' | 'other' | 'validation'; message?: string };

// Save the public profile doc (age band only — never the exact birthdate)
// and, when a birthdate was entered, the owner-only private identity doc.
// Callers validate through this function so a bad birthdate cannot be
// saved by any form — but since QA decision 9A an EMPTY birthdate is
// allowed: the profile saves and the 18+ check moves to the first
// human match (saveBirthdate).
export async function saveExchangeProfile(
  uid: string,
  form: ExchangeProfileForm
): Promise<SaveExchangeProfileResult> {
  // A birthdate that IS entered is still fully validated — an invalid
  // or under-18 date refuses the save, exactly as before 9A.
  const hasBirthdate = form.birthdate.trim().length > 0;
  const check = hasBirthdate ? validateBirthdate(form.birthdate) : null;
  if (check && check.ok === false) {
    return { ok: false, error: 'validation', message: check.error };
  }
  // Re-detect the timezone at save time (the user may have travelled).
  const { timezone, utcOffsetMin } = detectTimezone();
  // Build the public payload without ageBand when no birthdate was
  // given: with { merge: true } an omitted field leaves any band
  // already on the doc untouched, so existing profiles keep theirs.
  const publicDoc: Record<string, unknown> = {
    nickname: form.nickname.trim(),
    nativeLang: form.nativeLang,
    targetLang: form.targetLang,
    fluentLangs: form.fluentLangs.filter((l) => (LANGUAGES as readonly string[]).includes(l)),
    level: form.level,
    interests: form.interests,
    bio: form.bio.trim(),
    learningGoal: form.learningGoal,
    country: form.country,
    gender: form.gender,
    timezone,
    utcOffsetMin,
    availability: { days: form.availDays, slots: form.availSlots, perWeek: form.availPerWeek },
    commMode: form.commMode,
    correctionPref: form.correctionPref,
    sameGenderOnly: form.sameGenderOnly,
    updatedAt: serverTimestamp(),
  };
  if (check && check.ok) publicDoc.ageBand = check.band;
  try {
    await setDoc(doc(db, 'exchange_profiles', uid), publicDoc, { merge: true });
  } catch (err) {
    return {
      ok: false,
      error: (err as { code?: string }).code === 'permission-denied' ? 'permission-denied' : 'other',
    };
  }
  // No birthdate yet (QA decision 9A): nothing more to store — the
  // 18+ check happens at the first People Rooms contact / waitlist join.
  if (!check) {
    return { ok: true, band: '', timezone, utcOffsetMin, birthdateSaved: false, birthdateDeferred: true };
  }
  // From here the birthdate was entered and validated.
  if (check.ok === false) return { ok: false, error: 'validation', message: check.error };
  const band = check.band;
  // The exact birthdate goes to the owner-only private subcollection,
  // never to the public doc (any signed-in user can read public docs).
  // Until the console rule for it is published this write fails with
  // permission-denied — the public profile above is already saved, so
  // report it instead of failing the whole save.
  try {
    await setDoc(
      doc(db, 'exchange_profiles', uid, 'private', 'identity'),
      { birthdate: form.birthdate, ageBand: band, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { ok: true, band, timezone, utcOffsetMin, birthdateSaved: true };
  } catch (e) {
    return {
      ok: true,
      band,
      timezone,
      utcOffsetMin,
      birthdateSaved: false,
      birthdateError: (e as { code?: string }).code === 'permission-denied' ? 'permission-denied' : 'other',
    };
  }
}

export type SaveBirthdateResult =
  | { ok: true; band: AgeBand }
  | { ok: false; error: 'permission-denied' | 'other' | 'validation'; message?: string };

// First-human-match gate (QA decision 9A): collect the birthdate when
// the user first contacts someone in People Rooms or joins the
// waitlist. Same field, same validateBirthdate 18+ check, same
// private/identity subcollection as a profile save with a birthdate —
// and the public doc's age band is (re)computed from it, so existing
// profiles that already have a birthdate are untouched and a profile
// saved without one gains its band here. AI chat never calls this.
export async function saveBirthdate(uid: string, birthdate: string): Promise<SaveBirthdateResult> {
  const check = validateBirthdate(birthdate);
  if (check.ok === false) {
    return { ok: false, error: 'validation', message: check.error };
  }
  const band = check.band;
  try {
    await setDoc(
      doc(db, 'exchange_profiles', uid, 'private', 'identity'),
      { birthdate, ageBand: band, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    return {
      ok: false,
      error: (e as { code?: string }).code === 'permission-denied' ? 'permission-denied' : 'other',
    };
  }
  try {
    await setDoc(doc(db, 'exchange_profiles', uid), { ageBand: band, updatedAt: serverTimestamp() }, { merge: true });
  } catch {
    // The birthdate itself is stored; a public-doc band write failing
    // (e.g. rules) must not undo the 18+ check that just passed.
  }
  return { ok: true, band };
}

export type LoadedExchangeProfile = {
  exists: boolean;
  // Stored public values, ready to prefill a form. Only fields the doc
  // actually has are present — callers merge over the defaults.
  form: Partial<ExchangeProfileForm> & { ageBand: AgeBand | '' };
  // The owner's own birthdate, from the private subcollection. Empty when
  // there is no private doc yet (or its rule is unpublished) — callers
  // must never display it to anyone but the owner.
  birthdate: string;
};

// Load a saved profile for prefilling a form. The private read is
// best-effort and silent: a missing rule must never break the load.
export async function loadExchangeProfile(uid: string): Promise<LoadedExchangeProfile> {
  const out: LoadedExchangeProfile = { exists: false, form: { ageBand: '' }, birthdate: '' };
  try {
    const snap = await getDoc(doc(db, 'exchange_profiles', uid));
    if (!snap.exists()) return out;
    out.exists = true;
    const d = snap.data();
    if (typeof d.nativeLang === 'string') out.form.nativeLang = d.nativeLang;
    if (typeof d.targetLang === 'string') out.form.targetLang = d.targetLang;
    if (Array.isArray(d.fluentLangs)) {
      out.form.fluentLangs = d.fluentLangs.filter((l): l is string => typeof l === 'string');
    }
    if (typeof d.level === 'string') out.form.level = d.level;
    if (Array.isArray(d.interests)) {
      out.form.interests = d.interests.filter((i): i is string => typeof i === 'string');
    }
    if (typeof d.nickname === 'string') out.form.nickname = d.nickname;
    if (typeof d.bio === 'string') out.form.bio = d.bio;
    if (typeof d.learningGoal === 'string' && (GOALS as readonly string[]).includes(d.learningGoal)) {
      out.form.learningGoal = d.learningGoal as LearningGoal;
    }
    if (typeof d.country === 'string') out.form.country = d.country;
    if (typeof d.gender === 'string' && (GENDERS as readonly string[]).includes(d.gender)) {
      out.form.gender = d.gender as Gender;
    }
    if (typeof d.ageBand === 'string' && (AGE_BANDS as readonly string[]).includes(d.ageBand)) {
      out.form.ageBand = d.ageBand as AgeBand;
    }
    if (typeof d.commMode === 'string' && d.commMode) out.form.commMode = d.commMode;
    if (typeof d.correctionPref === 'string' && d.correctionPref) out.form.correctionPref = d.correctionPref;
    if (typeof d.sameGenderOnly === 'boolean') out.form.sameGenderOnly = d.sameGenderOnly;
    if (d.availability && typeof d.availability === 'object') {
      const a = d.availability as Record<string, unknown>;
      if (Array.isArray(a.days)) {
        out.form.availDays = a.days.filter((x): x is string => typeof x === 'string');
      }
      if (Array.isArray(a.slots)) {
        out.form.availSlots = a.slots.filter((x): x is string => typeof x === 'string');
      }
      if (typeof a.perWeek === 'number') out.form.availPerWeek = a.perWeek;
    }
  } catch {
    // A failed public read means "no usable profile": callers keep their
    // defaults and (in the Profile tab) show the load error separately.
    return out;
  }
  try {
    const priv = await getDoc(doc(db, 'exchange_profiles', uid, 'private', 'identity'));
    if (priv.exists() && typeof priv.data().birthdate === 'string') {
      out.birthdate = priv.data().birthdate as string;
    }
  } catch {
    // Silent: a missing rule must never break the profile load.
  }
  return out;
}

// Post-login setup gate (Jay, 2026-11-06): true only when the PUBLIC
// profile doc exists with the fields the setup form collects. Reads the
// public doc ONLY — never the private/identity subcollection (its
// Firestore rule is not published yet, so that read would fail). A failed
// read counts as incomplete: the setup page prefills from the public doc,
// so the user just saves again instead of hitting a dead end.
// QA decision 9A: the age band is NOT required here — a profile saved
// without a birthdate is complete, and the birthdate is collected at
// the first human match instead.
export async function isExchangeProfileComplete(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'exchange_profiles', uid));
    if (!snap.exists()) return false;
    const d = snap.data();
    const nonEmpty = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;
    return nonEmpty(d.nickname) && nonEmpty(d.nativeLang) && nonEmpty(d.targetLang) && nonEmpty(d.country);
  } catch {
    return false;
  }
}
