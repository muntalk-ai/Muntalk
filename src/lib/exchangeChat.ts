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
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
  type UploadTaskSnapshot,
} from 'firebase/storage';
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

// ── Phase 2: photo sharing ─────────────────────────────────────────────
// Photos live in Firebase Storage (object storage — no fixed capacity),
// never in Firestore (1 MiB per document) and never on the web server.
// The message document only carries the download URL + storage path.

export type CompressedPhoto = {
  blob: Blob;
  width: number;
  height: number;
  size: number;
};

export const MAX_PHOTO_ORIGINAL_BYTES = 10 * 1024 * 1024;
const MAX_PHOTO_EDGE = 1280;
const MAX_PHOTO_EDGE_RETRY = 1024;
const TARGET_PHOTO_BYTES = 200 * 1024;

function drawToCanvas(
  src: CanvasImageSource,
  width: number,
  height: number,
  maxEdge: number
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-unavailable');
  ctx.drawImage(src, 0, 0, w, h);
  return { canvas, width: w, height: h };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality));
}

async function decodeImage(file: File): Promise<{ width: number; height: number; draw: (maxEdge: number) => { canvas: HTMLCanvasElement; width: number; height: number } }> {
  // createImageBitmap handles JPEG/PNG/WebP; the <img> fallback covers
  // formats it rejects (e.g. HEIC on iOS Safari, which decodes it).
  try {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (maxEdge) => drawToCanvas(bitmap, bitmap.width, bitmap.height, maxEdge),
    };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('unsupported-image'));
        el.src = url;
      });
      return {
        width: img.naturalWidth,
        height: img.naturalHeight,
        draw: (maxEdge) => drawToCanvas(img, img.naturalWidth, img.naturalHeight, maxEdge),
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Compress a picked photo for upload: longest edge 1280px, JPEG 0.8,
 * aiming for ~200 KB. Retries at quality 0.6, then at 1024px, before
 * accepting the result (the Storage rule still caps uploads at 5 MB).
 * Throws Error('unsupported-image') when the browser cannot decode it.
 */
export async function compressImageFile(file: File): Promise<CompressedPhoto> {
  const decoded = await decodeImage(file);
  let { canvas, width, height } = decoded.draw(MAX_PHOTO_EDGE);
  let blob = await canvasToBlob(canvas, 0.8);
  if (!blob) throw new Error('compress-failed');
  if (blob.size > TARGET_PHOTO_BYTES) {
    blob = (await canvasToBlob(canvas, 0.6)) ?? blob;
  }
  if (blob.size > TARGET_PHOTO_BYTES) {
    ({ canvas, width, height } = decoded.draw(MAX_PHOTO_EDGE_RETRY));
    blob = (await canvasToBlob(canvas, 0.6)) ?? blob;
  }
  return { blob, width, height, size: blob.size };
}

export type UploadedPhoto = { photoUrl: string; photoPath: string };

/** Upload one compressed photo. The path is the message doc id, so the
    file and its message can always be found (and deleted) together. */
export async function uploadChatPhoto(
  storage: FirebaseStorage,
  chatId: string,
  messageId: string,
  blob: Blob,
  onProgress?: (pct: number) => void
): Promise<UploadedPhoto> {
  const photoPath = `chat-photos/${chatId}/${messageId}.jpg`;
  const storageRef = ref(storage, photoPath);
  const task = uploadBytesResumable(storageRef, blob, { contentType: 'image/jpeg' });
  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      (snap: UploadTaskSnapshot) => {
        if (onProgress && snap.totalBytes > 0) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      (err: unknown) => reject(err instanceof Error ? err : new Error('upload-failed')),
      () => resolve()
    );
  });
  const photoUrl = await getDownloadURL(storageRef);
  return { photoUrl, photoPath };
}

/** Best-effort delete of stored photo files (chat delete / block). */
export async function deleteChatPhotos(storage: FirebaseStorage, paths: string[]): Promise<void> {
  await Promise.allSettled(paths.map((p) => deleteObject(ref(storage, p))));
}

// ── Daily upload cap (client-side counter, design §7) ──────────────────
// 20 photos per person per day. This is the v1 enforcement; a server
// rule is a follow-up when abuse shows up (the Storage rule cannot
// count per-user daily uploads on its own).
const PHOTO_UPLOAD_COUNT_KEY = 'muntuz_exchange_photo_uploads_v1';
export const MAX_PHOTOS_PER_DAY = 20;

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function readUploadCount(): { date: string; count: number } {
  try {
    const raw = window.localStorage.getItem(PHOTO_UPLOAD_COUNT_KEY);
    if (!raw) return { date: utcToday(), count: 0 };
    const data = JSON.parse(raw) as Partial<{ date: unknown; count: unknown }>;
    if (data?.date !== utcToday() || typeof data.count !== 'number') return { date: utcToday(), count: 0 };
    return { date: utcToday(), count: data.count };
  } catch {
    return { date: utcToday(), count: 0 };
  }
}

export function photoUploadsToday(): number {
  return readUploadCount().count;
}

/** Record one successful upload. Returns false when the daily cap is hit. */
export function recordPhotoUpload(): boolean {
  const rec = readUploadCount();
  if (rec.count >= MAX_PHOTOS_PER_DAY) return false;
  try {
    window.localStorage.setItem(PHOTO_UPLOAD_COUNT_KEY, JSON.stringify({ date: rec.date, count: rec.count + 1 }));
  } catch {
    /* storage unavailable: the send already happened, do not block it */
  }
  return true;
}

/** First-message gate (Jay decision ②): photos only after the partner
    has replied at least once — a photo can never be the first message. */
export function hasPartnerReply(messages: Array<{ from: string }>): boolean {
  return messages.some((m) => m.from === 'partner');
}

export type SentPhoto = {
  serverId: string;
  photoUrl: string;
  photoPath: string;
  width: number;
  height: number;
  size: number;
};

/**
 * Full send flow for one photo: compress → upload → message document.
 * The message doc is created first so its id is the storage path.
 * Throws on decode failure ('unsupported-image'), oversize originals
 * are rejected by the caller before this runs.
 */
export async function sendServerPhoto(
  db: Firestore,
  storage: FirebaseStorage,
  chatId: string,
  fromUid: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<SentPhoto> {
  const compressed = await compressImageFile(file);
  const parts = chatId.split('_');
  await ensureChatRoom(db, chatId, parts[0] ?? fromUid, parts[1] ?? fromUid);
  const msgRef = doc(collection(db, EXCHANGE_CHATS_COLLECTION, chatId, 'messages'));
  const { photoUrl, photoPath } = await uploadChatPhoto(storage, chatId, msgRef.id, compressed.blob, onProgress);
  await setDoc(msgRef, {
    type: 'photo',
    text: '',
    from: fromUid,
    photoUrl,
    photoPath,
    width: compressed.width,
    height: compressed.height,
    size: compressed.size,
    at: serverTimestamp(),
  });
  await updateDoc(doc(db, EXCHANGE_CHATS_COLLECTION, chatId), {
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(() => {
    /* room update is best-effort: the message itself is already stored */
  });
  return {
    serverId: msgRef.id,
    photoUrl,
    photoPath,
    width: compressed.width,
    height: compressed.height,
    size: compressed.size,
  };
}
