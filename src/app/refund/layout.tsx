import type { Metadata } from 'next';

// refund/page.tsx is a client component, so its canonical lives here.
export const metadata: Metadata = {
  title: 'Refund Policy — MunTalk',
  description: 'MunTalk Refund Policy — refunds for MunTalk subscriptions and purchases.',
  alternates: { canonical: '/refund' },
};

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
