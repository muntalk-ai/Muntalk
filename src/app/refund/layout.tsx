import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { brandForHost } from '@/lib/brand';

// refund/page.tsx is a client component and had no metadata of its own
// (it inherited the root "MunTalk" title). Title follows the request host:
// Muntuz on muntuz.com, MunTalk elsewhere.
export function generateMetadata(): Metadata {
  const brand = brandForHost(headers().get('host'));
  return {
    title: `Refund Policy — ${brand.name}`,
    description: `Refund Policy for ${brand.name}.`,
    alternates: { canonical: '/refund' },
  };
}

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
