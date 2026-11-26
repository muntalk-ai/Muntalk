// Exchange AI chat usage counter (admin metrics only).
//
// Server-side only (firebase-admin — server writes bypass Firestore rules,
// so no console rule is needed). One doc per day in America/Vancouver:
//
//   exchange_ai_stats/{YYYY-MM-DD}
//     messages, messagesUser, messagesGuest, messagesMuntuz
//     newChats, newChatsUser, newChatsGuest
//     uniqueUsers, uniqueGuests
//     updatedAt
//   exchange_ai_stats/{YYYY-MM-DD}/actors/{hashedKey}
//     kind: 'user' | 'guest', firstAt
//
// No message text, no raw uid, no IP or device id is stored: actor doc ids
// are a truncated SHA-256 of the identity key, used only to count unique
// people per day. Counting must never break a chat reply — every call is
// wrapped in try/catch and bounded by a short timeout.
import { createHash } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/serverAuth';

export const EXCHANGE_AI_STATS_COLLECTION = 'exchange_ai_stats';
export const STATS_TIMEZONE = 'America/Vancouver';

export function statsDayKey(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STATS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function hashKey(raw: string): string {
  return createHash('sha256').update(`exchange-ai-stats:${raw}`).digest('hex').slice(0, 32);
}

export type AiChatStatInput = {
  /** Signed-in uid, or null for a guest. */
  uid: string | null;
  /** Guest identity: device id if sent, else client IP. Hashed before storage. */
  guestKey: string;
  /** True when the client marked this message as the first of a new chat. */
  newChat: boolean;
  /** Request came from muntuz.com. */
  isMuntuz: boolean;
};

async function recordInner(input: AiChatStatInput): Promise<void> {
  const db = getAdminDb();
  const day = statsDayKey();
  const dayRef = db.collection(EXCHANGE_AI_STATS_COLLECTION).doc(day);
  const isUser = !!input.uid;

  const inc: Record<string, unknown> = {
    messages: FieldValue.increment(1),
    [isUser ? 'messagesUser' : 'messagesGuest']: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (input.isMuntuz) inc.messagesMuntuz = FieldValue.increment(1);
  if (input.newChat) {
    inc.newChats = FieldValue.increment(1);
    inc[isUser ? 'newChatsUser' : 'newChatsGuest'] = FieldValue.increment(1);
  }

  // Unique people per day: create() fails if the actor doc already exists,
  // so the unique counter is bumped only on a person's first message today.
  const actorId = hashKey(isUser ? `u:${input.uid}` : `g:${input.guestKey || 'unknown'}`);
  const actorRef = dayRef.collection('actors').doc(actorId);
  try {
    await actorRef.create({ kind: isUser ? 'user' : 'guest', firstAt: FieldValue.serverTimestamp() });
    inc[isUser ? 'uniqueUsers' : 'uniqueGuests'] = FieldValue.increment(1);
  } catch (e) {
    const code = (e as { code?: number | string }).code;
    if (code !== 6 && code !== 'already-exists' && code !== 'ALREADY_EXISTS') throw e;
  }

  await dayRef.set(inc, { merge: true });
}

/** Records one successful AI reply. Never throws; gives up after timeoutMs. */
export async function recordAiChatStat(input: AiChatStatInput, timeoutMs = 1500): Promise<void> {
  try {
    await Promise.race([
      recordInner(input),
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch (e) {
    console.warn('[exchange-ai-stats] record failed:', (e as Error).message);
  }
}

export type AiChatDayStats = {
  day: string;
  messages: number;
  messagesUser: number;
  messagesGuest: number;
  messagesMuntuz: number;
  newChats: number;
  newChatsUser: number;
  newChatsGuest: number;
  uniqueUsers: number;
  uniqueGuests: number;
};

/** Last `days` days (today first), zero-filled for days with no doc. */
export async function readAiChatStats(days = 14): Promise<AiChatDayStats[]> {
  const db = getAdminDb();
  const keys: string[] = [];
  const now = Date.now();
  for (let i = 0; i < days; i++) {
    const k = statsDayKey(new Date(now - i * 86_400_000));
    if (!keys.includes(k)) keys.push(k);
  }
  const refs = keys.map((k) => db.collection(EXCHANGE_AI_STATS_COLLECTION).doc(k));
  const snaps = await db.getAll(...refs);
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  return snaps.map((s, i) => {
    const d = s.exists ? s.data() || {} : {};
    return {
      day: keys[i],
      messages: num(d.messages),
      messagesUser: num(d.messagesUser),
      messagesGuest: num(d.messagesGuest),
      messagesMuntuz: num(d.messagesMuntuz),
      newChats: num(d.newChats),
      newChatsUser: num(d.newChatsUser),
      newChatsGuest: num(d.newChatsGuest),
      uniqueUsers: num(d.uniqueUsers),
      uniqueGuests: num(d.uniqueGuests),
    };
  });
}
