'use client';

// /exchange/setup — onboarding: the profile form a new user fills in right
// after signing up / first sign-in. Same fields, same options, same save
// rules as the Exchange Profile tab (PR #169, B안) — both go through the
// shared module src/lib/exchangeProfile.ts so they cannot drift apart:
//  - only the derived age band is stored in the public doc; the exact
//    birthdate goes to the owner-only `private/identity` subcollection.
//  - QA decision 9A (Jay, 2026-11-18): the birthdate is optional here
//    now — the profile saves without one, and it is collected at the
//    first People Rooms contact / waitlist join instead. A birthdate
//    that IS entered is still validated (18+ only).
//  - no real name, email, contact details or exact birthdate is ever
//    shown to anyone but the owner themself.
// On a successful save the user goes to /exchange (Discover). The global
// login/signup flow is untouched: signed-out visitors get a link to
// /login?next=/exchange/setup, which the existing /login page already
// honours.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import BackButton from '@/components/BackButton';
import { takeStashedNextPath } from '@/lib/returnUrl';
import {
  AGE_BANDS,
  COMM_MODES,
  CORRECTION_PREFS,
  COUNTRIES,
  GENDERS,
  GOALS,
  INTERESTS,
  LANGUAGES,
  LEVELS,
  ageBandForAge,
  missingRequiredFields,
  type RequiredField,
  calcAge,
  defaultExchangeProfileForm,
  loadExchangeProfile,
  saveExchangeProfile,
  type ExchangeProfileForm,
  type Gender,
  type LearningGoal,
} from '@/lib/exchangeProfile';

const inputCls =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100';
const chipCls = (on: boolean) =>
  `rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
    on ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
  }`;

// About me examples: short, warm intros a new user can tap to use as-is
// (and then edit). They are shown to partners, so no real name, contact
// details or exact birthdate — and every one fits the 200-char limit.
const BIO_EXAMPLES = [
  "Hi! I love talking about travel and food. Let's practice together!",
  'I enjoy cooking, movies, and everyday conversation — happy to help with my language too.',
  "Let's learn together! I like music, hiking, and chatting about daily life.",
  "I'm here to practice speaking and make new friends around the world.",
];

// Required-field marker and per-field error (2026-11-26).
function Req() {
  return <span className="text-red-600" aria-hidden="true"> *</span>;
}
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">{msg}</span>;
}
const errCls = (on: boolean) => (on ? ' border-red-400 ring-2 ring-red-100' : '');

