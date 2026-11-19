import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { brandForHost } from '@/lib/brand';

// lingua/page.tsx renders LevelHub (client component), so its title lives here.
// Title/description follow the request host: Muntuz on muntuz.com, MunTalk elsewhere (QA 7A).
export function generateMetadata(): Metadata {
  const h = headers();
  const brand = brandForHost(h.get('x-forwarded-host') ?? h.get('host'));
  return {
    title: `${brand.name} — Learn Languages with AI`,
    description: `Master any language with ${brand.name} AI-powered lessons, spaced repetition, and live tutors.`,
    alternates: { canonical: '/lingua' },
  };
}

export default function LinguaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
