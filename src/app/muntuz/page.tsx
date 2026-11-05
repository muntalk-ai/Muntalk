import type { Metadata } from 'next';
import MuntuzLandingClient from './MuntuzLandingClient';

export const metadata: Metadata = {
  title: 'Muntuz — Meet your AI friends',
  description:
    'Meet your AI friends. Practice any language, any time. Join the waitlist — Muntuz is coming soon.',
};

// Muntuz.com Coming Soon landing page.
// Shown as the first screen on the muntuz.com host (see src/middleware.ts).
// Also reachable directly at /muntuz on any host (e.g. Vercel Preview).
export default function MuntuzLandingPage() {
  return <MuntuzLandingClient />;
}
