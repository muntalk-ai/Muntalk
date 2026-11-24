import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { brandForHost } from '@/lib/brand';

// privacy/page.tsx is a client component and had no metadata of its own
// (it inherited the root "MunTalk" title). Title follows the request host:
// Muntuz on muntuz.com, MunTalk elsewhere.
export function generateMetadata(): Metadata {
  const brand = brandForHost(headers().get('host'));
  return {
    title: `Privacy Policy — ${brand.name}`,
    description: `Privacy Policy for ${brand.name}.`,
    alternates: { canonical: '/privacy' },
  };
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
