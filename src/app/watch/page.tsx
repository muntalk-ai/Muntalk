import type { Metadata } from 'next';
import WatchHubClient from './hub-client';

export const metadata: Metadata = {
  title: 'Watch — Mia’s Story & Konglish ER — MunTalk',
  description:
    'Watch Mia’s text adventure in 22 languages and Konglish ER shorts in 17 languages. Past episodes are free for everyone — sign in to watch the next episode 1–2 days early.',
  alternates: { canonical: '/watch' },
};

// Watch hub (Jay 2026-11-06): one page, two tabs — Mia's Story (Text
// Adventure) and Konglish ER — with one shared early-access rule.
export default function WatchIndexPage() {
  return <WatchHubClient />;
}
