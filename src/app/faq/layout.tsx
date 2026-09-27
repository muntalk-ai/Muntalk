import type { Metadata } from 'next';

// faq/page.tsx is a client component, so its canonical lives here.
export const metadata: Metadata = {
  title: 'FAQ — MunTalk',
  description: 'Frequently asked questions about learning languages with MunTalk AI.',
  alternates: { canonical: '/faq' },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
