// app/api/account/delete/route.ts — full account deletion (privacy audit C2)
//
// Before this route, "Delete My Account" only removed the Firebase Auth user.
// Firestore documents, Storage photos and the public Exchange profile stayed
// behind, so a deleted user could keep appearing in People Rooms.
//
// This route deletes everything we can tie to the uid (or the account email,
// for the email-only waitlists), then deletes the Auth user last. It is
// idempotent: missing documents/collections are skipped, so a retry after a
// partial failure simply finishes the job.
//
// Retained on purpose (see PR body):
//   - exchange_reports (both authored-by and filed-against the user): safety
//     and abuse-handling records.
//   - guest_trials: keyed by device id, not linkable to the account.
//   - Partner-authored messages in shared people-chat rooms: they belong to
//     the other participant. The user's own messages and photos are deleted.
//
// MunTalk and Muntuz share one Firebase project and one login, so this
// deletes the user's data for BOTH products.
//
// Admin SDK is initialised lazily inside the handler (build-time page
// collection must pass without service-account env vars).

import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getAdminDb, rateLimit } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Require a sign-in within this window (the client re-authenticates first). */
const RECENT_AUTH_MAX_AGE_SEC = 10 * 60;

const DAILY_USAGE_SCOPES = ['tts', 'gemini', 'exchange-chat', 'exchange-new-chat'];

type Db = admin.firestore.Firestore;

/** Delete every doc whose id starts with `prefix` in a top-level collection. */
async function deleteByIdPrefix(db: Db, collection: string, prefix: string): Promise<number> {
  let total = 0;
  // Page in batches of 400 until nothing matches.
  for (;;) {
    const snap = await db
      .collection(collection)
      .where(admin.firestore.FieldPath.documentId(), '>=', prefix)
      .where(admin.firestore.FieldPath.documentId(), '<', prefix + '\uf8ff')
      .limit(400)
      .get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    total += snap.size;
    if (snap.size < 400) break;
  }
  return total;
}

/** Delete every doc matching field == value (optionally recursive). */
async function deleteWhere(db: Db, collection: string, field: string, value: string, recursive = false): Promise<number> {
  const snap = await db.collection(collection).where(field, '==', value).get();
  for (const d of snap.docs) {
    if (recursive) await db.recursiveDelete(d.ref);
    else await d.ref.delete();
  }
  return snap.size;
}

