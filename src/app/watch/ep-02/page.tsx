import type { Metadata } from 'next';
import EpisodePageClient from '../episode-client';
import { EPISODES } from '@/data/text-adventure-episodes';

export const metadata: Metadata = {
  title: 'Episode 2 — The Choice After — Text Adventure — MunTalk',
  description:
    'Mia picked her drink in Episode 1. Warm hands, warm heart — or iced coffee in the rain? Here is what happened next.',
  alternates: { canonical: '/watch/ep-02' },
};

export default function WatchEp02Page() {
  const episode = EPISODES[1];
  const prevEp = EPISODES[0] ?? null;
  const nextEp = EPISODES[2] ?? null;
  return <EpisodePageClient episode={episode} prevEp={prevEp} nextEp={nextEp} />;
}
