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
//  - Exchange is 18+ only: a missing/invalid/under-18 birthdate refuses
//    the save with an inline error.
//
// No new Firestore rules are needed for this module: it writes the same
// collections the Profile tab already writes. (The private-identity rule
// itself is still pending console publish — see
// goals/muntalk-exchange/files/firestore-pending-publish-2026-11-05.md;
// until then the birthdate write fails with permission-denied and the
// public profile is still saved, exactly as the Profile tab behaves.)
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
export const LANGUAGES = ['English', 'Korean', 'Spanish', 'Japanese', 'Portuguese'] as const;
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

// 18+ gate, shared by every save path. The error strings are the ones the
// Profile tab has shown since PR #169 — keep them identical so users see
// one consistent message wherever they save.
export function validateBirthdate(
  birthdate: string
): { ok: true; age: number; band: AgeBand } | { ok: false; error: string } {
  if (!birthdate) {
    return {
      ok: false,
      error:
        'Add your date of birth to save your profile. Exchange is 18+ only — your exact birthdate is never shown to anyone.',
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
  | { ok: false; error: 'permission-denied' | 'other' | 'validation'; message?: string };

// Save the public profile doc (age band only — never the exact birthdate)
// and the owner-only private identity doc. Callers validate through this
// function so the 18+ gate cannot be skipped by any form.
export async function saveExchangeProfile(
  uid: string,
  form: ExchangeProfileForm
): Promise<SaveExchangeProfileResult> {
  const check = validateBirthdate(form.birthdate);
  if (check.ok === false) {
    return { ok: false, error: 'validation', message: check.error };
  }
  const band = check.band;
  // Re-detect the timezone at save time (the user may have travelled).
  const { timezone, utcOffsetMin } = detectTimezone();
  try {
    await setDoc(
      doc(db, 'exchange_profiles', uid),
      {
        nickname: form.nickname.trim(),
        nativeLang: form.nativeLang,
        targetLang: form.targetLang,
        level: form.level,
        interests: form.interests,
        bio: form.bio.trim(),
        learningGoal: form.learningGoal,
        country: form.country,
        gender: form.gender,
        ageBand: band,
        timezone,
        utcOffsetMin,
        availability: { days: form.availDays, slots: form.availSlots, perWeek: form.availPerWeek },
        commMode: form.commMode,
        correctionPref: form.correctionPref,
        sameGenderOnly: form.sameGenderOnly,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    return {
      ok: false,
      error: (err as { code?: string }).code === 'permission-denied' ? 'permission-denied' : 'other',
    };
  }
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
