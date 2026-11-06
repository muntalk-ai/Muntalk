import type { Metadata } from 'next';
import KonglishClient from './konglish-client';

export const metadata: Metadata = {
  title: 'Konglish ER — Fix One English Mistake a Day — MunTalk',
  description:
    'Short videos that fix the English mistakes speakers of 17 languages make most. Past episodes are free for everyone — sign in to watch the next episode 1–2 days early.',
  alternates: { canonical: '/konglish' },
};

export default function KonglishPage() {
  return <KonglishClient />;
}
