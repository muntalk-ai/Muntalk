// lib/microtalk.ts
// Micro-Talk (Phase 2-1 Track 2-B) — 3분 회화 헬퍼
// 순수 함수 모음: 프롬프트 빌더, 게스트 일일 제한, 리포트 파싱

import { PURPOSE_LABEL, PURPOSE_REGISTER, isLearningPurpose } from './purpose';
import type { LearningPurpose } from './purpose';

export const MICROTALK_SECONDS = 180;
export const GUEST_DAILY_LIMIT = 3;
const GUEST_KEY = 'mt_microtalk';

/** ?topic= 파라미터 검증 — 5개 purpose 중 하나만 허용 */
export function resolveTopic(param: string | null): LearningPurpose {
  return isLearningPurpose(param) ? param : 'daily';
}

/** 세션 시스템 프롬프트 */
export function buildMicroTalkPrompt(o: {
  targetLangLabel: string;
  nativeLangLabel: string;
  topicLabel: string;
  purpose?: LearningPurpose | null;
}): string {
  const purposeLine =
    o.purpose && isLearningPurpose(o.purpose)
      ? `Learner's goal: ${PURPOSE_LABEL[o.purpose]}. ${PURPOSE_REGISTER[o.purpose]}`
      : '';
  return `You are a friendly ${o.targetLangLabel} conversation partner for a 3-minute chat.
Topic: ${o.topicLabel}.
${purposeLine}
THIS CHAT'S TOPIC IS ${o.topicLabel.toUpperCase()} — every question you ask must be about this topic only. Do NOT drift to the learner's general goal or to other topics. If the topic is Daily Life, ask about daily routines, hobbies, food, or weekend plans — never about the office, work, or business meetings. If the topic is Business, stay on work topics.
Rules:
- MAX 2 short sentences per turn. Ask exactly ONE follow-up question at a time.
- Match the learner's level from their first message; simplify if they struggle.
- React to what they ACTUALLY said — never invent details they did not mention.
- When told the session is over, end warmly in one sentence.
- Speak ONLY in ${o.targetLangLabel}.
- PER-MESSAGE FEEDBACK (QA M-8): if the learner's latest message has a grammar or word-choice mistake, end your reply with a new line: "✏️ Correction: <their exact phrase> → <corrected phrase>". Correct ONLY their latest message — never your own words. If they made no mistake, add nothing after your reply.`.trim();
}

/** AI 첫 발화 생성용 프롬프트 */
export function buildOpeningPrompt(o: { targetLangLabel: string; topicLabel: string }): string {
  return `Start a 3-minute casual chat in ${o.targetLangLabel} about "${o.topicLabel}".
Write ONLY the opening line: one short, warm question (max 15 words) a friendly tutor would ask.
Ask about "${o.topicLabel}" only — if the topic is Daily Life, ask about daily routines, hobbies, food, or weekend plans; never about the office, work, or business meetings.
No greeting prefix, no explanation — just the question, in ${o.targetLangLabel}.`;
}

/** AI 답신 끝의 "✏️ Correction: ..." 줄을 분리한다 (QA M-8: 메시지별 교정 칩) */
export function splitCorrection(text: string): { reply: string; correction: string | null } {
  const m = text.match(/^([\s\S]*?)\n\s*✏️\s*Correction:\s*([\s\S]+?)\s*$/);
  if (!m) return { reply: text, correction: null };
  return { reply: m[1].trim(), correction: m[2].trim() };
}

export interface MicroTalkReport {
  utterances: number;
  newPhrase: string;
  feedback: string;
}

/** 종료 리포트 생성용 프롬프트 */
export function buildReportPrompt(o: {
  targetLangLabel: string;
  nativeLangLabel: string;
  transcript: string;
}): string {
  return `Summarize this 3-minute ${o.targetLangLabel} micro-chat in JSON:
{"utterances": N, "newPhrase": "...", "feedback": "..."}
- "utterances": number of times the LEARNER spoke (count their messages below)
- "newPhrase": the single most useful expression from the chat, in ${o.targetLangLabel} + ${o.nativeLangLabel} translation in parentheses
- "feedback": one warm sentence of overall praise in ${o.nativeLangLabel}, including one specific compliment about what they did well
- Use correct spacing in all English words (e.g. write "in Spanish", never "inSpanish")
Transcript:
${o.transcript}
Return ONLY valid JSON, no markdown, no code fences.`;
}

/** 리포트 JSON 안전 파싱 (실패 시 fallback) */
export function parseReportJson(
  raw: string,
  fallback: MicroTalkReport,
): MicroTalkReport {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return fallback;
    const p = JSON.parse(m[0]) as Partial<MicroTalkReport>;
    return {
      utterances: typeof p.utterances === 'number' ? p.utterances : fallback.utterances,
      newPhrase: typeof p.newPhrase === 'string' && p.newPhrase ? fixGluedLanguage(p.newPhrase) : fallback.newPhrase,
      feedback: typeof p.feedback === 'string' && p.feedback ? fixGluedLanguage(p.feedback) : fallback.feedback,
    };
  } catch {
    return fallback;
  }
}

/**
 * QA L-1: AI가 "inSpanish!"처럼 언어명 앞 띄어쓰기를 누락하는 경우가 있어
 * 리캡에 그대로 노출됐다. "in<Language>" 형태를 "in <Language>"로 되돌린다.
 */
const GLUED_LANGS = [
  'Spanish', 'English', 'Korean', 'French', 'German', 'Italian', 'Portuguese',
  'Russian', 'Japanese', 'Chinese', 'Arabic', 'Hindi', 'Vietnamese', 'Thai',
  'Indonesian', 'Malay', 'Dutch', 'Polish', 'Turkish', 'Swedish', 'Danish',
  'Norwegian', 'Finnish', 'Czech', 'Slovak', 'Hungarian', 'Romanian', 'Greek',
  'Ukrainian', 'Burmese', 'Khmer', 'Mongolian', 'Cantonese', 'Filipino',
];

export function fixGluedLanguage(text: string): string {
  let out = text;
  for (const lang of GLUED_LANGS) {
    out = out.replace(new RegExp(`\\bin${lang}\\b`, 'g'), `in ${lang}`);
  }
  return out;
}

// ── 게스트 1일 3회 제한 (localStorage) ─────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC 기준)
}

export interface GuestUsage {
  date: string;
  count: number;
}

export function getGuestUsage(): GuestUsage {
  const today = todayKey();
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return { date: today, count: 0 };
    const d = JSON.parse(raw) as GuestUsage;
    return d.date === today ? d : { date: today, count: 0 };
  } catch {
    return { date: today, count: 0 };
  }
}

/** 남은 횟수 (로그인 유저는 무제한 = Infinity) */
export function guestRemaining(): number {
  return Math.max(0, GUEST_DAILY_LIMIT - getGuestUsage().count);
}

/** 세션 시작 시 호출 — true면 시작 가능 */
export function consumeGuestSession(): boolean {
  const u = getGuestUsage();
  if (u.count >= GUEST_DAILY_LIMIT) return false;
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify({ date: u.date, count: u.count + 1 }));
  } catch { /* ignore */ }
  return true;
}
