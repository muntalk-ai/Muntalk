import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { brandForHost } from '@/lib/brand';

// faq/page.tsx is a client component, so its canonical lives here.
// Title/description follow the request host: Muntuz on muntuz.com, MunTalk elsewhere.
export function generateMetadata(): Metadata {
  const brand = brandForHost(headers().get('host'));
  return {
    title: `FAQ — ${brand.name}`,
    description: `Frequently asked questions about learning languages with ${brand.name} AI.`,
    alternates: { canonical: '/faq' },
  };
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
