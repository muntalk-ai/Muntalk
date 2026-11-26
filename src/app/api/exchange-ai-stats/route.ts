import { NextRequest, NextResponse } from 'next/server';
import { getIdentity, isAdminEmail, apiError, apiSafeError } from '@/lib/apiGuard';
import { readAiChatStats, statsDayKey, STATS_TIMEZONE } from '@/lib/exchangeAiStats';

// Admin-only: daily Exchange AI chat counts for the last 14 days
// (exchange_ai_stats, written server-side by /api/exchange-ai-chat).
// Requires a Firebase ID token whose email is in ADMIN_EMAILS.
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const id = await getIdentity(req);
    if (!id) return apiError('Sign in required', 401);
    if (!isAdminEmail(id.email)) return apiError('Admin only', 403);
    const days = await readAiChatStats(14);
    return NextResponse.json(
      { timezone: STATS_TIMEZONE, today: statsDayKey(), days },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return apiSafeError('[exchange-ai-stats] route error:', err);
  }
}
