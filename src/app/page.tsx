import type { Metadata } from 'next';
import LevelHub from '@/components/LevelHub';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function Home() {
  return <LevelHub />;
}