'use client';

// MUNTUZ group page (client part) — /muntuz/group.
// The debut single "Say Hi" + the dorm-episodes gallery live here, on their
// own page, so the main page stays a simple language-exchange landing.
// Photos use the locked official faces; the debut-stage photo is a still
// from the "Say Hi" MV, the episode photos are the house photos + MV stills.

import { useEffect, useState } from 'react';
import { EPISODES, GROUP_DICT, LANGS } from './groupData';
import type { Lang } from './groupData';

const SUNO_SAY_HI = 'https://suno.com/song/3abdeff9-b70e-43b3-afc8-bc59cf8a8ef0';

export default function MuntuzGroupClient() {
  const [lang, setLang] = useState<Lang>('en');
  const [epFilter, setEpFilter] = useState('All');
  const [showMv, setShowMv] = useState(false);

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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowMv(false)}
            role="dialog"
            aria-modal="true"
            aria-label="MUNTUZ — Say Hi music video"
          >
            <div
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-sm font-bold text-white">MUNTUZ — “Say Hi”</p>
                <button
                  type="button"
                  onClick={() => setShowMv(false)}
                  aria-label="Close"
                  className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  ✕
                </button>
              </div>
              <video
                src="/muntuz/say-hi-mv.mp4"
                poster="/muntuz/ep-studio-stage.webp"
                controls
                autoPlay
                playsInline
                className="aspect-[3/2] w-full bg-black"
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
