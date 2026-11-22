'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { apiFetch } from '@/lib/apiClient';
import { AI_PARTNERS, AI_DISCLOSURE, type AiPartner } from '@/lib/exchangeAiPartners';
import {
  EXCHANGE_MEMORIES_COLLECTION,
  MAX_MEMORY_FACTS,
  formatMemoryForPrompt,
  memoryDocId,
  type ExchangeMemory,
} from '@/lib/exchangeMemory';
import {
  EXCHANGE_REVIEWS_COLLECTION,
  EXCHANGE_VOCAB_COLLECTION,
  buildOpener,
  loadOpenerEnabled,
  markOpenerSent,
  openerSentToday,
  saveOpenerEnabled,
  vocabDocId,
  type ExchangeVocabItem,
  type SessionReview,
} from '@/lib/exchangeMemoryReview';
import { useAuth } from '@/context/AuthContext';
import { isPremium } from '@/lib/subscription';
import BackButton from '@/components/BackButton';
import {
  AGE_BANDS,
  COMM_MODES,
  CORRECTION_PREFS,
  COUNTRIES,
  DAYS,
  GENDERS,
  GOALS,
  TIME_SLOTS,
  ageBandForAge,
  calcAge,
  saveExchangeProfile,
  utcLabel,
  type AgeBand,
  type Gender,
  type LearningGoal,
} from '@/lib/exchangeProfile';
import {
  createCallDoc,
  declineCall,
  endCallDoc,
  listenIncomingCalls,
  VoiceCallSession,
  type ConnectionState,
} from '@/lib/exchangeCall';

/*
/*
 * MunTalk Exchange — hidden lounge page (NOT linked from navigation).
 * Discover is split into two rooms:
 *   - AI Rooms: the AI partners only. A fixed banner at the top of
 *     the room and an "AI" badge on every AI card and AI message state
 *     plainly that these partners are AI, not real people.
 *   - People Rooms: a language-pair waitlist (stored in Firestore
 *     collection `exchange_waitlist`) plus the real Exchange profiles
 *     below it. Real cards show no match percentage and no verification
 *     badge (those fields do not exist in profile docs). Say hello —
 *     they accept before a chat opens — and voice calls use Firestore
 *     signaling in `exchange_calls` (see src/lib/exchangeCall.ts).
 *     Console snippet for Jay to paste: firestore-snippets/exchange-waitlist.rules.txt
 *     (repo firestore.rules is intentionally NOT touched).
 *   - Exchange opens on the AI room by default (AI-first).
 * AI chats call /api/exchange-ai-chat (Gemini) and live in browser state
 * only for this pilot. Memory: the browser reads the signed-in user's
 * memory doc (`exchange_memories/${uid}_${partnerId}`) and sends it with
 * the chat call so the partner can recall earlier chats; leaving a chat
 * saves new facts via the same API (one small summary call, only when
 * there are new learner turns). Until the console rules for the new
 * collection are published, memory reads fail with permission-denied and
 * chats simply work without memory.
 * Memory + review pilot (Jay 2026-11-06): (1) Vocabulary notebook —
 * finishing a chat with "Finish & review" runs one short Gemini call
 * that returns top mistakes + new words + one-line summary and saves
 * them server-side (`exchange_reviews`, `exchange_vocab`); the AI
 * Review tab shows the real words and corrections instead of demo
 * data, with a "words to review" card and mark-as-known. (2) Post-chat
 * review card — rendered inline in the chat room from the same call,
 * so it works even before the console rules for the two collections
 * are published. (3) AI speaks first — when the user opens the Chats
 * tab, an AI partner whose last message was answered may greet the
 * learner first with a recalled memory fact (template-based, $0, no
 * model call), at most once per partner per day; Profile settings can
 * turn it off. Console snippet for the two collections:
 * firestore-snippets/exchange-memory-review.rules.txt (repo
 * firestore.rules is intentionally NOT touched).
 * AI Review's "This week" chart now shows real per-day counts
 * (usage-week action); the Pro tab is otherwise still demo data. The
 * Profile tab is wired to Firestore for signed-in users (collection
 * `exchange_profiles`).
 * Header: the shared /logo.png M-ring badge with "Muntuz" (Jay
 * 2026-11-05 — same file the /muntuz landing uses, no new logo), plus a
 * Log in button for signed-out users (/login?next=/exchange; the /login
 * page already honours ?next=, so the global login flow is untouched).
 * Signed-in users without a profile get a banner to /exchange/setup,
 * the onboarding page that collects the same fields as the Profile tab.
 * Phase 1 profile fields (learning goal, country, gender, age band,
 * timezone, availability, comm mode, correction preference, same-gender
 * safety setting) are stored there too. The exact birthdate is never in
 * the public doc — it lives in `exchange_profiles/{uid}/private/identity`
 * (owner-only; console snippet:
 * firestore-snippets/exchange-profiles-phase1-private.rules.txt).
 * Discover People Rooms filter the real profiles by language, level,
 * interest, goal, gender, age band and timezone overlap. The gender
 * filter is free (Jay 2026-11-05, B안).
 */

type Tab = 'discover' | 'chats' | 'review' | 'pro' | 'profile';

type Room = 'ai' | 'people';

// Waitlist language pairs. Pilot focus is Korean ↔ English; the rest are
// selectable so other pairs can gather without a code change.
type PartnerStatus = 'idle' | 'pending' | 'matched';

// Real partner from Firestore `exchange_profiles` — never invented.
// `match` / `verified` do not exist in profile docs, so real cards show no
// match percentage and no verification badge (showing one would be fake).
// Phase 1 fields: goal / age band / country / timezone / availability /
// comm mode / correction preference / gender are public on the card.
// The exact birthdate is never in this doc — it lives in the private
// `private/identity` subcollection, owner-only (see
// firestore-snippets/exchange-profiles-phase1-private.rules.txt).
type RealPartner = {
  uid: string;
  name: string;
  flag: string;
  native: string;
  // Tandem-style: languages spoken fluently besides the native one.
  fluent: string[];
  learning: string;
  level: string;
  interests: string[];
  bio: string;
  gender: Gender;
  ageBand: AgeBand | '';
  country: string;
  goal: LearningGoal;
  timezone: string;
  utcOffsetMin: number;
  availability: { days: string[]; slots: string[]; perWeek: number };
  commMode: string;
  correctionPref: string;
  sameGenderOnly: boolean;
};

// Phase 1 human-profile fields live in src/lib/exchangeProfile.ts so the
// Profile tab and the /exchange/setup onboarding page share one source of
// truth (Jay 2026-11-05, PR #169, B안 — see goals/muntalk-exchange/files/
// human-exchange-profile-fields-analysis-2026-11-05.md).
// Local hour ranges for each slot, used for timezone-overlap matching.
const SLOT_HOURS: Record<string, [number, number]> = {
  Morning: [6, 12],
  Afternoon: [12, 18],
  Evening: [18, 24],
  Night: [0, 6],
};
// (calcAge / ageBandForAge / utcLabel live in src/lib/exchangeProfile.ts.)

// Do any of `aSlots` (at UTC offset aOff) overlap any of `bSlots`
// (at UTC offset bOff)? Slots are local hour ranges; each is converted
// to UTC and compared on a 24h circle (wrapping intervals are split).
function slotsOverlap(aSlots: string[], aOff: number, bSlots: string[], bOff: number): boolean {
  const toUtcRanges = (slots: string[], off: number): [number, number][] => {
    const out: [number, number][] = [];
    for (const s of slots) {
      const r = SLOT_HOURS[s];
      if (!r) continue;
      const start = (((r[0] * 60 - off) % 1440) + 1440) % 1440;
      const end = (((r[1] * 60 - off) % 1440) + 1440) % 1440;
      if (end <= start) {
        out.push([start, 1440]);
        out.push([0, end]);
      } else {
        out.push([start, end]);
      }
    }
    return out;
  };
  const a = toUtcRanges(aSlots, aOff);
  const b = toUtcRanges(bSlots, bOff);
  return a.some(([as, ae]) => b.some(([bs, be]) => as < be && bs < ae));
}

// Chat list time label, HelloTalk-style: today shows the clock time,
// yesterday shows "Yesterday HH:MM", this week shows the weekday,
// older shows M/D.
function relativeTime(ts: number | undefined): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay(d, now)) return `${hh}:${mm}`;
  if (sameDay(d, yesterday)) return `Yesterday ${hh}:${mm}`;
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const LANG_FLAG: Record<string, string> = {
  English: '🇺🇸',
  Korean: '🇰🇷',
  Spanish: '🇪🇸',
  Japanese: '🇯🇵',
  Portuguese: '🇧🇷',
  French: '🇫🇷',
  German: '🇩🇪',
  Indonesian: '🇮🇩',
  Hindi: '🇮🇳',
  Arabic: '🇸🇦',
  Mongolian: '🇲🇳',
  Persian: '🇮🇷',
  Lao: '🇱🇦',
  Polish: '🇵🇱',
  Vietnamese: '🇻🇳',
  Thai: '🇹🇭',
  Burmese: '🇲🇲',
  Russian: '🇷🇺',
  Chinese: '🇨🇳',
};

const profileToPartner = (uid: string, d: Record<string, unknown>): RealPartner => {
  const str = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v : fallback);
  const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((i): i is string => typeof i === 'string') : []);
  const native = str(d.nativeLang, '—');
  const avail = (d.availability && typeof d.availability === 'object' ? d.availability : {}) as Record<string, unknown>;
  return {
    uid,
    name: str(d.nickname, 'Partner'),
    flag: LANG_FLAG[native] || '🌐',
    native,
    fluent: strArr(d.fluentLangs),
    learning: str(d.targetLang, '—'),
    level: str(d.level, '—'),
    interests: strArr(d.interests),
    bio: str(d.bio, ''),
    gender: (GENDERS as readonly string[]).includes(d.gender as string) ? (d.gender as Gender) : 'Prefer not to say',
    ageBand: (AGE_BANDS as readonly string[]).includes(d.ageBand as string) ? (d.ageBand as AgeBand) : '',
    country: str(d.country, ''),
    goal: (GOALS as readonly string[]).includes(d.goal as string) ? (d.goal as LearningGoal) : 'Conversation',
    timezone: str(d.timezone, ''),
    utcOffsetMin: typeof d.utcOffsetMin === 'number' ? d.utcOffsetMin : 0,
    availability: {
      days: strArr(avail.days),
      slots: strArr(avail.slots),
      perWeek: typeof avail.perWeek === 'number' ? avail.perWeek : 0,
    },
    commMode: typeof d.commMode === 'string' && d.commMode ? d.commMode : 'Both',
    correctionPref: typeof d.correctionPref === 'string' && d.correctionPref ? d.correctionPref : 'Sometimes',
    sameGenderOnly: d.sameGenderOnly === true,
  };
};

// Voice call UI state. `phase` is the only thing rendered; the live
// RTCPeerConnection lives in the session ref below, never in React state.
type CallUi = {
  callId: string;
  peerUid: string;
  peerName: string;
  phase: 'outgoing' | 'incoming' | 'active';
  connection: ConnectionState;
  muted: boolean;
  startedAt: number | null;
};

type Msg = {
  id: number;
  from: 'me' | 'partner';
  text: string;
  ai?: boolean;
  /** Unix ms when the message was created — drives the chat list time label. */
  at?: number;
  /** Gallery photo shared with this AI reply (public/exchange-ai-avatars/...). */
  photo?: string;
  /** Natural rephrasing of the learner's previous message, when it could be improved. */
  correction?: string;
};

type Chat = {
  id: string;
  partnerId: string;
  name: string;
  avatar: string;
  gallery?: string[];
  flag?: string;
  isAi: boolean;
  messages: Msg[];
  /** A session review was already auto-saved for this chat (H-1). */
  autoReviewed?: boolean;
};

const CONTACT_GUARD = /(\b\d{2,4}[- ]?\d{3,4}[- ]?\d{4}\b|https?:\/\/|www\.|[\w.+-]+@[\w-]+\.[\w.]+|kakao|t\.me|instagram\.com)/i;

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'discover', label: 'Discover', icon: '🔍' },
  { id: 'chats', label: 'Chats', icon: '💬' },
  { id: 'review', label: 'AI Review', icon: '🤖' },
  { id: 'pro', label: 'Pro', icon: '⭐' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

let msgSeq = 100;

// Host check, same rule as src/middleware.ts (and the route-side
// isMuntuzHost from the S-1 fix): the /exchange page is shared with
// muntalk.com, so Muntuz-only behaviour in this file — chat persistence,
// auto-review, voice dictation, localised greetings — is gated on the
// Muntuz host. Only called from event handlers and effects (client-only),
// so `window` is always defined here.
function isMuntuzHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return host === 'muntuz.com' || host.endsWith('.muntuz.com');
}

// ── S-2: chat threads persisted in this browser ────────────────────────
// The pilot kept chats in memory only, so a refresh (or the sign-in
// redirect) wiped them. Threads now survive in localStorage on the same
// device; cross-device sync (a Firestore collection + rules) is a
// follow-up, not this PR. Guest and signed-in threads share the key —
// the trial modal's "picks up where it left off" promise is true on
// this device because localStorage survives the login redirect.
const CHATS_STORAGE_KEY = 'muntuz_exchange_chats_v1';
const MAX_STORED_CHATS = 20;
const MAX_STORED_MESSAGES = 100;

type PersistedChats = {
  v: 1;
  savedAt: number;
  activeChatId: string | null;
  chats: Chat[];
};

