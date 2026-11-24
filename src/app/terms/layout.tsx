import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { brandForHost } from '@/lib/brand';

// terms/page.tsx is a client component and had no metadata of its own
// (it inherited the root "MunTalk" title). Title follows the request host:
// Muntuz on muntuz.com, MunTalk elsewhere.
export function generateMetadata(): Metadata {
  const brand = brandForHost(headers().get('host'));
  return {
    title: `Terms of Service — ${brand.name}`,
    description: `Terms of Service for ${brand.name}.`,
    alternates: { canonical: '/terms' },
  };
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
