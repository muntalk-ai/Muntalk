'use client';
import { Suspense } from 'react';
import LevelHub from '@/components/LevelHub';
import RouteSkeleton from '@/components/RouteSkeleton';

export default function LinguaPage() {
  // PR #110: LevelHub이 useSearchParams(?trial=1, ?r=)를 사용하므로 Suspense 경계 필요
  // QA 11-16 D1 / Muntuz D28: fallback이 없어 프리렌더 HTML이 비어 JS 로드
  // +하이드레이션까지 /lingua 첫 화면이 백지가 보였다 — 스켈레톤을 즉시
  // 그리고 실제 콘텐츠가 준비되면 교체한다.
  return (
    <Suspense fallback={<RouteSkeleton variant="levels" />}>
      <LevelHub />
    </Suspense>
  );
}