export default function ExchangeSetupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<ExchangeProfileForm>(() => defaultExchangeProfileForm());
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillDone, setPrefillDone] = useState(false);
  const [savedAgeBand, setSavedAgeBand] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveFailed, setSaveFailed] = useState('');
  // 2026-11-26: required fields — per-field errors, shown after a save attempt
  // and cleared field by field as the user fills them in.
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredField, string>>>({});
  const [triedSave, setTriedSave] = useState(false);
  useEffect(() => {
    if (triedSave) setFieldErrors(missingRequiredFields(form, { existingAgeBand: savedAgeBand }));
  }, [form, triedSave, savedAgeBand]);

  // Prefill from a saved profile (e.g. a returning user who never
  // finished setup, or someone editing via this page instead of the
  // Profile tab). The birthdate comes from the private subcollection
  // and is only ever shown back to its owner, in this input.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    setPrefillLoading(true);
    loadExchangeProfile(user.uid)
      .then((loaded) => {
        if (cancelled) return;
        if (loaded.exists) {
          setForm((cur) => ({ ...cur, ...loaded.form, birthdate: loaded.birthdate || cur.birthdate }));
          if (loaded.form.ageBand) setSavedAgeBand(loaded.form.ageBand);
        } else if (loaded.birthdate) {
          setForm((cur) => ({ ...cur, birthdate: loaded.birthdate }));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPrefillLoading(false);
          setPrefillDone(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const birthdateAge = form.birthdate ? calcAge(form.birthdate) : null;
  const birthdateBand = birthdateAge === null ? '' : ageBandForAge(birthdateAge);
  const maxBirthdate = (() => {
    const t = new Date();
    t.setFullYear(t.getFullYear() - 18);
    return t.toISOString().slice(0, 10);
  })();

  const toggleInterest = (interest: string) =>
    setForm((cur) => ({
      ...cur,
      interests: cur.interests.includes(interest)
        ? cur.interests.filter((i) => i !== interest)
        : [...cur.interests, interest],
    }));
  const toggleFluent = (lang: string) =>
    setForm((cur) => ({
      ...cur,
      fluentLangs: cur.fluentLangs.includes(lang)
        ? cur.fluentLangs.filter((l) => l !== lang)
        : [...cur.fluentLangs, lang],
    }));
  const save = async () => {
    if (!user || saving) return;
    setSaveError('');
    setSaveFailed('');
    setTriedSave(true);
    const missing = missingRequiredFields(form, { existingAgeBand: savedAgeBand });
    setFieldErrors(missing);
    if (Object.keys(missing).length > 0) {
      setSaveError('Please fill in all required fields (marked *).');
      return;
    }
    setSaving(true);
    const result = await saveExchangeProfile(user.uid, form, { existingAgeBand: savedAgeBand });
    setSaving(false);
    if (result.ok === false) {
      if (result.error === 'validation') {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        setSaveError(result.message || 'Could not save your profile.');
      } else if (result.error === 'permission-denied') {
        setSaveFailed('Could not save: Exchange profile permissions are not published yet. Your answers are kept on this page.');
      } else {
        setSaveFailed('Could not save your profile. Please try again.');
      }
      return;
    }
    // Birthdate storage can lag behind the public save until its console
    // rule is published — the age band is saved either way, so the user
    // can continue; the Profile tab says the same thing.
    // QA decision 9A: a deferred birthdate (no date entered) also just
    // continues — it is collected at the first People Rooms contact.
    if (result.birthdateSaved === false && !('birthdateDeferred' in result) && result.birthdateError === 'permission-denied') {
      // Continue to Exchange: the profile itself is saved.
    }
    // Back to where the user was headed (stashed by the post-login setup
    // gate); otherwise back to Exchange.
    router.push(takeStashedNextPath('/exchange'));
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-slate-900">
      {/* Header — same brand as the Exchange page: shared /logo.png
          M-ring badge with "Muntuz", back to Discover. */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3.5">
          {/* Back — Muntuz pages only (Jay 2026-11-06). No history: /exchange. */}
          <BackButton fallback="/exchange" />
          <a href="/exchange" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" aria-label="Muntuz — back to Exchange">
            <Image src="/logo.png" alt="Muntuz" width={40} height={40} className="h-10 w-10 rounded-full object-cover shadow-md" />
            <span className="text-left">
              <span className="block text-lg font-extrabold leading-tight">Muntuz</span>
              <span className="block text-xs text-slate-500">Talk with people. Review with AI.</span>
            </span>
          </a>
          {!authLoading && !user && (
            <a
              href="/login?next=/exchange/setup"
              className="ml-auto rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Log in
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-16">
        <h1 className="text-xl font-extrabold">Set up your Exchange profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fields marked <span className="text-red-600">*</span> are required. Partners see your nickname, languages, level, interests, goal, age band and country. Your exact date of
          birth is never shown to anyone.
        </p>

        {authLoading ? (
          <p className="mt-4 text-sm text-slate-500">Checking sign-in…</p>
        ) : !user ? (
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold">Sign in to set up your Exchange profile.</p>
            <p className="mt-1 text-sm text-slate-500">Your answers are saved to your Exchange account.</p>
            <a
              href="/login?next=/exchange/setup"
              className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-3 font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Log in
            </a>
            <p className="mt-3 text-sm">
              <a href="/exchange" className="font-semibold text-violet-600 hover:underline">
                ← Back to Exchange
              </a>
            </p>
          </div>
        ) : !prefillDone ? (
          <div className="mt-4 grid gap-4" aria-busy="true">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-sm text-slate-500">Loading your saved profile…</p>
              <div className="mt-3 h-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              </div>
              <div className="mt-3 h-10 animate-pulse rounded-xl bg-slate-100" />
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="mt-3 h-10 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {savedAgeBand && (
              <p className="rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900">
                Welcome back — your saved profile is filled in below. Change anything and save again.
              </p>
            )}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <label className="block text-sm font-semibold">
                Nickname (shown to partners)<Req />
                <input
                  value={form.nickname}
                  onChange={(e) => setForm((cur) => ({ ...cur, nickname: e.target.value }))}
                  placeholder="Pick a nickname — not your real name"
                  maxLength={40}
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.nickname}
                  className={inputCls + errCls(!!fieldErrors.nickname)}
                />
                <FieldError msg={fieldErrors.nickname} />
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block text-sm font-semibold">
                  Native language<Req />
                  <select value={form.nativeLang} onChange={(e) => setForm((cur) => ({ ...cur, nativeLang: e.target.value }))} required aria-required="true" aria-invalid={!!fieldErrors.nativeLang} className={inputCls + errCls(!!fieldErrors.nativeLang)}>
                    <option value="">Select a language</option>
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <FieldError msg={fieldErrors.nativeLang} />
                </label>
                <label className="block text-sm font-semibold">
                  Learning<Req />
                  <select value={form.targetLang} onChange={(e) => setForm((cur) => ({ ...cur, targetLang: e.target.value }))} required aria-required="true" aria-invalid={!!fieldErrors.targetLang} className={inputCls + errCls(!!fieldErrors.targetLang)}>
                    <option value="">Select a language</option>
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <FieldError msg={fieldErrors.targetLang} />
                </label>
                <label className="block text-sm font-semibold">
                  Level<Req />
                  <select value={form.level} onChange={(e) => setForm((cur) => ({ ...cur, level: e.target.value }))} required aria-required="true" aria-invalid={!!fieldErrors.level} className={inputCls + errCls(!!fieldErrors.level)}>
                    <option value="">Select your level</option>
                    {LEVELS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <FieldError msg={fieldErrors.level} />
                </label>
              </div>
              <p className="mt-4 text-sm font-semibold">Fluent languages (besides your native language)</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LANGUAGES.filter((l) => l !== form.nativeLang).map((l) => (
                  <button key={l} type="button" onClick={() => toggleFluent(l)} className={chipCls(form.fluentLangs.includes(l))}>
                    {l}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold">Interests</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {INTERESTS.map((i) => (
                  <button key={i} type="button" onClick={() => toggleInterest(i)} className={chipCls(form.interests.includes(i))}>
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-bold">Matching</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Learning goal
                  <select value={form.learningGoal} onChange={(e) => setForm((cur) => ({ ...cur, learningGoal: e.target.value as LearningGoal }))} className={inputCls}>
                    {GOALS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Country<Req />
                  <select value={form.country} onChange={(e) => setForm((cur) => ({ ...cur, country: e.target.value }))} required aria-required="true" aria-invalid={!!fieldErrors.country} className={inputCls + errCls(!!fieldErrors.country)}>
                    <option value="">Select a country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <FieldError msg={fieldErrors.country} />
                </label>
                <label className="block text-sm font-semibold">
                  How I like to practice
                  <select value={form.commMode} onChange={(e) => setForm((cur) => ({ ...cur, commMode: e.target.value }))} className={inputCls}>
                    {COMM_MODES.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Corrections
                  <select value={form.correctionPref} onChange={(e) => setForm((cur) => ({ ...cur, correctionPref: e.target.value }))} className={inputCls}>
                    {CORRECTION_PREFS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">Corrections: how often you want partners to correct you (Often / Sometimes / Never).</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-bold">Age &amp; gender</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Date of birth (18+ only)<Req />
                  <input
                    type="date"
                    value={form.birthdate}
                    max={maxBirthdate}
                    onChange={(e) => setForm((cur) => ({ ...cur, birthdate: e.target.value }))}
                    required={!savedAgeBand}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.birthdate}
                    className={inputCls + errCls(!!fieldErrors.birthdate)}
                  />
                  <FieldError msg={fieldErrors.birthdate} />
                </label>
                <label className="block text-sm font-semibold">
                  Gender<Req />
                  <select value={form.gender} onChange={(e) => setForm((cur) => ({ ...cur, gender: e.target.value as Gender }))} required aria-required="true" aria-invalid={!!fieldErrors.gender} className={inputCls + errCls(!!fieldErrors.gender)}>
                    <option value="">Select your gender</option>
                    {GENDERS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                  <FieldError msg={fieldErrors.gender} />
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {`Your exact birthdate is never shown to anyone — only your age band${birthdateBand ? ` (${birthdateBand})` : savedAgeBand ? ` (${savedAgeBand})` : ''} is shown on your card.`}
                {birthdateAge !== null && birthdateAge < 18
                  ? ' You must be 18 or older to contact people in People Rooms.'
                  : ''}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <label className="block text-sm font-semibold">
                About me
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((cur) => ({ ...cur, bio: e.target.value }))}
                  placeholder="A short intro partners will see"
                  maxLength={200}
                  rows={3}
                  className={inputCls}
                />
              </label>
              <p className="mt-2 text-xs text-slate-500">Need ideas? Tap one to use it — you can edit it after.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BIO_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setForm((cur) => ({ ...cur, bio: ex }))}
                    className="rounded-full bg-violet-50 px-3 py-1.5 text-left text-xs font-semibold text-violet-700 transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-bold">Safety settings</h2>
              <label className="mt-2 flex items-center justify-between gap-3 text-sm">
                Only people of the same gender can find me
                <input
                  type="checkbox"
                  checked={form.sameGenderOnly}
                  onChange={(e) => setForm((cur) => ({ ...cur, sameGenderOnly: e.target.checked }))}
                  className="h-5 w-5 accent-violet-600"
                />
              </label>
              <p className="mt-2 text-xs text-slate-500">Safety settings are free for everyone — including the gender filter on Discover.</p>
            </div>

            {saveError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{saveError}</p>}
            {saveFailed && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{saveFailed}</p>}
            <button
              onClick={save}
              disabled={saving || prefillLoading}
              className="rounded-xl bg-violet-600 py-3 font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save and continue to Exchange'}
            </button>
            <p className="text-center text-sm">
              <a href="/exchange" className="font-semibold text-violet-600 hover:underline">
                ← Back to Exchange
              </a>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
