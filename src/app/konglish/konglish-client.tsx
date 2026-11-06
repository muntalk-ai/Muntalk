'use client';

// Konglish ER watch page (/konglish).
// Past episodes (release time passed) are free for everyone — one
// youtube-nocookie iframe, 9:16, no autoplay. The next episode per language
// is members-only early access: it opens 48h before its release time, and
// only signed-in users can watch it (if a videoId exists yet). Signed-out
// visitors see a lock card pointing to /login?next=/konglish. Episodes more
// than 48h out show their release date only. Status is computed from
// releaseAt (UTC) against the visitor's clock, so an episode flips to free
// automatically once its release time passes — no code change needed.
//
// Auth: useAuth() from @/context/AuthContext (Firebase Auth, same as the
// rest of the site). No new auth system, no Firestore writes here — the
// gate is a client-side watch gate only; the videos themselves are YouTube
// uploads (unlisted until release, Public at release time).
//
// Workflow note (Jay 2026-11-06): for the early-access section to have
// anything to show, upload the next episode as Unlisted 1–2 days BEFORE
// its release time and flip it to Public at release. Until that workflow
// runs, early episodes show a "video is being prepared" card.

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  KONGLISH_LANGS,
  episodesForLang,
  episodeStatus,
  latestReleasedForLang,
  nextEpisodeForLang,
  type KonglishEpisode,
  type KonglishLang,
} from '@/data/konglish-episodes';

const FONT =
  "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";

