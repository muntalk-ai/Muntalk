// MunTalk Exchange — memory + review pilot (Jay 2026-11-06).
//
// Three features, all inside the existing Gemini + Firestore budget
// (no new subscription, no new external service):
//   1. Vocabulary notebook + review reminders (exchange_vocab).
//   2. Post-chat review (exchange_reviews) — one short Gemini call per
//      finished chat, returning top mistakes + new words + one-line
//      summary; the same call also saves the vocab words.
//   3. AI speaks first (openers) — template-based, $0, no model call.
//      The partner greets a returning learner with a recalled memory
//      fact or an interest-based question, at most once per partner
//      per day, and the user can turn it off in Profile settings.
//
// Storage pattern (same as exchange_memories): the server writes via
// admin; the browser only reads its own docs (rules-gated). Until the
// console snippet is published, reads fail with permission-denied and
// the AI Review tab shows the empty/example state — the in-chat review
// card still works, because the server returns the review inline.
// Vocab "mark as known" is the one client write: owner-only, limited
// to the known / reviewCount / nextReviewAt fields (see
// firestore-snippets/exchange-memory-review.rules.txt).

export const EXCHANGE_VOCAB_COLLECTION = 'exchange_vocab';
export const EXCHANGE_REVIEWS_COLLECTION = 'exchange_reviews';

/** A word saved from a chat is due for review again after this long. */
export const VOCAB_REVIEW_AFTER_MS = 24 * 60 * 60 * 1000;

export type ReviewMistake = {
  /** What the learner wrote. */
  from: string;
  /** The more natural version. */
  to: string;
  /** One short reason, in the learner's language when possible. */
  why: string;
};

export type VocabWord = {
  word: string;
  /** Short meaning, in the learner's native language. */
  meaning: string;
  /** One example sentence using the word. */
  example: string;
};

export type SessionReview = {
  partnerId: string;
  partnerName: string;
  /** One encouraging summary sentence. */
  summary: string;
  mistakes: ReviewMistake[];
  vocab: VocabWord[];
  userTurns: number;
  /** Unix ms, for client-side sorting (no composite index needed). */
  createdAtMs: number;
};

export type ExchangeVocabItem = {
  uid: string;
  word: string;
  meaning: string;
  example: string;
  partnerId: string;
  partnerName: string;
  firstSeenAtMs: number;
  lastSeenAtMs: number;
  /** Unix ms — due for review when <= now. */
  nextReviewAtMs: number;
  reviewCount: number;
  known: boolean;
};

/** Normalize a word for the vocab doc id: lowercase, trim, keep letters. */
export function normalizeVocabWord(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N} ]+/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

export function vocabDocId(uid: string, word: string): string {
  return `${uid}_${normalizeVocabWord(word)}`;
}

export function reviewDocId(uid: string, partnerId: string, ts: number): string {
  return `${uid}_${partnerId}_${ts}`;
}

// ── AI speaks first (openers) ─────────────────────────────────────────
// Template-based: no model call, $0, instant. The opener is the AI
// partner greeting a returning learner first — with a recalled memory
// fact when one exists, otherwise an interest- or time-based question.
// Deterministic per (partner, day) so the same day always picks the
// same variant. The AI badge on the message still marks it as AI.

const OPENER_STORE_KEY = 'exchange-openers:v1';

export function openerSentToday(partnerId: string): boolean {
  try {
    if (typeof window === 'undefined') return true;
    const raw = window.localStorage.getItem(OPENER_STORE_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[partnerId] === new Date().toDateString();
  } catch {
    return true;
  }
}

export function markOpenerSent(partnerId: string): void {
  try {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(OPENER_STORE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[partnerId] = new Date().toDateString();
    window.localStorage.setItem(OPENER_STORE_KEY, JSON.stringify(map));
  } catch {
    /* opener cap is best-effort */
  }
}

const OPENER_TOGGLE_KEY = 'exchange-ai-openers:v1';

export function loadOpenerEnabled(): boolean {
  try {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(OPENER_TOGGLE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveOpenerEnabled(enabled: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(OPENER_TOGGLE_KEY, enabled ? 'on' : 'off');
  } catch {
    /* toggle is best-effort */
  }
}

function pickVariant(seed: string, count: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return count === 0 ? 0 : h % count;
}

function timeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 23) return 'evening';
  return 'night';
}

/**
 * Build a first message for a returning chat. `memoryFacts` are the raw
 * fact lines from exchange_memories (not the formatted prompt text).
 * `daysSinceLastChat` comes from the last message timestamp. Returns
 * null only when there is nothing to say — never for a returning chat
 * with at least one learner turn.
 */
export function buildOpener(opts: {
  partnerName: string;
  interests: string[];
  memoryFacts: string[];
  daysSinceLastChat: number;
}): string {
  const day = new Date().toDateString();
  const seed = `${opts.partnerName}|${day}`;
  if (opts.daysSinceLastChat >= 3) {
    const variants = [
      `Hey, long time no see! What have you been up to?`,
      `Hi! It's been a while — anything new you want to talk about?`,
      `Welcome back! I've missed our chats. What's new with you?`,
    ];
    return variants[pickVariant(seed, variants.length)];
  }
  if (opts.memoryFacts.length > 0) {
    const fact = opts.memoryFacts[pickVariant(`${seed}|fact`, opts.memoryFacts.length)];
    const followUps = [
      `Hi! I remember you told me: “${fact}” — how's that going?`,
      `Hey! Last time you mentioned “${fact}”. Did anything new happen with that?`,
      `Hi! I was thinking about what you said — “${fact}”. Tell me more?`,
    ];
    return followUps[pickVariant(seed, followUps.length)];
  }
  const interest = opts.interests[0];
  const tod = timeOfDay();
  if (interest) {
    const variants = [
      `Hi! I was just thinking about ${interest.toLowerCase()} — done anything fun with it lately?`,
      `Hey! Got a minute to chat about ${interest.toLowerCase()}?`,
      `Hi! How's your ${interest.toLowerCase()} going these days?`,
    ];
    return variants[pickVariant(seed, variants.length)];
  }
  const todVariants: Record<string, string[]> = {
    morning: [`Good morning! What are you up to today?`, `Morning! Got something fun to talk about today?`],
    afternoon: [`Hey! How's your day going so far?`, `Hi! Got a minute to chat?`],
    evening: [`Good evening! How was your day?`, `Hey! What was the best part of your day?`],
    night: [`Hi! Still up? Want to chat a little before bed?`, `Hey, night owl! What are you thinking about?`],
  };
  const list = todVariants[tod];
  return list[pickVariant(seed, list.length)];
}