export async function POST(req: NextRequest) {
  const m = /^Bearer (.+)$/i.exec(req.headers.get('authorization') || '');
  if (!m) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let decoded: admin.auth.DecodedIdToken;
  try {
    getAdminDb(); // ensure the app is initialised
    decoded = await admin.auth().verifyIdToken(m[1], true);
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const uid = decoded.uid;

  if (!rateLimit(`account-delete:${uid}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  // Deletion is irreversible: require a fresh sign-in.
  const nowSec = Math.floor(Date.now() / 1000);
  if (!decoded.auth_time || nowSec - decoded.auth_time > RECENT_AUTH_MAX_AGE_SEC) {
    return NextResponse.json({ error: 'requires_recent_login' }, { status: 403 });
  }

  const db = getAdminDb();
  const email = (decoded.email || '').trim().toLowerCase();

  // An active paid plan would keep billing after the account is gone.
  const subRef = db.collection('subscriptions').doc(uid);
  const subSnap = await subRef.get();
  if (subSnap.exists) {
    const s = subSnap.data() || {};
    const active = ['active', 'trialing', 'past_due'].includes(String(s.status || ''));
    if (active && !s.cancelAtPeriodEnd) {
      return NextResponse.json({ error: 'active_subscription' }, { status: 409 });
    }
  }

  const deleted: Record<string, number> = {};
  const errors: string[] = [];
  const step = async (name: string, fn: () => Promise<number | void>) => {
    try {
      const n = await fn();
      deleted[name] = typeof n === 'number' ? n : 1;
    } catch (e) {
      errors.push(`${name}: ${(e as Error).message}`);
    }
  };

  // ── Exchange (Muntuz) ──
  // People-chat rooms: delete the user's own messages + their photos.
  await step('exchange_chats.messages', async () => {
    const rooms = await db.collection('exchange_chats').where('participants', 'array-contains', uid).get();
    let n = 0;
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = bucketName ? admin.storage().bucket(bucketName) : null;
    for (const room of rooms.docs) {
      const msgs = await room.ref.collection('messages').where('from', '==', uid).get();
      for (const msg of msgs.docs) {
        const photoPath = msg.get('photoPath');
        if (bucket && typeof photoPath === 'string' && photoPath.startsWith('chat-photos/')) {
          await bucket.file(photoPath).delete({ ignoreNotFound: true });
        }
        await msg.ref.delete();
        n++;
      }
      // Drop a room that no longer has any messages.
      const left = await room.ref.collection('messages').limit(1).get();
      if (left.empty) await room.ref.delete();
    }
    return n;
  });
  // Call signalling docs (+ ICE candidate subcollections). `members` is an array.
  await step('exchange_calls', async () => {
    const snap = await db.collection('exchange_calls').where('members', 'array-contains', uid).get();
    for (const d of snap.docs) await db.recursiveDelete(d.ref);
    return snap.size;
  });
  await step('exchange_memories', () => deleteByIdPrefix(db, 'exchange_memories', `${uid}_`));
  await step('exchange_vocab', () => deleteByIdPrefix(db, 'exchange_vocab', `${uid}_`));
  await step('exchange_reviews', () => deleteByIdPrefix(db, 'exchange_reviews', `${uid}_`));
  await step('exchange_waitlist', async () => { await db.collection('exchange_waitlist').doc(uid).delete(); });
  // Public profile + private/identity (birthday) subcollection.
  await step('exchange_profiles', async () => { await db.recursiveDelete(db.collection('exchange_profiles').doc(uid)); });

  // ── MunTalk ──
  await step('user_leagues+members', async () => {
    const ul = await db.collection('user_leagues').doc(uid).get();
    const leagueId = ul.exists ? ul.get('leagueId') : null;
    if (typeof leagueId === 'string' && leagueId) {
      await db.collection('leagues').doc(leagueId).collection('members').doc(uid).delete();
    }
    await db.collection('user_leagues').doc(uid).delete();
  });
  await step('dream_projects', () => deleteWhere(db, 'dream_projects', 'uid', uid, true));
  await step('referral_codes', () => deleteWhere(db, 'referral_codes', 'uid', uid));
  await step('xp_awards', async () => { await db.recursiveDelete(db.collection('xp_awards').doc(uid)); });
  for (const c of ['fcm_tokens', 'hearts', 'chat_usage', 'trials', 'trial_usage']) {
    await step(c, async () => { await db.collection(c).doc(uid).delete(); });
  }
  await step('api_daily_usage', async () => {
    let n = 0;
    for (const scope of DAILY_USAGE_SCOPES) n += await deleteByIdPrefix(db, 'api_daily_usage', `${scope}:uid:${uid}:`);
    return n;
  });
  // Email-keyed notify lists.
  if (email) {
    await step('muntuz_waitlist', () => deleteWhere(db, 'muntuz_waitlist', 'email', email));
    await step('text_adventure_notify', () => deleteWhere(db, 'text_adventure_notify', 'email', email));
  }
  await step('subscriptions', async () => { await subRef.delete(); });
  // users/{uid} + srs_cards and any other subcollections.
  await step('users', async () => { await db.recursiveDelete(db.collection('users').doc(uid)); });

  if (errors.length > 0) {
    // Keep the Auth user so the user (or a retry) can finish the deletion.
    console.error('[account/delete] partial failure', uid, errors);
    return NextResponse.json({ ok: false, error: 'partial_failure', deleted }, { status: 500 });
  }

  try {
    await admin.auth().deleteUser(uid);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code !== 'auth/user-not-found') {
      console.error('[account/delete] auth delete failed', uid, (e as Error).message);
      return NextResponse.json({ ok: false, error: 'auth_delete_failed', deleted }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, deleted });
}
