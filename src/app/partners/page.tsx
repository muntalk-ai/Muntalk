import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partners — Muntuz',
  description:
    'Meet the 50 AI partners of Muntuz — starting with the five house friends: Emily, Jiyoung, Chloe, Sofia and Amara.',
};

const HOUSE_FRIENDS = [
  {
    id: 'emily',
    name: 'Emily',
    avatar: '/muntuz-avatars/emily.jpg',
    pers: 'Warm, curious, first to laugh',
    hobby: 'Alley-café hunting, journaling, late-night tea',
    places: 'That tiny alley café · her sunny balcony',
  },
  {
    id: 'jiyoung',
    name: 'Jiyoung',
    avatar: '/muntuz-avatars/jiyoung.jpg',
    pers: 'Bright, encouraging, a little mischievous',
    hobby: 'Kimbap experiments, K-dramas, weekend markets',
    places: 'Her kitchen · the market by the river',
  },
  {
    id: 'chloe',
    name: 'Chloe',
    avatar: '/muntuz-avatars/chloe.jpg',
    pers: 'Witty, thoughtful, quietly poetic',
    hobby: 'Songwriting, French films, slow coffee',
    places: 'The corner café · old bookshops',
  },
  {
    id: 'sofia',
    name: 'Sofia',
    avatar: '/muntuz-avatars/sofia.jpg',
    pers: 'Sunny, expressive, feeds everyone',
    hobby: 'Pasta from scratch, salsa nights, farmers’ markets',
    places: 'Her kitchen · the dance studio',
  },
  {
    id: 'amara',
    name: 'Amara',
    avatar: '/muntuz-avatars/amara.jpg',
    pers: 'Calm, steady, dry sense of humor',
    hobby: 'Sunrise runs, sketching, stargazing',
    places: 'The river path · the hill at dawn',
  },
];

export default function PartnersPage() {
  const s = styles;
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <a href="/" style={s.back}>← Back</a>
        <span style={s.navTitle}>Muntuz</span>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>Partners</h1>
        <p style={s.lead}>
          Five friends, five personalities — all of them speak every language.
          Muntuz has 50 AI partners in total. Start with the five house friends below;
          meet all 50 partners in /exchange.
        </p>

        <h2 style={s.h2}>The five house friends</h2>
        <div style={s.grid}>
          {HOUSE_FRIENDS.map((f) => (
            <div key={f.id} style={s.card}>
              <img src={f.avatar} alt={f.name} style={s.avatar} />
              <div style={s.name}>{f.name}</div>
              <div style={s.multi}>Multilingual · speaks every language</div>
              <div style={s.row}>
                <span style={s.label}>Personality</span>
                <span style={s.value}>{f.pers}</span>
              </div>
              <div style={s.row}>
                <span style={s.label}>Hobbies</span>
                <span style={s.value}>{f.hobby}</span>
              </div>
              <div style={s.row}>
                <span style={s.label}>Often at</span>
                <span style={s.value}>{f.places}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={s.more}>
          <div style={s.moreTitle}>45 more AI friends</div>
          <p style={s.p}>
            The other 45 partners are already waiting in /exchange — meet all 50 there.
            Every partner is an AI friend: always patient, never judgmental, and ready to chat
            whenever you are.
          </p>
        </div>

        <div style={s.cta}>
          <div style={s.ctaTitle}>Pick a friend, say hi.</div>
          <a href="/exchange" style={s.ctaButton}>Start chatting</a>
        </div>

        <p style={s.note}>
          Curious how it works? See <a href="/how-it-works" style={s.link}>How it works</a> or{' '}
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
  lead: { fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 32, padding: '20px 24px', background: '#FDF4FF', borderRadius: 16, borderLeft: '4px solid #A855F7' },
  h2: { fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 8, marginBottom: 16 },
  grid: { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' },
  card: { background: '#fff', borderRadius: 16, border: '1px solid #E9ECEF', padding: '24px' },
  avatar: { width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 },
  name: { fontSize: 21, fontWeight: 900, color: '#0F172A' },
  multi: { fontSize: 12, fontWeight: 800, color: '#0A5C4B', marginBottom: 12 },
  row: { marginBottom: 8 },
  label: { display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#94A3B8' },
  value: { fontSize: 14, fontWeight: 600, color: '#475569', lineHeight: 1.6 },
  more: { background: '#fff', borderRadius: 16, border: '1px solid #E9ECEF', padding: '24px', marginTop: 16 },
  moreTitle: { fontSize: 16, fontWeight: 900, color: '#0F172A', marginBottom: 8 },
  p: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 0 },
  cta: { marginTop: 40, background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', border: '1px solid #C7D2FE' },
  ctaTitle: { fontSize: 18, fontWeight: 900, color: '#1E1B4B', marginBottom: 16 },
  ctaButton: { display: 'inline-block', padding: '12px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 900, fontSize: 15, textDecoration: 'none', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif", boxShadow: '0 4px 16px rgba(99,102,241,0.3)' },
  note: { fontSize: 13, color: '#94A3B8', fontWeight: 600, marginTop: 32, textAlign: 'center' },
  link: { color: '#6366F1', fontWeight: 700 },
  footer: { background: '#fff', borderTop: '1px solid #E9ECEF', padding: '24px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13 },
  footLink: { color: '#6366F1', fontWeight: 700, textDecoration: 'none' },
};
