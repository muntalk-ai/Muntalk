// lib/exchangeChat.ts
// ─────────────────────────────────────────────────────────────────────────────
// People-chat server transport (Phase 1 of the Muntuz photo-sharing plan,
// design 2026-11-19).
//
// People-chat threads used to live only in this browser's localStorage
// (S-2), so two matched users could never actually exchange messages —
// and photos had nowhere to go. This module moves people-chat messages
// to Firestore (`exchange_chats/{chatId}/messages`) with realtime
// delivery, while localStorage stays as the offline cache.
//
// Rules (published by Jay in the Firebase console, never from this repo):
// only the two participants of a room may read it or write messages.
// Until those rules are published, every write below throws and the
// caller falls back to local-only (the message is never lost).
// ─────────────────────────────────────────────────────────────────────────────

import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

export const EXCHANGE_CHATS_COLLECTION = 'exchange_chats';
const MAX_SERVER_MESSAGES = 200;

/** Two user uids, sorted so both sides compute the same room id. */
export function serverChatIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

/** The uid of the other participant of a server room, from my uid. */
export function otherParticipant(serverChatId: string, myUid: string): string | null {
  const parts = serverChatId.split('_');
  if (parts.length !== 2) return null;
  if (parts[0] === myUid) return parts[1] ?? null;
  if (parts[1] === myUid) return parts[0] ?? null;
  return null;
}

export type ServerChatMessageType = 'text' | 'photo';

export type ServerChatMessage = {
  id: string;
  from: string;
  type: ServerChatMessageType;
  text?: string;
  photoUrl?: string;
  photoPath?: string;
  width?: number;
  height?: number;
  size?: number;
  /** Unix ms (serverTimestamp converted on read). */
  atMs: number;
};

export type ServerChatRoom = {
  chatId: string;
  participants: string[];
};

function toMillis(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v && typeof (v as Timestamp).toMillis === 'function') return (v as Timestamp).toMillis();
  return Date.now();
}

function parseMessage(snap: QueryDocumentSnapshot<DocumentData>): ServerChatMessage | null {
  const d = snap.data();
  if (typeof d.from !== 'string' || !d.from) return null;
  if (d.type !== 'text' && d.type !== 'photo') return null;
  return {
    id: snap.id,
    from: d.from,
    type: d.type,
    text: typeof d.text === 'string' ? d.text : undefined,
    photoUrl: typeof d.photoUrl === 'string' ? d.photoUrl : undefined,
    photoPath: typeof d.photoPath === 'string' ? d.photoPath : undefined,
    width: typeof d.width === 'number' ? d.width : undefined,
    height: typeof d.height === 'number' ? d.height : undefined,
    size: typeof d.size === 'number' ? d.size : undefined,
    atMs: toMillis(d.at),
  };
}

// Rooms already ensured in this session — ensureChatRoom is idempotent,
// but skipping the repeat write saves one Firestore write per message.
const ensuredRooms = new Set<string>();

/** Create the room document if missing (merge — never clobbers it). */
export async function ensureChatRoom(db: Firestore, chatId: string, uidA: string, uidB: string): Promise<void> {
  if (!ensuredRooms.has(chatId)) {
    await setDoc(
      doc(db, EXCHANGE_CHATS_COLLECTION, chatId),
      { participants: [uidA, uidB].sort(), updatedAt: serverTimestamp() },
      { merge: true }
    );
    ensuredRooms.add(chatId);
  }
}

async function writeMessage(
  db: Firestore,
  chatId: string,
  fromUid: string,
  fields: Record<string, unknown>
): Promise<string> {
  const parts = chatId.split('_');
  await ensureChatRoom(db, chatId, parts[0] ?? fromUid, parts[1] ?? fromUid);
  const ref = await addDoc(collection(db, EXCHANGE_CHATS_COLLECTION, chatId, 'messages'), {
    ...fields,
    from: fromUid,
    at: serverTimestamp(),
  });
  await updateDoc(doc(db, EXCHANGE_CHATS_COLLECTION, chatId), {
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(() => {
    /* room update is best-effort: the message itself is already stored */
  });
  return ref.id;
}

/** Send a text message to the server room. Returns the message doc id. */
export async function sendServerTextMessage(
  db: Firestore,
  chatId: string,
  fromUid: string,
  text: string
): Promise<string> {
  return writeMessage(db, chatId, fromUid, { type: 'text', text });
}

/** Send a photo message to the server room. Returns the message doc id. */
export async function sendServerPhotoMessage(
  db: Firestore,
  chatId: string,
  fromUid: string,
  photo: { photoUrl: string; photoPath: string; width: number; height: number; size: number }
): Promise<string> {
  return writeMessage(db, chatId, fromUid, { type: 'photo', text: '', ...photo });
}

/** Live subscription to one room's messages (oldest first). */
export function subscribeChatMessages(
  db: Firestore,
  chatId: string,
  onMessages: (messages: ServerChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, EXCHANGE_CHATS_COLLECTION, chatId, 'messages'),
    orderBy('at', 'asc'),
    limit(MAX_SERVER_MESSAGES)
  );
  return onSnapshot(
    q,
    (snap) => {
      const out: ServerChatMessage[] = [];
      for (const s of snap.docs) {
        const m = parseMessage(s);
        if (m) out.push(m);
      }
      onMessages(out);
    },
    () => {
      /* permission-denied (rules not published yet) or offline: the
         caller keeps the local copy; a later snapshot retries. */
    }
  );
}

/** Live subscription to every room I participate in. */
export function subscribeMyChatRooms(
  db: Firestore,
  uid: string,
  onRooms: (rooms: ServerChatRoom[]) => void
): Unsubscribe {
  const q = query(collection(db, EXCHANGE_CHATS_COLLECTION), where('participants', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const out: ServerChatRoom[] = [];
      for (const s of snap.docs) {
        const d = s.data();
        if (Array.isArray(d.participants) && d.participants.every((p: unknown) => typeof p === 'string')) {
          out.push({ chatId: s.id, participants: d.participants as string[] });
        }
      }
      onRooms(out);
    },
    () => {
      /* same as above: local chats keep working without the server */
    }
  );
}
