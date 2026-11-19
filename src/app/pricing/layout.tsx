import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { brandForHost } from '@/lib/brand';

// pricing/page.tsx is a client component, so its canonical lives here.
// Title/description follow the request host: Muntuz on muntuz.com, MunTalk elsewhere (QA 7A).
export function generateMetadata(): Metadata {
  const h = headers();
  const brand = brandForHost(h.get('x-forwarded-host') ?? h.get('host'));
  return {
    title: `Pricing — ${brand.name}`,
    description: `${brand.name} pricing: start free, upgrade for unlimited AI lessons and live tutors.`,
    alternates: { canonical: '/pricing' },
  };
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
