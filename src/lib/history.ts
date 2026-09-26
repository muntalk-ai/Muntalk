// Shared conversation-history truncation for Gemini prompts.
//
// Free-chat modules (Discover, Roleplay) previously sent the FULL transcript on
// every turn. That balloons tokens on long sessions and amplifies hallucination
// of stale context. coach (slice(-8)) and agora (slice(-10)) already cap it —
// this helper unifies the policy: keep only the most recent n messages.

export function truncateHistory<T>(msgs: T[], n: number = 10): T[] {
  if (!Array.isArray(msgs)) return [];
  return msgs.length > n ? msgs.slice(-n) : msgs;
}
