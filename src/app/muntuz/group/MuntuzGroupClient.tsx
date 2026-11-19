'use client';

// MUNTUZ group page (client part) — /muntuz/group.
// The debut single "Say Hi" + the dorm-episodes gallery live here, on their
// own page, so the main page stays a simple language-exchange landing.
// Photos use the locked official faces; the debut-stage photo is a still
// from the "Say Hi" MV, the episode photos are the house photos + MV stills.

import { useEffect, useRef, useState } from 'react';
import { EPISODES, GROUP_DICT, LANGS } from './groupData';
import type { Lang } from './groupData';

const SUNO_SAY_HI = 'https://suno.com/song/3abdeff9-b70e-43b3-afc8-bc59cf8a8ef0';

export default function MuntuzGroupClient() {
  const [lang, setLang] = useState<Lang>('en');
  const [epFilter, setEpFilter] = useState('All');
  const [showMv, setShowMv] = useState(false);
  const mvRef = useRef<HTMLVideoElement>(null);
  const mvDialogRef = useRef<HTMLDivElement>(null);
  const [mvExpanded, setMvExpanded] = useState(false);
  const [mvFullscreen, setMvFullscreen] = useState(false);

  // Keep the fullscreen toggle label in sync even when the user exits
  // native fullscreen via Esc instead of the button.
  useEffect(() => {
    const onChange = () => setMvFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // QA 11-16 Muntuz D12: the landing "Watch the 'Say Hi' MV" button links
  // here with ?mv=1 — open the MV dialog (autoPlay) on arrival instead of
  // landing on the group page and making the guest find the button.
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('mv') === '1') setShowMv(true);
    } catch {}
  }, []);

  // Explicit fullscreen button: the native controls' fullscreen button can
  // be missing/disabled when the page sits in an iframe without
  // allowfullscreen or on iOS quirks, so offer one directly.
  //
  // D26 (11-16 guest QA — contradicts #203's "already fixed"): the old
  // version called video.requestFullscreen() and silently swallowed the
  // rejection. When the page sits in an iframe without allowfullscreen
  // (or the browser denies fullscreen for any other reason) the promise
  // rejects and the button visibly does nothing — the exact reported
  // symptom. Fix: try the real Fullscreen API first (video, then iOS
  // webkitEnterFullscreen, then the dialog container), and fall back to
  // expanding the dialog to fill the viewport via CSS, so the button
  // ALWAYS visibly does something. The button toggles back off.
  const enterMvFullscreen = async () => {
    // Toggle off: already in native fullscreen, or in the CSS-expanded fallback.
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* noop */ }
      setMvExpanded(false);
      return;
    }
    if (mvExpanded) { setMvExpanded(false); return; }
    const video = mvRef.current;
    if (video) {
      const v = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
      try {
        if (typeof video.requestFullscreen === 'function') {
          await video.requestFullscreen();
          return;
        }
        // iOS Safari: no requestFullscreen on video — use the video-only API.
        if (typeof v.webkitEnterFullscreen === 'function') {
          v.webkitEnterFullscreen();
          return;
        }
      } catch { /* denied (e.g. iframe without allowfullscreen) — fall through */ }
    }
    // Fallback 1: fullscreen the dialog container instead of the video.
    const dialog = mvDialogRef.current;
    if (dialog && typeof dialog.requestFullscreen === 'function') {
      try {
        await dialog.requestFullscreen();
        return;
      } catch { /* denied — fall through to the CSS fallback */ }
    }
    // Fallback 2 (always works): expand the dialog to fill the viewport.
    setMvExpanded(true);
  };

  const closeMv = () => {
    setMvExpanded(false);
    setShowMv(false);
  };

  const t = (key: string) => GROUP_DICT[lang][key] ?? GROUP_DICT.en[key] ?? key;

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return (
    <main className="min-h-screen bg-[#FAF6EF] text-slate-900">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#FAF6EF]/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-5 py-3 sm:max-w-2xl">
          <a href="/muntuz" className="text-lg font-extrabold tracking-tight">
            MUNTUZ
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/muntuz"
              className="rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {t('groupBack')}
            </a>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label="Language"
              className="rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {LANGS.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5 pb-12 pt-8 sm:max-w-2xl">
        {/* Debut */}
        <section>
          <p className="mx-auto w-fit rounded-full bg-amber-400 px-4 py-1.5 text-xs font-extrabold text-slate-900">
            🎉 {t('debutJust')}
          </p>
          <p className="mt-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            {t('debutKicker')}
          </p>
          <h1 className="mt-2 text-center text-2xl font-extrabold">
            {t('debutGreeting')}
          </h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
            {t('debutSub')}
          </p>
          <p className="mt-3 text-center text-sm font-bold text-violet-700">
            {t('debutLearn')}
          </p>
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-md ring-1 ring-slate-100">
            <img
              src="/muntuz/ep-studio-stage.webp"
              alt="MUNTUZ performing “Say Hi” on the debut stage"
              className="h-auto w-full rounded-2xl object-cover"
            />
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('songLabel')}
            </p>
            <p className="mt-1 text-xl font-extrabold">“Say Hi”</p>
            <p className="mt-1 text-sm text-slate-600">{t('songMeta')}</p>
            <button
              type="button"
              onClick={() => setShowMv(true)}
              className="mt-3 inline-block rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {t('watchMvBtn')}
            </button>
            <a
              href={SUNO_SAY_HI}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 mt-3 inline-block text-sm font-bold text-violet-700 hover:text-violet-900"
            >
              {t('sunoLink')}
            </a>
            <div className="mt-5 rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                {t('hookLabel')}
              </p>
              <p className="mt-2 text-2xl font-extrabold text-violet-900">
                말해봐, 너의 언어로
              </p>
              <p className="mt-2 text-sm text-slate-700">{t('hookMeaning')}</p>
              <p className="mt-1 text-sm text-slate-700">{t('hookPron')}</p>
              <p className="mt-2 text-sm font-semibold text-violet-800">
                {t('hookMission')}
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-700">
              {t('debutRoles')}
            </p>
            <div className="mt-4 rounded-2xl bg-[#FAF6EF] p-4 ring-1 ring-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('fandomLabel')}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {t('fandomText')}
              </p>
            </div>
          </div>
        </section>

        {/* Dorm episodes — stories from living together. */}
        <section className="mt-12">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            {t('epKicker')}
          </p>
          <h2 className="mt-2 text-center text-xl font-extrabold">{t('epTitle')}</h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">{t('epSub')}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {['All', 'Jiyoung', 'Emily', 'Chloe', 'Sofia', 'Amara'].map((m) => (
              <button
                key={m}
                onClick={() => setEpFilter(m)}
                aria-pressed={epFilter === m}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${epFilter === m ? 'bg-violet-600 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
              >
                {m === 'All' ? t('epFilterAll') : m}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {EPISODES.filter((e) => epFilter === 'All' || e.who === epFilter || e.who === 'All').map((ep) => (
              <article key={ep.id} className="overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-100">
                <img src={ep.img} alt={t(ep.titleKey)} className="h-52 w-full object-cover sm:h-56" loading="lazy" />
                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                    {ep.who === 'All' ? t('epAllTag') : ep.who}
                  </p>
                  <h3 className="mt-1 font-extrabold">{t(ep.titleKey)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(ep.textKey)}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">{t('epMoreNote')}</p>
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <a
            href="/exchange"
            className="inline-block rounded-full bg-violet-600 px-8 py-3 text-base font-bold text-white shadow-md hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            {t('groupCta')}
          </a>
          <p className="mt-4">
            <a href="/muntuz" className="text-sm font-bold text-violet-700 hover:text-violet-900">
              {t('groupBack')}
            </a>
          </p>
        </section>

        {/* MV player — the produced “Say Hi” video plays right here; Suno stays as a second link. */}
        {showMv && (
          <div
            className={mvExpanded ? 'fixed inset-0 z-50 flex items-center justify-center bg-black' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'}
            onClick={closeMv}
            role="dialog"
            aria-modal="true"
            aria-label="MUNTUZ — Say Hi music video"
          >
            <div
              ref={mvDialogRef}
              className={mvExpanded ? 'h-full w-full overflow-hidden bg-black' : 'w-full max-w-2xl overflow-hidden rounded-2xl bg-black shadow-2xl'}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-sm font-bold text-white">MUNTUZ — “Say Hi”</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      enterMvFullscreen();
                    }}
                    aria-label={mvFullscreen || mvExpanded ? 'Exit fullscreen' : 'Fullscreen'}
                    title={mvFullscreen || mvExpanded ? 'Exit fullscreen' : 'Fullscreen'}
                    className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {mvFullscreen || mvExpanded ? '⛶ Exit' : '⛶'}
                  </button>
                  <button
                    type="button"
                    onClick={closeMv}
                    aria-label="Close"
                    className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <video
                ref={mvRef}
                src="/muntuz/say-hi-mv.mp4"
                poster="/muntuz/ep-studio-stage.webp"
                controls
                autoPlay
                playsInline
                className={mvExpanded ? 'h-[calc(100dvh-41px)] w-full bg-black object-contain' : 'aspect-[3/2] w-full bg-black'}
              />
            </div>
          </div>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center">
          <p className="text-xs text-slate-500">{t('groupAiNote')}</p>
          <p className="mt-1 text-xs text-slate-400">© 2026 Muntuz</p>
        </footer>
      </div>
    </main>
  );
}
