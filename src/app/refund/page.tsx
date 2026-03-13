'use client';
import { useRouter } from 'next/navigation';

export default function RefundPage() {
  const router = useRouter();
  const s = styles;
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button onClick={() => router.back()} style={s.back}>← Back</button>
        <span style={s.navTitle}>MunTalk</span>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>Refund Policy</h1>
        <p style={s.meta}>Effective Date: March 1, 2025 &middot; Last Updated: March 12, 2026</p>

        <p style={s.lead}>
          We want you to be completely satisfied with MunTalk. If you are not happy with your purchase,
          please review our refund policy below. This policy complies with the <strong>Canadian Consumer
          Protection Act</strong> and British Columbia consumer protection regulations.
        </p>

        <h2 style={s.h2}>1. 7-Day Money-Back Guarantee</h2>
        <p style={s.p}>We offer a <strong>full refund within 7 days</strong> of your initial subscription purchase, provided that:</p>
        <ul style={s.ul}>
          <li style={s.li}>You request the refund within 7 days of the purchase date.</li>
          <li style={s.li}>You have completed fewer than 5 premium lessons during this period.</li>
          <li style={s.li}>This is your first purchase (does not apply to renewals or upgrades).</li>
        </ul>

        <h2 style={s.h2}>2. How to Request a Refund</h2>
        <p style={s.p}>To request a refund, please email us at <a href="mailto:muntalkofficial@gmail.com" style={s.link}>muntalkofficial@gmail.com</a> with:</p>
        <ul style={s.ul}>
          <li style={s.li}>Your account email address</li>
          <li style={s.li}>Date of purchase</li>
          <li style={s.li}>Reason for the refund request</li>
        </ul>
        <p style={s.p}>We will process your refund within <strong>5-10 business days</strong>. Refunds are returned to the original payment method via Stripe.</p>

        <h2 style={s.h2}>3. Non-Refundable Situations</h2>
        <p style={s.p}>Refunds will <strong>not</strong> be issued in the following cases:</p>
        <ul style={s.ul}>
          <li style={s.li}>Requests made after 7 days of the purchase date</li>
          <li style={s.li}>Subscription renewal charges (you will receive a reminder email before renewal)</li>
          <li style={s.li}>Accounts that have been suspended or terminated due to violations of our Terms of Service</li>
          <li style={s.li}>Partial months or unused days of a subscription period</li>
        </ul>

        <h2 style={s.h2}>4. Subscription Cancellations</h2>
        <p style={s.p}>You may cancel your subscription at any time. Cancellations take effect at the end of the current billing period. You will retain access to premium features until that date. Cancellation does not entitle you to a refund unless it falls within the 7-day guarantee window.</p>

        <h2 style={s.h2}>5. Annual Plan Refunds</h2>
        <p style={s.p}>For annual subscriptions, the 7-day money-back guarantee applies. After 7 days, no partial refunds are available for the remaining months of an annual plan.</p>

        <h2 style={s.h2}>6. Technical Issues</h2>
        <p style={s.p}>If you experience a technical issue that prevents you from using the service, please contact us at <a href="mailto:muntalkofficial@gmail.com" style={s.link}>muntalkofficial@gmail.com</a>. We will investigate and may issue a refund or service credit at our discretion.</p>

        <h2 style={s.h2}>7. Chargebacks</h2>
        <p style={s.p}>If you initiate a chargeback with your bank without first contacting us, we reserve the right to suspend your account pending resolution. We encourage you to contact us directly as we are committed to resolving issues fairly and promptly.</p>

        <h2 style={s.h2}>8. Contact Us</h2>
        <p style={s.p}>For refund requests or billing questions:<br />
          <strong>MunTalk</strong><br />
          British Columbia, Canada<br />
          Email: <a href="mailto:muntalkofficial@gmail.com" style={s.link}>muntalkofficial@gmail.com</a><br />
          Response time: within 2 business days
        </p>
      </div>
      <footer style={s.footer}>
        <a href="/privacy" style={s.footLink}>Privacy Policy</a>
        <a href="/terms" style={s.footLink}>Terms of Service</a>
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
  lead: { fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 32, padding: '20px 24px', background: '#F0FDF4', borderRadius: 16, borderLeft: '4px solid #10B981' },
  h2: { fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 40, marginBottom: 12 },
  p: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 12 },
  ul: { paddingLeft: 20, marginBottom: 16 },
  li: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 6 },
  link: { color: '#6366F1', fontWeight: 700 },
  footer: { background: '#fff', borderTop: '1px solid #E9ECEF', padding: '24px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13 },
  footLink: { color: '#6366F1', fontWeight: 700, textDecoration: 'none' },
};
