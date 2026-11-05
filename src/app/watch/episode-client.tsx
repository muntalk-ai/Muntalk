'use client';

// Text Adventure episode page (shared by /watch/ep-01 and /watch/ep-02).
// Player = one youtube-nocookie iframe, 9:16, no autoplay. The language
// selector only enables languages that have a YouTube video ID; the rest
// show as "준비 중" (disabled). Vote is client-side only (localStorage) —
// no backend yet — plus links to the TikTok / Instagram comment threads.
// Notify form writes to Firestore `text_adventure_notify` (same pattern as
// the Muntuz waitlist). NOTE: the collection rules are NOT published yet —
// Jay publishes them in the Sunday console bundle (2026-11-08). Until then
// the write fails with permission-denied and the form shows the "opens
// soon" fallback instead of claiming the signup succeeded.

import { useEffect, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LANGS, type Episode, type Lang } from '@/data/text-adventure-episodes';

const FONT =
  "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";

function WatchHeader() {
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

function WatchFooter() {
  return (
    <footer style={{ textAlign: 'center', padding: 28, color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff', marginTop: 48 }}>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <a href="/" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>🏠 Home</a>
        <a href="/watch" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>📺 Watch</a>
        <a href="/about" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>About</a>
        <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💎 Pricing</a>
        <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💬 Help &amp; FAQ</a>
      </div>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
        Text Adventure is an AI-generated fictional story. Built by Jay, an independent developer.
      </div>
      <div style={{ fontSize: 11, color: '#CBD5E1' }}>&copy; {new Date().getFullYear()} MunTalk. All rights reserved.</div>
    </footer>
  );
}

export default function EpisodePageClient({
  episode,
  prevEp,
  nextEp,
}: {
  episode: Episode;
  prevEp: Episode | null;
  nextEp: Episode | null;
}) {
  const available = LANGS.filter((l) => episode.videos[l.code]);
  const [lang, setLang] = useState<Lang>(available[0]?.code ?? 'ko');
  const [vote, setVote] = useState<'A' | 'B' | null>(null);
  const [email, setEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState<'idle' | 'loading' | 'done' | 'soon' | 'invalid'>('idle');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ta-vote-ep-${episode.ep}`);
      if (saved === 'A' || saved === 'B') setVote(saved);
    } catch {
      // private mode — vote just won't persist
    }
  }, [episode.ep]);

  const videoId = episode.videos[lang];

  function castVote(choice: 'A' | 'B') {
    setVote(choice);
    try {
      localStorage.setItem(`ta-vote-ep-${episode.ep}`, choice);
    } catch {
      // ignore
    }
  }

  async function submitNotify() {
    const cleaned = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setNotifyStatus('invalid');
      return;
    }
    setNotifyStatus('loading');
    try {
      await addDoc(collection(db, 'text_adventure_notify'), {
        email: cleaned,
        ep: episode.ep,
        createdAt: serverTimestamp(),
      });
      setNotifyStatus('done');
    } catch {
      // Rules not published yet (permission-denied) — do not claim success.
      setNotifyStatus('soon');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', fontFamily: FONT, color: '#0F172A' }}>
      <WatchHeader />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 8px' }}>
        <a href="/watch" style={{ fontSize: 13, fontWeight: 800, color: '#6366F1', textDecoration: 'none' }}>
          ← All episodes
        </a>
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
            margin: '20px 0 16px',
            letterSpacing: 0.8,
          }}
        >
          🎬 TEXT ADVENTURE — EPISODE {episode.ep}
        </div>
        <h1 style={{ fontSize: 'clamp(26px,4.5vw,36px)', fontWeight: 900, lineHeight: 1.3, margin: '0 0 10px', letterSpacing: -0.5 }}>
          {episode.title}
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.8, fontWeight: 600, margin: '0 0 24px' }}>
          {episode.summary}
        </p>

        {/* Player — one youtube-nocookie iframe, 9:16, no autoplay */}
        {videoId ? (
          <div
            style={{
              maxWidth: 360,
              margin: '0 auto 24px',
              aspectRatio: '9 / 16',
              borderRadius: 20,
              overflow: 'hidden',
              background: '#000',
              boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            }}
          >
            <iframe
              key={videoId}
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={`${episode.title} — ${LANGS.find((l) => l.code === lang)?.name ?? ''}`}
              style={{ width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <div
            style={{
              maxWidth: 360,
              margin: '0 auto 24px',
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
            <div style={{ fontSize: 40 }}>🎬</div>
            <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.5 }}>
              Episode {episode.ep} is being prepared
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1', lineHeight: 1.7 }}>
              Videos appear here as each language is ready. Leave your email below and we will tell you when
              the next episode drops.
            </div>
          </div>
        )}

        {/* Language selector */}
        <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 12px' }}>🌐 Language</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {LANGS.map((l) => {
            const ready = Boolean(episode.videos[l.code]);
            const active = lang === l.code && ready;
            return (
              <button
                key={l.code}
                disabled={!ready}
                onClick={() => setLang(l.code)}
                style={{
                  border: active ? '2px solid #6366F1' : '1.5px solid #E2E8F0',
                  background: active ? '#EEF2FF' : ready ? '#fff' : '#F1F5F9',
                  color: ready ? '#0F172A' : '#94A3B8',
                  borderRadius: 99,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: ready ? 'pointer' : 'not-allowed',
                  fontFamily: FONT,
                }}
              >
                {l.native} {!ready && '· 준비 중'}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, margin: '0 0 32px' }}>
          {available.length} of 13 languages ready — more appear as each version is uploaded.
        </p>

        {/* A/B vote — client-side only */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px 26px', border: '1.5px solid #F1F5F9', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 6px' }}>🗳️ {episode.voteQuestion}</h2>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '0 0 16px' }}>
            Tap your choice — it is saved on this device.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => castVote('A')}
              style={{
                flex: 1,
                minWidth: 160,
                border: vote === 'A' ? '2px solid #059669' : '1.5px solid #E2E8F0',
                background: vote === 'A' ? '#ECFDF5' : '#fff',
                borderRadius: 14,
                padding: '14px 16px',
                fontSize: 15,
                fontWeight: 900,
                color: '#0F172A',
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              A · {episode.choiceA}
            </button>
            <button
              onClick={() => castVote('B')}
              style={{
                flex: 1,
                minWidth: 160,
                border: vote === 'B' ? '2px solid #0284C7' : '1.5px solid #E2E8F0',
                background: vote === 'B' ? '#F0F9FF' : '#fff',
                borderRadius: 14,
                padding: '14px 16px',
                fontSize: 15,
                fontWeight: 900,
                color: '#0F172A',
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              B · {episode.choiceB}
            </button>
          </div>
          {vote && (
            <p style={{ fontSize: 13, color: '#059669', fontWeight: 800, margin: '14px 0 0' }}>
              ✓ You voted {vote === 'A' ? episode.choiceA : episode.choiceB} — thanks!
            </p>
          )}
          <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, margin: '16px 0 0' }}>
            Join the vote in the comments too:{' '}
            <a href="https://www.tiktok.com/@muntakasia" target="_blank" rel="noreferrer" style={{ color: '#6366F1', fontWeight: 800 }}>
              TikTok @muntakasia
            </a>
            {' · '}
            <a href="https://www.instagram.com/muntalk.global/" target="_blank" rel="noreferrer" style={{ color: '#6366F1', fontWeight: 800 }}>
              Instagram @muntalk.global
            </a>
          </p>
        </div>

        {/* Notify form */}
        <div style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 20, padding: '24px 26px', marginBottom: 24, color: '#fff' }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 6px' }}>🔔 Get the next episode a day early</h2>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 16px', lineHeight: 1.7 }}>
            New episodes drop here first, a day before anywhere else. One email per episode, no spam.
          </p>
          {notifyStatus === 'done' ? (
            <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
              ✓ You are on the list — we will email you when the next episode drops.
            </p>
          ) : notifyStatus === 'soon' ? (
            <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
              🔔 Notifications open soon — the list opens once the site update is ready (Nov 8). Please come
              back then and we will save your email.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-label="Email for next-episode notifications"
                  style={{
                    flex: 1,
                    minWidth: 200,
                    borderRadius: 12,
                    border: 'none',
                    padding: '12px 16px',
                    fontSize: 14,
                    fontFamily: FONT,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={submitNotify}
                  disabled={notifyStatus === 'loading'}
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
                  {notifyStatus === 'loading' ? 'Saving…' : 'Notify me'}
                </button>
              </div>
              {notifyStatus === 'invalid' && (
                <p style={{ fontSize: 12, fontWeight: 700, margin: '10px 0 0', color: '#FECACA' }}>
                  Please enter a valid email address.
                </p>
              )}
            </>
          )}
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
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>🎤 Practice pronunciation on MunTalk</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1', lineHeight: 1.6 }}>
            Mia learned it in the story — now say it yourself. Free 3-minute AI chat, no sign-up.
          </div>
        </a>

        {/* Prev / next */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {prevEp ? (
            <a
              href={`/watch/${prevEp.slug}`}
              style={{
                flex: 1,
                minWidth: 160,
                background: '#fff',
                border: '1.5px solid #F1F5F9',
                borderRadius: 16,
                padding: '16px 18px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8' }}>← PREVIOUS</div>
              <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4 }}>
                Episode {prevEp.ep} — {prevEp.title}
              </div>
            </a>
          ) : (
            <div style={{ flex: 1, minWidth: 160 }} />
          )}
          {nextEp ? (
            <a
              href={`/watch/${nextEp.slug}`}
              style={{
                flex: 1,
                minWidth: 160,
                background: '#fff',
                border: '1.5px solid #F1F5F9',
                borderRadius: 16,
                padding: '16px 18px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8' }}>NEXT →</div>
              <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4 }}>
                Episode {nextEp.ep} — {nextEp.title}
              </div>
            </a>
          ) : (
            <div
              style={{
                flex: 1,
                minWidth: 160,
                background: '#F1F5F9',
                borderRadius: 16,
                padding: '16px 18px',
                color: '#94A3B8',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800 }}>NEXT →</div>
              <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4 }}>Episode {episode.ep + 1} — coming soon</div>
            </div>
          )}
        </div>
      </div>

      <WatchFooter />
    </div>
  );
}
