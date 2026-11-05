// MunTalk Exchange — AI partner memory (shared by the chat page and API).
//
// What is stored: per-user, per-partner short facts the AI partner can
// recall in later chats (learner nickname, interests, stable facts such as
// goals or plans). Never real names, emails, or contact details.
// Storage: Firestore collection `exchange_memories`, doc id
// `${uid}_${partnerId}` (same one-doc-per-user-per-partner pattern as the
// waitlist). The client reads its own memory doc directly (rules-gated);
// the server writes it (admin) after a small Gemini summary call.
// Until the console rules are published, the client read fails with
// permission-denied and chats simply work without memory.

export const EXCHANGE_MEMORIES_COLLECTION = 'exchange_memories';

/** At most this many fact lines are kept per partner. */
export const MAX_MEMORY_FACTS = 10;

/** Cap on the memory text injected into the AI prompt. */
export const MAX_MEMORY_CHARS = 1000;

export type ExchangeMemory = {
  uid: string;
  partnerId: string;
  nickname?: string;
  interests?: string[];
  /** Short stable facts about the learner, one per line. */
  facts: string[];
  updatedAt?: unknown;
};

export function memoryDocId(uid: string, partnerId: string): string {
  return `${uid}_${partnerId}`;
}

/** Render stored memory as the short text injected into the AI prompt. */
export function formatMemoryForPrompt(mem: ExchangeMemory): string {
  const lines: string[] = [];
  if (mem.nickname) lines.push(`The learner goes by ${mem.nickname}.`);
  if (mem.interests && mem.interests.length > 0) {
    lines.push(`Their interests: ${mem.interests.join(', ')}.`);
  }
  for (const f of mem.facts.slice(0, MAX_MEMORY_FACTS)) {
    if (f) lines.push(`- ${f}`);
  }
  return lines.join('\n').slice(0, MAX_MEMORY_CHARS);
}
