import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { brandForHost } from '@/lib/brand';

// about/page.tsx is a client component, so its canonical lives here.
// Title/description follow the request host: Muntuz on muntuz.com, MunTalk elsewhere.
export function generateMetadata(): Metadata {
  const brand = brandForHost(headers().get('host'));
  return {
    title: `About — ${brand.name}`,
    description: `The story behind ${brand.name}: an AI language coach built by a solo developer.`,
    alternates: { canonical: '/about' },
  };
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
