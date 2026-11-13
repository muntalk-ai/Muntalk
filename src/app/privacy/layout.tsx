import type { Metadata } from 'next';

// privacy/page.tsx is a client component, so its canonical lives here.
export const metadata: Metadata = {
  title: 'Privacy Policy — MunTalk',
  description: 'MunTalk Privacy Policy — how we collect, use, and protect your information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