function fmtRelease(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Vancouver',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function KonglishHeader() {
  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #F1F5F9',
        height: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}
    >
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
        <img src="/logo.png" alt="MunTalk" style={{ width: 36, height: 36, borderRadius: 12 }} />
        <span style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-0.5px' }}>MunTalk</span>
        <span style={{ background: '#EFF6FF', color: '#0284C7', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
          BETA
        </span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <a href="/watch" style={{ color: '#0F172A', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
          📺 Watch
        </a>
        <a href="/konglish" style={{ color: '#0F172A', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
          🚑 Konglish
        </a>
        <a href="/learn" style={{ color: '#0F172A', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
          📚 Learn
        </a>
        <a href="/signup" style={{ color: '#6366F1', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
          Start Free
        </a>
      </div>
    </div>
  );
}

function KonglishFooter() {
  return (
    <footer style={{ textAlign: 'center', padding: 28, color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff', marginTop: 48 }}>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <a href="/" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>🏠 Home</a>
        <a href="/watch" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>📺 Watch</a>
        <a href="/konglish" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>🚑 Konglish</a>
        <a href="/about" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>About</a>
        <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💎 Pricing</a>
        <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💬 Help &amp; FAQ</a>
      </div>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
        Konglish ER fixes one common English mistake per episode. Built by Jay, an independent developer.
      </div>
      <div style={{ fontSize: 11, color: '#CBD5E1' }}>&copy; {new Date().getFullYear()} MunTalk. All rights reserved.</div>
    </footer>
  );
}

export default function KonglishClient() {
  const { user, loading: authLoading } = useAuth();
  const [lang, setLang] = useState<KonglishLang>('vi');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  // Re-check the clock every minute so episodes flip free on their own.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const episodes = episodesForLang(lang);
  const nextEp = nextEpisodeForLang(lang, now);
  const latestReleased = latestReleasedForLang(lang, now);
  const selected: KonglishEpisode | null =
    episodes.find((e) => e.slug === selectedSlug) ?? latestReleased;
  const langMeta = KONGLISH_LANGS.find((l) => l.code === lang);

  function pickLanguage(next: KonglishLang) {
    setLang(next);
    setSelectedSlug(null);
  }

  const nextStatus = nextEp ? episodeStatus(nextEp, now) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', fontFamily: FONT, color: '#0F172A' }}>
      <KonglishHeader />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 8px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 20,
            padding: '6px 16px',
            marginBottom: 20,
            letterSpacing: 0.8,
          }}
        >
          🚑 KONGLISH ER
        </div>
        <h1 style={{ fontSize: 'clamp(26px,4.5vw,38px)', fontWeight: 900, lineHeight: 1.3, margin: '0 0 12px', letterSpacing: -0.5 }}>
          Fix one English mistake a day.
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.8, fontWeight: 600, margin: '0 0 32px' }}>
          Short videos that fix the English mistakes {langMeta?.name ?? ''} speakers make most.
          Past episodes are free for everyone. Sign in to watch the next episode 1–2 days early.
        </p>

        {/* Language selector */}
        <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 12px' }}>🌐 Language</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {KONGLISH_LANGS.map((l) => {
            const active = lang === l.code;
            const releasedCount = episodesForLang(l.code).filter(
              (e) => episodeStatus(e, now) === 'released',
            ).length;
            return (
              <button
                key={l.code}
                onClick={() => pickLanguage(l.code)}
                style={{
                  border: active ? '2px solid #DC2626' : '1.5px solid #E2E8F0',
                  background: active ? '#FEF2F2' : '#fff',
                  color: '#0F172A',
                  borderRadius: 99,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: FONT,
                }}
              >
                {l.native}
                {releasedCount > 0 ? ` · ${releasedCount} free` : ''}
              </button>
            );
          })}
        </div>

        {/* Player — selected episode (free) or a placeholder */}
        {selected && selected.videoId ? (
          <>
            <div
              style={{
                maxWidth: 360,
                margin: '0 auto 16px',
                aspectRatio: '9 / 16',
                borderRadius: 20,
                overflow: 'hidden',
                background: '#000',
                boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
              }}
            >
              <iframe
                key={selected.videoId}
                src={`https://www.youtube-nocookie.com/embed/${selected.videoId}`}
                title={selected.ytTitle}
                style={{ width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <p style={{ fontSize: 15, fontWeight: 900, textAlign: 'center', margin: '0 0 4px' }}>
              Episode {selected.ep} — “{selected.topic}”
            </p>
            <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textAlign: 'center', margin: '0 0 32px' }}>
              {langMeta?.name} · Released {fmtRelease(selected.releaseAt)} (Vancouver time)
            </p>
          </>
        ) : (
          <div
            style={{
              maxWidth: 360,
              margin: '0 auto 32px',
              aspectRatio: '9 / 16',
              borderRadius: 20,
              background: '#1E293B',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: 24,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 40 }}>🚑</div>
            <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.5 }}>
              {selected
                ? 'This episode is being uploaded'
                : `The first ${langMeta?.name} episode opens soon`}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1', lineHeight: 1.7 }}>
              {selected
                ? 'The video is on its way — check back soon.'
                : nextEp
                  ? `Episode ${nextEp.ep} opens ${fmtRelease(nextEp.releaseAt)} (Vancouver time). Sign in to watch it early when it opens.`
                  : 'More episodes are coming soon.'}
            </div>
          </div>
        )}

        {/* Next episode — members-only early access */}
        {nextEp && (
          <div
            style={{
              background: 'linear-gradient(135deg,#DC2626,#F97316)',
              borderRadius: 20,
              padding: '24px 26px',
              marginBottom: 24,
              color: '#fff',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 6px' }}>
              🔒 Next episode — Episode {nextEp.ep}: “{nextEp.topic}”
            </h2>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 16px', lineHeight: 1.7 }}>
              Opens to everyone {fmtRelease(nextEp.releaseAt)} (Vancouver time).
              {nextStatus === 'early'
                ? ' Members can watch it right now.'
                : ' Sign in and watch it 1–2 days early when early access opens.'}
            </p>
            {authLoading ? (
              <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Checking sign-in…</p>
            ) : nextStatus === 'early' && user ? (
              nextEp.videoId ? (
                <button
                  onClick={() => setSelectedSlug(nextEp.slug)}
                  style={{
                    borderRadius: 12,
                    border: 'none',
                    background: '#0F172A',
                    color: '#fff',
                    padding: '12px 22px',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  ▶ Watch early — Episode {nextEp.ep}
                </button>
              ) : (
                <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
                  ✓ Early access is open — the video is being prepared. Check back soon.
                </p>
              )
            ) : nextStatus === 'early' && user === null ? (
              <a
                href="/login?next=/konglish"
                style={{
                  display: 'inline-block',
                  borderRadius: 12,
                  background: '#0F172A',
                  color: '#fff',
                  padding: '12px 22px',
                  fontSize: 14,
                  fontWeight: 900,
                  textDecoration: 'none',
                }}
              >
                🔒 Sign in to watch early — free account
              </a>
            ) : (
              <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
                Early access opens 2 days before release
                {user === null ? (
                  <>
                    {' — '}
                    <a href="/login?next=/konglish" style={{ color: '#fff', textDecoration: 'underline' }}>
                      sign in now
                    </a>{' '}
                    so you can watch it first.
                  </>
                ) : (
                  ' — come back then.'
                )}
              </p>
            )}
          </div>
        )}
        {nextEp === null && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '22px 26px', border: '1.5px solid #F1F5F9', marginBottom: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
              🎉 All {langMeta?.name} episodes are out — more coming soon.
            </p>
          </div>
        )}

        {/* Past episodes — free */}
        <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 12px' }}>📺 Past episodes — free</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {episodes
            .filter((e) => episodeStatus(e, now) === 'released')
            .sort((a, b) => b.ep - a.ep)
            .map((e) => {
              const active = selected?.slug === e.slug;
              return (
                <button
                  key={e.slug}
                  onClick={() => setSelectedSlug(e.slug)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: active ? '#FEF2F2' : '#fff',
                    border: active ? '2px solid #DC2626' : '1.5px solid #F1F5F9',
                    borderRadius: 16,
                    padding: '16px 20px',
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', letterSpacing: 1 }}>
                    EPISODE {e.ep} · FREE
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, margin: '4px 0 2px', color: '#0F172A' }}>
                    “{e.topic}”
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                    Released {fmtRelease(e.releaseAt)} (Vancouver time)
                    {e.videoId ? '' : ' · video uploading'}
                  </div>
                </button>
              );
            })}
          {episodes.filter((e) => episodeStatus(e, now) === 'released').length === 0 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1.5px solid #F1F5F9' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#64748B', margin: 0 }}>
                No free episodes in {langMeta?.name} yet — the first one opens soon.
              </p>
            </div>
          )}
        </div>

        {/* Upcoming episodes */}
        <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 12px' }}>🗓️ Coming up</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {episodes
            .filter((e) => episodeStatus(e, now) !== 'released' && e.slug !== nextEp?.slug)
            .map((e) => (
              <div
                key={e.slug}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: '16px 20px',
                  border: '1.5px solid #F1F5F9',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: 1 }}>
                  EPISODE {e.ep} · OPENS {fmtRelease(e.releaseAt).toUpperCase()}
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, margin: '4px 0 2px' }}>“{e.topic}”</div>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                  Members watch it 1–2 days early.
                </div>
              </div>
            ))}
        </div>

        {/* App CTA */}
        <a
          href="/lingua/microtalk"
          style={{
            display: 'block',
            background: '#0F172A',
            color: '#fff',
            borderRadius: 20,
            padding: '22px 26px',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>🎤 Practice it on MunTalk</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1', lineHeight: 1.6 }}>
            Check your pronunciation for free — the same mistakes, fixed in your own voice.
          </div>
        </a>
      </div>

      <KonglishFooter />
    </div>
  );
}
