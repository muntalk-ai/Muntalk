'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { apiFetch } from '@/lib/apiClient';
import { AI_PARTNERS, AI_DISCLOSURE, type AiPartner } from '@/lib/exchangeAiPartners';
import {
  EXCHANGE_MEMORIES_COLLECTION,
  formatMemoryForPrompt,
  memoryDocId,
  type ExchangeMemory,
} from '@/lib/exchangeMemory';
import { useAuth } from '@/context/AuthContext';

/*
 * MunTalk Exchange — hidden lounge page (NOT linked from navigation).
 * Discover is split into two rooms:
 *   - AI Rooms: the 20 AI partners only. A fixed banner at the top of
 *     the room and an "AI" badge on every AI card and AI message state
 *     plainly that these partners are AI, not real people.
 *   - People Rooms (AI-first waitlist): NO user list is shown here, and no
 *     demo or AI profiles are ever shown here. Visitors pick a language
 *     pair (Korean ↔ English first, plus other pairs) and join that pair's
 *     waitlist, stored in Firestore collection `exchange_waitlist`
 *     (fields: uid, pair, pairId, createdAt — minimal). The waiting count
 *     is the real document count, or it says it is unavailable; a fake
 *     count is never shown. If the console rules for the new collection
 *     are not published yet, join/count fail gracefully with a notice.
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
 * AI Review / Pro tabs are still demo data. The Profile tab is wired to
 * Firestore for signed-in users (collection `exchange_profiles`).
 */

type Tab = 'discover' | 'chats' | 'review' | 'pro' | 'profile';

type Room = 'ai' | 'people';

// Waitlist language pairs. Pilot focus is Korean ↔ English; the rest are
// selectable so other pairs can gather without a code change.
const WAITLIST_PAIRS = [
  { id: 'ko-en', label: 'Korean ↔ English' },
  { id: 'en-es', label: 'English ↔ Spanish' },
  { id: 'en-ja', label: 'English ↔ Japanese' },
  { id: 'en-pt', label: 'English ↔ Portuguese' },
  { id: 'ko-ja', label: 'Korean ↔ Japanese' },
  { id: 'en-fr', label: 'English ↔ French' },
];

