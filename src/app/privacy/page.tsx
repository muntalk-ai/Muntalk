'use client';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();
  const s = styles;
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button onClick={() => router.back()} style={s.back}>← Back</button>
        <span style={s.navTitle}>MunTalk</span>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.meta}>Effective Date: March 1, 2025 &middot; Last Updated: March 12, 2026</p>

        <p style={s.lead}>
          MunTalk ("we", "us", or "our") is operated by an individual based in British Columbia, Canada.
          This Privacy Policy explains how we collect, use, disclose, and protect your personal information
          in compliance with Canada&apos;s <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong>
          and British Columbia&apos;s <strong>Personal Information Protection Act (PIPA)</strong>.
        </p>

        <h2 style={s.h2}>1. Information We Collect</h2>
        <h3 style={s.h3}>Account Information</h3>
        <p style={s.p}>When you create an account, we collect your name, email address, and profile photo (via Google Sign-In).</p>
        <h3 style={s.h3}>Usage Data</h3>
        <p style={s.p}>We collect data about your learning activity including lessons completed, XP points, streak data, language preferences, and session duration.</p>
        <h3 style={s.h3}>Payment Information</h3>
        <p style={s.p}>Payments are processed by <strong>Stripe, Inc.</strong> We do not store your credit card details. Stripe&apos;s privacy policy applies to all payment transactions.</p>
        <h3 style={s.h3}>Device &amp; Technical Data</h3>
        <p style={s.p}>We may collect browser type, IP address, device type, and operating system for security and performance purposes.</p>

        <h2 style={s.h2}>2. How We Use Your Information</h2>
        <ul style={s.ul}>
          <li style={s.li}>To provide and personalize the MunTalk language learning service</li>
          <li style={s.li}>To process payments and manage your subscription</li>
          <li style={s.li}>To send service-related emails (account, billing, updates)</li>
          <li style={s.li}>To improve our AI tutoring content and features</li>
          <li style={s.li}>To comply with legal obligations</li>
        </ul>

        <h2 style={s.h2}>3. Third-Party Services</h2>
        <p style={s.p}>We use the following third-party services which may process your data:</p>
        <ul style={s.ul}>
          <li style={s.li}><strong>Google Firebase</strong> - Authentication, database, and hosting</li>
          <li style={s.li}><strong>Google Gemini AI</strong> - AI-powered language tutoring content</li>
          <li style={s.li}><strong>Stripe</strong> - Payment processing</li>
          <li style={s.li}><strong>Vercel</strong> - Web hosting and deployment</li>
          <li style={s.li}><strong>Telegram</strong> - Optional notification delivery</li>
        </ul>

        <h2 style={s.h2}>4. Data Retention</h2>
        <p style={s.p}>We retain your personal data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.</p>

        <h2 style={s.h2}>5. Your Rights (PIPEDA)</h2>
        <p style={s.p}>Under PIPEDA, you have the right to:</p>
        <ul style={s.ul}>
          <li style={s.li}>Access the personal information we hold about you</li>
          <li style={s.li}>Request correction of inaccurate information</li>
          <li style={s.li}>Withdraw consent and request deletion of your data</li>
          <li style={s.li}>File a complaint with the <strong>Office of the Privacy Commissioner of Canada</strong></li>
        </ul>
        <p style={s.p}>To exercise your rights, contact us at <strong>muntalkofficial@gmail.com</strong>.</p>

        <h2 style={s.h2}>6. Children&apos;s Privacy</h2>
        <p style={s.p}>MunTalk is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.</p>

        <h2 style={s.h2}>7. Security</h2>
        <p style={s.p}>We implement industry-standard security measures including encryption, secure HTTPS connections, and Firebase security rules to protect your data. However, no method of transmission over the Internet is 100% secure.</p>

        <h2 style={s.h2}>8. Cookies</h2>
        <p style={s.p}>We use cookies and similar technologies for authentication and analytics. See our <a href="/cookies" style={s.link}>Cookie Policy</a> for details.</p>

        <h2 style={s.h2}>9. Changes to This Policy</h2>
        <p style={s.p}>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. Continued use of the service after changes constitutes acceptance.</p>

        <h2 style={s.h2}>10. Contact Us</h2>
        <p style={s.p}>For privacy-related inquiries:<br />
          <strong>MunTalk</strong><br />
          British Columbia, Canada<br />
          Email: <a href="mailto:muntalkofficial@gmail.com" style={s.link}>muntalkofficial@gmail.com</a>
        </p>
      </div>
      <footer style={s.footer}>
        <a href="/terms" style={s.footLink}>Terms of Service</a>
        <a href="/refund" style={s.footLink}>Refund Policy</a>
        <a href="/cookies" style={s.footLink}>Cookie Policy</a>
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
  lead: { fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 32, padding: '20px 24px', background: '#EFF6FF', borderRadius: 16, borderLeft: '4px solid #6366F1' },
  h2: { fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 40, marginBottom: 12 },
  h3: { fontSize: 15, fontWeight: 800, color: '#334155', marginTop: 20, marginBottom: 6 },
  p: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 12 },
  ul: { paddingLeft: 20, marginBottom: 16 },
  li: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 6 },
  link: { color: '#6366F1', fontWeight: 700 },
  footer: { background: '#fff', borderTop: '1px solid #E9ECEF', padding: '24px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13 },
  footLink: { color: '#6366F1', fontWeight: 700, textDecoration: 'none' },
};
