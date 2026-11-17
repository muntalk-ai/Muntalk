import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rooms — Muntuz',
  description:
    'AI Rooms are open now — chat with your AI partners. People Rooms, for real people matched by language and level, are coming soon.',
};

export default function RoomsPage() {
  const s = styles;
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <a href="/" style={s.back}>← Back</a>
        <span style={s.navTitle}>Muntuz</span>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>Rooms</h1>
        <p style={s.lead}>
          Two kinds of rooms: AI Rooms, where you chat with your AI partners — open now —
          and People Rooms, where you meet real people to practise with — coming soon.
        </p>

        <div style={s.card}>
          <span style={s.badgeOpen}>Open now</span>
          <h2 style={s.h2}>AI Rooms</h2>
          <p style={s.p}>
            Your AI partners live here. Pick a friend, pick a language, and start chatting —
            by text or by voice. Each partner remembers your conversations and asks about
            your life first, like a real friend would.
          </p>
          <p style={s.p}>
            You can start as a guest: your first 5 minutes are free, then sign in to keep going.
          </p>
          <a href="/exchange" style={s.button}>Open AI Rooms</a>
        </div>

        <div style={{ ...s.card, background: '#0A5C4B', borderColor: '#0A5C4B' }}>
          <span style={s.badgeSoon}>Coming soon</span>
          <h2 style={{ ...s.h2, color: '#F4FBF7' }}>People Rooms</h2>
          <p style={{ ...s.p, color: '#D9EDE6' }}>
            Real people, matched by native language, learning language and level — the way
            language exchange should work. You pick your native language, the languages you
            speak fluently, and the one you are learning, and we match you with people who
            want the opposite.
          </p>
          <p style={{ ...s.p, color: '#D9EDE6' }}>
            People Rooms are not open yet, and the waitlist is not taking emails yet either.
            Please check back at launch — we will save you a seat.
          </p>
        </div>

        <p style={s.note}>
          Meet the friends first? See <a href="/partners" style={s.link}>Partners</a> or{' '}
          <a href="/how-it-works" style={s.link}>How it works</a>.
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
  card: { background: '#fff', borderRadius: 16, border: '1px solid #E9ECEF', padding: '28px 24px', marginBottom: 16 },
  badgeOpen: { display: 'inline-block', borderRadius: 99, background: '#F0FDF4', color: '#059669', fontSize: 11, fontWeight: 800, padding: '4px 12px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  badgeSoon: { display: 'inline-block', borderRadius: 99, background: '#FFC53D', color: '#4A3500', fontSize: 11, fontWeight: 800, padding: '4px 12px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  h2: { fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 12, marginBottom: 8 },
  p: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 12 },
  button: { display: 'inline-block', marginTop: 8, padding: '12px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 900, fontSize: 15, textDecoration: 'none', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif", boxShadow: '0 4px 16px rgba(99,102,241,0.3)' },
  note: { fontSize: 13, color: '#94A3B8', fontWeight: 600, marginTop: 32, textAlign: 'center' },
  link: { color: '#6366F1', fontWeight: 700 },
  footer: { background: '#fff', borderTop: '1px solid #E9ECEF', padding: '24px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13 },
  footLink: { color: '#6366F1', fontWeight: 700, textDecoration: 'none' },
};
