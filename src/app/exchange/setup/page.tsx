'use client';

// /exchange/setup — onboarding: the profile form a new user fills in right
// after signing up / first sign-in. Same fields, same options, same save
// rules as the Exchange Profile tab (PR #169, B안) — both go through the
// shared module src/lib/exchangeProfile.ts so they cannot drift apart:
//  - only the derived age band is stored in the public doc; the exact
//    birthdate goes to the owner-only `private/identity` subcollection.
//  - 18+ gate: a missing/invalid/under-18 birthdate refuses the save.
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
import {
  AGE_BANDS,
  COMM_MODES,
  CORRECTION_PREFS,
  COUNTRIES,
  DAYS,
  GENDERS,
  GOALS,
  INTERESTS,
  LANGUAGES,
  LEVELS,
  TIME_SLOTS,
  ageBandForAge,
  calcAge,
  defaultExchangeProfileForm,
  detectTimezone,
  loadExchangeProfile,
  saveExchangeProfile,
  utcLabel,
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
  const [timezone, setTimezone] = useState('');

  // Timezone is detected from the device, not typed in.
  useEffect(() => {
    const { timezone: tz, utcOffsetMin: off } = detectTimezone();
    setTimezone(`${tz} (${utcLabel(off)})`);
  }, []);

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
  const toggleDay = (d: string) =>
    setForm((cur) => ({
      ...cur,
      availDays: cur.availDays.includes(d) ? cur.availDays.filter((x) => x !== d) : [...cur.availDays, d],
    }));
  const toggleSlot = (s: string) =>
    setForm((cur) => ({
      ...cur,
      availSlots: cur.availSlots.includes(s) ? cur.availSlots.filter((x) => x !== s) : [...cur.availSlots, s],
    }));

  const save = async () => {
    if (!user || saving) return;
    setSaveError('');
    setSaveFailed('');
    setSaving(true);
    const result = await saveExchangeProfile(user.uid, form);
    setSaving(false);
    if (result.ok === false) {
      if (result.error === 'validation') {
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
    if (result.birthdateSaved === false && result.birthdateError === 'permission-denied') {
      // Continue to Exchange: the profile itself is saved.
    }
    router.push('/exchange');
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-slate-900">
      {/* Header — same brand as the Exchange page: shared /logo.png
          M-ring badge with "Muntuz", back to Discover. */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3.5">
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
          Partners see your nickname, languages, level, interests, goal, age band, country, timezone and availability. Your exact date of
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
        ) : (
          <div className="mt-4 grid gap-4">
            {prefillLoading && <p className="text-sm text-slate-500">Loading your saved profile…</p>}
            {prefillDone && savedAgeBand && (
              <p className="rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900">
                Welcome back — your saved profile is filled in below. Change anything and save again.
              </p>
            )}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <label className="block text-sm font-semibold">
                Nickname (shown to partners)
                <input
                  value={form.nickname}
                  onChange={(e) => setForm((cur) => ({ ...cur, nickname: e.target.value }))}
                  placeholder="Pick a nickname — not your real name"
                  maxLength={40}
                  className={inputCls}
                />
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block text-sm font-semibold">
                  Native language
                  <select value={form.nativeLang} onChange={(e) => setForm((cur) => ({ ...cur, nativeLang: e.target.value }))} className={inputCls}>
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Learning
                  <select value={form.targetLang} onChange={(e) => setForm((cur) => ({ ...cur, targetLang: e.target.value }))} className={inputCls}>
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Level
                  <select value={form.level} onChange={(e) => setForm((cur) => ({ ...cur, level: e.target.value }))} className={inputCls}>
                    {LEVELS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </label>
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
                  Country
                  <select value={form.country} onChange={(e) => setForm((cur) => ({ ...cur, country: e.target.value }))} className={inputCls}>
                    <option value="">Select a country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
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
                  Date of birth (18+ only)
                  <input
                    type="date"
                    value={form.birthdate}
                    max={maxBirthdate}
                    onChange={(e) => setForm((cur) => ({ ...cur, birthdate: e.target.value }))}
                    className={inputCls}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Gender
                  <select value={form.gender} onChange={(e) => setForm((cur) => ({ ...cur, gender: e.target.value as Gender }))} className={inputCls}>
                    {GENDERS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Your exact birthdate is never shown to anyone — only your age band
                {birthdateBand ? ` (${birthdateBand})` : savedAgeBand ? ` (${savedAgeBand})` : ''} is shown on your card.
                {birthdateAge !== null && birthdateAge < 18 ? ' You must be 18 or older to save.' : ''}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-bold">Availability</h2>
              <p className="mt-1 text-sm text-slate-600">Timezone: {timezone ? `${timezone}` : 'detecting…'} — detected from your device.</p>
              <p className="mt-4 text-sm font-semibold">Days</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DAYS.map((d) => (
                  <button key={d} type="button" onClick={() => toggleDay(d)} className={chipCls(form.availDays.includes(d))}>
                    {d}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold">Times of day</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSlot(s)} className={chipCls(form.availSlots.includes(s))}>
                    {s}
                  </button>
                ))}
              </div>
              <label className="mt-4 block text-sm font-semibold">
                Sessions per week
                <select value={form.availPerWeek} onChange={(e) => setForm((cur) => ({ ...cur, availPerWeek: Number(e.target.value) }))} className={`${inputCls} sm:w-48`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n === 5 ? '5+' : n}
                    </option>
                  ))}
                </select>
              </label>
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
