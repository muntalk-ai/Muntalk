// QA 11-16 D1 / Muntuz D5+D28: 첫 로드 백지 방지용 로딩 스켈레톤.
// /pricing과 /lingua는 둘 다 useSearchParams를 쓰는 클라이언트 컴포넌트를
// Suspense로 감싸고 있는데 fallback이 없어, 프리렌더된 HTML에 아무것도
// 들어가지 않고 JS 로드+하이드레이션까지 백지가 보였다. 이 스켈레톤을
// fallback으로 주면 SSR HTML에 즉시 들어가고, 실제 콘텐츠가 준비되면
// 교체된다 (점진적 렌더링). 브랜드 중립 디자인이라 muntuz.com에서도 동일.
export default function RouteSkeleton({ variant }: { variant: 'pricing' | 'levels' }) {
  const block = (style: React.CSSProperties, key: number) => (
    <div key={key} style={{ background: '#E2E8F0', borderRadius: 12, animation: 'mt-pulse 1.4s ease-in-out infinite', ...style }} />
  );
  return (
    <div style={{ minHeight: '100dvh', background: '#F8FAFC', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif" }}>
      <style>{`@keyframes mt-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }`}</style>
      {/* 상단 네비 자리표시 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
        {block({ width: 120, height: 28, borderRadius: 20 }, 1)}
        {block({ width: 90, height: 28, borderRadius: 20 }, 2)}
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px' }}>
        {/* 헤드라인 자리표시 */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {block({ width: 320, height: 36, margin: '0 auto 14px' }, 3)}
          {block({ width: 220, height: 16, margin: '0 auto' }, 4)}
        </div>
        {/* 카드 그리드 자리표시 */}
        <div style={{ display: 'grid', gridTemplateColumns: variant === 'pricing' ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {Array.from({ length: variant === 'pricing' ? 3 : 6 }).map((_, i) =>
            block({ height: variant === 'pricing' ? 340 : 220, borderRadius: 20 }, 10 + i),
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
          Loading…
        </div>
      </div>
    </div>
  );
}
