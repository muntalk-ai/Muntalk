import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie — Muntuz',
  description:
    'A short summary of how Muntuz uses cookies. The full Cookie Policy lives at /cookies.',
};

const COOKIES = [
  ['Firebase Auth Token', 'Keeps you logged in', 'Essential'],
  ['Language choices', 'Remembers your learning and native languages', 'Functional'],
  ['Progress (offline)', 'Stores your progress on your device', 'Functional'],
  ['Firebase Analytics', 'Anonymous usage analytics', 'Analytics'],
  ['Stripe Session', 'Enables secure payment processing', 'Essential'],
] as const;

export default function CookiePage() {
  const s = styles;
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <a href="/" style={s.back}>← Back</a>
        <span style={s.navTitle}>Muntuz</span>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>Cookies</h1>
        <p style={s.meta}>Short summary &middot; Full policy: <a href="/cookies" style={s.link}>Cookie Policy</a></p>

        <p style={s.lead}>
          Muntuz uses cookies and similar technologies (such as your browser&apos;s local storage)
          to keep you logged in, remember your language choices and progress, process payments
          securely, and understand — anonymously — how the service is used.
        </p>

        <h2 style={s.h2}>What we store</h2>
        <div style={s.table}>
          <div style={s.tableHeader}>
            <span style={{ flex: 2 }}>Cookie / Storage</span>
            <span style={{ flex: 2 }}>Purpose</span>
            <span style={{ flex: 1 }}>Type</span>
          </div>
          {COOKIES.map(([name, purpose, type]) => (
            <div key={name} style={s.tableRow}>
              <span style={{ flex: 2, fontWeight: 700, color: '#334155' }}>{name}</span>
              <span style={{ flex: 2, color: '#475569' }}>{purpose}</span>
              <span style={{ flex: 1 }}>
                <span style={{
                  ...s.badge,
                  background: type === 'Essential' ? '#EFF6FF' : type === 'Analytics' ? '#FFF7ED' : '#F0FDF4',
                  color: type === 'Essential' ? '#2563EB' : type === 'Analytics' ? '#D97706' : '#059669',
                }}>{type}</span>
              </span>
            </div>
          ))}
        </div>

        <h2 style={s.h2}>Essential cookies</h2>
        <p style={s.p}>Essential cookies are required for the service to function. These cannot be disabled without affecting core functionality such as login and payment processing.</p>

        <h2 style={s.h2}>Managing cookies</h2>
        <p style={s.p}>You can control cookies through your browser settings. Note that disabling cookies may affect the functionality of Muntuz, including your ability to stay logged in. You can also opt out of Firebase Analytics by enabling &quot;Do Not Track&quot; in your browser settings.</p>

        <h2 style={s.h2}>Third parties</h2>
        <p style={s.p}>Our third-party services may set their own cookies: Google / Firebase (authentication and analytics) and Stripe (payment security and fraud prevention).</p>

        <div style={s.full}>
          <div style={s.fullTitle}>Looking for the full policy?</div>
          <p style={s.p}>This page is a short summary. The complete Cookie Policy — including every cookie we use — is here:</p>
          <a href="/cookies" style={s.button}>Read the full Cookie Policy</a>
        </div>

        <h2 style={s.h2}>Contact us</h2>
        <p style={s.p}>For questions about our use of cookies, email us at{' '}
          <a href="mailto:muntuz.official@gmail.com" style={s.link}>muntuz.official@gmail.com</a>.
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
  meta: { fontSize: 13, color: '#94A3B8', marginBottom: 32, fontWeight: 600 },
  lead: { fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 32, padding: '20px 24px', background: '#FDF4FF', borderRadius: 16, borderLeft: '4px solid #A855F7' },
  h2: { fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 40, marginBottom: 12 },
  p: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 12 },
  link: { color: '#6366F1', fontWeight: 700 },
  table: { background: '#fff', borderRadius: 16, border: '1px solid #E9ECEF', overflow: 'hidden', marginBottom: 24 },
  tableHeader: { display: 'flex', padding: '12px 16px', background: '#F8FAFC', fontWeight: 800, fontSize: 12, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.5px', borderBottom: '1px solid #E9ECEF' },
  tableRow: { display: 'flex', padding: '12px 16px', borderBottom: '1px solid #F1F5F9', fontSize: 13, alignItems: 'center' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 },
  full: { marginTop: 40, background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', border: '1px solid #C7D2FE' },
  fullTitle: { fontSize: 18, fontWeight: 900, color: '#1E1B4B', marginBottom: 6 },
  button: { display: 'inline-block', padding: '12px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 900, fontSize: 15, textDecoration: 'none', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif", boxShadow: '0 4px 16px rgba(99,102,241,0.3)' },
  footer: { background: '#fff', borderTop: '1px solid #E9ECEF', padding: '24px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13 },
  footLink: { color: '#6366F1', fontWeight: 700, textDecoration: 'none' },
};
