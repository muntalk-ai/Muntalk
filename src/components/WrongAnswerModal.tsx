'use client';
// components/WrongAnswerModal.tsx
// B-6: 게임 오답 해설 모달 (정적 설명 — AI 호출 없음)
// word: 문제 단어, wrongText: 학습자 선택, correctText: 정답, example: 예문

export interface WrongAnswerInfo {
  word: string;
  wrongText: string;
  correctText: string;
  example?: string;
}

interface Props {
  info: WrongAnswerInfo;
  onClose: () => void;
}

export default function WrongAnswerModal({ info, onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        background: 'rgba(15,23,42,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 24, padding: '28px 24px',
          maxWidth: 400, width: '100%',
          boxShadow: '0 24px 64px rgba(15,23,42,.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>💡</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 16 }}>
          Not quite — here's why
        </div>

        <div style={{ fontSize: 15, fontWeight: 900, color: '#6366F1', marginBottom: 12 }}>
          {info.word}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', marginBottom: 4 }}>YOU PICKED</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>{info.wrongText}</div>
          </div>
          <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', marginBottom: 4 }}>CORRECT</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>{info.correctText}</div>
          </div>
        </div>

        {info.example && (
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 16, fontStyle: 'italic' }}>
            “{info.example}”
          </div>
        )}

        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
          Tip: say the word and the correct meaning out loud once — it sticks better.
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: '#6366F1', color: '#fff', fontSize: 15, fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
