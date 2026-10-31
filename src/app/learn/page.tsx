import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn English from Real Mistakes — MunTalk',
  description:
    'Common English mistakes learners actually make — and the natural correction. From the Konglish ER series, written by the developer of MunTalk.',
  alternates: { canonical: '/learn' },
};

const FONT =
  "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";

const KO_ARTICLES = [
  { slug: 'im-bored-not-boring', wrong: "I'm boring", right: "I'm bored", desc: '지루하다고 말할 때 — -ed와 -ing의 차이' },
  { slug: 'i-have-plans-not-promise', wrong: 'I have a promise', right: 'I have plans', desc: '약속이 있다는 영어 — promise는 맹세' },
  { slug: 'go-for-it-not-fighting', wrong: 'Fighting!', right: 'Go for it!', desc: '응원할 때 — fighting은 싸우는 중' },
  { slug: 'cell-phone-not-hand-phone', wrong: 'hand phone', right: 'cell phone', desc: '핸드폰 영어 — hand phone은 없는 말' },
  { slug: 'on-the-house-not-service', wrong: 'service', right: "It's on the house", desc: '공짜라는 뜻 — service에는 공짜 뜻이 없음' },
  { slug: 'cheat-sheet-not-cunning-paper', wrong: 'cunning paper', right: 'cheat sheet', desc: '컨닝 페이퍼 — cunning은 교활한' },
  { slug: 'going-home-not-to-home', wrong: "I'm going to home", right: "I'm going home", desc: '집에 가요 — home 앞에는 to 없음' },
  { slug: 'im-interested-not-interesting', wrong: "I'm interesting", right: "I'm interested", desc: '관심 있어요 — -ed/-ing 2탄' },
  { slug: 'didnt-go-not-didnt-went', wrong: "I didn't went", right: "I didn't go", desc: "didn't 뒤에는 동사원형 — 과거 두 번 표시 금지" },
  { slug: 'what-time-it-is-not-is-it', wrong: 'Do you know what time is it?', right: 'Do you know what time it is?', desc: '간접의문문 — 어순은 안 바뀐다' },
  { slug: 'pronunciation-not-pronounce', wrong: 'My pronounce is bad', right: 'My pronunciation is bad', desc: '발음은 명사 pronunciation — pronounce는 동사' },
  { slug: 'there-are-many-people', wrong: 'There is many people', right: 'There are many people', desc: 'there is/are — 뒤 명사에 맞추다' },
];

const EN_ARTICLES = [
  { slug: 'same-same-vs-its-the-same', wrong: 'same same', right: "It's the same", desc: 'Tinglish — Thai-style English, not standard English' },
  { slug: 'embarazada-vs-embarrassed', wrong: 'Estoy embarazada', right: "I'm embarrassed", desc: 'Spanglish false friend — embarazada means pregnant' },
];

function ArticleList({ items }: { items: typeof KO_ARTICLES }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((a) => (
        <a
          key={a.slug}
          href={`/learn/${a.slug}`}
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
          <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.5, marginBottom: 4 }}>
            <span style={{ color: '#DC2626', textDecoration: 'line-through', textDecorationThickness: 2 }}>
              {a.wrong}
            </span>{' '}
            → <span style={{ color: '#059669' }}>{a.right}</span>
          </div>
          <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, lineHeight: 1.6 }}>{a.desc}</div>
        </a>
      ))}
    </div>
  );
}

export default function LearnIndexPage() {
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
        <a href="/signup" style={{ color: '#6366F1', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
          Start Free
        </a>
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
          📚 LEARN FROM REAL MISTAKES
        </div>
        <h1 style={{ fontSize: 'clamp(26px,4.5vw,38px)', fontWeight: 900, lineHeight: 1.3, margin: '0 0 12px', letterSpacing: -0.5 }}>
          English mistakes, corrected.
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.8, fontWeight: 600, margin: '0 0 32px' }}>
          The mistakes learners actually make — and what native speakers really say. From the Konglish ER
          series, written by the developer of MunTalk.
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 16px' }}>한국어 시리즈 — 콩글리시 응급실</h2>
        <ArticleList items={KO_ARTICLES} />

        <h2 style={{ fontSize: 20, fontWeight: 900, margin: '32px 0 16px' }}>English series — Global pilot</h2>
        <ArticleList items={EN_ARTICLES} />

        <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: '32px 0 0', textAlign: 'center' }}>
          Written by the developer of muntalk. The video features an original AI-generated character story.
        </p>
      </div>

      <footer style={{ textAlign: 'center', padding: 28, color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff', marginTop: 48 }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <a href="/" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>🏠 Home</a>
          <a href="/about" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>About</a>
          <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💎 Pricing</a>
          <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💬 Help &amp; FAQ</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>&copy; {new Date().getFullYear()} MunTalk. All rights reserved.</div>
      </footer>
    </div>
  );
}
