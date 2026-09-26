'use client';

// PR-I: 공용 Skeleton UI — 로딩 중 빈 화면/깜빡임 제거.
// globals.css의 @keyframes pulse를 재사용한다.

const base: React.CSSProperties = {
  background: '#E8EDF5',
  borderRadius: 12,
  animation: 'pulse 1.2s ease-in-out infinite',
};

export function Skeleton({
  w = '100%',
  h = 16,
  r = 12,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number;
  style?: React.CSSProperties;
}) {
  return <div style={{ ...base, width: w, height: h, borderRadius: r, ...style }} />;
}

/** 대시보드 로딩용 — 히어로 카드 + 스탯 그리드 + 리스트 플레이스홀더 */
export function DashboardSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '20px 16px 40px', maxWidth: 640, margin: '0 auto' }}>
      <Skeleton h={28} w="55%" r={8} style={{ marginBottom: 8 }} />
      <Skeleton h={14} w="35%" r={8} style={{ marginBottom: 20 }} />
      <Skeleton h={120} r={20} style={{ marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <Skeleton h={76} r={16} />
        <Skeleton h={76} r={16} />
        <Skeleton h={76} r={16} />
      </div>
      <Skeleton h={18} w="40%" r={8} style={{ marginBottom: 12 }} />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <Skeleton w={44} h={44} r={14} />
          <div style={{ flex: 1 }}>
            <Skeleton h={14} w="70%" r={6} style={{ marginBottom: 8 }} />
            <Skeleton h={10} w="45%" r={6} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 리더보드/리스트 로딩용 — N개의 행 플레이스홀더 */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton w={36} h={36} r={18} />
          <div style={{ flex: 1 }}>
            <Skeleton h={14} w={`${70 - (i % 3) * 12}%`} r={6} style={{ marginBottom: 8 }} />
            <Skeleton h={10} w="35%" r={6} />
          </div>
          <Skeleton w={52} h={20} r={10} />
        </div>
      ))}
    </div>
  );
}

/** 복습 카드 로딩용 — 큰 카드 1장 플레이스홀더 */
export function CardSkeleton() {
  return (
    <div style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto', width: '100%' }}>
      <Skeleton h={200} r={20} style={{ marginBottom: 16 }} />
      <Skeleton h={16} w="60%" r={8} style={{ margin: '0 auto 24px' }} />
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Skeleton w={120} h={48} r={14} />
        <Skeleton w={120} h={48} r={14} />
      </div>
    </div>
  );
}