type Msg = {
  id: number;
  from: 'me' | 'partner';
  text: string;
  ai?: boolean;
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
  isAi: boolean;
  messages: Msg[];
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

export default function ExchangePage() {
  const [tab, setTab] = useState<Tab>('discover');
  const [room, setRoom] = useState<Room>('ai');
  const [chats, setChats] = useState<Chat[]>([]);
  const [aiSending, setAiSending] = useState(false);
  const [waitlistPair, setWaitlistPair] = useState('ko-en');
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistJoining, setWaitlistJoining] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [waitlistReload, setWaitlistReload] = useState(0);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [toast, setToast] = useState('');
  const [pro, setPro] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [reportChat, setReportChat] = useState<Chat | null>(null);
  const [reportReason, setReportReason] = useState('');

  // AI partner memory (per partner, loaded once per page load).
  // memoryRef: partnerId -> formatted memory text sent with chat calls.
  // memorySavedRef: chatId -> learner turns already saved, so leaving a
  // chat only triggers a summary call when there are new turns.
  const memoryRef = useRef<Record<string, string>>({});
  const memorySavedRef = useRef<Record<string, number>>({});
  const [memoryClearing, setMemoryClearing] = useState(false);

  // Profile (demo, browser state only)
  const [nativeLang, setNativeLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Korean');
  const [level, setLevel] = useState('Intermediate');
  const [interestSel, setInterestSel] = useState<string[]>(['Travel', 'Cooking']);
  // Set when the user taps an interest chip. The Firestore load below must
  // never overwrite a selection the user already made (load resolving after
  // a tap used to wipe it, so a tap looked dead and never persisted).
  const interestEditedRef = useRef(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [hideOnline, setHideOnline] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [allowVoice, setAllowVoice] = useState(true);

  // Firestore wiring for the Profile tab only.
  // Only nickname / languages / level / interests / bio are stored —
  // never real name, email, or contact details.
  const { user, loading: authLoading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      interestEditedRef.current = false;
      setProfileLoaded(false);
      setProfileError('');
      return;
    }
    let cancelled = false;
    // A fresh load for this user: user edits from here on win over the doc.
    interestEditedRef.current = false;
    setProfileLoading(true);
    getDoc(doc(db, 'exchange_profiles', user.uid))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          const d = snap.data();
          if (typeof d.nativeLang === 'string') setNativeLang(d.nativeLang);
          if (typeof d.targetLang === 'string') setTargetLang(d.targetLang);
          if (typeof d.level === 'string') setLevel(d.level);
          if (!interestEditedRef.current && Array.isArray(d.interests)) setInterestSel(d.interests.filter((i): i is string => typeof i === 'string'));
          if (typeof d.nickname === 'string') setNickname(d.nickname);
          if (typeof d.bio === 'string') setBio(d.bio);
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
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // People room = waitlist (AI-first). The count is the real number of
  // exchange_waitlist documents for the selected pair. If the console
  // rules for the new collection are not published yet, the query fails
  // with permission-denied: the count stays unknown (never faked) and a
  // notice is shown instead.
  useEffect(() => {
    if (room !== 'people' || !user) return;
    let cancelled = false;
    setWaitlistLoading(true);
    setWaitlistError('');
    setWaitlistJoined(false);
    getDocs(query(collection(db, 'exchange_waitlist'), where('pairId', '==', waitlistPair)))
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
  }, [room, user, waitlistPair, waitlistReload]);

  // One waitlist entry per user per pair: doc id `${uid}_${pairId}`.
  // Only uid / pair / pairId / createdAt are stored — nothing else.
  const joinWaitlist = async () => {
    if (!user || waitlistJoining) return;
    const pair = WAITLIST_PAIRS.find((p) => p.id === waitlistPair) || WAITLIST_PAIRS[0];
    setWaitlistJoining(true);
    try {
      await setDoc(
        doc(db, 'exchange_waitlist', `${user.uid}_${pair.id}`),
        { uid: user.uid, pair: pair.label, pairId: pair.id, createdAt: serverTimestamp() },
        { merge: true }
      );
      setWaitlistJoined(true);
      setWaitlistError('');
      setWaitlistReload((r) => r + 1);
      showToast(`Joined the waitlist for ${pair.label}.`);
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

  const saveProfile = async () => {
    if (!user) {
      showToast('Sign in to save your Exchange profile to your account.');
      return;
    }
    try {
      await setDoc(
        doc(db, 'exchange_profiles', user.uid),
        {
          nickname: nickname.trim(),
          nativeLang,
          targetLang,
          level,
          interests: interestSel,
          bio: bio.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setProfileLoaded(true);
      showToast('Profile saved to your Exchange account.');
    } catch (err) {
      showToast(
        (err as { code?: string }).code === 'permission-denied'
          ? 'Could not save: Exchange profile permissions are not published yet. Your changes are kept on this page.'
          : 'Could not save your profile. Please try again.'
      );
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
    } catch {
      // Never surface an error for memory: the chat works without it.
      memoryRef.current[partnerId] = '';
    }
  };

  const startAiChat = (p: AiPartner) => {
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
              isAi: true,
              messages: [{ id: msgSeq++, from: 'partner', text: p.greeting, ai: true }],
            },
          ]
    );
    setActiveChatId(p.id);
    setTab('chats');
    void loadMemoryForPartner(p.id);
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const sendAiMessage = async () => {
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
    setChats((cs) =>
      cs.map((c) => (c.id === activeChat.id ? { ...c, messages: [...c.messages, { id, from: 'me' as const, text }] } : c))
    );
    setInput('');
    setAiSending(true);
    try {
      const res = await fetch('/api/exchange-ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: activeChat.partnerId, message: text, history, sentPhotos, turnsSincePhoto, memory: memoryRef.current[activeChat.partnerId] || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'AI reply failed');
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
      setChats((cs) =>
        cs.map((c) =>
          c.id === activeChat.id ? { ...c, messages: [...c.messages, { id: rid, from: 'partner' as const, text: reply, ai: true, photo, correction }] } : c
        )
      );
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
    const chat = activeChat;
    setActiveChatId(null);
    if (chat) void saveMemoryForChat(chat);
  };

  const clearMemoryForChat = async () => {
    if (!activeChat?.isAi || !user || memoryClearing) return;
    if (!window.confirm(`Clear what ${activeChat.name} remembers about you? This cannot be undone.`)) return;
    setMemoryClearing(true);
    try {
      const res = await apiFetch('/api/exchange-ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-memory', partnerId: activeChat.partnerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not clear memory');
      delete memoryRef.current[activeChat.partnerId];
      showToast('Memory cleared.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not clear memory. Please try again.');
    } finally {
      setMemoryClearing(false);
    }
  };

  const reportAndBlock = () => {
    if (!reportChat) return;
    setChats((cs) => cs.filter((c) => c.id !== reportChat.id));
    if (activeChatId === reportChat.id) setActiveChatId(null);
    showToast(`${reportChat.name} reported (${reportReason}) and blocked.`);
    setReportChat(null);
    setReportReason('');
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

  const tabButton = (t: { id: Tab; label: string; icon: string }, vertical: boolean) => (
    <button
      key={t.id}
      onClick={() => setTab(t.id)}
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-900 via-violet-600 to-violet-400 text-lg font-bold text-white shadow-md shadow-violet-600/25 ring-1 ring-white/40">
              M
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-tight">MunTalk Exchange</h1>
              <p className="text-xs text-slate-500">Talk with people. Review with AI.</p>
            </div>
          </div>
          {pro && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">PRO</span>}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            Pilot — AI rooms are the main experience; People room is a waitlist
          </span>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 pb-32 md:pb-10 md:py-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-20 flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">
            {TABS.map((t) => tabButton(t, true))}
          </nav>
          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-xs leading-relaxed text-slate-500 shadow-sm">
            <p className="text-sm font-bold text-slate-700">Daily new chats</p>
            <p className="mt-1">Free: 20 / day · Pro: 50 / day</p>
            <p>Ongoing chats are unlimited.</p>
            <p className="mt-2">New accounts (first 7 days): 5 / day.</p>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
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
              <div role="tablist" aria-label="Room type" className="mt-4 flex gap-2">
                <button
                  role="tab"
                  aria-selected={room === 'ai'}
                  onClick={() => setRoom('ai')}
                  className={`min-h-[44px] flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${room === 'ai' ? 'bg-violet-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300'}`}
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
                  <div className="sticky top-[68px] z-20 mt-4 rounded-2xl border border-violet-300 bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-md">
                    🤖 {AI_DISCLOSURE} Every AI card and AI message here is marked &ldquo;AI&rdquo;.
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    20 AI practice partners — no language filter. Pick anyone and practice in any language. They are always online — start a chat and get a real AI reply.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {AI_PARTNERS.map((p) => (
                      <article key={p.id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                        <div className="flex items-start gap-3">
                          <img src={p.avatar} alt={`${p.name} AI partner avatar`} className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-violet-200" />
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
                          <span className="inline-block rounded-full bg-violet-600 px-3.5 py-1.5 text-base font-extrabold text-white">
                            {p.native} → {p.learning}
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
                              <img
                                key={g}
                                src={g}
                                alt={`Lifestyle photo ${i + 1} of AI partner ${p.name}`}
                                loading="lazy"
                                className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                              />
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
                    People rooms open when people gather for a language pair. Pick a pair and join its waitlist — the waiting number below is the real
                    count of waitlist entries, never a made-up number.
                  </p>
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-sm font-bold">Choose a language pair</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {WAITLIST_PAIRS.map((pair) => (
                        <button
                          key={pair.id}
                          onClick={() => setWaitlistPair(pair.id)}
                          aria-pressed={waitlistPair === pair.id}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${waitlistPair === pair.id ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {pair.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl bg-violet-50 px-4 py-3">
                      {waitlistLoading ? (
                        <p className="text-sm font-semibold text-slate-500">Loading waiting count…</p>
                      ) : waitlistCount !== null ? (
                        <p className="text-sm font-extrabold text-slate-800">
                          {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} waiting for {(WAITLIST_PAIRS.find((p) => p.id === waitlistPair) || WAITLIST_PAIRS[0]).label}
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-slate-600">Waiting count is not available yet.</p>
                      )}
                      {waitlistJoined && (
                        <p className="mt-1 text-sm font-bold text-emerald-700">
                          ✓ You are on the waitlist for {(WAITLIST_PAIRS.find((p) => p.id === waitlistPair) || WAITLIST_PAIRS[0]).label}. This language pair will open when people gather.
                        </p>
                      )}
                      {waitlistError && <p className="mt-1 text-sm font-semibold text-amber-800">{waitlistError}</p>}
                    </div>
                    {!user ? (
                      <p className="mt-3 text-sm text-slate-500">Sign in to join the waitlist. Until then, you can still practice with an AI partner.</p>
                    ) : waitlistJoined ? (
                      <p className="mt-3 text-sm font-semibold text-slate-600">You are on this waitlist. Check back here — this pair opens when people gather.</p>
                    ) : (
                      <button
                        onClick={joinWaitlist}
                        disabled={waitlistJoining}
                        className="mt-3 min-h-[44px] w-full rounded-xl bg-violet-600 py-3 font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
                      >
                        {waitlistJoining ? 'Joining…' : `Join waitlist for ${(WAITLIST_PAIRS.find((p) => p.id === waitlistPair) || WAITLIST_PAIRS[0]).label}`}
                      </button>
                    )}
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <p className="font-extrabold">No people here yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      No people here yet — practice with an AI partner, or join the waitlist and we&apos;ll let you know when people gather.
                    </p>
                    <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                      <button
                        onClick={() => setRoom('ai')}
                        className="min-h-[44px] rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                      >
                        Practice with an AI partner
                      </button>
                      {user && !waitlistJoined && (
                        <button
                          onClick={joinWaitlist}
                          disabled={waitlistJoining}
                          className="min-h-[44px] rounded-xl border border-violet-300 bg-white px-5 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60"
                        >
                          Join the waitlist
                        </button>
                      )}
                    </div>
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
              {!activeChat ? (
                <div className="mt-4 grid gap-3">
                  {chats.length === 0 && (
                    <p className="rounded-2xl border bg-white p-6 text-center text-sm text-slate-500">
                      No chats yet. Start one from an AI Room on Discover.
                    </p>
                  )}
                  {chats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChatId(c.id)}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <img src={c.avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-violet-200" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">
                          {c.name}{' '}
                          {c.isAi && <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-extrabold text-white">AI</span>}
                        </span>
                        <span className="block truncate text-sm text-slate-500">
                          {c.messages.length > 0 ? c.messages[c.messages.length - 1].text : 'New match — say hi!'}
                        </span>
                      </span>
                      <span className="shrink-0 text-lg text-slate-300">›</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-slate-100 p-3 sm:p-4">
                    <button onClick={leaveAiChat} className="min-h-[44px] rounded-lg px-2 font-bold text-violet-600 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">← Back</button>
                    <img src={activeChat.avatar} alt={`${activeChat.name} AI partner`} className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-violet-200 sm:h-16 sm:w-16" />
                    <span className="font-bold">
                      {activeChat.name}{' '}
                      {activeChat.isAi && <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-extrabold text-white">AI</span>}
                    </span>
                    {activeChat.isAi && user && (
                      <button
                        onClick={clearMemoryForChat}
                        disabled={memoryClearing}
                        className="ml-auto min-h-[36px] rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60"
                      >
                        {memoryClearing ? 'Clearing…' : 'Clear memory'}
                      </button>
                    )}
                    <button
                      onClick={() => setReportChat(activeChat)}
                      className="min-h-[36px] rounded-full border border-red-200 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      Report
                    </button>
                  </div>
                  {activeChat.isAi && (
                    <div className="border-b border-violet-100 bg-violet-50 px-4 py-2.5 text-xs font-bold text-violet-800">
                      🤖 {AI_DISCLOSURE}
                    </div>
                  )}
                  <div className="flex flex-col gap-3 p-4">
                    {activeChat.messages.map((m) => (
                      <div key={m.id} className={`flex items-start gap-2 ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                        {m.from !== 'me' && (
                          <img src={activeChat.avatar} alt="" className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-violet-200" />
                        )}
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
                          className={`max-w-[85%] cursor-pointer rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm [overflow-wrap:anywhere] sm:max-w-[75%] ${
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
                              <img
                                src={m.photo}
                                alt="Photo shared by this AI partner from their gallery"
                                loading="lazy"
                                className="max-h-56 w-auto max-w-full rounded-xl object-cover"
                              />
                            </a>
                          )}
                          <span>{m.text}</span>
                        </div>
                      </div>
                    ))}
                    {aiSending && <p className="text-xs font-semibold text-slate-400">AI is generating a reply…</p>}
                  </div>
                  <div className="flex gap-2 border-t border-slate-100 p-3">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                      placeholder="Write a message…"
                      maxLength={500}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                    <button onClick={sendAiMessage} disabled={aiSending} className="min-h-[44px] rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60">
                      {aiSending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === 'review' && (
            <section>
              <h2 className="text-xl font-extrabold">AI Review</h2>
              <p className="mt-1 text-sm text-slate-500">
                Based on your demo chat with Emma. Free: 1 review per week. Pro: unlimited.
              </p>
              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="font-bold">Corrections from this week (3)</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    <li><span className="line-through">I think its correct</span> → <b>I think it&apos;s correct</b> — &quot;its&quot; is possessive; &quot;it&apos;s&quot; means &quot;it is&quot;.</li>
                    <li><span className="line-through">I am agree</span> → <b>I agree</b> — &quot;agree&quot; is already a verb.</li>
                    <li><span className="line-through">He go to school</span> → <b>He goes to school</b> — third person adds -s.</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="font-bold">More natural expressions</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Instead of &quot;Thanks! That helps a lot.&quot;, try &quot;That really clears it up, thanks!&quot; — warmer and more native.
                  </p>
                  <h3 className="mt-4 font-bold">Vocabulary from your chats</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['clear up', 'in return', 'comfortable', 'practice', 'recently'].map((w) => (
                      <span key={w} className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">{w}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="font-bold">This week</h3>
                  <div className="mt-3 flex items-end gap-2">
                    {[3, 5, 2, 6, 4, 7, 1].map((h, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-violet-500" style={{ height: `${h * 10}px` }} />
                        <span className="text-[10px] text-slate-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Messages exchanged per day (demo data).</p>
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
                    Ask Emma about her weekend plans using &quot;going to&quot; — then review the corrections together.
                  </p>
                </div>
              </div>
            </section>
          )}

          {tab === 'pro' && (
            <section>
              <h2 className="text-xl font-extrabold">MunTalk Exchange Pro</h2>
              <p className="mt-1 text-sm text-slate-500">People talk. AI reviews. Pro removes the limits.</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`flex-1 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:p-5 ${billing === 'monthly' ? 'border-violet-600 bg-violet-50 shadow-sm ring-1 ring-violet-600' : 'border-slate-200/80 bg-white hover:border-violet-300'}`}
                >
                  <p className="font-bold">Monthly</p>
                  <p className="text-2xl font-extrabold">$8<span className="text-sm font-normal text-slate-500">/mo</span></p>
                </button>
                <button
                  onClick={() => setBilling('yearly')}
                  className={`flex-1 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:p-5 ${billing === 'yearly' ? 'border-violet-600 bg-violet-50 shadow-sm ring-1 ring-violet-600' : 'border-slate-200/80 bg-white hover:border-violet-300'}`}
                >
                  <p className="font-bold">Yearly <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Save 33%</span></p>
                  <p className="text-2xl font-extrabold">$64<span className="text-sm font-normal text-slate-500">/yr</span></p>
                  <p className="text-xs text-slate-500">≈ $5.33 / month</p>
                </button>
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>50 new chats per day (free: 20)</li>
                <li>Unlimited AI reviews + weekly report</li>
                <li>Unlimited translations</li>
                <li>Advanced filters: region, timezone, goals, verified-only</li>
                <li>Safety tools (report, block, contact guard) are free for everyone</li>
              </ul>
              <button
                onClick={() => {
                  setPro(true);
                  showToast('7-day trial started (demo). PRO badge is now active.');
                }}
                disabled={pro}
                className={`mt-4 w-full rounded-xl py-3 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-default ${pro ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-600 text-white shadow-sm hover:bg-violet-700'}`}
              >
                {pro ? '✓ Trial active — you are PRO (demo)' : 'Start 7-day free trial'}
              </button>
              <p className="mt-2 text-center text-xs text-slate-400">Demo only — no payment is taken on this page.</p>
            </section>
          )}

          {tab === 'profile' && (
            <section>
              <h2 className="text-xl font-extrabold">My Exchange profile</h2>
              <p className="mt-1 text-sm text-slate-500">Only nickname, languages, level and interests are shown to partners.</p>
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
                    <li>✓ Phone verified</li>
                    <li>✓ 18+ confirmed</li>
                    <li>◷ Profile photo review pending</li>
                  </ul>
                  <h3 className="mt-4 font-bold">Safety settings</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <label className="flex items-center justify-between gap-3">
                      Hide my online status
                      <input type="checkbox" checked={hideOnline} onChange={(e) => setHideOnline(e.target.checked)} className="h-5 w-5 accent-violet-600" />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      Only verified partners can message me
                      <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="h-5 w-5 accent-violet-600" />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      Allow voice messages
                      <input type="checkbox" checked={allowVoice} onChange={(e) => setAllowVoice(e.target.checked)} className="h-5 w-5 accent-violet-600" />
                    </label>
                  </div>
                </div>
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

      {/* Mobile bottom tab bar — hidden inside an open chat room, where the
          Back button already navigates and the fixed bar would ride up with
          the mobile keyboard and cover the message being typed. */}
      {!activeChat && (
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
          {TABS.map((t) => tabButton(t, false))}
        </nav>
      )}

      {/* Report modal */}
      {reportChat && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl">
            {!reportReason ? (
              <>
                <h3 className="font-extrabold">Report {reportChat.name}?</h3>
                <p className="mt-1 text-sm text-slate-500">Step 1 of 2 — pick a reason.</p>
                <div className="mt-3 grid gap-2">
                  {['Spam', 'Inappropriate content', 'Asking for money', 'Other'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setReportReason(r)}
                      className="rounded-xl border border-slate-200 px-3 py-3 text-left text-sm font-semibold transition hover:border-red-300 hover:bg-red-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <button onClick={() => setReportChat(null)} className="mt-3 min-h-[44px] w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-700">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h3 className="font-extrabold">Report &amp; block?</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Step 2 of 2 — {reportChat.name} will be blocked, this chat will be removed, and you will not be notified of each other again.
                </p>
                <button onClick={reportAndBlock} className="mt-4 min-h-[48px] w-full rounded-xl bg-red-600 py-3 font-bold text-white shadow-sm hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 active:scale-[0.98]">
                  Report &amp; block
                </button>
                <button onClick={() => setReportReason('')} className="mt-2 min-h-[44px] w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-700">
                  Back
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
