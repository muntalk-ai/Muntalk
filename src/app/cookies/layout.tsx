import type { Metadata } from 'next';

// cookies/page.tsx is a client component, so its canonical lives here.
export const metadata: Metadata = {
  title: 'Cookie Policy — MunTalk',
  description: 'MunTalk Cookie Policy — how we use cookies on muntalk.com.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
