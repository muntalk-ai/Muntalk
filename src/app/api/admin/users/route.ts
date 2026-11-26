import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getIdentity, apiError, apiSafeError } from '@/lib/apiGuard';
import { isPanelAdmin } from '@/lib/panelAdmin';
import { getAdminDb } from '@/lib/serverAuth';

// Admin-only user list for /admin (2026-11-26).
//
// Why: /admin used to read the `users` collection straight from the browser.
// The live Firestore rules only treat muntalkofficial@gmail.com as admin, so
// when the panel was opened with muntuz.official@gmail.com the read was denied,
// the error was swallowed, and the panel showed "0 users". Reading through the
// Admin SDK here bypasses the client rules, so both admin accounts see the
// same numbers. Also returns Firebase Auth totals, so accounts that exist in
// Auth but never got a users/{uid} doc are not silently missing.
export const dynamic = 'force-dynamic';

function tsToIso(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  const t = v as { toDate?: () => Date };
  if (typeof t.toDate === 'function') {
    try { return t.toDate().toISOString(); } catch { return ''; }
  }
  return '';
}

export async function GET(req: NextRequest) {
  try {
    const id = await getIdentity(req);
    if (!id) return apiError('Sign in required', 401);
    if (!isPanelAdmin(id.email)) return apiError('Admin only', 403);

    const db = getAdminDb();
    const [usersSnap, subsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('subscriptions').get(),
    ]);
    const subs = new Map<string, FirebaseFirestore.DocumentData>();
    subsSnap.docs.forEach((d) => subs.set(d.id, d.data()));

    const users = usersSnap.docs.map((d) => {
      const u = d.data();
      const s = subs.get(d.id);
      return {
        uid: d.id,
        email: typeof u.email === 'string' ? u.email : '',
        displayName: u.displayName || u.name || '',
        createdAt: tsToIso(u.createdAt),
        xp: typeof u.xp === 'number' ? u.xp : 0,
        streak: typeof u.streak === 'number' ? u.streak : 0,
        learnLang: u.learnLang || '',
        nativeLang: u.nativeLang || '',
        lastActive: u.lastActive || '',
        completedLessons: Array.isArray(u.completedLessons) ? u.completedLessons.length : 0,
        activityDates: Array.isArray(u.activityDates) ? u.activityDates : [],
        visitDates: Array.isArray(u.visitDates) ? u.visitDates : [],
        lastSeen: u.lastSeen || '',
        muntuzVisitDays: Array.isArray(u.muntuzVisitDates) ? u.muntuzVisitDates.length : 0,
        signupSite: u.signupSite === 'muntuz' || u.signupSite === 'muntalk' ? u.signupSite : '',
        funnel: u.funnel && typeof u.funnel === 'object' ? u.funnel : {},
        entrySource: u.entrySource || '',
        planId: (s?.planId as string) || 'free',
        planStatus: (s?.status as string) || 'active',
        expiry: (s?.currentPeriodEnd as string) || '',
      };
    });

    // Firebase Auth totals — counts every account, including ones whose
    // users/{uid} doc was never created. Best-effort: a failure here does not
    // hide the Firestore list.
    let authTotal: number | null = null;
    let authWithoutProfile: { uid: string; email: string; createdAt: string }[] = [];
    try {
      const have = new Set(users.map((u) => u.uid));
      let token: string | undefined;
      let total = 0;
      const missing: { uid: string; email: string; createdAt: string }[] = [];
      do {
        const page = await admin.auth().listUsers(1000, token);
        total += page.users.length;
        page.users.forEach((a) => {
          if (!have.has(a.uid)) {
            missing.push({
              uid: a.uid,
              email: a.email || '',
              createdAt: a.metadata.creationTime ? new Date(a.metadata.creationTime).toISOString() : '',
            });
          }
        });
        token = page.pageToken;
      } while (token);
      authTotal = total;
      authWithoutProfile = missing;
    } catch (e) {
      console.error('[admin/users] auth list failed:', e);
    }

    return NextResponse.json(
      { users, authTotal, authWithoutProfile },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return apiSafeError('[admin/users] route error:', err);
  }
}