function loadStoredChats(): PersistedChats | null {
  try {
    const raw = window.localStorage.getItem(CHATS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<PersistedChats>;
    if (data?.v !== 1 || !Array.isArray(data.chats)) return null;
    const chats: Chat[] = [];
    for (const c of data.chats) {
      if (!c || typeof c.id !== 'string' || typeof c.partnerId !== 'string' || !Array.isArray(c.messages)) continue;
      const messages: Msg[] = [];
      for (const m of c.messages) {
        if (!m || typeof m.text !== 'string' || (m.from !== 'me' && m.from !== 'partner')) continue;
        messages.push({
          id: typeof m.id === 'number' ? m.id : 0,
          from: m.from,
          text: m.text,
          ai: m.ai === true,
          at: typeof m.at === 'number' ? m.at : undefined,
          photo: typeof m.photo === 'string' ? m.photo : undefined,
          correction: typeof m.correction === 'string' ? m.correction : undefined,
        });
      }
      chats.push({
        id: c.id,
        partnerId: c.partnerId,
        name: typeof c.name === 'string' ? c.name : '',
        avatar: typeof c.avatar === 'string' ? c.avatar : '',
        gallery: Array.isArray(c.gallery) ? c.gallery.filter((g): g is string => typeof g === 'string') : undefined,
        flag: typeof c.flag === 'string' ? c.flag : undefined,
        isAi: c.isAi === true,
        messages,
        autoReviewed: c.autoReviewed === true ? true : undefined,
      });
    }
    return {
      v: 1,
      savedAt: typeof data.savedAt === 'number' ? data.savedAt : 0,
      activeChatId: typeof data.activeChatId === 'string' ? data.activeChatId : null,
      chats,
    };
  } catch {
    return null;
  }
}

// ── M-5: opening line in the learner's own target language ─────────────
// The static per-partner greeting was partner-centric English ("Let's
// practice English" from Jiyoung, a Korean native learning English) even
// for a user learning Korean. The greeting is now built at chat-open
// time from the user's profile target language; the static greeting
// stays as the fallback for unknown languages and non-Muntuz hosts.
const GREETING_BY_TARGET: Record<string, (name: string) => string> = {
  English: (name) =>
    `Hi! I'm ${name}, your AI practice partner. Let's practice English together — what did you do today?`,
  Korean: (name) => `안녕하세요! 저는 ${name}, AI 연습 파트너예요. 같이 한국어 연습해요 — 오늘 뭐 했어요?`,
  Spanish: (name) => `¡Hola! Soy ${name}, tu compañera de práctica con IA. Practiquemos español juntos — ¿qué hiciste hoy?`,
  Japanese: (name) => `こんにちは！${name}です。AI練習パートナーです。一緒に日本語を練習しましょう — 今日は何をしましたか？`,
  Portuguese: (name) => `Olá! Eu sou ${name}, sua parceira de prática com IA. Vamos praticar português juntos — o que você fez hoje?`,
};

function greetingForChat(p: AiPartner, target: string): string {
  const build = GREETING_BY_TARGET[target];
  return build ? build(p.name) : p.greeting;
}

// ── H-7: Web Speech API dictation ──────────────────────────────────────
// Minimal local typing: the DOM lib in this repo has no
// SpeechRecognition declarations. Dictation fills the text input; it is
// never confused with VoiceCallSession (real-person WebRTC calls).
type SpeechRecognitionResultLike = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};
type SpeechRecognitionErrorLike = { error: string };
type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// BCP-47 language for dictation, from the user's profile target
// language (the five languages the profile form offers).
const SPEECH_LANG: Record<string, string> = {
  English: 'en-US',
  Korean: 'ko-KR',
  Spanish: 'es-ES',
  Japanese: 'ja-JP',
  Portuguese: 'pt-BR',
};

function speechLangFor(target: string): string {
  return SPEECH_LANG[target] ?? 'en-US';
}

