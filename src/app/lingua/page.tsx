'use client';
import { Suspense } from 'react';
import LevelHub from '@/components/LevelHub';

export default function LinguaPage() {
  // PR #110: LevelHub이 useSearchParams(?trial=1, ?r=)를 사용하므로 Suspense 경계 필요
  return (
    <Suspense>
      <LevelHub />
    </Suspense>
  );
}
