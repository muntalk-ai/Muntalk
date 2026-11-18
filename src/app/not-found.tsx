// app/not-found.tsx — 404 폴백 (PR-G)
// Brand-neutral chrome (same page serves muntalk.com and muntuz.com):
// a slim header with a way home + a footer with the legal pages,
// so a dead link never strands the visitor on a bare page.
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        background: '#F8FAFC',
        fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif",
      }}
    >
      <nav
        style={{
          background: '#fff', borderBottom: '1px solid #E9ECEF', height: 60,
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
          position: 'sticky', top: 0, zIndex: 100,
        }}
      >
        <a
          href="/"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#6366F1', fontFamily: 'inherit', textDecoration: 'none' }}
        >
          ← Back
        </a>
        <a href="/" style={{ fontWeight: 900, fontSize: 18, color: '#0F172A', textDecoration: 'none' }}>Home</a>
      </nav>

      <div
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🧭</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '0 0 10px' }}>
            This page wandered off
          </h1>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>
            The page you&rsquo;re looking for doesn&rsquo;t exist or was moved. Let&rsquo;s get you back on track.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block', padding: '13px 32px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
              fontWeight: 900, fontSize: 15, textDecoration: 'none',
              fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif",
            }}
          >
            ← Back to home
          </a>
        </div>
      </div>

      <footer
        style={{
          background: '#fff', borderTop: '1px solid #E9ECEF', padding: '24px',
          display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13,
        }}
      >
        <a href="/about" style={{ color: '#6366F1', fontWeight: 700, textDecoration: 'none' }}>Our Story</a>
        <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, textDecoration: 'none' }}>Help &amp; FAQ</a>
        <a href="/privacy" style={{ color: '#6366F1', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</a>
        <a href="/terms" style={{ color: '#6366F1', fontWeight: 700, textDecoration: 'none' }}>Terms of Service</a>
        <a href="/refund" style={{ color: '#6366F1', fontWeight: 700, textDecoration: 'none' }}>Refund Policy</a>
        <a href="/cookies" style={{ color: '#6366F1', fontWeight: 700, textDecoration: 'none' }}>Cookie Policy</a>
        <span style={{ color: '#CBD5E1' }}>&copy; {new Date().getFullYear()}. All rights reserved.</span>
      </footer>
    </div>
  );
}
