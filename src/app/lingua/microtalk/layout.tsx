import type { Metadata } from 'next';

// microtalk/page.tsx is a client component, so its canonical lives here.
export const metadata: Metadata = {
  title: 'Micro-Talk — Free 1-Minute AI Conversation | MunTalk',
  description: 'Try a free 1-minute AI conversation. No signup needed.',
  alternates: { canonical: '/lingua/microtalk' },
};

export default function MicrotalkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
