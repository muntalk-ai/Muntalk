import type { Metadata } from 'next';
import MuntuzLandingClient from './MuntuzLandingClient';

export const metadata: Metadata = {
  title: 'Muntuz — Meet your AI friends',
  description:
    'Meet your AI friends. Practice any language with 50 AI partners — chat and voice calls, free. People Rooms opening soon.',
};

// Muntuz landing page.
// Reachable directly at /muntuz on any host (e.g. Vercel Preview).
// The first screen on the muntuz.com host is /exchange (see src/middleware.ts).
export default function MuntuzLandingPage() {
  return <MuntuzLandingClient />;
}
