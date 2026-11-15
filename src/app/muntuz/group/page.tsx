import type { Metadata } from 'next';
import MuntuzGroupClient from './MuntuzGroupClient';

export const metadata: Metadata = {
  title: 'MUNTUZ — Say hi, we are MUNTUZ!',
  description:
    'The five housemates just debuted as MUNTUZ. Hear their first single “Say Hi” and peek at dorm life — the episodes from living, practicing and debuting together.',
};

// MUNTUZ group page — the debut + dorm episodes live here, on their own
// page, so the main page stays a simple language-exchange landing.
// Reachable at /muntuz/group (muntuz.com/muntuz/group).
export default function MuntuzGroupPage() {
  return <MuntuzGroupClient />;
}
