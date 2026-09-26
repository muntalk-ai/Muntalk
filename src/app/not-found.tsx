// app/not-found.tsx — 404 폴백 (PR-G)
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center', background: '#F8FAFC',
        fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif",
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
  );
}
