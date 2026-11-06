import type { Metadata } from 'next';
import EpisodePageClient from '../episode-client';
import { EPISODES } from '@/data/text-adventure-episodes';

export const metadata: Metadata = {
  title: 'Episode 3 — The Missing Wallet — Text Adventure — MunTalk',
  description:
    'Mia finished dinner. The bill is £21.38 — and her wallet is gone. What would you do?',
  alternates: { canonical: '/watch/ep-03' },
};

export default function WatchEp03Page() {
  const episode = EPISODES[2];
  const prevEp = EPISODES[1] ?? null;
  const nextEp = null;
  return <EpisodePageClient episode={episode} prevEp={prevEp} nextEp={nextEp} />;
}
