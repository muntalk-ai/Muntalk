import type { Metadata } from 'next';
import EpisodePageClient from '../episode-client';
import { EPISODES } from '@/data/text-adventure-episodes';

export const metadata: Metadata = {
  title: "Episode 1 — Mia's Café Choice — Text Adventure — MunTalk",
  description:
    'Mia is stuck in a rainy London café: hot chocolate or iced Americano? Watch in 22 languages and vote for your choice.',
  alternates: { canonical: '/watch/ep-01' },
};

export default function WatchEp01Page() {
  const episode = EPISODES[0];
  const prevEp = null;
  const nextEp = EPISODES[1] ?? null;
  return <EpisodePageClient episode={episode} prevEp={prevEp} nextEp={nextEp} />;
}
