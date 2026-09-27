import type { Metadata } from 'next';

// about/page.tsx is a client component, so its canonical lives here.
export const metadata: Metadata = {
  title: 'About — MunTalk',
  description: 'The story behind MunTalk: an AI language coach built by a solo developer.',
  alternates: { canonical: '/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
