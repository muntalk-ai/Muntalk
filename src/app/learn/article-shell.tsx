import type { ReactNode } from 'react';

// Shared shell for /learn SEO article pages. Server component so the
// article body is rendered into HTML for search crawlers.
// Pattern follows src/app/about/page.tsx (inline styles, maxWidth 720,
// white cards on #F8F9FA, violet gradient CTA).

const FONT =
  "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";

export function Card({ children }: { children: ReactNode }) {
  return (
    <section
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: '26px 28px',
        border: '1.5px solid #F1F5F9',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 12px', letterSpacing: -0.3 }}>
      {children}
    </h2>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.85, margin: '0 0 12px', fontWeight: 600 }}>
      {children}
    </p>
  );
}

export function Quote({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: 17,
        fontWeight: 900,
        color: '#0F172A',
        background: '#F8FAFC',
        borderLeft: '4px solid #6366F1',
        borderRadius: '0 12px 12px 0',
        padding: '14px 18px',
        lineHeight: 1.6,
        margin: '0 0 12px',
      }}
    >
      {children}
    </p>
  );
}

export function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ fontSize: 15, color: '#475569', lineHeight: 1.85, fontWeight: 600, margin: '0 0 12px', paddingLeft: 20 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 6 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

interface ArticleShellProps {
  lang: 'ko' | 'en';
  kicker: string;
  title: string;
  practice: string;
  videoHref?: string;
  children: ReactNode;
}

export default function ArticleShell({ lang, kicker, title, practice, videoHref, children }: ArticleShellProps) {
  const ko = lang === 'ko';
  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', fontFamily: FONT, color: '#0F172A' }}>
      {/* Nav */}
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
          <div
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg,#38BDF8,#818CF8)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            🌐
          </div>
          <span style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-0.5px' }}>MunTalk</span>
          <span style={{ background: '#EFF6FF', color: '#0284C7', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
            BETA
          </span>
        </a>
        <a
          href="/learn"
          style={{ color: '#6366F1', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}
        >
          {ko ? '✚ 전체 목록' : '✚ All articles'}
        </a>
      </div>

      {/* Hero */}
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
          {kicker}
        </div>
        <h1 style={{ fontSize: 'clamp(26px,4.5vw,38px)', fontWeight: 900, lineHeight: 1.3, margin: '0 0 24px', letterSpacing: -0.5 }}>
          {title}
        </h1>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}

        {/* Practice CTA */}
        <section
          style={{
            background: 'linear-gradient(135deg,#0F172A,#1E1B4B)',
            borderRadius: 24,
            padding: '32px 28px',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2, color: '#A5B4FC', marginBottom: 12 }}>
            {ko ? '🎤 발음 연습' : '🎤 PRACTICE IT'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>{practice}</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontWeight: 600, margin: '0 0 20px' }}>
            {ko
              ? '이 문장을 직접 말하고 발음 점수를 받아보세요. muntalk에서 무료로 발음 체크가 가능합니다.'
              : 'Say this sentence out loud and get a pronunciation score. You can check your pronunciation free on MunTalk.'}
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              borderRadius: 14,
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              color: '#fff',
              fontWeight: 900,
              fontSize: 14,
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
            }}
          >
            {ko ? '무료로 발음 체크하기 🚀' : 'Check your pronunciation free 🚀'}
          </a>
        </section>

        {/* Video */}
        <section
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '22px 28px',
            border: '1.5px solid #F1F5F9',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>📺 {ko ? '관련 영상' : 'Watch the video'}</div>
          {videoHref ? (
            <a href={videoHref} style={{ color: '#6366F1', fontWeight: 700, fontSize: 14, wordBreak: 'break-all' }}>
              {videoHref}
            </a>
          ) : (
            <p style={{ fontSize: 14, color: '#64748B', fontWeight: 600, margin: 0, lineHeight: 1.7 }}>
              {ko
                ? '관련 쇼츠 영상은 출고 후 이 자리에 연결됩니다.'
                : 'The companion Short will be linked here after release.'}
            </p>
          )}
        </section>

        {/* Developer note */}
        <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
          {ko
            ? '이 글은 muntalk 개발자가 직접 작성했습니다. 영상은 AI로 제작된 오리지널 캐릭터 이야기입니다.'
            : 'Written by the developer of muntalk. The video features an original AI-generated character story.'}
        </p>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: 28, color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <a href="/" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>🏠 Home</a>
          <a href="/learn" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>📚 Learn</a>
          <a href="/about" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>About</a>
          <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💎 Pricing</a>
          <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💬 Help &amp; FAQ</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>&copy; {new Date().getFullYear()} MunTalk. All rights reserved.</div>
      </footer>
    </div>
  );
}
