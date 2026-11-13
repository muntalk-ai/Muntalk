import type { Metadata } from 'next';

// terms/page.tsx is a client component, so its canonical lives here.
export const metadata: Metadata = {
  title: 'Terms of Service — MunTalk',
  description: 'MunTalk Terms of Service — the terms for using the MunTalk AI language tutor.',
  alternates: { canonical: '/terms' },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
