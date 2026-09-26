'use client';

// PR-I: 통일된 Empty State — 데이터가 없을 때 안내 일러스트 + CTA.
// 신규 카피를 추가하지 않고 기존 문구를 재사용하는 용도로 설계됨.

export default function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  emoji: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 440, margin: '0 auto' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>{title}</div>
      {description && (
        <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, fontWeight: 600, marginBottom: 24 }}>
          {description}
        </div>
      )}
      {(actionLabel || secondaryLabel) && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: description ? 0 : 16 }}>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              style={{
                padding: '13px 28px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
                fontSize: 14, fontWeight: 900, cursor: 'pointer',
              }}
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button
              onClick={onSecondary}
              style={{
                padding: '13px 20px', borderRadius: 14, border: '1.5px solid #E5E7EB',
                background: '#fff', color: '#374151', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              }}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
