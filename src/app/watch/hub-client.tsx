'use client';

// Watch hub (/watch) — one page, two series (Jay 2026-11-06).
// Tabs: "Mia's Story" (Text Adventure) and "Konglish ER". Both series
// follow the same rule (see src/lib/early-access.ts): released episodes
// are free for everyone, the next episode is members-only early access
// (1–2 days before release), later episodes are coming soon.
//
// Tab is read from ?tab= (mia | konglish) so /konglish can redirect here
// and the tab is shareable: /watch?tab=konglish.

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EPISODES, LANGS, availableLangs, textAdventureStatus } from '@/data/text-adventure-episodes';
import KonglishClient from '../konglish/konglish-client';
import { FONT, useNow, WatchFooter, WatchHeader } from './watch-shared';

type Tab = 'mia' | 'konglish';

function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const btn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    border: active ? '2px solid #6366F1' : '1.5px solid #E2E8F0',
    background: active ? '#EEF2FF' : '#fff',
    color: '#0F172A',
    borderRadius: 16,
    padding: '14px 16px',
    fontSize: 15,
    fontWeight: 900,
    cursor: 'pointer',
    fontFamily: FONT,
  });
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
      <button onClick={() => onTab('mia')} style={btn(tab === 'mia')}>
        🎬 Mia&rsquo;s Story
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748B', marginTop: 2 }}>
          Text Adventure · 22 languages
        </span>
      </button>
      <button onClick={() => onTab('konglish')} style={btn(tab === 'konglish')}>
        🚑 Konglish ER
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748B', marginTop: 2 }}>
          One mistake a day · 17 languages
        </span>
      </button>
    </div>
  );
}

function MiaTab() {
  const { user, loading: authLoading } = useAuth();
  const now = useNow();
  const sorted = [...EPISODES].sort((a, b) => b.ep - a.ep);
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 8px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#EEF2FF',
          border: '1px solid #C7D2FE',
          color: '#6366F1',
          fontSize: 11,
          fontWeight: 800,
          borderRadius: 20,
          padding: '6px 16px',
          marginBottom: 20,
          letterSpacing: 0.8,
        }}
      >
        🎬 TEXT ADVENTURE
      </div>
      <h1 style={{ fontSize: 'clamp(26px,4.5vw,38px)', fontWeight: 900, lineHeight: 1.3, margin: '0 0 12px', letterSpacing: -0.5 }}>
        Mia&rsquo;s story, one choice at a time.
      </h1>
      <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.8, fontWeight: 600, margin: '0 0 32px' }}>
        A 35-second story in 22 languages. You pick what Mia does — and the next episode shows what
        happened. Past episodes are free for everyone. Sign in to watch the next episode 1–2 days early.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map((ep) => {
          const ready = availableLangs(ep).length;
          const status = textAdventureStatus(ep, now);
          const badge =
            status === 'released'
              ? `EPISODE ${ep.ep} · FREE · ${ready} OF ${LANGS.length} LANGUAGES READY`
              : status === 'early'
                ? `EPISODE ${ep.ep} · 🔒 MEMBERS EARLY · ${ready} OF ${LANGS.length} LANGUAGES READY`
                : `EPISODE ${ep.ep} · COMING SOON`;
          const cta =
            status === 'released'
              ? `Watch episode ${ep.ep} →`
              : status === 'early'
                ? authLoading
                  ? 'Checking sign-in…'
                  : user
                    ? `▶ Watch episode ${ep.ep} early →`
                    : `🔒 Sign in to watch episode ${ep.ep} early →`
                : `Episode ${ep.ep} is being prepared`;
          return (
            <a
              key={ep.slug}
              href={`/watch/${ep.slug}`}
              style={{
                display: 'block',
                background: '#fff',
                borderRadius: 20,
                padding: '22px 26px',
                border: '1.5px solid #F1F5F9',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: status === 'early' ? '#DC2626' : '#6366F1', letterSpacing: 1 }}>
                {badge}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.4, margin: '6px 0 4px' }}>{ep.title}</div>
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, lineHeight: 1.6 }}>{ep.summary}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: status === 'early' ? '#DC2626' : '#6366F1', marginTop: 10 }}>
                {cta}
              </div>
            </a>
          );
        })}
      </div>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: '32px 0 0', textAlign: 'center' }}>
        Text Adventure is an AI-generated fictional story. Built by Jay, an independent developer.
      </p>
    </div>
  );
}

function HubInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'konglish' ? 'konglish' : 'mia';

  function onTab(next: Tab) {
    router.replace(next === 'konglish' ? '/watch?tab=konglish' : '/watch', { scroll: false });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', fontFamily: FONT, color: '#0F172A' }}>
      <WatchHeader active={tab === 'konglish' ? 'konglish' : 'watch'} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 24px 0' }}>
        <TabBar tab={tab} onTab={onTab} />
      </div>

      {tab === 'konglish' ? (
        <KonglishClient />
      ) : (
        <MiaTab />
      )}

      <WatchFooter
        note={
          tab === 'konglish'
            ? 'Konglish ER fixes one common English mistake per episode. Built by Jay, an independent developer.'
            : undefined
        }
      />
    </div>
  );
}

export default function WatchHubClient() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: '#F8F9FA', fontFamily: FONT, color: '#0F172A' }}>
          <WatchHeader active="watch" />
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px', fontSize: 15, fontWeight: 700, color: '#64748B' }}>
            Loading…
          </div>
        </div>
      }
    >
      <HubInner />
    </Suspense>
  );
}
