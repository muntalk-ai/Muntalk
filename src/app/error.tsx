'use client';
// app/error.tsx — 전역 에러 바운더리 (PR-G)
// 라우트 세그먼트에서 throw된 에러를 잡아 전문적인 폴백 UI 표시.
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // useErrorTracking이 없을 수 있는 초기 로드 대비 직접 기록
    try {
      fetch('/api/client-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'error',
          message: `route-error: ${error.message || 'unknown'}`.slice(0, 500),
          url: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif", background: '#F8FAFC' }}>
        <div
          style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🛠️</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '0 0 10px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>
              We hit an unexpected hiccup. Your progress is saved — please try again.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: '13px 28px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
                  fontWeight: 900, fontSize: 15, cursor: 'pointer',
                  fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif",
                }}
              >
                ↻ Try again
              </button>
              <a
                href="/"
                style={{
                  padding: '13px 28px', borderRadius: 12, border: '1.5px solid #E2E8F0',
                  background: '#fff', color: '#475569', fontWeight: 800, fontSize: 15,
                  textDecoration: 'none', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif",
                }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
