'use client';
// components/GlobalOverlays.tsx — 루트 레이아웃에 1회 마운트되는 전역 UI (PR-G)
import AiFailureModal from './AiFailureModal';
import { useErrorTracking } from '@/hooks/useErrorTracking';

export default function GlobalOverlays() {
  useErrorTracking();
  return <AiFailureModal />;
}
