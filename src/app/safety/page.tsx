'use client';
import { useRouter } from 'next/navigation';

export default function SafetyPage() {
  const router = useRouter();
  const s = styles;
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button onClick={() => router.back()} style={s.back}>← Back</button>
        <span style={s.navTitle}>Muntuz</span>
      </nav>
      <div style={s.container}>
        <h1 style={s.h1}>Muntuz Safety Standards</h1>
        <p style={s.meta}>Effective Date: November 19, 2026</p>

        <p style={s.lead}>
          Muntuz is an adults-only language practice community (18+). We have zero tolerance for child sexual abuse and exploitation (CSAE) in any form.
        </p>

        <ul style={s.ul}>
          <li style={s.li}><strong>Adults only.</strong> Muntuz is for users aged 18 and over. All AI practice partners are adults aged 20–24. No minors.</li>
          <li style={s.li}><strong>Zero tolerance.</strong> Any content or behaviour involving the sexual abuse or exploitation of children is prohibited. It is removed immediately and the account is permanently banned.</li>
          <li style={s.li}><strong>Report in-app.</strong> Any user can report a safety concern from a chat: Report → choose a reason → Report &amp; block. Reports go to our admin team for review.</li>
          <li style={s.li}><strong>Block.</strong> Reporting also blocks the person, removes the chat, and prevents you from being matched with them again. We never tell the reported person who reported them.</li>
          <li style={s.li}><strong>Contact guard.</strong> Phone numbers, links and contact IDs cannot be shared in chat.</li>
          <li style={s.li}><strong>Admin action.</strong> Our admin team reviews every report and can resolve it, dismiss it, or ban the reported user.</li>
          <li style={s.li}><strong>Contact.</strong> For safety concerns, contact <a href="mailto:muntuz.official@gmail.com" style={s.link}>muntuz.official@gmail.com</a>.</li>
        </ul>
      </div>
      <footer style={s.footer}>
        <a href="/privacy" style={s.footLink}>Privacy Policy</a>
        <a href="/terms" style={s.footLink}>Terms of Service</a>
        <span style={{ color: '#CBD5E1' }}>&copy; 2026 Muntuz. All rights reserved.</span>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif" },
  nav: { background: '#fff', borderBottom: '1px solid #E9ECEF', height: 60, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 100 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#6366F1', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif" },
  navTitle: { fontWeight: 900, fontSize: 18, color: '#0F172A' },
  container: { maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' },
  h1: { fontSize: 32, fontWeight: 900, color: '#0F172A', marginBottom: 8 },
  meta: { fontSize: 13, color: '#94A3B8', marginBottom: 32, fontWeight: 600 },
  lead: { fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 32, padding: '20px 24px', background: '#EFF6FF', borderRadius: 16, borderLeft: '4px solid #6366F1' },
  ul: { paddingLeft: 20, marginBottom: 16 },
  li: { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 6 },
  link: { color: '#6366F1', fontWeight: 700 },
  footer: { background: '#fff', borderTop: '1px solid #E9ECEF', padding: '24px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13 },
  footLink: { color: '#6366F1', fontWeight: 700, textDecoration: 'none' },
};
