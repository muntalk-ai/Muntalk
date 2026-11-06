'use client';

// Shared chrome + early-access UI for the /watch hub (both series).
// The header/footer used to be duplicated in episode-client.tsx and
// konglish-client.tsx; the hub renders them once here instead.

import { useEffect, useState, type ReactNode } from 'react';

export const FONT =
  "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";

// Ticking clock so episodes flip free on their own (re-check every minute).
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function WatchHeader({ active }: { active?: 'watch' | 'konglish' }) {
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
        <a
          href="/watch"
          style={{ color: '#0F172A', fontWeight: 800, fontSize: 13, textDecoration: active === 'watch' ? 'underline' : 'none' }}
        >
          📺 Watch
        </a>
        <a
          href="/watch?tab=konglish"
          style={{ color: '#0F172A', fontWeight: 800, fontSize: 13, textDecoration: active === 'konglish' ? 'underline' : 'none' }}
        >
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

export function WatchFooter({ note }: { note?: string }) {
  return (
    <footer style={{ textAlign: 'center', padding: 28, color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff', marginTop: 48 }}>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <a href="/" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>🏠 Home</a>
        <a href="/watch" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>📺 Watch</a>
        <a href="/watch?tab=konglish" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>🚑 Konglish</a>
        <a href="/about" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>About</a>
        <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💎 Pricing</a>
        <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💬 Help &amp; FAQ</a>
      </div>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
        {note ?? 'Text Adventure is an AI-generated fictional story. Built by Jay, an independent developer.'}
      </div>
      <div style={{ fontSize: 11, color: '#CBD5E1' }}>&copy; {new Date().getFullYear()} MunTalk. All rights reserved.</div>
    </footer>
  );
}

// Members-only early-access lock card (shared by both series).
// `loginNext` is the path to return to after sign-in (e.g. /watch/ep-02
// or /watch?tab=konglish) — it is URL-encoded into /login?next=.
export function LockCard({
  title,
  line,
  loginNext,
  accent = 'red',
  showButton = true,
}: {
  title: string;
  line: ReactNode;
  loginNext: string;
  accent?: 'red' | 'indigo';
  showButton?: boolean;
}) {
  const bg =
    accent === 'red'
      ? 'linear-gradient(135deg,#DC2626,#F97316)'
      : 'linear-gradient(135deg,#4F46E5,#7C3AED)';
  return (
    <div
      style={{
        background: bg,
        borderRadius: 20,
        padding: '24px 26px',
        marginBottom: 24,
        color: '#fff',
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 6px' }}>🔒 {title}</h2>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '0 0 16px', lineHeight: 1.7 }}>
        {line}
      </p>
      {showButton && (
        <a
          href={`/login?next=${encodeURIComponent(loginNext)}`}
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
      )}
    </div>
  );
}
