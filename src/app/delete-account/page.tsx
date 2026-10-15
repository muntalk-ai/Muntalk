'use client';
import { useRouter } from 'next/navigation';

export default function DeleteAccountPage() {
  const router = useRouter();
  const s = styles;
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button onClick={() => router.back()} style={s.back}>← Back</button>
        <span style={s.navTitle}>MunTalk</span>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>Delete Your Account &amp; Data</h1>
        <p style={s.meta}>Last Updated: October 14, 2026</p>

        <p style={s.lead}>
          You can delete your MunTalk account and all associated personal data at any time.
          Once deleted, your account cannot be recovered.
        </p>

        <h2 style={s.h2}>How to delete your account</h2>
        <ol style={s.ul}>
          <li style={s.li}>Sign in to <a href="https://www.muntalk.com" style={s.link}>muntalk.com</a></li>
          <li style={s.li}>Open your Profile page</li>
          <li style={s.li}>Tap <strong>&quot;Delete My Account&quot;</strong> and confirm</li>
        </ol>
        <p style={s.p}>
          This permanently deletes your account, profile, learning history, XP, streak data,
          and all personal information we hold about you. Deletion is processed immediately
          in our systems; residual backups are purged within 30 days.
        </p>

        <h2 style={s.h2}>Request deletion by email</h2>
        <p style={s.p}>
          If you cannot access your account, email us at{' '}
          <a href="mailto:muntalkofficial@gmail.com" style={s.link}>muntalkofficial@gmail.com</a>{' '}
          from the email address linked to your account with the subject
          &quot;Delete my account&quot;. We will verify your identity and process your
          request within 30 days, as described in our{' '}
          <a href="/privacy" style={s.link}>Privacy Policy</a>.
        </p>

        <h2 style={s.h2}>What gets deleted</h2>
        <ul style={s.ul}>
          <li style={s.li}>Account information (name, email address, profile photo)</li>
          <li style={s.li}>Learning activity (lessons completed, XP, streaks, language preferences)</li>
          <li style={s.li}>Any data linked to your account in our databases</li>
        </ul>
        <p style={s.p}>
          Payment records processed by Stripe are retained as required by law for
          financial record-keeping; they are not linked to an identifiable account
          after deletion.
        </p>
      </div>
      <footer style={s.footer}>
        <a href="/privacy" style={s.footLink}>Privacy Policy</a>
        <a href="/terms" style={s.footLink}>Terms of Service</a>
        <a href="/" style={s.footLink}>Home</a>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' },
  nav: { background: '#fff', borderBottom: '1px solid #E9ECEF', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky' as const, top: 0, zIndex: 10 },
  back: { background: 'none', border: 'none', color: '#6366F1', fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  navTitle: { fontWeight: 900, fontSize: 18, color: '#0F172A' },
  container: { maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' },
  h1: { fontSize: 32, fontWeight: 900, color: '#0F172A', marginBottom: 8 },
  meta: { fontSize: 13, color: '#94A3B8', marginBottom: 32, fontWeight: 600 },
  lead: { fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 32, padding: '20px 24px', background: '#FEF2F2', borderRadius: 16, borderLeft: '4px solid #EF4444' },
  h2: { fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 40, marginBottom: 12 },
  p: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 12 },
  ul: { paddingLeft: 20, marginBottom: 16 },
  li: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 6 },
  link: { color: '#6366F1', fontWeight: 700 },
  footer: { background: '#fff', borderTop: '1px solid #E9ECEF', padding: '24px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' as const, fontSize: 13 },
  footLink: { color: '#6366F1', fontWeight: 700, textDecoration: 'none' },
};