export default function ExchangePage() {
  // 뒤로가기 폴백 (Jay 2026-11-06): muntuz.com 호스트에서는 랜딩이
  // `/`에 있으므로 `/`로, 그 외 호스트(Preview·muntalk.com)에서는
  // Muntuz 랜딩 라우트인 `/muntuz`로. 클릭 시에만 쓰이고 렌더 결과에
  // 안 쓰이므로 SSR/하이드레이션에 영향이 없다.
  const backFallback = (() => {
    if (typeof window === 'undefined') return '/muntuz';
    const host = window.location.hostname;
    return host === 'muntuz.com' || host.endsWith('.muntuz.com') ? '/' : '/muntuz';
  })();
  const [tab, setTab] = useState<Tab>('discover');
  const [room, setRoom] = useState<Room>('ai');
  const [chats, setChats] = useState<Chat[]>([]);
  const [aiSending, setAiSending] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistJoining, setWaitlistJoining] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [waitlistReload, setWaitlistReload] = useState(0);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  // S-2: restored chats load once after mount (see the effect below);
  // the save effect waits for this flag so it never overwrites stored
  // threads with the empty initial state.
  const [chatsLoaded, setChatsLoaded] = useState(false);
  // H-7: Web Speech API dictation. `speechSupported` starts false so
  // the server render matches (no hydration mismatch); it flips after
  // mount when the API exists.
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const dictationBaseRef = useRef('');
  const [toast, setToast] = useState('');
  // H-6 / Q9: 가짜 7일 체험 버튼이 없어져 이 값은 더 이상 켜지지
  // 않는다 (항상 false). 헤더 PRO 배지와 주간 리포트 게이트가 아직
  // 이 값을 보므로, 실제 구독(getSubscription)으로 바꾸는 전체
  // 배선은 별도 작업으로 남아 있다. 카운터 분모용 실제 Pro 여부는
  // 아래 realPro state를 쓴다.
  const [pro] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'biannual' | 'yearly'>('yearly');
  // Q7 / M-4: 오늘 새로 시작한 AI 채팅 수 (표시용 카운터) + 실제
  // Pro 여부 (카운터 분모 20/50용으로만 읽는다).
  const [newChatsToday, setNewChatsToday] = useState(0);
  const [realPro, setRealPro] = useState(false);
  const newChatPendingRef = useRef<Set<string>>(new Set());
  // Guest trial (5 minutes, no sign-in — see requireChatAccess).
  const [guestTrial, setGuestTrial] = useState<GuestTrial | null>(null);
  const [trialLeftMs, setTrialLeftMs] = useState<number | null>(null);
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  // Trial-ended prompt, dismissed once per session: the 1 s countdown
  // interval re-opens the prompt on every tick, so a plain "Later"
  // never sticks. Once the user closes it, it stays closed for this
  // session (a ref, not state — the interval closure reads it without
  // re-subscribing). Sending again still stays blocked by the trial
  // gate; the user just gets a toast instead of the prompt.
  const trialExpiredDismissedRef = useRef(false);
  const openTrialExpired = () => {
    if (!trialExpiredDismissedRef.current) setShowTrialExpired(true);
  };
  const dismissTrialExpired = () => {
    trialExpiredDismissedRef.current = true;
    setShowTrialExpired(false);
  };

  // Photo lightbox — tap a partner avatar or gallery photo to see the
  // original high-resolution file. `images` enables prev/next inside a
  // gallery; a single photo has no list. The alt text is derived from the
  // current photo (name + index) at render time, so it stays correct
  // while stepping through a gallery.
  const [lightbox, setLightbox] = useState<{ src: string; name: string; images?: string[]; index?: number } | null>(null);
  const openLightbox = (src: string, name: string, images?: string[]) =>
    setLightbox({ src, name, images, index: images ? images.indexOf(src) : undefined });
  const stepLightbox = (dir: 1 | -1) => {
    setLightbox((cur) => {
      if (!cur || !cur.images || cur.images.length === 0) return cur;
      const next = ((((cur.index ?? 0) + dir) % cur.images.length) + cur.images.length) % cur.images.length;
      return { ...cur, index: next, src: cur.images[next] };
    });
  };
  const lightboxAlt =
    lightbox && lightbox.images && lightbox.images.length > 1
      ? `Lifestyle photo ${(lightbox.index ?? 0) + 1} of AI partner ${lightbox.name}`
      : lightbox
        ? `${lightbox.name} AI partner photo`
        : '';

  // Lightbox image load state — the original file is large, so show a
  // spinner while it loads and a message if it fails, instead of a blank
  // dark screen. Reset on every photo change (open or step).
  const lightboxImgRef = useRef<HTMLImageElement | null>(null);
  const [lightboxLoading, setLightboxLoading] = useState(true);
  const [lightboxError, setLightboxError] = useState(false);
  useEffect(() => {
    if (!lightbox) return;
    setLightboxLoading(true);
    setLightboxError(false);
    // A cached image may already be complete before onLoad fires.
    const img = lightboxImgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLightboxLoading(false);
  }, [lightbox]);

  // Lightbox keys + scroll lock while open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') stepLightbox(1);
      if (e.key === 'ArrowLeft') stepLightbox(-1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps — stepLightbox only uses the stable setLightbox.
  }, [lightbox]);

  // AI partner memory (per partner, loaded once per page load).
  // memoryRef: partnerId -> formatted memory text sent with chat calls.
  // memorySavedRef: chatId -> learner turns already saved, so leaving a
  // chat only triggers a summary call when there are new turns.
  const memoryRef = useRef<Record<string, string>>({});
  const memorySavedRef = useRef<Record<string, number>>({});
  // Raw memory fact lines per partner (for the "AI speaks first" opener —
  // the formatted prompt text in memoryRef is not usable for quoting).
  const memoryFactsRef = useRef<Record<string, string[]>>({});

  // Memory + review pilot state.
  // `review` is the latest session review for the open chat (rendered
  // inline in the chat room); it is cleared when the chat changes.
  const [review, setReview] = useState<SessionReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  // AI Review tab data (signed-in only, rules-gated reads). Loaded lazily
  // when the tab opens; empty until the console rules are published.
  const [vocabItems, setVocabItems] = useState<ExchangeVocabItem[]>([]);
  const [reviewItems, setReviewItems] = useState<SessionReview[]>([]);
  // H-1: real per-day AI-message counts for the "This week" chart
  // (api_daily_usage via the usage-week action). null = not loaded yet.
  const [weekCounts, setWeekCounts] = useState<{ day: string; count: number }[] | null>(null);
  const [weekCountsLoading, setWeekCountsLoading] = useState(false);
  const [reviewDataLoaded, setReviewDataLoaded] = useState(false);
  const [reviewDataLoading, setReviewDataLoading] = useState(false);
  // "AI speaks first" toggle — pilot setting, browser-local (localStorage).
  // Default on; the opener itself is capped at once per partner per day.
  const [aiOpeners, setAiOpeners] = useState<boolean>(() => loadOpenerEnabled());

  // Profile (demo, browser state only)
  const [nativeLang, setNativeLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Korean');
  const [fluentLangs, setFluentLangs] = useState<string[]>([]);
  const [level, setLevel] = useState('Intermediate');
  const [interestSel, setInterestSel] = useState<string[]>(['Travel', 'Cooking']);
  // Set when the user taps an interest chip. The Firestore load below must
  // never overwrite a selection the user already made (load resolving after
  // a tap used to wipe it, so a tap looked dead and never persisted).
  const interestEditedRef = useRef(false);
  // Same guard as interests: the Firestore load must never overwrite a
  // fluent-language tap that landed before the load resolved.
  const fluentEditedRef = useRef(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [hideOnline, setHideOnline] = useState(false);
  const [allowVoice, setAllowVoice] = useState(true);

  // Phase 1 human-profile fields.
  const [learningGoal, setLearningGoal] = useState<LearningGoal>('Conversation');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState<Gender>('Prefer not to say');
  // Birthdate is the user's own input for the 18+ gate. Only the derived
  // age band is ever stored in the public profile doc or shown to anyone;
  // the exact date goes to the private subcollection (see saveProfile).
  const [birthdate, setBirthdate] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand | ''>('');
  const [commMode, setCommMode] = useState('Both');
  const [correctionPref, setCorrectionPref] = useState('Sometimes');
  const [availDays, setAvailDays] = useState<string[]>(['Sat', 'Sun']);
  const [availSlots, setAvailSlots] = useState<string[]>(['Evening']);
  const [availPerWeek, setAvailPerWeek] = useState(3);
  const [sameGenderOnly, setSameGenderOnly] = useState(false);
  const [timezone, setTimezone] = useState('');
  const [utcOffsetMin, setUtcOffsetMin] = useState(0);
  const [saveError, setSaveError] = useState('');

  // Timezone is detected from the device, not typed in. Recompute on
  // every save too, in case the user travelled since the page loaded.
  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      setUtcOffsetMin(-new Date().getTimezoneOffset());
    } catch {
      setTimezone('UTC');
      setUtcOffsetMin(0);
    }
  }, []);

  // Firestore wiring for the Profile tab only.
  // Stored in `exchange_profiles`: nickname / languages / level /
  // interests / bio / learningGoal / country / gender / ageBand /
  // timezone / utcOffsetMin / availability / commMode / correctionPref /
  // sameGenderOnly — never real name, email, contact details, or the
  // exact birthdate (see saveProfile for where the birthdate goes).
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState('');
  // Whether a public `exchange_profiles/{uid}` doc exists. null = not
  // known yet (logged out or still loading). Drives the setup banner:
  // signed-in users without a profile get pointed to /exchange/setup.
  const [profileExists, setProfileExists] = useState<boolean | null>(null);

  // ── Discover: real partners from `exchange_profiles` ──────────────
  // Signed-in users only (profile reads need auth). No demo users here:
  // empty query results render the empty state, never fake cards.
  const [realPartners, setRealPartners] = useState<RealPartner[] | null>(null);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnersError, setPartnersError] = useState('');
  const [statuses, setStatuses] = useState<Record<string, PartnerStatus>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRealPartners(null);
      setPartnersError('');
      return;
    }
    let cancelled = false;
    setPartnersLoading(true);
    setPartnersError('');
    // Client-side filter on purpose: `status` is absent on most profile
    // docs, and Firestore `!=` / `not-in` queries exclude docs where the
    // field is missing — a server-side filter would hide real partners.
    getDocs(query(collection(db, 'exchange_profiles'), limit(50)))
      .then((snap) => {
        if (cancelled) return;
        const list = snap.docs
          .filter((d) => d.id !== user.uid)
          .filter((d) => {
            const s = d.data().status;
            return s !== 'paused' && s !== 'banned';
          })
          .map((d) => profileToPartner(d.id, d.data()));
        setRealPartners(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setRealPartners([]);
        setPartnersError(
          (err as { code?: string }).code === 'permission-denied'
            ? 'Could not load partners: Exchange profile read permissions are not published yet.'
            : 'Could not load partners. Please try again.'
        );
      })
      .finally(() => {
        if (!cancelled) setPartnersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // ── Discover filters (People Rooms) ──────────────────────────────
  // Free for everyone, including the gender filter (Jay 2026-11-05, B안).
  // Filters apply to the real `exchange_profiles` list above — never to
  // the AI room, which has no language filter by design.
  // Tandem-style search: "Speaks" matches a partner's native language
  // OR any of their fluent languages; "Learning" matches what they are
  // learning, and "Level" is their level in that language
  // (Beginner / Intermediate / Advanced).
  const [fSpeaks, setFSpeaks] = useState('All');
  const [fLearning, setFLearning] = useState('All');
  const [fLevel, setFLevel] = useState('All');
  const [fInterest, setFInterest] = useState('All');
  const [fGoal, setFGoal] = useState<LearningGoal | 'All'>('All');
  const [fGender, setFGender] = useState<Gender | 'All'>('All');
  const [fAgeBand, setFAgeBand] = useState<AgeBand | 'All'>('All');
  const [fOverlap, setFOverlap] = useState(false);

  const filterSpeaks = Array.from(new Set((realPartners || []).flatMap((p) => [p.native, ...p.fluent]))).sort();
  const filterLearnings = Array.from(new Set((realPartners || []).map((p) => p.learning))).sort();
  const filterInterests = Array.from(new Set((realPartners || []).flatMap((p) => p.interests))).sort();
  const filtersActive =
    fSpeaks !== 'All' || fLearning !== 'All' || fLevel !== 'All' || fInterest !== 'All' || fGoal !== 'All' || fGender !== 'All' || fAgeBand !== 'All' || fOverlap;
  const clearFilters = () => {
    setFSpeaks('All');
    setFLearning('All');
    setFLevel('All');
    setFInterest('All');
    setFGoal('All');
    setFGender('All');
    setFAgeBand('All');
    setFOverlap(false);
  };

  const visiblePartners = (realPartners || []).filter((p) => {
    if (fSpeaks !== 'All' && p.native !== fSpeaks && !p.fluent.includes(fSpeaks)) return false;
    if (fLearning !== 'All' && p.learning !== fLearning) return false;
    if (fLevel !== 'All' && p.level !== fLevel) return false;
    if (fInterest !== 'All' && !p.interests.includes(fInterest)) return false;
    if (fGoal !== 'All' && p.goal !== fGoal) return false;
    if (fGender !== 'All' && p.gender !== fGender) return false;
    if (fAgeBand !== 'All' && p.ageBand !== fAgeBand) return false;
    // Timezone overlap: at least one of the partner's available slots
    // overlaps one of mine, after converting both to UTC. Uses my
    // Profile availability (defaults: Sat–Sun evenings) and the
    // device-detected timezone until the profile is saved.
    if (
      fOverlap &&
      (availSlots.length === 0 ||
        p.availability.slots.length === 0 ||
        !slotsOverlap(p.availability.slots, p.utcOffsetMin, availSlots, utcOffsetMin))
    )
      return false;
    // Safety: a partner who only wants to be found by the same gender is
    // hidden from everyone else — including signed-out viewers, whose
    // gender is "Prefer not to say".
    if (p.sameGenderOnly && (gender === 'Prefer not to say' || p.gender !== gender)) return false;
    return true;
  });

  // ── Voice call state ───────────────────────────────────────────────
  const [call, setCall] = useState<CallUi | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const callRef = useRef<CallUi | null>(null);
  callRef.current = call;
  const sessionRef = useRef<VoiceCallSession | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Elapsed timer while a call is active.
  useEffect(() => {
    if (!call || call.phase !== 'active' || !call.startedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - (call.startedAt as number)) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [call?.phase, call?.startedAt]);

  const clearCallLocally = () => {
    sessionRef.current?.dispose();
    sessionRef.current = null;
    setCall(null);
  };

  const peerDisplayName = async (uid: string): Promise<string> => {
    try {
      const snap = await getDoc(doc(db, 'exchange_profiles', uid));
      if (snap.exists() && typeof snap.data().nickname === 'string' && snap.data().nickname.trim()) {
        return snap.data().nickname as string;
      }
    } catch {
      // Fall through to the generic label.
    }
    return 'Partner';
  };

  // Incoming ringing calls for this user. While a call UI is already open,
  // new ringing calls are ignored (1:1 only — no call waiting).
  useEffect(() => {
    if (authLoading || !user) return;
    const unsub = listenIncomingCalls(user.uid, (ringing) => {
      const current = callRef.current;
      if (current) {
        // Our own incoming banner disappears if the caller hung up first.
        if (current.phase === 'incoming' && !ringing.some((c) => c.id === current.callId)) {
          sessionRef.current?.dispose();
          sessionRef.current = null;
          setCall(null);
        }
        return;
      }
      const first = ringing[0];
      if (!first) return;
      void peerDisplayName(first.callerId).then((name) => {
        if (callRef.current) return; // something started meanwhile
        setCall({
          callId: first.id,
          peerUid: first.callerId,
          peerName: name,
          phase: 'incoming',
          connection: 'new',
          muted: false,
          startedAt: null,
        });
      });
    });
    return unsub;
  }, [user, authLoading]);

  // Never leak a mic or a PeerConnection on unmount / navigation away.
  useEffect(
    () => () => {
      sessionRef.current?.dispose();
      sessionRef.current = null;
    },
    []
  );

  const startVoiceCall = async (partner: RealPartner) => {
    if (!user) {
      showToast('Sign in to start a voice call.');
      return;
    }
    if (callRef.current) {
      showToast('You are already in a call.');
      return;
    }
    const callId = await createCallDoc(user.uid, partner.uid).catch((err) => {
      showToast(
        (err as { code?: string }).code === 'permission-denied'
          ? 'Could not start the call: Exchange call permissions are not published yet.'
          : 'Could not start the call. Please try again.'
      );
      return null;
    });
    if (!callId) return;
    const session = new VoiceCallSession(callId, user.uid, true, {
      onRemoteStream: (stream) => {
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
      },
      onConnectionState: (state) => {
        setCall((c) => (c && c.callId === callId ? { ...c, connection: state } : c));
      },
      onCallStatus: (status, doc) => {
        if (status === 'declined') {
          sessionRef.current?.dispose();
          sessionRef.current = null;
          setCall(null);
          showToast(`${partner.name} declined the call.`);
        } else if (status === 'ended') {
          sessionRef.current?.dispose();
          sessionRef.current = null;
          setCall(null);
          showToast('Call ended.');
        } else if (status === 'active' && doc.answer) {
          setCall((c) => (c && c.callId === callId ? { ...c, phase: 'active', startedAt: Date.now() } : c));
        }
      },
    });
    sessionRef.current = session;
    setCall({
      callId,
      peerUid: partner.uid,
      peerName: partner.name,
      phase: 'outgoing',
      connection: 'new',
      muted: false,
      startedAt: null,
    });
    try {
      await session.startAsCaller();
    } catch (err) {
      // Mic denied, or offer write failed: no half-open call left behind.
      session.dispose();
      sessionRef.current = null;
      setCall(null);
      await endCallDoc(callId);
      showToast(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Allow the mic to make a voice call.'
          : 'Could not start the call. Please try again.'
      );
    }
  };

  const acceptIncomingCall = async () => {
    const current = callRef.current;
    if (!current || current.phase !== 'incoming' || !user) return;
    const { callId } = current;
    let offer: RTCSessionDescriptionInit | undefined;
    try {
      const snap = await getDoc(doc(db, 'exchange_calls', callId));
      if (!snap.exists() || snap.data().status !== 'ringing') {
        setCall(null);
        showToast('This call is no longer ringing.');
        return;
      }
      offer = snap.data().offer as RTCSessionDescriptionInit | undefined;
    } catch {
      showToast('Could not accept the call. Please try again.');
      return;
    }
    if (!offer) {
      showToast('Could not accept the call: no offer from the caller yet.');
      return;
    }
    const session = new VoiceCallSession(callId, user.uid, false, {
      onRemoteStream: (stream) => {
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
      },
      onConnectionState: (state) => {
        setCall((c) => (c && c.callId === callId ? { ...c, connection: state } : c));
      },
      onCallStatus: (status) => {
        if (status === 'ended' || status === 'declined') {
          sessionRef.current?.dispose();
          sessionRef.current = null;
          setCall(null);
          showToast('Call ended.');
        }
      },
    });
    sessionRef.current = session;
    try {
      await session.acceptAsCallee(offer);
      setCall((c) => (c && c.callId === callId ? { ...c, phase: 'active', startedAt: Date.now() } : c));
    } catch (err) {
      session.dispose();
      sessionRef.current = null;
      setCall(null);
      showToast(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Allow the mic to answer a voice call.'
          : 'Could not accept the call. Please try again.'
      );
    }
  };

  const declineIncomingCall = async () => {
    const current = callRef.current;
    if (!current || current.phase !== 'incoming') return;
    const callId = current.callId;
    setCall(null);
    try {
      await declineCall(callId);
    } catch {
      // Caller already hung up — banner is gone either way.
    }
  };

  const endVoiceCall = async () => {
    const session = sessionRef.current;
    setCall(null);
    if (session) {
      await session.hangup();
      sessionRef.current = null;
    }
  };

  const toggleCallMute = () => {
    const session = sessionRef.current;
    if (!session) return;
    const muted = session.toggleMute();
    setCall((c) => (c ? { ...c, muted } : c));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      interestEditedRef.current = false;
      fluentEditedRef.current = false;
      setProfileLoaded(false);
      setProfileExists(null);
      setProfileError('');
      return;
    }
    let cancelled = false;
    // A fresh load for this user: user edits from here on win over the doc.
    interestEditedRef.current = false;
    fluentEditedRef.current = false;
    setProfileLoading(true);
    getDoc(doc(db, 'exchange_profiles', user.uid))
      .then((snap) => {
        if (cancelled) return;
        setProfileExists(snap.exists());
        if (snap.exists()) {
          const d = snap.data();
          if (typeof d.nativeLang === 'string') setNativeLang(d.nativeLang);
          if (typeof d.targetLang === 'string') setTargetLang(d.targetLang);
          if (typeof d.level === 'string') setLevel(d.level);
          if (!fluentEditedRef.current && Array.isArray(d.fluentLangs)) setFluentLangs(d.fluentLangs.filter((l): l is string => typeof l === 'string'));
          if (!interestEditedRef.current && Array.isArray(d.interests)) setInterestSel(d.interests.filter((i): i is string => typeof i === 'string'));
          if (typeof d.nickname === 'string') setNickname(d.nickname);
          if (typeof d.bio === 'string') setBio(d.bio);
          if (typeof d.learningGoal === 'string' && (GOALS as readonly string[]).includes(d.learningGoal)) setLearningGoal(d.learningGoal as LearningGoal);
          if (typeof d.country === 'string') setCountry(d.country);
          if (typeof d.gender === 'string' && (GENDERS as readonly string[]).includes(d.gender)) setGender(d.gender as Gender);
          if (typeof d.ageBand === 'string' && (AGE_BANDS as readonly string[]).includes(d.ageBand)) setAgeBand(d.ageBand as AgeBand);
          if (typeof d.commMode === 'string' && d.commMode) setCommMode(d.commMode);
          if (typeof d.correctionPref === 'string' && d.correctionPref) setCorrectionPref(d.correctionPref);
          if (typeof d.sameGenderOnly === 'boolean') setSameGenderOnly(d.sameGenderOnly);
          if (d.availability && typeof d.availability === 'object') {
            const a = d.availability as Record<string, unknown>;
            if (Array.isArray(a.days)) setAvailDays(a.days.filter((x): x is string => typeof x === 'string'));
            if (Array.isArray(a.slots)) setAvailSlots(a.slots.filter((x): x is string => typeof x === 'string'));
            if (typeof a.perWeek === 'number') setAvailPerWeek(a.perWeek);
          }
        }
        setProfileLoaded(true);
        setProfileError('');
      })
      .catch((err) => {
        if (cancelled) return;
        // Never fail silently: keep demo values but say so.
        setProfileError(
          (err as { code?: string }).code === 'permission-denied'
            ? 'Could not load your saved profile: Exchange profile permissions are not published yet. Showing demo values.'
            : 'Could not load your saved profile. Showing demo values.'
        );
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    // Birthdate lives in the private subcollection, owner-only (see
    // firestore-snippets/exchange-profiles-phase1-private.rules.txt).
    // Best-effort: until that rule is published the read fails with
    // permission-denied and the date input simply stays empty — the
    // public profile still loads and the age band still comes from it.
    getDoc(doc(db, 'exchange_profiles', user.uid, 'private', 'identity'))
      .then((snap) => {
        if (cancelled || !snap.exists()) return;
        const d = snap.data();
        if (typeof d.birthdate === 'string') setBirthdate(d.birthdate);
      })
      .catch(() => {
        // Silent: a missing rule must never break the profile load.
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // People room = waitlist (AI-first). The count is the real number of
  // exchange_waitlist documents — one per user, no language pair:
  // people are matched by their own native / fluent / learning
  // languages (Tandem-style), so the waitlist no longer splits by pair.
  // If the console rules for the new collection are not published yet,
  // the query fails with permission-denied: the count stays unknown
  // (never faked) and a notice is shown instead.
  useEffect(() => {
    if (room !== 'people' || !user) return;
    let cancelled = false;
    setWaitlistLoading(true);
    setWaitlistError('');
    setWaitlistJoined(false);
    getDocs(query(collection(db, 'exchange_waitlist')))
      .then((snap) => {
        if (cancelled) return;
        setWaitlistCount(snap.size);
        setWaitlistJoined(snap.docs.some((d) => d.data().uid === user.uid));
      })
      .catch((err) => {
        if (cancelled) return;
        setWaitlistCount(null);
        setWaitlistError(
          (err as { code?: string }).code === 'permission-denied'
            ? 'Waiting count is not available yet: waitlist read permissions are not published yet.'
            : 'Waiting count could not be loaded.'
        );
      })
      .finally(() => {
        if (!cancelled) setWaitlistLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [room, user, waitlistReload]);

  // One waitlist entry per user: doc id is the uid. Only uid and
  // createdAt are stored — the user's languages already live in their
  // Exchange profile, so no pair is recorded.
  const joinWaitlist = async () => {
    if (!user || waitlistJoining) return;
    setWaitlistJoining(true);
    try {
      await setDoc(
        doc(db, 'exchange_waitlist', user.uid),
        { uid: user.uid, createdAt: serverTimestamp() },
        { merge: true }
      );
      setWaitlistJoined(true);
      setWaitlistError('');
      setWaitlistReload((r) => r + 1);
      showToast('Joined the People Rooms waitlist.');
    } catch (err) {
      setWaitlistError(
        (err as { code?: string }).code === 'permission-denied'
          ? 'Could not join yet: waitlist permissions are not published yet. Your spot was not saved.'
          : 'Could not join the waitlist. Please try again.'
      );
    } finally {
      setWaitlistJoining(false);
    }
  };

  // Save goes through the shared module (src/lib/exchangeProfile.ts) so
  // the Profile tab and the /exchange/setup onboarding page write exactly
  // the same doc shape with the same 18+ gate. Toast wording is kept
  // identical to the pre-refactor behaviour.
  const saveProfile = async () => {
    if (!user) {
      showToast('Sign in to save your Exchange profile to your account.');
      return;
    }
    setSaveError('');
    const result = await saveExchangeProfile(user.uid, {
      nickname,
      nativeLang,
      targetLang,
      fluentLangs,
      level,
      interests: interestSel,
      bio,
      learningGoal,
      country,
      gender,
      birthdate,
      commMode,
      correctionPref,
      availDays,
      availSlots,
      availPerWeek,
      sameGenderOnly,
    });
    if (result.ok === false) {
      if (result.error === 'validation') {
        setSaveError(result.message || 'Could not save your profile.');
        return;
      }
      showToast(
        result.error === 'permission-denied'
          ? 'Could not save: Exchange profile permissions are not published yet. Your changes are kept on this page.'
          : 'Could not save your profile. Please try again.'
      );
      return;
    }
    setAgeBand(result.band);
    setTimezone(result.timezone);
    setUtcOffsetMin(result.utcOffsetMin);
    setProfileLoaded(true);
    setProfileExists(true);
    if (result.birthdateSaved === true) {
      showToast('Profile saved to your Exchange account.');
    } else if (result.birthdateError === 'permission-denied') {
      showToast('Profile saved, but your date of birth could not be stored yet (age-check rule not published). Your age band was saved.');
    } else {
      showToast('Profile saved, but your date of birth could not be stored. Please try saving again.');
    }
  };

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 4000);
  };

  // Tap a message bubble to copy the whole sentence. Mobile long-press
  // selection picks characters one by one, so whole-message copy is a
  // dedicated action. Only the message text is copied — shared photos
  // and the correction line are not part of it.
  const copyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast('Copied');
  };

  // Load this partner's memory for the signed-in user (rules-gated).
  // A missing doc (first chat) or a permission-denied read (rules not
  // published yet) both mean "no memory" — chats work either way.
  const loadMemoryForPartner = async (partnerId: string) => {
    if (!user || memoryRef.current[partnerId] !== undefined) return;
    memoryRef.current[partnerId] = '';
    try {
      const snap = await getDoc(doc(db, EXCHANGE_MEMORIES_COLLECTION, memoryDocId(user.uid, partnerId)));
      if (!snap.exists()) return;
      const d = snap.data() as Partial<ExchangeMemory>;
      const mem: ExchangeMemory = {
        uid: user.uid,
        partnerId,
        nickname: typeof d.nickname === 'string' ? d.nickname : undefined,
        interests: Array.isArray(d.interests) ? d.interests.filter((i): i is string => typeof i === 'string') : undefined,
        facts: Array.isArray(d.facts) ? d.facts.filter((f): f is string => typeof f === 'string') : [],
      };
      memoryRef.current[partnerId] = formatMemoryForPrompt(mem);
      memoryFactsRef.current[partnerId] = mem.facts.slice(0, MAX_MEMORY_FACTS);
    } catch {
      // Never surface an error for memory: the chat works without it.
      memoryRef.current[partnerId] = '';
      memoryFactsRef.current[partnerId] = [];
    }
  };

  // ── Guest trial (5 minutes, no sign-in) ──────────────────────────
  // A first-time visitor can chat with an AI partner for 5 minutes
  // from their first guest message. After that, sign-in is required
  // to keep chatting (the free tier continues after sign-up).
  // Anti-repeat is soft on purpose: the trial record lives in
  // localStorage keyed by a stable device id, and the server enforces
  // the same 5-minute window per device id (Firestore `guest_trials`).
  // IP is NOT used as an identity — it only feeds the existing
  // per-IP rate limits, because carrier NAT shares IPs across people
  // and mobile IPs rotate.
  const GUEST_TRIAL_MS = 5 * 60 * 1000;
  const GUEST_TRIAL_KEY = 'muntuz_guest_trial';
  const DEVICE_ID_KEY = 'muntuz_device_id';

  type GuestTrial = { deviceId: string; startedAt: number };

  function getDeviceId(): string {
    if (typeof window === 'undefined') return '';
    try {
      let id = window.localStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = window.crypto?.randomUUID
          ? window.crypto.randomUUID()
          : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.localStorage.setItem(DEVICE_ID_KEY, id);
      }
      return id;
    } catch {
      return '';
    }
  }

  function readGuestTrial(): GuestTrial | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(GUEST_TRIAL_KEY);
      if (!raw) return null;
      const t = JSON.parse(raw) as GuestTrial;
      if (typeof t?.startedAt !== 'number' || typeof t?.deviceId !== 'string') return null;
      return t;
    } catch {
      return null;
    }
  }

  function writeGuestTrial(t: GuestTrial) {
    try {
      window.localStorage.setItem(GUEST_TRIAL_KEY, JSON.stringify(t));
    } catch {
      // Private mode: the trial lives in memory only for this session.
    }
  }

  // Q7 / M-4: 하루 새로 시작하는 AI 채팅 수 카운터 (Muntuz host only).
  // "무료 20회" = 하루에 새로 시작하는 채팅 20개(파트너 20명), 이미
  // 시작한 대화는 무제한. 이 값은 화면 표시 + 새 채팅 시작 전 1차
  // 게이트용이다. 실제 강제(서버)는 새 채팅의 첫 메시지에 붙는
  // newChat 플래그로 api_daily_usage에 세어 한다. 날짜는 서버와
  // 같은 UTC 기준. 로그인 계정별로 따로 세고, 게스트는 이 기기
  // 기준 20회로 표시한다.
  const NEW_CHATS_KEY = 'muntuz_exchange_new_chats_v1';
  const FREE_DAILY_NEW_CHATS = 20;
  const PRO_DAILY_NEW_CHATS = 50;

  function utcToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function newChatCountKey(): string {
    return user ? `uid:${user.uid}` : 'guest';
  }

  function readNewChatCount(): number {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = window.localStorage.getItem(NEW_CHATS_KEY);
      if (!raw) return 0;
      const rec = JSON.parse(raw) as { date?: string; key?: string; count?: number };
      if (rec.date !== utcToday() || rec.key !== newChatCountKey() || typeof rec.count !== 'number') return 0;
      return Math.max(0, Math.floor(rec.count));
    } catch {
      return 0;
    }
  }

  function recordNewChatStarted(): number {
    const key = newChatCountKey();
    const next = readNewChatCount() + 1;
    try {
      window.localStorage.setItem(NEW_CHATS_KEY, JSON.stringify({ date: utcToday(), key, count: next }));
    } catch {
      // Private mode: the count lives in memory only for this session.
    }
    return next;
  }

  // Chat access: signed-in users always pass. Guests get one 5-minute
  // trial from their first guest message; after it expires they are
  // sent to sign-up (the free tier continues after sign-up). Returns
  // true when the caller may proceed. Opening a chat does not start
  // the trial — only the first guest message does.
  const requireChatAccess = (): boolean => {
    if (user) return true;
    const now = Date.now();
    const existing = guestTrial ?? readGuestTrial();
    if (existing && now - existing.startedAt < GUEST_TRIAL_MS) return true;
    if (existing) {
      // Trial used up. If the prompt was already dismissed this
      // session, do not re-open it — a toast is the only feedback.
      if (trialExpiredDismissedRef.current) {
        showToast('Your 5-minute free trial ended — sign up to keep chatting.');
      } else {
        setShowTrialExpired(true);
      }
      return false;
    }
    // First guest chat message: start the trial.
    const trial: GuestTrial = { deviceId: getDeviceId(), startedAt: now };
    writeGuestTrial(trial);
    setGuestTrial(trial);
    return true;
  };

  // Sign out from the header indicator (also lets the user test the
  // guest trial). The page re-renders as a guest; chats stay in
  // browser state for this session.
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setActiveChatId(null);
      showToast('Signed out. You are browsing as a guest.');
    } catch {
      showToast('Could not sign out. Please try again.');
    }
  };

  const startAiChat = (p: AiPartner) => {
    // Q7 / M-4 (Muntuz host only): 이미 열린 채팅을 다시 여는 것은
    // 세지 않는다. 새로 만드는 채팅만 오늘 한도에 들어간다 — 한도에
    // 도달했으면 만들지 않고 Pro 탭으로 안내한다. (연속 탭 시 chats
    // 스냅샷이 한 렌더 뒤처질 수 있어, 서버가 첫 메시지에서 한 번
    // 더 강제한다.)
    if (isMuntuzHost() && !chats.some((c) => c.id === p.id)) {
      const limit = realPro ? PRO_DAILY_NEW_CHATS : FREE_DAILY_NEW_CHATS;
      if (newChatsToday >= limit) {
        showToast(
          `You've started ${limit} new chats today (${realPro ? 'Pro' : 'free'} plan). Ongoing chats are unlimited — Pro allows 50 new chats a day.`
        );
        setTab('pro');
        return;
      }
      setNewChatsToday(recordNewChatStarted());
      newChatPendingRef.current.add(p.id);
    }
    const gid = msgSeq++;
    setChats((cs) =>
      cs.some((c) => c.id === p.id)
        ? cs
        : [
            ...cs,
            {
              id: p.id,
              partnerId: p.id,
              name: p.name,
              avatar: p.avatar,
              gallery: p.gallery,
              flag: LANG_FLAG[p.native] || '🌐',
              isAi: true,
              // M-5: the opening line is built from the learner's target
              // language on Muntuz hosts (greetingForChat); elsewhere the
              // partner's static greeting stays.
              messages: [{ id: gid, from: 'partner', text: isMuntuzHost() ? greetingForChat(p, targetLang) : p.greeting, ai: true, at: Date.now() }],
            },
          ]
    );
    // The greeting is read at once (the chat opens immediately).
    setSeenMsgId((s) => ({ ...s, [p.id]: Math.max(s[p.id] ?? 0, gid) }));
    setReview(null);
    setActiveChatId(p.id);
    setTab('chats');
    void loadMemoryForPartner(p.id);
  };

const sayHello = (p: { id: string; name: string; flag: string }) => {
    setStatuses((s) => ({ ...s, [p.id]: 'pending' }));
    window.setTimeout(() => {
      setStatuses((s) => ({ ...s, [p.id]: 'matched' }));
      setChats((cs) =>
        cs.some((c) => c.id === p.id)
          ? cs
          : [...cs, { id: p.id, partnerId: p.id, name: p.name, avatar: '', flag: p.flag, isAi: false, messages: [] }]
      );
      showToast(`${p.name} accepted your hello! A chat was created.`);
    }, 2500);
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  // Load any earlier guest trial once (localStorage is client-only, so
  // this runs after mount to avoid a hydration mismatch).
  useEffect(() => {
    setGuestTrial(readGuestTrial());
  }, []);

  // Q7 / M-4: 오늘 새 채팅 수와 실제 Pro 여부를 읽는다 (Muntuz host
  // only). 로그인 상태가 바뀌면 해당 계정의 카운터로 다시 읽는다.
  // realPro는 카운터 분모(20/50) 표시용으로만 쓴다.
  useEffect(() => {
    if (!isMuntuzHost()) {
      setNewChatsToday(0);
      setRealPro(false);
      return;
    }
    setNewChatsToday(readNewChatCount());
    if (!user) {
      setRealPro(false);
      return;
    }
    let cancelled = false;
    void isPremium(user.uid, user.email)
      .then((v) => {
        if (!cancelled) setRealPro(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps — user change only.
  }, [user]);

  // H-7: detect Web Speech API support after mount (server render has
  // no window, so this must not run during render).
  useEffect(() => {
    setSpeechSupported(getSpeechRecognition() !== null);
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  // S-2: restore chat threads saved in this browser (Muntuz host only).
  // Runs once after mount; the save effect below waits for chatsLoaded,
  // so a refresh never clobbers stored threads with the empty initial
  // state. Restored replies are marked seen (no phantom unread badges),
  // msgSeq is bumped past every restored message id (it restarts at 100
  // on every load — without this, new messages could reuse an id), and
  // an open chat is restored together with the Chats tab.
  useEffect(() => {
    if (!isMuntuzHost()) {
      setChatsLoaded(true);
      return;
    }
    const stored = loadStoredChats();
    if (stored && stored.chats.length > 0) {
      let maxId = 100;
      for (const c of stored.chats) {
        for (const m of c.messages) if (typeof m.id === 'number' && m.id >= maxId) maxId = m.id + 1;
      }
      msgSeq = Math.max(msgSeq, maxId);
      setChats(stored.chats);
      setSeenMsgId((s) => {
        const next = { ...s };
        for (const c of stored.chats) {
          const last = c.messages[c.messages.length - 1];
          if (last) next[c.id] = Math.max(next[c.id] ?? 0, last.id);
        }
        return next;
      });
      if (stored.activeChatId && stored.chats.some((c) => c.id === stored.activeChatId)) {
        setActiveChatId(stored.activeChatId);
        setTab('chats');
      }
    }
    setChatsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps — load once on mount only.
  }, []);

  // S-2: persist threads on every change (Muntuz host only). Capped so
  // one heavy chat cannot blow the localStorage quota; a full or
  // unavailable store fails silent — chats still work in memory.
  useEffect(() => {
    if (!chatsLoaded || !isMuntuzHost()) return;
    try {
      const payload: PersistedChats = {
        v: 1,
        savedAt: Date.now(),
        activeChatId,
        chats: chats.slice(-MAX_STORED_CHATS).map((c) => ({ ...c, messages: c.messages.slice(-MAX_STORED_MESSAGES) })),
      };
      window.localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* storage full or unavailable: in-memory chats still work */
    }
  }, [chats, activeChatId, chatsLoaded]);

  // Guest trial countdown: ticks once a second while a guest trial is
  // active. At zero the sign-up prompt opens if an AI chat is on
  // screen; otherwise it opens on the next send attempt.
  useEffect(() => {
    if (user || !guestTrial) {
      setTrialLeftMs(null);
      return;
    }
    const tick = () => {
      const left = guestTrial.startedAt + GUEST_TRIAL_MS - Date.now();
      setTrialLeftMs(Math.max(0, left));
      if (left <= 0 && activeChat?.isAi) openTrialExpired();
    };
    tick();
    const iv = window.setInterval(tick, 1000);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps — tick on trial/user/chat change only.
  }, [user, guestTrial, activeChatId]);

  // Escape closes the trial-ended prompt (same as "Later").
  useEffect(() => {
    if (!showTrialExpired) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissTrialExpired();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showTrialExpired]);

  // ── Chats list: search + filter chips (HelloTalk list layout, MunTalk style)
  const [chatQuery, setChatQuery] = useState('');
  type ChatFilter = 'all' | 'online' | 'unread' | 'myturn' | 'proximity';
  const [chatFilter, setChatFilter] = useState<ChatFilter>('all');
  // Last message id the user has seen per chat (in-memory only) — drives
  // the Unread filter and the unread dot. Marked when a chat is opened
  // and when leaving it, so replies seen in the open chat never count.
  const [seenMsgId, setSeenMsgId] = useState<Record<string, number>>({});
  const markChatSeen = (c: Chat) => {
    const last = c.messages[c.messages.length - 1];
    if (last) setSeenMsgId((s) => ({ ...s, [c.id]: Math.max(s[c.id] ?? 0, last.id) }));
  };
  const openChat = (c: Chat) => {
    markChatSeen(c);
    setReview(null);
    setActiveChatId(c.id);
  };
  const chatIsUnread = (c: Chat) => {
    const last = c.messages[c.messages.length - 1];
    return !!last && last.from === 'partner' && last.id > (seenMsgId[c.id] ?? 0);
  };
  const chatIsMyTurn = (c: Chat) => {
    const last = c.messages[c.messages.length - 1];
    return !last || last.from === 'partner';
  };
  // AI partners are always online. Real-person presence is not tracked
  // yet (no heartbeat), so Online currently lists AI chats only.
  const chatIsOnline = (c: Chat) => c.isAi;
  // Timezone distance in minutes from me; AI has no timezone and is
  // always available, so it sorts first under Timezone proximity.
  const chatTzDistance = (c: Chat): number => {
    if (c.isAi) return 0;
    const p = (realPartners || []).find((rp) => rp.uid === c.partnerId);
    if (!p || !p.timezone) return Number.POSITIVE_INFINITY;
    return Math.abs(p.utcOffsetMin - utcOffsetMin);
  };
  const visibleChats = chats.filter((c) => {
    if (chatQuery) {
      const q = chatQuery.trim().toLowerCase();
      const last = c.messages[c.messages.length - 1];
      const hay = `${c.name} ${last ? last.text : ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (chatFilter === 'online' && !chatIsOnline(c)) return false;
    if (chatFilter === 'unread' && !chatIsUnread(c)) return false;
    if (chatFilter === 'myturn' && !chatIsMyTurn(c)) return false;
    return true;
  });
  // "Timezone proximity" is a sort, not a filter: closest timezone first.
  const sortedChats =
    chatFilter === 'proximity' ? [...visibleChats].sort((a, b) => chatTzDistance(a) - chatTzDistance(b)) : visibleChats;

  // ── AI Review tab: derived real data ────────────────────────────────
  // Due words: saved, not marked known, and past their review time.
  const dueVocab = vocabItems.filter((v) => !v.known && v.nextReviewAtMs > 0 && v.nextReviewAtMs <= Date.now());
  // Latest corrections across saved reviews (newest first, at most 5).
  const recentMistakes = reviewItems
    .flatMap((r) => r.mistakes.map((m) => ({ ...m, partnerName: r.partnerName, at: r.createdAtMs })))
    .slice(0, 5);
  const latestReview = reviewItems[0] ?? null;

  const sendAiMessage = async () => {
    if (!requireChatAccess()) return;
    const text = input.trim();
    if (!text || !activeChat || !activeChat.isAi || aiSending) return;
    if (CONTACT_GUARD.test(text)) {
      setInput('');
      showToast('Held back: phone numbers, links and contact IDs cannot be sent here.');
      return;
    }
    const history = activeChat.messages.slice(-20).map((m) => ({
      role: m.from === 'me' ? ('user' as const) : ('ai' as const),
      text: m.text,
    }));
    // Gallery photo state for the server's frequency guard: photos already
    // shared in this chat, and learner turns since the last shared photo.
    const sentPhotos = activeChat.messages.filter((m) => m.from === 'partner' && m.photo).map((m) => m.photo as string);
    let turnsSincePhoto = 0;
    for (let i = activeChat.messages.length - 1; i >= 0; i--) {
      const m = activeChat.messages[i];
      if (m.from === 'partner' && m.photo) break;
      if (m.from === 'me') turnsSincePhoto++;
    }
    const id = msgSeq++;
    const userMsg: Msg = { id, from: 'me' as const, text, at: Date.now() };
    setChats((cs) =>
      cs.map((c) => (c.id === activeChat.id ? { ...c, messages: [...c.messages, userMsg] } : c))
    );
    setInput('');
    setAiSending(true);
    // Q7 / M-4: 이 채팅의 첫 메시지일 때만 서버에 newChat을 알려
    // 서버가 오늘 새 채팅 수를 센다. 이후 메시지는 세지 않는다
    // (이미 시작한 대화는 무제한).
    const isNewChatStart = newChatPendingRef.current.has(activeChat.id);
    try {
      const res = await fetch('/api/exchange-ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: activeChat.partnerId, message: text, history, sentPhotos, turnsSincePhoto, memory: memoryRef.current[activeChat.partnerId] || undefined, deviceId: getDeviceId() || undefined, ...(isNewChatStart ? { newChat: true } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Server-side trial expiry (e.g. localStorage was cleared): open
        // the sign-up prompt instead of a generic error toast.
        if (data.error === 'trial_expired') {
          openTrialExpired();
          return;
        }
        // Q7: 서버의 새 채팅 한도에 걸리면, 채팅은 그대로 두고
        // (이미 시작한 대화는 계속 가능) 한도 안내만 보여준다.
        // 플래그는 지우지 않아 재시도 때도 서버가 다시 검사한다.
        if (data.code === 'new_chat_limit_reached') {
          showToast(typeof data.error === 'string' ? data.error : 'Daily new-chat limit reached — ongoing chats are unlimited.');
          return;
        }
        throw new Error(typeof data.error === 'string' ? data.error : 'AI reply failed');
      }
      newChatPendingRef.current.delete(activeChat.id);
      const rid = msgSeq++;
      const reply = typeof data.text === 'string' && data.text ? data.text : 'Sorry, I could not reply just now.';
      // Only accept a photo that is actually in this partner's gallery —
      // the server must never be able to inject an arbitrary image URL.
      const partnerGallery = AI_PARTNERS.find((p) => p.id === activeChat.partnerId)?.gallery ?? [];
      const photo = typeof data.photo === 'string' && partnerGallery.includes(data.photo) ? data.photo : undefined;
      // Natural-expression correction: one short rephrasing of the learner's
      // message, shown inside the AI reply. Absent when already natural.
      const correction =
        typeof data.correction === 'string' && data.correction.trim()
          ? data.correction.trim().slice(0, 200)
          : undefined;
      const replyMsg: Msg = { id: rid, from: 'partner' as const, text: reply, ai: true, at: Date.now(), photo, correction };
      setChats((cs) =>
        cs.map((c) => (c.id === activeChat.id ? { ...c, messages: [...c.messages, replyMsg] } : c))
      );
      // H-1: once the 4th learner turn has its reply, auto-save the
      // session review (same action as the manual button). The snapshot
      // carries both new messages so the review sees the full exchange.
      void maybeAutoReview({ ...activeChat, messages: [...activeChat.messages, userMsg, replyMsg] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'AI reply failed. Please try again.');
    } finally {
      setAiSending(false);
    }
  };

  // Save new facts when leaving an AI chat: at most one small summary
  // call per leave, only when at least 4 new learner turns arrived since
  // the last save. Failures are silent — memory must never break chatting.
  const saveMemoryForChat = async (chat: Chat) => {
    if (!chat.isAi || !user) return;
    const userTurns = chat.messages.filter((m) => m.from === 'me').length;
    const lastSaved = memorySavedRef.current[chat.id] ?? 0;
    if (userTurns - lastSaved < 4) return;
    try {
      const history = chat.messages.slice(-20).map((m) => ({
        role: m.from === 'me' ? ('user' as const) : ('ai' as const),
        text: m.text,
      }));
      const res = await apiFetch('/api/exchange-ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-memory',
          partnerId: chat.partnerId,
          history,
          nickname: nickname.trim(),
          interests: interestSel,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.saved) memorySavedRef.current[chat.id] = userTurns;
    } catch {
      /* background save: never interrupt the user */
    }
  };

  const leaveAiChat = () => {
    stopDictation();
    const chat = activeChat;
    // Replies read while the chat was open must not show as unread later.
    if (chat) markChatSeen(chat);
    setReview(null);
    setActiveChatId(null);
    if (chat) {
      void saveMemoryForChat(chat);
      // H-1: leaving a chat with enough turns auto-saves its review.
      void maybeAutoReview(chat);
    }
  };

  // H-1: auto-save a session review once a chat has at least 4 learner
  // turns — on leave, or mid-chat right after the 4th reply lands.
  // Reuses requestSessionReview (same server action, no new endpoint).
  // Muntuz-only: the shared page also serves muntalk.com, where the
  // manual "Finish & review" button stays the only review path. The
  // per-chat flag stops repeat saves; a failed save simply retries on
  // the next trigger.
  const maybeAutoReview = (chat: Chat) => {
    if (!isMuntuzHost() || !chat.isAi || !user) return;
    const userTurns = chat.messages.filter((m) => m.from === 'me').length;
    if (userTurns < 4 || chat.autoReviewed) return;
    void requestSessionReview(chat, { auto: true });
  };

  // ── Memory + review pilot ────────────────────────────────────────────
  // Load the signed-in user's saved words and session reviews for the
  // AI Review tab. Single-field equality queries only (no composite
  // index needed); sorting happens client-side. A permission-denied read
  // (console rules not published yet) leaves the empty/example state.
  const loadReviewData = async () => {
    if (!user || reviewDataLoading) return;
    setReviewDataLoading(true);
    try {
      const vSnap = await getDocs(
        query(collection(db, EXCHANGE_VOCAB_COLLECTION), where('uid', '==', user.uid), limit(50))
      );
      const items: ExchangeVocabItem[] = [];
      vSnap.forEach((d) => {
        const data = d.data() as Partial<ExchangeVocabItem>;
        if (typeof data.word !== 'string' || !data.word) return;
        items.push({
          uid: user.uid,
          word: data.word,
          meaning: typeof data.meaning === 'string' ? data.meaning : '',
          example: typeof data.example === 'string' ? data.example : '',
          partnerId: typeof data.partnerId === 'string' ? data.partnerId : '',
          partnerName: typeof data.partnerName === 'string' ? data.partnerName : '',
          firstSeenAtMs: typeof data.firstSeenAtMs === 'number' ? data.firstSeenAtMs : 0,
          lastSeenAtMs: typeof data.lastSeenAtMs === 'number' ? data.lastSeenAtMs : 0,
          nextReviewAtMs: typeof data.nextReviewAtMs === 'number' ? data.nextReviewAtMs : 0,
          reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
          known: data.known === true,
        });
      });
      items.sort((a, b) => b.lastSeenAtMs - a.lastSeenAtMs);
      setVocabItems(items);
      const rSnap = await getDocs(
        query(collection(db, EXCHANGE_REVIEWS_COLLECTION), where('uid', '==', user.uid), limit(10))
      );
      const reviews: SessionReview[] = [];
      rSnap.forEach((d) => {
        const data = d.data() as Partial<SessionReview>;
        if (typeof data.partnerId !== 'string') return;
        reviews.push({
          partnerId: data.partnerId,
          partnerName: typeof data.partnerName === 'string' ? data.partnerName : '',
          summary: typeof data.summary === 'string' ? data.summary : '',
          mistakes: Array.isArray(data.mistakes) ? (data.mistakes as SessionReview['mistakes']) : [],
          vocab: Array.isArray(data.vocab) ? (data.vocab as SessionReview['vocab']) : [],
          userTurns: typeof data.userTurns === 'number' ? data.userTurns : 0,
          createdAtMs: typeof data.createdAtMs === 'number' ? data.createdAtMs : 0,
        });
      });
      reviews.sort((a, b) => b.createdAtMs - a.createdAtMs);
      setReviewItems(reviews);
    } catch {
      // Rules not published yet — keep the empty/example state.
    } finally {
      setReviewDataLoaded(true);
      setReviewDataLoading(false);
    }
  };

  // Finish a chat with a review: one short Gemini call (server-side)
  // that returns top mistakes + new words + one-line summary and saves
  // them. The review card renders inline from the response, so it works
  // even before the console rules are published. Called with an explicit
  // chat by the H-1 auto-save (leave / 4th reply); the manual button
  // passes nothing and reviews the open chat. `auto` skips the inline
  // card (the user may already have left) and the "not enough yet"
  // toast — the auto trigger already checked the 4-turn bar.
  const requestSessionReview = async (chatArg?: Chat, opts?: { auto?: boolean }) => {
    const chat = chatArg ?? activeChat;
    if (!chat?.isAi || !user || reviewLoading) return;
    const userTurns = chat.messages.filter((m) => m.from === 'me').length;
    if (userTurns < 4) {
      if (!opts?.auto) showToast('Chat a little more first — a review needs at least 4 messages from you.');
      return;
    }
    // Pair each 💡 correction with the learner message it corrects.
    const corrections: { from: string; to: string }[] = [];
    for (let i = 0; i < chat.messages.length; i++) {
      const m = chat.messages[i];
      if (!m.correction) continue;
      let from = '';
      for (let j = i - 1; j >= 0; j--) {
        if (chat.messages[j].from === 'me') {
          from = chat.messages[j].text;
          break;
        }
      }
      if (from) corrections.push({ from, to: m.correction });
    }
    const history = chat.messages.slice(-12).map((m) => ({
      role: m.from === 'me' ? ('user' as const) : ('ai' as const),
      text: m.text,
    }));
    setReviewLoading(true);
    try {
      const res = await apiFetch('/api/exchange-ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'session-review',
          partnerId: chat.partnerId,
          history,
          corrections,
          nativeLang,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Review failed');
      if (data.reviewed && data.review) {
        const r = data.review as SessionReview;
        if (!opts?.auto) setReview(r);
        setReviewItems((prev) => [r, ...prev].slice(0, 10));
        // Mark the chat so the auto-save never fires twice for it; the
        // manual button stays available for an on-demand re-review.
        setChats((cs) => cs.map((c) => (c.id === chat.id ? { ...c, autoReviewed: true } : c)));
        void loadReviewData();
        showToast(opts?.auto ? 'Review saved — see AI Review.' : 'Review ready — your top corrections and new words are below.');
      } else {
        if (!opts?.auto) showToast('Not enough to review yet — chat a little more and try again.');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Review failed. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  // H-1: real per-day AI-message counts for the "This week" chart.
  // Reads the same api_daily_usage store the daily caps increment
  // (usage-week action, same route — no new endpoint, no new
  // collection). Muntuz host + signed-in only; guests keep the
  // sign-in prompt. A failed load leaves weekCounts null and the
  // chart shows its empty state — never the old hardcoded demo bars.
  const loadWeekCounts = async () => {
    if (!user || weekCountsLoading) return;
    setWeekCountsLoading(true);
    try {
      const res = await apiFetch('/api/exchange-ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'usage-week' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.days)) {
        const days = (data.days as unknown[])
          .filter(
            (d): d is { day: string; count: number } =>
              !!d &&
              typeof d === 'object' &&
              typeof (d as { day?: unknown }).day === 'string' &&
              typeof (d as { count?: unknown }).count === 'number'
          )
          .slice(-7);
        if (days.length > 0) setWeekCounts(days);
      }
    } catch {
      /* chart stays in its empty state */
    } finally {
      setWeekCountsLoading(false);
    }
  };

  // Mark a saved word as known: it leaves the "words to review" list.
  // Owner-only client update (rules-gated); a missing rule fails silent
  // with a toast instead of breaking the tab.
  const markVocabKnown = async (item: ExchangeVocabItem) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, EXCHANGE_VOCAB_COLLECTION, vocabDocId(user.uid, item.word)), {
        known: true,
        reviewCount: item.reviewCount + 1,
        nextReviewAtMs: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
      setVocabItems((prev) => prev.map((v) => (v.word === item.word ? { ...v, known: true } : v)));
      showToast(`"${item.word}" marked as known.`);
    } catch {
      showToast('Could not save that yet — try again later.');
    }
  };

  // AI speaks first: when the user opens the Chats list, an AI partner
  // whose conversation already has at least one learner turn may greet
  // the learner first — with a recalled memory fact when one exists.
  // Template-based ($0, no model call), at most once per partner per
  // day, and only while the user is on the list (never inside an open
  // chat). The message carries the AI badge like any AI message.
  const maybeSendOpeners = () => {
    if (!aiOpeners || !user || activeChatId) return;
    const now = Date.now();
    const pending: { chatId: string; partnerId: string; text: string }[] = [];
    for (const c of chats) {
      if (!c.isAi) continue;
      if (c.messages.filter((m) => m.from === 'me').length < 1) continue;
      const last = c.messages[c.messages.length - 1];
      if (!last || last.from !== 'partner') continue;
      if (openerSentToday(c.partnerId)) continue;
      const partner = AI_PARTNERS.find((p) => p.id === c.partnerId);
      if (!partner) continue;
      const daysSince = last.at ? Math.floor((now - last.at) / (24 * 60 * 60 * 1000)) : 0;
      pending.push({
        chatId: c.id,
        partnerId: c.partnerId,
        text: buildOpener({
          partnerName: partner.name,
          interests: partner.interests,
          memoryFacts: memoryFactsRef.current[c.partnerId] ?? [],
          daysSinceLastChat: daysSince,
        }),
      });
    }
    if (pending.length === 0) return;
    for (const p of pending) markOpenerSent(p.partnerId);
    setChats((cs) =>
      cs.map((c) => {
        const p = pending.find((x) => x.chatId === c.id);
        if (!p) return c;
        return { ...c, messages: [...c.messages, { id: msgSeq++, from: 'partner' as const, text: p.text, ai: true, at: Date.now() }] };
      })
    );
  };

  // Openers fire when the user switches to the Chats tab (list view).
  useEffect(() => {
    if (tab === 'chats') maybeSendOpeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps — run on tab switch only.
  }, [tab]);

  // AI Review tab data: load once when the tab opens (signed-in only).
  useEffect(() => {
    if (tab === 'review' && user && !reviewDataLoaded) void loadReviewData();
    // H-1: the weekly chart reloads on every open so it reflects the
    // chats just finished (cheap read, server rate-limited).
    if (tab === 'review' && user && isMuntuzHost()) void loadWeekCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps — run on tab switch only.
  }, [tab, user]);

// Real (human) chats: messages stay in browser state only for this
  // pilot. No auto-reply — the partner is a real person, never a fake.
  const sendMessage = () => {
    const text = input.trim();
    if (!text || !activeChat || activeChat.isAi) return;
    if (CONTACT_GUARD.test(text)) {
      setInput('');
      showToast('Held back: phone numbers, links and contact IDs cannot be sent here.');
      return;
    }
    const id = msgSeq++;
    setChats((cs) =>
      cs.map((c) => (c.id === activeChat.id ? { ...c, messages: [...c.messages, { id, from: 'me' as const, text, at: Date.now() }] } : c))
    );
    setInput('');
  };

  // H-7: Web Speech API dictation for the AI chat input. Recognised
  // text fills the input (interim results show live); the user still
  // sends with Send/Enter. The button only renders where the API exists
  // (speechSupported, set after mount). Stops on send, on leaving the
  // chat, and on unmount (effect cleanup above). Never confused with
  // VoiceCallSession (real-person WebRTC calls).
  const stopDictation = () => {
    recognitionRef.current?.stop();
  };

  const toggleDictation = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    if (listening) {
      stopDictation();
      return;
    }
    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = speechLangFor(targetLang);
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    dictationBaseRef.current = input;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const alt = r[0];
        if (!alt) continue;
        if (r.isFinal) finalText += alt.transcript;
        else interim += alt.transcript;
      }
      setInput(dictationBaseRef.current + finalText + interim);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        showToast('Microphone blocked — allow the mic in your browser to dictate.');
      }
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    try {
      rec.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  };

  const sendCurrentMessage = () => {
    stopDictation();
    if (activeChat?.isAi) void sendAiMessage();
    else sendMessage();
  };

  // Interest chips save immediately when signed in: a tap must never depend
  // on a later Save press, and must survive a page reload on its own.
  // Signed-out users keep the previous demo behaviour (local state only).
  const toggleInterest = (interest: string) => {
    interestEditedRef.current = true;
    const next = interestSel.includes(interest) ? interestSel.filter((i) => i !== interest) : [...interestSel, interest];
    setInterestSel(next);
    if (user) {
      setDoc(doc(db, 'exchange_profiles', user.uid), { interests: next, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {
        showToast('Could not save interests. Please try again.');
      });
    }
  };

  // Fluent languages save with the profile (Save button), unlike
  // interests which save on tap.
  const toggleFluent = (lang: string) => {
    fluentEditedRef.current = true;
    setFluentLangs((cur) => (cur.includes(lang) ? cur.filter((l) => l !== lang) : [...cur, lang]));
  };

  // Availability chips save with the profile (Save button), unlike
  // interests which save on tap.
  const toggleAvailDay = (d: string) =>
    setAvailDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  const toggleAvailSlot = (s: string) =>
    setAvailSlots((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  // Live preview for the birthdate field: only the band is ever shown,
  // never the exact age. Used for the inline hint under the date input.
  const birthdateAge = birthdate ? calcAge(birthdate) : null;
  const birthdateBand = birthdateAge === null ? '' : ageBandForAge(birthdateAge);
  const maxBirthdate = (() => {
    const t = new Date();
    t.setFullYear(t.getFullYear() - 18);
    return t.toISOString().slice(0, 10);
  })();

  const tabButton = (t: { id: Tab; label: string; icon: string }, vertical: boolean) => (
    <button
      key={t.id}
      // M-6 residual: entering Discover from the sidebar must reset the
      // inner room to AI Rooms, or the last-used room (e.g. People
      // Rooms) sticks. The logo/back button already does this.
      onClick={() => {
        if (t.id === 'discover') setRoom('ai');
        setTab(t.id);
      }}
      aria-current={tab === t.id ? 'page' : undefined}
      className={`flex ${vertical ? 'w-full items-center gap-3 rounded-xl px-4 py-3 text-left' : 'min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px]'} font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 ${
        tab === t.id
          ? vertical
            ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
            : 'bg-violet-600 text-white'
          : 'text-slate-600 hover:bg-violet-50 active:bg-violet-100'
      }`}
    >
      <span className="text-lg leading-none">{t.icon}</span>
      <span>{t.label}</span>
      {t.id === 'chats' && chats.length > 0 && vertical && (
        <span className="ml-auto rounded-full bg-white/25 px-2 py-0.5 text-xs text-white">{chats.length}</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-nowrap items-center gap-2 px-3 py-2 sm:px-4">
          {/* Back — Muntuz pages only (Jay 2026-11-06). No history:
              muntuz.com host → `/`, other hosts → `/muntuz`. */}
          <BackButton fallback={backFallback} />
          {/* Brand: the shared /logo.png M-ring badge (same file the
              /muntuz landing uses) with "Muntuz" beside it — not
              "MunTalk", so the Exchange app reads as its own product
              (Jay 2026-11-05). Tapping it goes back to Discover. */}
          <button
            onClick={() => {
              setTab('discover');
              setRoom('ai');
              window.scrollTo({ top: 0 });
            }}
            aria-label="Muntuz — back to Discover"
            className="flex min-w-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <Image src="/logo.png" alt="Muntuz" width={40} height={40} className="h-8 w-8 shrink-0 rounded-full object-cover shadow-md sm:h-10 sm:w-10" />
            <span className="min-w-0 text-left">
              <span className="block truncate text-lg font-extrabold leading-tight">Muntuz</span>
              <span className="hidden text-xs text-slate-500 sm:block">Talk with people. Review with AI.</span>
            </span>
          </button>
          {pro && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">PRO</span>}
          {/* Log in — signed-out users only. The existing /login page
              already honours ?next=, so signing in returns here; the
              global login flow is untouched. */}
          {!authLoading && !user && (
            <a
              href="/login?next=/exchange"
              className="ml-auto shrink-0 rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Log in
            </a>
          )}
          {/* Signed-in indicator: name + green dot + Log out. Without
              this, a signed-in user cannot tell their login state —
              the header showed nothing at all when signed in. */}
          {!authLoading && user && (
            <span className="ml-auto flex min-w-0 items-center gap-2">
              <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="min-w-0 truncate">{user.displayName || user.email?.split('@')[0] || 'Learner'}<span className="hidden sm:inline"> · Signed in</span></span>
              </span>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Log out
              </button>
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 md:pb-10 md:py-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-20 flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">
            {TABS.map((t) => tabButton(t, true))}
          </nav>
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-xs leading-relaxed text-slate-500 shadow-sm">
            <p className="text-sm font-bold text-slate-700">Daily new chats</p>
            <p className="mt-1">Free: 20 / day · Pro: 50 / day</p>
            <p>Ongoing chats are unlimited.</p>
            {isMuntuzHost() && (
              <p className="mt-1 font-bold text-violet-700">
                Today: {newChatsToday}/{realPro ? PRO_DAILY_NEW_CHATS : FREE_DAILY_NEW_CHATS} new chats
              </p>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Signed-in but no Exchange profile yet: point at the setup
              page. Shown only once the profile load has resolved, so a
              slow load never flashes a wrong prompt. */}
          {user && profileLoaded && profileExists === false && tab !== 'chats' && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
              <p className="min-w-0 flex-1 text-sm font-semibold text-violet-900">
                Set up your Exchange profile so real partners can find you.
              </p>
              <a
                href="/exchange/setup"
                className="shrink-0 rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                Set up profile
              </a>
            </div>
          )}
          {tab === 'discover' && (
            <section>
              <h2 className="text-xl font-extrabold">Exchange lounge</h2>
              <p className="mt-1 text-sm text-slate-500">
                A warm room for language practice. AI Rooms are the main experience; People Rooms are a waitlist that opens when people gather.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                <span>
                  Online now: {AI_PARTNERS.length} AI partners ready to practice
                </span>
              </div>
              {/* Q7 / M-4 (Muntuz host only): 오늘 새로 시작한 채팅 수. */}
              {isMuntuzHost() && (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  New chats today: {newChatsToday}/{realPro ? PRO_DAILY_NEW_CHATS : FREE_DAILY_NEW_CHATS} ({realPro ? 'Pro: 50' : 'Free: 20'} / day) — ongoing chats are unlimited.
                </p>
              )}
              {/* Mobile-only entry points: the sidebar tab switcher is
                  desktop-only (hidden md:block), so on phones AI Review
                  and Profile had no in-page path. */}
              <div className="mt-3 flex gap-2 md:hidden">
                <button
                  onClick={() => setTab('review')}
                  className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  🤖 AI Review
                </button>
                <button
                  onClick={() => setTab('profile')}
                  className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  👤 Profile
                </button>
              </div>
              <div role="tablist" aria-label="Room type" className="mt-4 flex gap-2">
                <button
                  role="tab"
                  aria-selected={room === 'ai'}
                  onClick={() => setRoom('ai')}
                  className={`min-h-[44px] flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${room === 'ai' ? 'bg-violet-100 text-violet-900 shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300'}`}
                >
                  AI Rooms
                </button>
                <button
                  role="tab"
                  aria-selected={room === 'people'}
                  onClick={() => setRoom('people')}
                  className={`min-h-[44px] flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${room === 'people' ? 'bg-violet-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300'}`}
                >
                  People Rooms
                </button>
              </div>

              {room === 'ai' && (
                <>
                  <div className="sticky top-[68px] z-20 mt-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-slate-700">
                    🤖 {AI_DISCLOSURE} Every AI card and AI message here is marked &ldquo;AI&rdquo;.
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {AI_PARTNERS.length} AI practice partners — no language filter. Pick anyone and practice in any language. They are always online — start a chat and get a real AI reply.
                  </p>
                  {!user && !authLoading && (
                    <p className="mt-2 text-sm font-semibold text-violet-700">
                      No sign-in needed to try — chat free for 5 minutes, then sign up to keep going free.
                    </p>
                  )}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {AI_PARTNERS.map((p) => (
                      <article key={p.id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => openLightbox(p.avatar, p.name, p.gallery)}
                            aria-label={`View ${p.name}'s photo full size`}
                            className="h-14 w-14 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                          >
                            <Image src={p.avatar} alt={`${p.name} AI partner avatar`} width={112} height={112} className="h-14 w-14 rounded-full object-cover ring-2 ring-violet-200" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold">
                              {p.name}{' '}
                              <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-extrabold text-white">AI</span>
                            </p>
                            <p className="text-xs text-slate-500">
                              {p.level} · {p.personality}
                            </p>
                          </div>
                          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-emerald-700">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                            Online
                          </span>
                        </div>
                        <p className="mt-3">
                          <span className="text-base font-extrabold text-slate-600">
                            Multilingual · speaks every language
                          </span>
                        </p>
                        <p className="mt-2 text-xs font-semibold text-violet-700">
                          Practice in any language
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.interests.map((i) => (
                            <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{i}</span>
                          ))}
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-bold text-slate-500">
                            Photos{' '}
                            <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">AI</span>
                            <span className="font-normal"> — lifestyle photos of this AI partner</span>
                          </p>
                          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                            {p.gallery.map((g, i) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => openLightbox(g, p.name, p.gallery)}
                                aria-label={`View lifestyle photo ${i + 1} of ${p.name} full size`}
                                className="h-20 w-20 shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                              >
                                <Image
                                  src={g}
                                  alt={`Lifestyle photo ${i + 1} of AI partner ${p.name}`}
                                  width={120}
                                  height={120}
                                  className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => startAiChat(p)}
                          className="mt-4 w-full rounded-xl bg-violet-600 py-3 font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                        >
                          Start AI chat
                        </button>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {room === 'people' && (
                <>
                  <p className="mt-4 text-sm text-slate-500">
                    People rooms open when people gather. Join the waitlist — the waiting number below is the real count of waitlist entries, never a
                    made-up number. Matching uses your profile languages (native / fluent / learning), not a fixed pair.
                  </p>
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-5">
                    <div className="rounded-xl bg-violet-50 px-4 py-3">
                      {waitlistLoading ? (
                        <p className="text-sm font-semibold text-slate-500">Loading waiting count…</p>
                      ) : waitlistCount !== null ? (
                        <p className="text-sm font-extrabold text-slate-800">
                          {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} waiting for People Rooms
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-slate-600">Waiting count is not available yet.</p>
                      )}
                      {waitlistJoined && (
                        <p className="mt-1 text-sm font-bold text-emerald-700">
                          ✓ You are on the waitlist. People Rooms will open when people gather.
                        </p>
                      )}
                      {waitlistError && <p className="mt-1 text-sm font-semibold text-amber-800">{waitlistError}</p>}
                    </div>
                    {!user ? (
                      <p className="mt-3 text-sm text-slate-500">Sign in to join the waitlist. Until then, you can still practice with an AI partner.</p>
                    ) : waitlistJoined ? (
                      <p className="mt-3 text-sm font-semibold text-slate-600">You are on this waitlist. Check back here — People Rooms open when people gather.</p>
                    ) : (
                      <button
                        onClick={joinWaitlist}
                        disabled={waitlistJoining}
                        className="mt-3 min-h-[44px] w-full rounded-xl bg-violet-600 py-3 font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
                      >
                        {waitlistJoining ? 'Joining…' : 'Join the People Rooms waitlist'}
                      </button>
                    )}
                  </div>
                  <h3 className="mt-6 text-base font-extrabold">People here now</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Real Exchange profiles. Say hello — they accept before a chat opens. No open DMs.
                  </p>
                  {user && !partnersLoading && !partnersError && realPartners && realPartners.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold">Filter people</h4>
                        {filtersActive && (
                          <button
                            onClick={clearFilters}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="block text-sm font-semibold">
                          Speaks
                          <select value={fSpeaks} onChange={(e) => setFSpeaks(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                            <option>All</option>
                            {filterSpeaks.map((l) => (
                              <option key={l}>{l}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm font-semibold">
                          Learning
                          <select value={fLearning} onChange={(e) => setFLearning(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                            <option>All</option>
                            {filterLearnings.map((l) => (
                              <option key={l}>{l}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm font-semibold">
                          Level
                          <select value={fLevel} onChange={(e) => setFLevel(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                            <option>All</option>
                            {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                              <option key={l}>{l}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm font-semibold">
                          Interest
                          <select value={fInterest} onChange={(e) => setFInterest(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                            <option>All</option>
                            {filterInterests.map((i) => (
                              <option key={i}>{i}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm font-semibold">
                          Learning goal
                          <select value={fGoal} onChange={(e) => setFGoal(e.target.value as LearningGoal | 'All')} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                            <option>All</option>
                            {GOALS.map((g) => (
                              <option key={g}>{g}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm font-semibold">
                          Gender
                          <select value={fGender} onChange={(e) => setFGender(e.target.value as Gender | 'All')} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                            <option>All</option>
                            {['Female', 'Male', 'Non-binary'].map((g) => (
                              <option key={g}>{g}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm font-semibold">
                          Age band
                          <select value={fAgeBand} onChange={(e) => setFAgeBand(e.target.value as AgeBand | 'All')} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                            <option>All</option>
                            {AGE_BANDS.map((b) => (
                              <option key={b}>{b}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" checked={fOverlap} onChange={(e) => setFOverlap(e.target.checked)} className="h-5 w-5 accent-violet-600" />
                        Overlapping hours with me (uses my Profile availability + timezone)
                      </label>
                      <p className="mt-2 text-xs text-slate-500">
                        Showing {visiblePartners.length} of {realPartners.length} {realPartners.length === 1 ? 'person' : 'people'}.
                      </p>
                    </div>
                  )}
                  {!user && !authLoading && (
                    <p className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-sm text-slate-500">
                      Sign in to see real Exchange partners and start a voice call.
                    </p>
                  )}
                  {partnersLoading && (
                    <p className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-sm text-slate-500">
                      Loading partners…
                    </p>
                  )}
                  {partnersError && (
                    <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-semibold text-amber-800">
                      {partnersError}
                    </p>
                  )}
                  {user && !partnersLoading && !partnersError && realPartners && realPartners.length === 0 && (
                    <p className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-sm text-slate-500">
                      아직 파트너가 없어요. Complete your profile on the Profile tab so others can find you.
                    </p>
                  )}
                  {user && !partnersLoading && !partnersError && realPartners && realPartners.length > 0 && visiblePartners.length === 0 && (
                    <p className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-sm text-slate-500">
                      No partners match these filters yet. Try clearing a filter.
                    </p>
                  )}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {visiblePartners.map((p) => {
                      const status = statuses[p.uid] || 'idle';
                      return (
                        <article key={p.uid} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{p.flag}</span>
                              <div>
                                <p className="font-bold">{p.name}</p>
                                <p className="text-xs text-slate-500">
                                  Native: {p.native}
                                  {p.fluent.length > 0 ? ` · Fluent: ${p.fluent.join(', ')}` : ''}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Learning: {p.learning} · {p.level}
                                </p>
                                {(p.country || p.ageBand || p.goal || p.timezone) && (
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {[p.country, p.gender !== 'Prefer not to say' ? p.gender : '', p.ageBand, p.goal, p.timezone ? utcLabel(p.utcOffsetMin) : ''].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                                {p.availability.slots.length > 0 && (
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    Available {p.availability.days.length > 0 ? `${p.availability.days.join(', ')} · ` : ''}{p.availability.slots.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{p.bio}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {p.interests.map((i) => (
                              <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{i}</span>
                            ))}
                          </div>
                          <button
                            onClick={() => sayHello({ id: p.uid, name: p.name, flag: p.flag })}
                            disabled={status !== 'idle'}
                            className={`mt-4 w-full rounded-xl py-3 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-default ${
                              status === 'matched'
                                ? 'bg-emerald-100 text-emerald-700'
                                : status === 'pending'
                                  ? 'bg-slate-200 text-slate-500'
                                  : 'bg-violet-600 text-white shadow-sm hover:bg-violet-700'
                            }`}
                          >
                            {status === 'matched' ? '✓ Matched — open Chats' : status === 'pending' ? 'Waiting for accept…' : 'Say hello'}
                          </button>
                          <button
                            onClick={() => void startVoiceCall(p)}
                            disabled={call !== null}
                            className="mt-2 w-full rounded-xl border border-violet-200 bg-violet-50 py-3 font-bold text-violet-700 transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
                          >
                            🎤 음성 통화
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}

          {tab === 'chats' && (
            <section>
              <h2 className="text-xl font-extrabold">Chats</h2>
              <p className="mt-1 text-sm text-slate-500">
                AI chats are marked AI throughout. Phone numbers, links and contact IDs are blocked before sending.
              </p>
              {/* Q7 / M-4 (Muntuz host only): 오늘 새로 시작한 채팅 수. */}
              {isMuntuzHost() && (
                <p className="mt-1 text-xs font-semibold text-violet-700">
                  New chats today: {newChatsToday}/{realPro ? PRO_DAILY_NEW_CHATS : FREE_DAILY_NEW_CHATS} ({realPro ? 'Pro: 50' : 'Free: 20'} / day) — ongoing chats are unlimited.
                </p>
              )}
              {!activeChat ? (
                <div className="mt-4">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-slate-400" aria-hidden="true">🔍</span>
                    <input
                      value={chatQuery}
                      onChange={(e) => setChatQuery(e.target.value)}
                      placeholder="Search chats"
                      aria-label="Search chats"
                      className="w-full rounded-full border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-9 text-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    />
                    {chatQuery && (
                      <button
                        onClick={() => setChatQuery('')}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-1 text-sm text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Chat filters">
                    {(
                      [
                        ['all', 'All'],
                        ['online', 'Online'],
                        ['unread', 'Unread'],
                        ['myturn', 'My turn'],
                        ['proximity', 'Timezone proximity'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        role="tab"
                        aria-selected={chatFilter === id}
                        onClick={() => setChatFilter(id)}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${chatFilter === id ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 grid gap-3">
                    {chats.length === 0 && (
                      <p className="rounded-2xl border bg-white p-6 text-center text-sm text-slate-500">
                        No chats yet. Start one from an AI Room on Discover.
                      </p>
                    )}
                    {chats.length > 0 && sortedChats.length === 0 && (
                      <p className="rounded-2xl border bg-white p-6 text-center text-sm text-slate-500">
                        No chats match this filter.
                      </p>
                    )}
                    {sortedChats.map((c) => {
                      const last = c.messages[c.messages.length - 1];
                      const unread = chatIsUnread(c);
                      return (
                        <button
                          key={c.id}
                          onClick={() => openChat(c)}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                          <span className="relative h-12 w-12 shrink-0">
                            {c.avatar ? (
                              <Image src={c.avatar} alt="" width={96} height={96} className="h-12 w-12 rounded-full object-cover ring-2 ring-violet-200" />
                            ) : (
                              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-700 ring-2 ring-violet-200">
                                {c.name.charAt(0)}
                              </span>
                            )}
                            <span className="absolute -bottom-0.5 -left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] ring-1 ring-slate-200" aria-hidden="true">
                              {c.flag || '🌐'}
                            </span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bold">
                              {c.name}{' '}
                              {c.isAi && <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-extrabold text-white">AI</span>}
                            </span>
                            <span className={`block truncate text-sm ${unread ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                              {last ? last.text || (last.photo ? '📷 Photo' : '') : 'New match — say hi!'}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1.5">
                            <span className="whitespace-nowrap text-xs text-slate-400">{relativeTime(last?.at)}</span>
                            {unread ? (
                              <span className="h-2.5 w-2.5 rounded-full bg-violet-600" aria-label="Unread" />
                            ) : (
                              <span className="text-lg leading-none text-slate-300">›</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 p-2 sm:p-3">
                    <button onClick={leaveAiChat} className="min-h-[36px] rounded-lg px-1.5 font-bold text-violet-600 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">← Back</button>
                    {activeChat.avatar ? (<button type="button" onClick={() => openLightbox(activeChat.avatar, activeChat.name, activeChat.gallery)} aria-label={`View ${activeChat.name}'s photo full size`} className="h-10 w-10 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:h-12 sm:w-12"><Image src={activeChat.avatar} alt={`${activeChat.name} AI partner`} width={112} height={112} className="h-10 w-10 rounded-full object-cover ring-2 ring-violet-200 sm:h-12 sm:w-12" /></button>) : (<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl ring-2 ring-violet-200 sm:h-12 sm:w-12">{activeChat.flag || '🌐'}</span>)}
                    <span className="font-bold">
                      {activeChat.name}{' '}
                      {activeChat.isAi && <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-extrabold text-white">AI</span>}
                    </span>
                    {/* Q7 / M-4 (Muntuz host only): 오늘 새로 시작한 채팅 수. */}
                    {isMuntuzHost() && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600" title="New AI chats started today">
                        {newChatsToday}/{realPro ? PRO_DAILY_NEW_CHATS : FREE_DAILY_NEW_CHATS} today
                      </span>
                    )}
                    {activeChat.isAi && user && activeChat.messages.filter((m) => m.from === 'me').length >= 4 && (
                      <button
                        onClick={() => void requestSessionReview()}
                        disabled={reviewLoading}
                        className="ml-auto min-h-[36px] rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60"
                      >
                        {reviewLoading ? 'Reviewing…' : '✏️ Finish & review'}
                      </button>
                    )}
                  </div>
                  {activeChat.isAi && (
                    <div className="border-b border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800">
                      🤖 {AI_DISCLOSURE}
                    </div>
                  )}
                  {activeChat.isAi && !user && (
                    <div className="border-b border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                      {guestTrial && trialLeftMs !== null && trialLeftMs > 0
                        ? `⏱️ Free trial ${Math.floor(trialLeftMs / 60000)}:${String(Math.floor((trialLeftMs % 60000) / 1000)).padStart(2, '0')} left — sign up to keep chatting free.`
                        : '💬 Try free for 5 minutes, no sign-in — the trial starts with your first message.'}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 p-3">
                    {activeChat.messages.map((m) => (
                      <div key={m.id} className={`flex items-start gap-2 ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                        {m.from !== 'me' && activeChat.avatar ? (
                          <Image src={activeChat.avatar} alt="" width={64} height={64} className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-violet-200" />
                        ) : null}
                        <div
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('a')) return;
                            void copyMessage(m.text);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              void copyMessage(m.text);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          title="Tap to copy this message"
                          className={`max-w-[85%] cursor-pointer rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm [overflow-wrap:anywhere] sm:max-w-[75%] ${
                            m.from === 'me'
                              ? 'rounded-br-md bg-violet-600 text-white'
                              : 'rounded-bl-md bg-slate-100 text-slate-800'
                          }`}
                        >
                          {m.correction && (
                            <span className="-mx-3.5 -mt-2.5 mb-2 block rounded-t-2xl bg-amber-100 px-3.5 pb-2 pt-2.5 text-xs leading-relaxed text-violet-700">
                              💡 자연스럽게: {m.correction}
                            </span>
                          )}
                          {m.ai && (
                            <span className="mb-1 block text-[11px] font-extrabold tracking-wide text-violet-700">AI</span>
                          )}
                          {m.photo && (
                            <a href={m.photo} target="_blank" rel="noreferrer" className="mb-2 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" aria-label="Open shared gallery photo full size">
                              <Image
                                src={m.photo}
                                alt="Photo shared by this AI partner from their gallery"
                                width={448}
                                height={672}
                                className="h-auto max-h-56 w-auto max-w-full rounded-xl object-cover"
                              />
                            </a>
                          )}
                          <span>{m.text}</span>
                        </div>
                      </div>
                    ))}
                    {aiSending && <p className="text-xs font-semibold text-slate-400">AI is generating a reply…</p>}
                  </div>
                  {review && review.partnerId === activeChat.partnerId && (
                    <div className="border-t border-violet-100 bg-violet-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-violet-900">
                          📝 Session review with {review.partnerName}{' '}
                          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-extrabold text-white">AI</span>
                        </h3>
                        <button
                          onClick={() => setReview(null)}
                          aria-label="Dismiss review"
                          className="min-h-[32px] rounded-full px-2 text-sm font-bold text-violet-700 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                          ✕
                        </button>
                      </div>
                      {review.summary && <p className="mt-1 text-sm text-violet-800">{review.summary}</p>}
                      {review.mistakes.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-extrabold uppercase tracking-wide text-violet-700">Top corrections</h4>
                          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-slate-700">
                            {review.mistakes.map((m, i) => (
                              <li key={i}>
                                <span className="line-through">{m.from}</span> → <b>{m.to}</b>
                                {m.why ? <span className="text-slate-500"> — {m.why}</span> : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {review.vocab.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-extrabold uppercase tracking-wide text-violet-700">New words — saved to your vocabulary</h4>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {review.vocab.map((w) => (
                              <span key={w.word} title={w.example || w.meaning} className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
                                {w.word}{w.meaning ? ` — ${w.meaning}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="mt-3 text-xs text-violet-700">Saved to AI Review — review these words again tomorrow.</p>
                    </div>
                  )}
                  <div className="flex gap-2 border-t border-slate-100 p-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendCurrentMessage()}
                      placeholder="Write a message…"
                      maxLength={500}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                    {/* H-7: dictate into the AI chat (Web Speech API).
                        Muntuz host + supported browser only; elsewhere
                        the input stays plain text. */}
                    {speechSupported && activeChat?.isAi && isMuntuzHost() && (
                      <button
                        type="button"
                        onClick={toggleDictation}
                        disabled={aiSending}
                        aria-label={listening ? 'Stop dictation' : 'Dictate a message'}
                        aria-pressed={listening}
                        title={listening ? 'Stop dictation' : 'Dictate (speech to text)'}
                        className={`min-h-[44px] w-[44px] shrink-0 rounded-xl border px-2 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                          listening ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {listening ? '⏹️' : '🎙️'}
                      </button>
                    )}
                    <button onClick={sendCurrentMessage} disabled={aiSending} className="min-h-[44px] rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60">
                      {aiSending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Guest trial ended: sign up to keep chatting (free). The
              conversation is saved in this browser (localStorage, S-2),
              so it picks up where it left off after sign-in on this
              device. */}
          {showTrialExpired && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
              role="dialog"
              aria-modal="true"
              aria-label="Free trial ended"
              onClick={(e) => {
                if (e.target === e.currentTarget) dismissTrialExpired();
              }}
            >
              <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl">
                <h3 className="text-lg font-extrabold">Your 5-minute free trial ended</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Sign up to keep chatting — it is free, and this conversation picks up where it left off.
                </p>
                <button
                  onClick={() => router.push('/login?next=/exchange')}
                  className="mt-4 w-full rounded-xl bg-violet-600 py-3 font-bold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  Sign up and keep chatting
                </button>
                <button
                  onClick={() => dismissTrialExpired()}
                  className="mt-2 w-full rounded-xl border border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Later
                </button>
              </div>
            </div>
          )}

          {tab === 'review' && (
            <section>
              <h2 className="text-xl font-extrabold">AI Review</h2>
              <p className="mt-1 text-sm text-slate-500">
                {!user
                  ? 'Sign in to see your real reviews and vocabulary.'
                  : 'Based on your AI chats. Finish a chat and tap “Finish & review” to save a review here.'}
              </p>
              <div className="mt-4 grid gap-4">
                {dueVocab.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm sm:p-5">
                    <h3 className="font-bold">📚 Words to review ({dueVocab.length})</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      These came up in your chats yesterday or earlier. Tap “Got it” when you know one — or practice it with the partner who taught it.
                    </p>
                    <ul className="mt-3 space-y-2">
                      {dueVocab.slice(0, 5).map((v) => {
                        const partner = AI_PARTNERS.find((p) => p.id === v.partnerId);
                        return (
                          <li key={v.word} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
                            <span className="min-w-0 flex-1">
                              <b>{v.word}</b>
                              {v.meaning ? <span className="text-sm text-slate-600"> — {v.meaning}</span> : null}
                              {v.example ? <span className="block text-xs text-slate-500">{v.example}</span> : null}
                            </span>
                            {partner && (
                              <button
                                onClick={() => startAiChat(partner)}
                                className="min-h-[36px] rounded-full border border-violet-200 px-3 py-1 text-xs font-bold text-violet-700 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                              >
                                💬 Practice with {v.partnerName || partner.name}
                              </button>
                            )}
                            <button
                              onClick={() => void markVocabKnown(v)}
                              className="min-h-[36px] rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                            >
                              Got it ✓
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="font-bold">Corrections from your chats{recentMistakes.length > 0 ? ` (${recentMistakes.length})` : ''}</h3>
                  {recentMistakes.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {recentMistakes.map((m, i) => (
                        <li key={i}>
                          <span className="line-through">{m.from}</span> → <b>{m.to}</b>
                          {m.why ? <span> — {m.why}</span> : null}
                          {m.partnerName ? <span className="text-slate-400"> ({m.partnerName})</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">
                      No reviews yet — this is an example: <span className="line-through">I am agree</span> → <b>I agree</b> — &quot;agree&quot; is already a verb. Finish an AI chat and tap “Finish &amp; review” to see your real corrections here.
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="font-bold">Vocabulary from your chats</h3>
                  {vocabItems.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {vocabItems.slice(0, 12).map((v) => (
                        <span
                          key={v.word}
                          title={v.example || v.meaning}
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${v.known ? 'bg-slate-100 text-slate-500 line-through' : 'bg-violet-100 text-violet-700'}`}
                        >
                          {v.word}
                          {v.known ? ' ✓' : ''}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">
                      No saved words yet — finish a chat to save new words here. Words you mark as known show struck through.
                    </p>
                  )}
                  {latestReview?.summary && (
                    <p className="mt-3 text-sm text-slate-600">
                      <b>Latest review{latestReview.partnerName ? ` (${latestReview.partnerName})` : ''}:</b> {latestReview.summary}
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="font-bold">This week</h3>
                  {/* H-1: real per-day counts from api_daily_usage. The
                      old hardcoded demo bars are gone — with no data the
                      card says so instead of inventing a week. */}
                  {!user ? (
                    <p className="mt-2 text-sm text-slate-500">Sign in to see your weekly activity.</p>
                  ) : weekCounts === null ? (
                    <p className="mt-2 text-sm text-slate-500">
                      {weekCountsLoading ? 'Loading your week…' : 'No activity yet — chat with an AI partner and your daily counts will appear here.'}
                    </p>
                  ) : (
                    (() => {
                      const max = Math.max(1, ...weekCounts.map((w) => w.count));
                      const total = weekCounts.reduce((s, w) => s + w.count, 0);
                      if (total === 0) {
                        return (
                          <p className="mt-2 text-sm text-slate-500">
                            No activity yet — chat with an AI partner and your daily counts will appear here.
                          </p>
                        );
                      }
                      return (
                        <>
                          <div className="mt-3 flex items-end gap-2">
                            {weekCounts.map((d) => {
                              const wd = new Date(`${d.day}T00:00:00Z`).getUTCDay();
                              return (
                                <div
                                  key={d.day}
                                  className="flex flex-1 flex-col items-center gap-1"
                                  title={`${d.day}: ${d.count} message${d.count === 1 ? '' : 's'}`}
                                >
                                  <div className="w-full rounded-t bg-violet-500" style={{ height: `${Math.max(4, Math.round((d.count / max) * 70))}px` }} />
                                  <span className="text-[10px] text-slate-400">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][wd]}</span>
                                </div>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-xs text-slate-500">AI messages you sent per day.</p>
                        </>
                      );
                    })()
                  )}
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="font-bold">Weekly report</h3>
                  {!pro ? (
                    <div className="mt-2">
                      <p className="text-sm text-slate-500">Your full weekly report, progress trends and weak-area summary.</p>
                      <div className="mt-3 rounded-xl bg-slate-100 p-4 text-center">
                        <p className="font-bold text-slate-600">🔒 Pro only</p>
                        <button onClick={() => setTab('pro')} className="mt-2 min-h-[44px] rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98]">
                          See Pro
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">
                      Unlocked with Pro: speaking confidence up, grammar slips down 30% this week. Keep the streak going!
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
                  <h3 className="font-bold">Next mission</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {latestReview && latestReview.vocab.length > 0
                      ? `Use “${latestReview.vocab[0].word}” in a sentence with ${latestReview.partnerName || 'your AI partner'} — then review the corrections together.`
                      : 'Ask Emma about her weekend plans using "going to" — then review the corrections together.'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {tab === 'pro' && (
            <section>
              <h2 className="text-xl font-extrabold">MunTalk Exchange Pro</h2>
              <p className="mt-1 text-sm text-slate-500">People talk. AI reviews. Pro removes the limits.</p>
              {/* Q6: /pricing 가격과 통일 (월 $9.99, 6개월 $39.99, 1년
                  $59.99). 예전 Pro 탭의 월/연 표기는 삭제. 할인율은
                  /pricing 기준 — 6개월 33%, 1년 50%. */}
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:p-5 ${billing === 'monthly' ? 'border-violet-600 bg-violet-50 shadow-sm ring-1 ring-violet-600' : 'border-slate-200/80 bg-white hover:border-violet-300'}`}
                >
                  <p className="font-bold">Monthly</p>
                  <p className="text-2xl font-extrabold">$9.99<span className="text-sm font-normal text-slate-500">/mo</span></p>
                </button>
                <button
                  onClick={() => setBilling('biannual')}
                  className={`rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:p-5 ${billing === 'biannual' ? 'border-violet-600 bg-violet-50 shadow-sm ring-1 ring-violet-600' : 'border-slate-200/80 bg-white hover:border-violet-300'}`}
                >
                  <p className="font-bold">6 Months <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Save 33%</span></p>
                  <p className="text-2xl font-extrabold">$39.99<span className="text-sm font-normal text-slate-500">/6mo</span></p>
                  <p className="text-xs text-slate-500">≈ $6.67 / month</p>
                </button>
                <button
                  onClick={() => setBilling('yearly')}
                  className={`rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:p-5 ${billing === 'yearly' ? 'border-violet-600 bg-violet-50 shadow-sm ring-1 ring-violet-600' : 'border-slate-200/80 bg-white hover:border-violet-300'}`}
                >
                  <p className="font-bold">Yearly <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Save 50%</span></p>
                  <p className="text-2xl font-extrabold">$59.99<span className="text-sm font-normal text-slate-500">/yr</span></p>
                  <p className="text-xs text-slate-500">≈ $5.00 / month</p>
                </button>
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>50 new chats per day (free: 20)</li>
                <li>Unlimited AI reviews + weekly report</li>
                <li>Unlimited translations</li>
                <li>Safety tools (report, block, contact guard) are free for everyone</li>
              </ul>
              {/* Q9: 가짜 7일 무료 체험 버튼을 없애고 /pricing으로
                  연결한다. 무료 체험 결제는 만들지 않는다 — 무료
                  20회/일이 이미 충분하다는 사용자 결정. */}
              <a
                href="/pricing"
                className="mt-4 block w-full rounded-xl bg-violet-600 py-3 text-center font-bold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                See plans &amp; pricing
              </a>
              <p className="mt-2 text-center text-xs text-slate-400">Free plan includes 20 new chats a day — ongoing chats are unlimited.</p>
            </section>
          )}

          {tab === 'profile' && (
            <section>
              <h2 className="text-xl font-extrabold">My Exchange profile</h2>
              <p className="mt-1 text-sm text-slate-500">Partners see your nickname, languages, level, interests, goal, age band, country, timezone and availability. Your exact date of birth is never shown to anyone.</p>
              {authLoading ? (
                <p className="mt-2 text-sm text-slate-500">Checking sign-in…</p>
              ) : user ? (
                <p className="mt-2 text-sm text-slate-500">
                  Signed in — your profile loads from and saves to your Exchange account.
                  {profileLoading && ' Loading saved profile…'}
                  {profileLoaded && !profileLoading && ' ✓ Loaded.'}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Not signed in — sign in to save this profile to your account. Until then, changes stay in this browser session.
                </p>
              )}
              {profileError && (
                <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{profileError}</p>
              )}
              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <label className="block text-sm font-semibold">
                    Nickname (shown to partners)
                    <input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Pick a nickname — not your real name"
                      maxLength={40}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="block text-sm font-semibold">
                      Native language
                      <select value={nativeLang} onChange={(e) => setNativeLang(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                        {['English', 'Korean', 'Spanish', 'Japanese', 'Portuguese'].map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold">
                      Learning
                      <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                        {['English', 'Korean', 'Spanish', 'Japanese', 'Portuguese'].map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold">
                      Level
                      <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                        {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="mt-4 text-sm font-semibold">Fluent languages (besides your native language)</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['English', 'Korean', 'Spanish', 'Japanese', 'Portuguese']
                      .filter((l) => l !== nativeLang)
                      .map((l) => (
                        <button
                          key={l}
                          onClick={() => toggleFluent(l)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${fluentLangs.includes(l) ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {l}
                        </button>
                      ))}
                  </div>
                  <p className="mt-4 text-sm font-semibold">Interests</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['Travel', 'Cooking', 'Football', 'Music', 'Movies', 'Reading', 'Hiking'].map((i) => (
                      <button
                        key={i}
                        onClick={() => toggleInterest(i)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${interestSel.includes(i) ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="font-bold">Matching</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold">
                      Learning goal
                      <select value={learningGoal} onChange={(e) => setLearningGoal(e.target.value as LearningGoal)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                        {GOALS.map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold">
                      Country
                      <select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                        <option value="">Select a country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold">
                      How I like to practice
                      <select value={commMode} onChange={(e) => setCommMode(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                        {COMM_MODES.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold">
                      Corrections
                      <select value={correctionPref} onChange={(e) => setCorrectionPref(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                        {CORRECTION_PREFS.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Corrections: how often you want partners to correct you (Often / Sometimes / Never).</p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="font-bold">Age &amp; gender</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold">
                      Date of birth (18+ only)
                      <input
                        type="date"
                        value={birthdate}
                        max={maxBirthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      Gender
                      <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                        {GENDERS.map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {`Your exact birthdate is never shown to anyone — only your age band${birthdateBand ? ` (${birthdateBand})` : ageBand ? ` (${ageBand})` : ''} is shown on your card.`}
                    {birthdateAge !== null && birthdateAge < 18 ? ' You must be 18 or older to save.' : ''}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="font-bold">Availability</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Timezone: {timezone ? `${timezone} (${utcLabel(utcOffsetMin)})` : 'detecting…'} — detected from your device.
                  </p>
                  <p className="mt-4 text-sm font-semibold">Days</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleAvailDay(d)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${availDays.includes(d) ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-sm font-semibold">Times of day</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {TIME_SLOTS.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleAvailSlot(s)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${availSlots.includes(s) ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <label className="mt-4 block text-sm font-semibold">
                    Sessions per week
                    <select value={availPerWeek} onChange={(e) => setAvailPerWeek(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:w-48">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n === 5 ? '5+' : n}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <label className="block text-sm font-semibold">
                    About me
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A short intro partners will see"
                      maxLength={200}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </label>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="font-bold">Verification</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    <li>{ageBand ? '✓ 18+ confirmed' : '◷ 18+ check — add your date of birth above'}</li>
                  </ul>
                  <h3 className="mt-4 font-bold">Safety settings</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <label className="flex items-center justify-between gap-3">
                      Hide my online status
                      <input type="checkbox" checked={hideOnline} onChange={(e) => setHideOnline(e.target.checked)} className="h-5 w-5 accent-violet-600" />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      Allow voice messages
                      <input type="checkbox" checked={allowVoice} onChange={(e) => setAllowVoice(e.target.checked)} className="h-5 w-5 accent-violet-600" />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      Only people of the same gender can find me
                      <input type="checkbox" checked={sameGenderOnly} onChange={(e) => setSameGenderOnly(e.target.checked)} className="h-5 w-5 accent-violet-600" />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      AI partners can message me first
                      <input
                        type="checkbox"
                        checked={aiOpeners}
                        onChange={(e) => {
                          setAiOpeners(e.target.checked);
                          saveOpenerEnabled(e.target.checked);
                        }}
                        className="h-5 w-5 accent-violet-600"
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Safety settings are free for everyone — including the gender filter on Discover. AI first messages come at most once a day per partner, and only from AI partners (marked AI).</p>
                </div>
                {saveError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{saveError}</p>
                )}
                <button
                  onClick={saveProfile}
                  disabled={authLoading || profileLoading}
                  className="rounded-xl bg-violet-600 py-3 font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                >
                  {authLoading || profileLoading ? 'Loading…' : user ? 'Save profile' : 'Save profile (sign in to store it)'}
                </button>
                {!user && !authLoading && (
                  <p className="-mt-2 text-center text-xs text-slate-400">Signing in uses the existing MunTalk login — no new login flow on this page.</p>
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Voice call: remote audio plays here (audio-only, no video element). */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Outgoing / active call bar */}
      {call && call.phase !== 'incoming' && (
        <div className="fixed inset-x-0 bottom-20 z-50 mx-auto w-fit max-w-[92%] rounded-3xl bg-slate-900 px-5 py-4 text-center text-white shadow-xl md:bottom-8">
          <p className="font-extrabold">
            {call.phase === 'outgoing' ? `📞 Calling ${call.peerName}…` : `🎤 On a call with ${call.peerName}`}
          </p>
          {call.phase === 'active' && (
            <p className="mt-1 text-sm text-slate-300">
              {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
              {' · '}
              {call.connection === 'connected'
                ? '연결됨'
                : call.connection === 'failed'
                  ? '연결 실패 — 네트워크를 확인하세요'
                  : call.connection === 'closed'
                    ? '종료됨'
                    : '연결 중…'}
            </p>
          )}
          {call.phase === 'outgoing' && <p className="mt-1 text-sm text-slate-300">Waiting for them to pick up…</p>}
          <div className="mt-3 flex justify-center gap-2">
            {call.phase === 'active' && (
              <button
                onClick={toggleCallMute}
                className="min-h-[44px] rounded-xl bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {call.muted ? '🔇 Unmute' : '🎤 Mute'}
              </button>
            )}
            <button
              onClick={() => void endVoiceCall()}
              className="min-h-[44px] rounded-xl bg-red-600 px-5 py-2 text-sm font-bold hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              {call.phase === 'outgoing' ? 'Cancel call' : 'End call'}
            </button>
          </div>
        </div>
      )}

      {/* Incoming call */}
      {call && call.phase === 'incoming' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-xl">
            <p className="text-4xl">📞</p>
            <h3 className="mt-2 font-extrabold">Incoming voice call</h3>
            <p className="mt-1 text-sm text-slate-500">
              {call.peerName} wants to talk. Audio only — no video.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => void declineIncomingCall()}
                className="min-h-[48px] flex-1 rounded-xl bg-slate-200 py-3 font-bold text-slate-700 hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                거절
              </button>
              <button
                onClick={() => void acceptIncomingCall()}
                className="min-h-[48px] flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                받기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg md:bottom-8">
          {toast}
        </div>
      )}

      {/* Photo lightbox — original high-resolution file (not the thumbnail) */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightboxAlt}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close photo viewer"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            ×
          </button>
          {lightbox.images && lightbox.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stepLightbox(-1);
                }}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stepLightbox(1);
                }}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4"
              >
                ›
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element — the lightbox must show the original full-resolution file, not an optimized variant */}
          <img
            key={lightbox.src}
            ref={lightboxImgRef}
            src={lightbox.src}
            alt={lightboxAlt}
            onLoad={() => setLightboxLoading(false)}
            onError={() => {
              setLightboxLoading(false);
              setLightboxError(true);
            }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
          />
          {lightboxLoading && !lightboxError && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status" aria-label="Loading photo">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            </div>
          )}
          {lightboxError && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-bold text-white">
              Couldn&apos;t load this photo.
            </p>
          )}
          {lightbox.images && lightbox.images.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
              {(lightbox.index ?? 0) + 1} / {lightbox.images.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
