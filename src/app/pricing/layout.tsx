import type { Metadata } from 'next';

// pricing/page.tsx is a client component, so its canonical lives here.
export const metadata: Metadata = {
  title: 'Pricing — MunTalk',
  description: 'MunTalk pricing: start free, upgrade for unlimited AI lessons and live tutors.',
  alternates: { canonical: '/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
