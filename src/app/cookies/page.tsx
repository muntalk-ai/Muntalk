'use client';
import { useRouter } from 'next/navigation';

export default function CookiesPage() {
  const router = useRouter();
  const s = styles;
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button onClick={() => router.back()} style={s.back}>← Back</button>
        <span style={s.navTitle}>MunTalk</span>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>Cookie Policy</h1>
        <p style={s.meta}>Effective Date: March 1, 2025 &middot; Last Updated: March 12, 2026</p>

        <p style={s.lead}>
          This Cookie Policy explains how MunTalk uses cookies and similar tracking technologies
          when you visit our website at <strong>www.muntalk.com</strong>.
        </p>

        <h2 style={s.h2}>1. What Are Cookies?</h2>
        <p style={s.p}>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience. Similar technologies include local storage, session storage, and device fingerprinting.</p>

        <h2 style={s.h2}>2. Types of Cookies We Use</h2>

        <div style={s.table}>
          <div style={s.tableHeader}>
            <span style={{ flex: 2 }}>Cookie / Storage</span>
            <span style={{ flex: 2 }}>Purpose</span>
            <span style={{ flex: 1 }}>Type</span>
          </div>
          {[
            ['Firebase Auth Token', 'Keeps you logged in', 'Essential'],
            ['mt_learn_lang', 'Remembers your learning language', 'Functional'],
            ['mt_native_lang', 'Remembers your native language', 'Functional'],
            ['mt_tutor_id', 'Remembers your preferred AI tutor', 'Functional'],
            ['mt_placement_done', 'Tracks placement test completion', 'Functional'],
            ['mt_xp / mt_done', 'Stores your offline progress', 'Functional'],
            ['Firebase Analytics', 'Anonymous usage analytics', 'Analytics'],
            ['Stripe Session', 'Enables secure payment processing', 'Essential'],
          ].map(([name, purpose, type]) => (
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

        <h2 style={s.h2}>3. Essential Cookies</h2>
        <p style={s.p}>Essential cookies are required for the service to function. These cannot be disabled without affecting core functionality such as login and payment processing.</p>

        <h2 style={s.h2}>4. Functional Cookies</h2>
        <p style={s.p}>Functional cookies remember your preferences (language choice, tutor selection, progress) to personalize your experience. These are stored in your browser&apos;s local storage.</p>

        <h2 style={s.h2}>5. Analytics</h2>
        <p style={s.p}>We use Firebase Analytics to understand how users interact with MunTalk. This data is aggregated and anonymous. You can opt out of Firebase Analytics by enabling &quot;Do Not Track&quot; in your browser settings.</p>

        <h2 style={s.h2}>6. Third-Party Cookies</h2>
        <p style={s.p}>Our third-party services may set their own cookies:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>Google / Firebase</strong> - Authentication and analytics</li>
          <li style={s.li}><strong>Stripe</strong> - Payment security and fraud prevention</li>
        </ul>

        <h2 style={s.h2}>7. Managing Cookies</h2>
        <p style={s.p}>You can control cookies through your browser settings. Note that disabling cookies may affect the functionality of MunTalk, including your ability to stay logged in. To clear MunTalk local storage data, you can use your browser&apos;s developer tools or clear your browsing data.</p>

        <h2 style={s.h2}>8. Contact Us</h2>
        <p style={s.p}>For questions about our use of cookies:<br />
          <strong>MunTalk</strong><br />
          British Columbia, Canada<br />
          Email: <a href="mailto:muntalkofficial@gmail.com" style={s.link}>muntalkofficial@gmail.com</a>
        </p>
      </div>
      <footer style={s.footer}>
        <a href="/privacy" style={s.footLink}>Privacy Policy</a>
        <a href="/terms" style={s.footLink}>Terms of Service</a>
        <a href="/refund" style={s.footLink}>Refund Policy</a>
        <span style={{ color: '#CBD5E1' }}>&copy; 2025 MunTalk. All rights reserved.</span>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito', sans-serif" },
  nav: { background: '#fff', borderBottom: '1px solid #E9ECEF', height: 60, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 100 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#6366F1', fontFamily: "'Nunito', sans-serif" },
  navTitle: { fontWeight: 900, fontSize: 18, color: '#0F172A' },
  container: { maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' },
  h1: { fontSize: 32, fontWeight: 900, color: '#0F172A', marginBottom: 8 },
  meta: { fontSize: 13, color: '#94A3B8', marginBottom: 32, fontWeight: 600 },
  lead: { fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 32, padding: '20px 24px', background: '#FDF4FF', borderRadius: 16, borderLeft: '4px solid #A855F7' },
  h2: { fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 40, marginBottom: 12 },
  p: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 12 },
  ul: { paddingLeft: 20, marginBottom: 16 },
  li: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 6 },
  link: { color: '#6366F1', fontWeight: 700 },
  table: { background: '#fff', borderRadius: 16, border: '1px solid #E9ECEF', overflow: 'hidden', marginBottom: 24 },
  tableHeader: { display: 'flex', padding: '12px 16px', background: '#F8FAFC', fontWeight: 800, fontSize: 12, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.5px', borderBottom: '1px solid #E9ECEF' },
  tableRow: { display: 'flex', padding: '12px 16px', borderBottom: '1px solid #F1F5F9', fontSize: 13, alignItems: 'center' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 },
  footer: { background: '#fff', borderTop: '1px solid #E9ECEF', padding: '24px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13 },
  footLink: { color: '#6366F1', fontWeight: 700, textDecoration: 'none' },
};
