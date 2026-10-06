import type { Metadata } from 'next';
import { Suspense } from 'react';
import LevelHub from '@/components/LevelHub';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function Home() {
  // PR #110: LevelHub이 useSearchParams(?trial=1, ?r=)를 사용하므로 Suspense 경계 필요
  return (
    <Suspense>
      <LevelHub />
    </Suspense>
  );
}