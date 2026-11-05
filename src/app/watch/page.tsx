import type { Metadata } from 'next';
import { EPISODES, availableLangs } from '@/data/text-adventure-episodes';

export const metadata: Metadata = {
  title: 'Text Adventure — Watch Mia’s Story — MunTalk',
  description:
    'A 35-second AI-generated story in 13 languages. Mia’s café choice, the morning after, and what happens next — new episodes first on muntalk.com.',
  alternates: { canonical: '/watch' },
};

const FONT =
  "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";

export default function WatchIndexPage() {
  const sorted = [...EPISODES].sort((a, b) => b.ep - a.ep);
  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', fontFamily: FONT, color: '#0F172A' }}>
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
          Mia’s story, one choice at a time.
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.8, fontWeight: 600, margin: '0 0 32px' }}>
          A 35-second story in 13 languages. You pick what Mia does — and the next episode shows what
          happened. New episodes drop here first, a day before anywhere else.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sorted.map((ep) => {
            const ready = availableLangs(ep).length;
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
                <div style={{ fontSize: 11, fontWeight: 800, color: '#6366F1', letterSpacing: 1 }}>
                  EPISODE {ep.ep} · {ready === 0 ? 'COMING SOON' : `${ready} OF 13 LANGUAGES READY`}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.4, margin: '6px 0 4px' }}>{ep.title}</div>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, lineHeight: 1.6 }}>{ep.summary}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#6366F1', marginTop: 10 }}>
                  Watch episode {ep.ep} →
                </div>
              </a>
            );
          })}
        </div>

        <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: '32px 0 0', textAlign: 'center' }}>
          Text Adventure is an AI-generated fictional story. Built by Jay, an independent developer.
        </p>
      </div>

      <footer style={{ textAlign: 'center', padding: 28, color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff', marginTop: 48 }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <a href="/" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>🏠 Home</a>
          <a href="/watch" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>📺 Watch</a>
          <a href="/about" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>About</a>
          <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💎 Pricing</a>
          <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💬 Help &amp; FAQ</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>&copy; {new Date().getFullYear()} MunTalk. All rights reserved.</div>
      </footer>
    </div>
  );
}
