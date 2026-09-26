'use client';
// components/AiFailureModal.tsx — AI 요청 실패 시 전역 재시도 모달 (PR-G)
// src/app/layout.tsx에 GlobalOverlays를 통해 1회 마운트.
// lib/aiRetry.ts의 `mt:ai-failure` 이벤트를 수신하면 표시.
import { useEffect, useState } from 'react';
import { AI_FAILURE_EVENT, type AiFailureDetail } from '@/lib/aiRetry';

export default function AiFailureModal() {
  const [detail, setDetail] = useState<AiFailureDetail | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      setDetail((e as CustomEvent<AiFailureDetail>).detail);
    };
    window.addEventListener(AI_FAILURE_EVENT, handler);
    return () => window.removeEventListener(AI_FAILURE_EVENT, handler);
  }, []);

  if (!detail) return null;

  const onRetry = () => {
    const d = detail;
    setDetail(null);
    d.retry();
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="AI connection issue"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'mtFadeIn .2s ease',
      }}
      onClick={() => setDetail(null)}
    >
      <style>{`@keyframes mtFadeIn{from{opacity:0}to{opacity:1}}@keyframes mtPop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: '28px 26px',
          maxWidth: 380, width: '100%', textAlign: 'center',
          boxShadow: '0 24px 64px rgba(15,23,42,0.25)',
          fontFamily: "'Nunito',sans-serif",
          animation: 'mtPop .25s ease',
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 10 }}>📡</div>
        <div style={{ fontSize: 19, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>
          The AI didn&rsquo;t respond in time
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B', lineHeight: 1.55, marginBottom: 20 }}>
          Check your connection and try again — your message is saved, nothing is lost.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setDetail(null)}
            style={{
              flex: 1, padding: '13px 0', borderRadius: 12, border: '1.5px solid #E2E8F0',
              background: '#fff', color: '#475569', fontWeight: 800, fontSize: 15,
              cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
            }}
          >
            Dismiss
          </button>
          <button
            onClick={onRetry}
            style={{
              flex: 1.4, padding: '13px 0', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
              fontWeight: 900, fontSize: 15, cursor: 'pointer',
              fontFamily: "'Nunito',sans-serif",
            }}
          >
            ↻ Try again
          </button>
        </div>
      </div>
    </div>
  );
}
