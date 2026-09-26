'use client';
// components/MicGuide.tsx — STT 사용 불가 시 안내 UI (PR-G)
// 마이크 권한 거부 / 브라우저 미지원 / 마이크 없음 → 무음 처리 대신 안내.
export type MicGuideReason = 'denied' | 'unsupported' | 'no-mic';

const COPY: Record<MicGuideReason, { icon: string; title: string; body: string }> = {
  denied: {
    icon: '🎤',
    title: "Microphone is blocked",
    body: "Allow mic access in your browser's site settings (tap the 🔒 icon in the address bar), then tap 🎤 again — or just type instead.",
  },
  unsupported: {
    icon: '🎤',
    title: "Voice input isn't supported here",
    body: "This browser doesn't support voice input. Please type your message instead — it works just as well.",
  },
  'no-mic': {
    icon: '🎤',
    title: "No microphone found",
    body: "We couldn't find a microphone on this device. Please type your message instead.",
  },
};

export default function MicGuide({
  reason,
  onDismiss,
}: {
  reason: MicGuideReason;
  onDismiss: () => void;
}) {
  const c = COPY[reason];
  return (
    <div
      role="status"
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12,
        padding: '10px 12px', margin: '8px 0', animation: 'mtFadeIn .2s ease',
        fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif",
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1.3 }}>{c.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#92400E', marginBottom: 2 }}>{c.title}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#A16207', lineHeight: 1.5 }}>{c.body}</div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          border: 'none', background: 'transparent', color: '#A16207',
          fontSize: 16, cursor: 'pointer', padding: 4, lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}
