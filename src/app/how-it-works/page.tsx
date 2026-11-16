import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works — Muntuz',
  description:
    'Pick an AI partner, chat or call about your real day, and get corrected naturally — one gentle fix at a time.',
};

const STEPS = [
  {
    n: '1',
    title: 'Pick a partner',
    body: 'Choose a friend and a language — switch anytime, mid-conversation if you like. Every partner speaks every language, so pick by personality, not by language.',
  },
  {
    n: '2',
    title: 'Chat or call',
    body: 'Text or talk out loud about your real day: work, trips, the little stuff. You can speak with the microphone or type — both work the same way.',
  },
  {
    n: '3',
    title: 'Get corrected naturally',
    body: 'One gentle fix at a time, right inside the chat — never a red-pen lecture. Your partner offers the smallest change that makes you sound natural, the way a friend would.',
  },
];

const FEATURES = [
  {
    title: 'Voice calls',
    body: 'Hear tone, pace, breath and laughter — practice speaking, not just typing.',
  },
  {
    title: 'One-line corrections',
    body: 'The smallest fix that makes you sound natural, offered like a friend would.',
  },
  {
    title: 'Memory callbacks',
    body: 'They remember your exam, your trip, your cat — and ask about them first.',
  },
];

export default function HowItWorksPage() {
  const s = styles;
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <a href="/" style={s.back}>← Back</a>
        <span style={s.navTitle}>Muntuz</span>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>How it works</h1>
        <p style={s.lead}>
          Practice any language with AI friends who feel real. No lessons to grind through,
          no quizzes — just conversation with a friend who gently helps you sound more natural.
        </p>

        {STEPS.map((step) => (
          <div key={step.n} style={s.step}>
            <div style={s.stepNum}>{step.n}</div>
            <h2 style={s.h2}>{step.title}</h2>
            <p style={s.p}>{step.body}</p>
          </div>
        ))}

        <h2 style={{ ...s.h2, marginTop: 48 }}>Made to feel like a friend</h2>
        {FEATURES.map((f) => (
          <div key={f.title} style={s.feature}>
            <h3 style={s.h3}>{f.title}</h3>
            <p style={s.p}>{f.body}</p>
          </div>
        ))}

        <div style={s.cta}>
          <div style={s.ctaTitle}>Your first conversation is one tap away.</div>
          <p style={s.ctaSub}>
            Pick a language, pick a friend, say hi. You can start chatting as a guest —
            your first 5 minutes are free, then sign in to keep going.
          </p>
          <a href="/exchange" style={s.ctaButton}>Start chatting</a>
        </div>

        <p style={s.note}>
          Want to meet the friends first? See <a href="/partners" style={s.link}>Partners</a> or{' '}
          <a href="/rooms" style={s.link}>Rooms</a>.
        </p>
      </div>
      <footer style={s.footer}>
        <a href="/privacy" style={s.footLink}>Privacy Policy</a>
        <a href="/terms" style={s.footLink}>Terms of Service</a>
        <a href="/refund" style={s.footLink}>Refund Policy</a>
        <a href="/cookies" style={s.footLink}>Cookie Policy</a>
        <span style={{ color: '#CBD5E1' }}>&copy; 2026 Muntuz. All rights reserved.</span>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif" },
  nav: { background: '#fff', borderBottom: '1px solid #E9ECEF', height: 60, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 100 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#6366F1', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif", textDecoration: 'none' },
  navTitle: { fontWeight: 900, fontSize: 18, color: '#0F172A' },
  container: { maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' },
  h1: { fontSize: 32, fontWeight: 900, color: '#0F172A', marginBottom: 8 },
  lead: { fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 32, padding: '20px 24px', background: '#EFF7F2', borderRadius: 16, borderLeft: '4px solid #0A5C4B' },
  step: { background: '#fff', borderRadius: 16, border: '1px solid #E9ECEF', padding: '24px', marginBottom: 16 },
  stepNum: { fontSize: 32, fontWeight: 900, color: '#FFC53D', lineHeight: 1 },
  h2: { fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 12, marginBottom: 8 },
  h3: { fontSize: 16, fontWeight: 900, color: '#0F172A', margin: '0 0 4px' },
  p: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 0 },
  feature: { background: '#fff', borderRadius: 16, border: '1px solid #E9ECEF', padding: '20px 24px', marginBottom: 12 },
  cta: { marginTop: 40, background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', border: '1px solid #C7D2FE' },
  ctaTitle: { fontSize: 18, fontWeight: 900, color: '#1E1B4B', marginBottom: 6 },
  ctaSub: { fontSize: 14, color: '#6366F1', fontWeight: 700, marginBottom: 16, lineHeight: 1.7 },
  ctaButton: { display: 'inline-block', padding: '12px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 900, fontSize: 15, textDecoration: 'none', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif", boxShadow: '0 4px 16px rgba(99,102,241,0.3)' },
  note: { fontSize: 13, color: '#94A3B8', fontWeight: 600, marginTop: 32, textAlign: 'center' },
  link: { color: '#6366F1', fontWeight: 700 },
  footer: { background: '#fff', borderTop: '1px solid #E9ECEF', padding: '24px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13 },
  footLink: { color: '#6366F1', fontWeight: 700, textDecoration: 'none' },
};
