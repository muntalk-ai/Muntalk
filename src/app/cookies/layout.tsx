import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { brandForHost } from '@/lib/brand';

// cookies/page.tsx is a client component and had no metadata of its own
// (it inherited the root "MunTalk" title). Title follows the request host:
// Muntuz on muntuz.com, MunTalk elsewhere.
export function generateMetadata(): Metadata {
  const brand = brandForHost(headers().get('host'));
  return {
    title: `Cookie Policy — ${brand.name}`,
    description: `Cookie Policy for ${brand.name}.`,
    alternates: { canonical: '/cookies' },
  };
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
