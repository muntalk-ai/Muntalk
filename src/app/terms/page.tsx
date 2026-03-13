'use client';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();
  const s = styles;
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button onClick={() => router.back()} style={s.back}>← Back</button>
        <span style={s.navTitle}>MunTalk</span>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>Terms of Service</h1>
        <p style={s.meta}>Effective Date: March 1, 2025 &middot; Last Updated: March 12, 2026</p>

        <p style={s.lead}>
          Please read these Terms of Service carefully before using MunTalk. By accessing or using our service,
          you agree to be bound by these terms. If you do not agree, please do not use the service.
        </p>

        <h2 style={s.h2}>1. About MunTalk</h2>
        <p style={s.p}>MunTalk is an AI-powered language learning platform operated by an individual based in British Columbia, Canada. The service is accessible at <strong>www.muntalk.com</strong>.</p>

        <h2 style={s.h2}>2. Eligibility</h2>
        <p style={s.p}>You must be at least 13 years of age to use MunTalk. By using the service, you represent that you meet this requirement. Users between 13 and 18 must have parental or guardian consent.</p>

        <h2 style={s.h2}>3. Account Registration</h2>
        <ul style={s.ul}>
          <li style={s.li}>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li style={s.li}>You agree to provide accurate and up-to-date information.</li>
          <li style={s.li}>You are responsible for all activities that occur under your account.</li>
          <li style={s.li}>You must notify us immediately of any unauthorized use of your account.</li>
        </ul>

        <h2 style={s.h2}>4. Subscriptions &amp; Payments</h2>
        <p style={s.p}>MunTalk offers free and paid subscription plans. Paid plans are billed in advance on a monthly or annual basis via <strong>Stripe</strong>. All prices are in Canadian Dollars (CAD) unless otherwise stated.</p>
        <ul style={s.ul}>
          <li style={s.li}>Subscriptions auto-renew unless cancelled before the renewal date.</li>
          <li style={s.li}>You may cancel your subscription at any time through your account settings or by contacting us.</li>
          <li style={s.li}>Cancellation takes effect at the end of the current billing period.</li>
        </ul>

        <h2 style={s.h2}>5. Refund Policy</h2>
        <p style={s.p}>Please refer to our <a href="/refund" style={s.link}>Refund Policy</a> for full details. In summary:</p>
        <ul style={s.ul}>
          <li style={s.li}>Refunds are available within <strong>7 days</strong> of purchase if you have not used premium features.</li>
          <li style={s.li}>No refunds after 7 days or after significant use of the service.</li>
        </ul>

        <h2 style={s.h2}>6. AI-Generated Content</h2>
        <p style={s.p}>MunTalk uses Google Gemini AI to generate language learning content. While we strive for accuracy, AI-generated content may occasionally contain errors. MunTalk is not liable for inaccuracies in AI-generated lessons, translations, or tutoring responses. Always verify critical language information with qualified sources.</p>

        <h2 style={s.h2}>7. Acceptable Use</h2>
        <p style={s.p}>You agree not to:</p>
        <ul style={s.ul}>
          <li style={s.li}>Use the service for any unlawful purpose</li>
          <li style={s.li}>Attempt to reverse-engineer, scrape, or copy the service</li>
          <li style={s.li}>Share your account with others</li>
          <li style={s.li}>Use automated tools to access the service</li>
          <li style={s.li}>Upload harmful or offensive content</li>
        </ul>

        <h2 style={s.h2}>8. Intellectual Property</h2>
        <p style={s.p}>All content on MunTalk, including curriculum, design, and software, is the property of MunTalk and protected by applicable copyright and intellectual property laws. You may not copy, reproduce, or distribute any content without prior written permission.</p>

        <h2 style={s.h2}>9. Service Availability</h2>
        <p style={s.p}>We strive to provide uninterrupted service but do not guarantee 100% uptime. We reserve the right to modify, suspend, or discontinue the service at any time with reasonable notice.</p>

        <h2 style={s.h2}>10. Limitation of Liability</h2>
        <p style={s.p}>To the maximum extent permitted by Canadian law, MunTalk shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.</p>

        <h2 style={s.h2}>11. Governing Law</h2>
        <p style={s.p}>These Terms are governed by the laws of the Province of British Columbia and the federal laws of Canada applicable therein. Any disputes shall be resolved in the courts of British Columbia.</p>

        <h2 style={s.h2}>12. Changes to Terms</h2>
        <p style={s.p}>We may update these Terms from time to time. We will provide at least 14 days notice of material changes via email or in-app notification. Continued use after changes constitutes acceptance.</p>

        <h2 style={s.h2}>13. Contact Us</h2>
        <p style={s.p}>For questions about these Terms:<br />
          <strong>MunTalk</strong><br />
          British Columbia, Canada<br />
          Email: <a href="mailto:muntalkofficial@gmail.com" style={s.link}>muntalkofficial@gmail.com</a>
        </p>
      </div>
      <footer style={s.footer}>
        <a href="/privacy" style={s.footLink}>Privacy Policy</a>
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
  lead: { fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 32, padding: '20px 24px', background: '#FFF7ED', borderRadius: 16, borderLeft: '4px solid #F59E0B' },
  h2: { fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 40, marginBottom: 12 },
  p: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 12 },
  ul: { paddingLeft: 20, marginBottom: 16 },
  li: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 6 },
  link: { color: '#6366F1', fontWeight: 700 },
  footer: { background: '#fff', borderTop: '1px solid #E9ECEF', padding: '24px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13 },
  footLink: { color: '#6366F1', fontWeight: 700, textDecoration: 'none' },
};
