'use client';

import { useState } from 'react';

/*
 * MunTalk Exchange — hidden demo page (NOT linked from navigation).
 * Demo data only: no Firestore, Auth, payments, or push wiring.
 * Real backend wiring follows the MVP spec in a later step.
 */

type Tab = 'discover' | 'chats' | 'review' | 'pro' | 'profile';

type PartnerStatus = 'idle' | 'pending' | 'matched';

type Partner = {
  id: string;
  name: string;
  flag: string;
  native: string;
  learning: string;
  level: string;
  match: number;
  interests: string[];
  verified: boolean;
  bio: string;
  reply: string;
};

type Msg = {
  id: number;
  from: 'me' | 'partner';
  text: string;
  voice?: boolean;
  translation?: string;
  correction?: { before: string; after: string; note: string };
};

type Chat = {
  id: string;
  partnerId: string;
  name: string;
  flag: string;
  messages: Msg[];
  heldBack?: boolean;
};

const PARTNERS: Partner[] = [
  {
    id: 'mateo',
    name: 'Mateo',
    flag: '🇲🇽',
    native: 'Spanish',
    learning: 'English',
    level: 'Intermediate',
    match: 94,
    interests: ['Football', 'Cooking', 'Travel'],
    verified: true,
    bio: 'Mexican student who wants to practice English by talking about food and football.',
    reply: 'Hey! Nice to meet you. I love talking about food — what did you cook recently?',
  },
  {
    id: 'emma',
    name: 'Emma',
    flag: '🇺🇸',
    native: 'English',
    learning: 'Korean',
    level: 'Beginner',
    match: 91,
    interests: ['K-pop', 'Movies', 'Coffee'],
    verified: true,
    bio: 'Learning Korean and happy to help with natural English in return.',
    reply: 'That sounds great! I was just watching a Korean movie last night.',
  },
  {
    id: 'kenji',
    name: 'Kenji',
    flag: '🇯🇵',
    native: 'Japanese',
    learning: 'English',
    level: 'Intermediate',
    match: 88,
    interests: ['Anime', 'Hiking', 'Photography'],
    verified: true,
    bio: 'Office worker in Osaka. I want to get comfortable speaking English at work.',
    reply: 'Hi! Hiking is my weekend thing. Where do you usually go?',
  },
  {
    id: 'sofia',
    name: 'Sofia',
    flag: '🇧🇷',
    native: 'Portuguese',
    learning: 'English',
    level: 'Advanced',
    match: 86,
    interests: ['Music', 'Reading', 'Running'],
    verified: false,
    bio: 'Book lover from São Paulo. Looking for someone to trade English and Portuguese.',
    reply: 'Hello! Just finished a great novel — do you like reading too?',
  },
];

const EMMA_CHAT: Chat = {
  id: 'emma',
  partnerId: 'emma',
  name: 'Emma',
  flag: '🇺🇸',
  messages: [
    { id: 1, from: 'partner', text: 'Hi! I am studying Korean these days.', translation: '안녕! 요즘 한국어를 공부하고 있어.' },
    { id: 2, from: 'me', text: 'I think its correct', correction: { before: 'I think its correct', after: "I think it's correct", note: "“its” is possessive. For “it is”, use the contraction “it's”." } },
    { id: 3, from: 'partner', text: 'Thanks! That helps a lot.', translation: '고마워! 정말 도움이 돼.' },
    { id: 4, from: 'partner', text: '', voice: true },
  ],
};

const KENJI_CHAT: Chat = {
  id: 'kenji',
  partnerId: 'kenji',
  name: 'Kenji',
  flag: '🇯🇵',
  messages: [
    { id: 1, from: 'partner', text: 'Hello! Nice to meet you.', translation: '안녕하세요! 만나서 반가워요.' },
    { id: 2, from: 'me', text: 'Nice to meet you too! Do you like hiking?' },
  ],
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
  const [statuses, setStatuses] = useState<Record<string, PartnerStatus>>({});
  const [chats, setChats] = useState<Chat[]>([EMMA_CHAT, KENJI_CHAT]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [toast, setToast] = useState('');
  const [pro, setPro] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [reportChat, setReportChat] = useState<Chat | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [translated, setTranslated] = useState<Record<number, boolean>>({});
  const [aiChecked, setAiChecked] = useState<Record<number, boolean>>({});
  const [heldIds, setHeldIds] = useState<number[]>([]);

  // Profile (demo, browser state only)
  const [nativeLang, setNativeLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Korean');
  const [level, setLevel] = useState('Intermediate');
  const [interestSel, setInterestSel] = useState<string[]>(['Travel', 'Cooking']);
  const [hideOnline, setHideOnline] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [allowVoice, setAllowVoice] = useState(true);

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 4000);
  };

  const sayHello = (p: Partner) => {
    setStatuses((s) => ({ ...s, [p.id]: 'pending' }));
    window.setTimeout(() => {
      setStatuses((s) => ({ ...s, [p.id]: 'matched' }));
      setChats((cs) =>
        cs.some((c) => c.id === p.id)
          ? cs
          : [...cs, { id: p.id, partnerId: p.id, name: p.name, flag: p.flag, messages: [] }]
      );
      showToast(`${p.name} accepted your hello! A chat was created.`);
    }, 2500);
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !activeChat) return;
    if (CONTACT_GUARD.test(text)) {
      const id = msgSeq++;
      setHeldIds((h) => [...h, id]);
      setChats((cs) =>
        cs.map((c) =>
          c.id === activeChat.id
            ? { ...c, messages: [...c.messages, { id, from: 'me', text }], heldBack: true }
            : c
        )
      );
      setInput('');
      showToast('Held back: phone numbers, links and contact IDs cannot be sent here.');
      return;
    }
    const id = msgSeq++;
    setChats((cs) =>
      cs.map((c) => (c.id === activeChat.id ? { ...c, messages: [...c.messages, { id, from: 'me', text }] } : c))
    );
    setInput('');
    const partner = PARTNERS.find((p) => p.id === activeChat.partnerId);
    window.setTimeout(() => {
      const rid = msgSeq++;
      setChats((cs) =>
        cs.map((c) =>
          c.id === activeChat.id
            ? { ...c, messages: [...c.messages, { id: rid, from: 'partner', text: partner ? partner.reply : 'Nice! Tell me more.' }] }
            : c
        )
      );
    }, 1500);
  };

  const reportAndBlock = () => {
    if (!reportChat) return;
    setChats((cs) => cs.filter((c) => c.id !== reportChat.id));
    if (activeChatId === reportChat.id) setActiveChatId(null);
    showToast(`${reportChat.name} reported (${reportReason}) and blocked.`);
    setReportChat(null);
    setReportReason('');
  };

  const toggleInterest = (interest: string) =>
    setInterestSel((sel) => (sel.includes(interest) ? sel.filter((i) => i !== interest) : [...sel, interest]));

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
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
            Demo — no real data, no backend yet
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
              <h2 className="text-xl font-extrabold">Discover partners</h2>
              <p className="mt-1 text-sm text-slate-500">
                4 partner suggestions today. Say hello — they accept before a chat opens. No open DMs.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {PARTNERS.map((p) => {
                  const status = statuses[p.id] || 'idle';
                  return (
                    <article key={p.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{p.flag}</span>
                          <div>
                            <p className="font-bold">
                              {p.name}{' '}
                              {p.verified ? (
                                <span title="Phone verified" className="text-sky-600">✓</span>
                              ) : (
                                <span title="Not verified yet" className="text-xs font-semibold text-slate-400">Unverified</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              {p.native} → {p.learning} · {p.level}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-700">
                          {p.match}% match
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{p.bio}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.interests.map((i) => (
                          <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{i}</span>
                        ))}
                      </div>
                      <button
                        onClick={() => sayHello(p)}
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
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {tab === 'chats' && (
            <section>
              <h2 className="text-xl font-extrabold">Chats</h2>
              <p className="mt-1 text-sm text-slate-500">
                Tap a chat to open it. Phone numbers, links and contact IDs are blocked before sending.
              </p>
              {!activeChat ? (
                <div className="mt-4 grid gap-3">
                  {chats.length === 0 && (
                    <p className="rounded-2xl border bg-white p-6 text-center text-sm text-slate-500">
                      No chats yet. Say hello on Discover to start one.
                    </p>
                  )}
                  {chats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChatId(c.id)}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <span className="text-3xl">{c.flag}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{c.name}</span>
                        <span className="block truncate text-sm text-slate-500">
                          {c.messages.length > 0 ? c.messages[c.messages.length - 1].text || '🎤 Voice message' : 'New match — say hi!'}
                        </span>
                      </span>
                      <span className="shrink-0 text-lg text-slate-300">›</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-slate-100 p-3 sm:p-4">
                    <button onClick={() => setActiveChatId(null)} className="min-h-[44px] rounded-lg px-2 font-bold text-violet-600 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">← Back</button>
                    <span className="text-2xl">{activeChat.flag}</span>
                    <span className="font-bold">{activeChat.name}</span>
                    <button
                      onClick={() => setReportChat(activeChat)}
                      className="ml-auto min-h-[36px] rounded-full border border-red-200 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      Report
                    </button>
                  </div>
                  <div className="flex flex-col gap-3 p-4">
                    {activeChat.messages.map((m) => {
                      const held = heldIds.includes(m.id);
                      return (
                        <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm [overflow-wrap:anywhere] sm:max-w-[75%] ${
                              m.from === 'me'
                                ? 'rounded-br-md bg-violet-600 text-white'
                                : 'rounded-bl-md bg-slate-100 text-slate-800'
                            }`}
                          >
                            {m.voice ? (
                              <span className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/30">▶</span>
                                Voice message · 0:12
                                <span className="text-xs opacity-70">(pronunciation score: UI preview)</span>
                              </span>
                            ) : (
                              <span>{m.text}</span>
                            )}
                            {held && (
                              <span className="mt-1 block rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                                Held back — not sent. Contact details cannot be shared here.
                              </span>
                            )}
                            {!held && m.translation && translated[m.id] && (
                              <span className="mt-1 block border-t border-slate-200 pt-1 text-xs opacity-80">{m.translation}</span>
                            )}
                            {!held && m.correction && aiChecked[m.id] && (
                              <span className="mt-2 block rounded-lg bg-emerald-50 px-2 py-1.5 text-xs text-emerald-900">
                                <span className="font-bold">AI check: </span>
                                <span className="line-through opacity-60">{m.correction.before}</span>
                                {' → '}
                                <span className="font-bold">{m.correction.after}</span>
                                <span className="mt-0.5 block text-emerald-700">{m.correction.note}</span>
                              </span>
                            )}
                            {!held && (
                              <span className="mt-1.5 flex gap-2">
                                {m.translation && (
                                  <button
                                    onClick={() => setTranslated((t) => ({ ...t, [m.id]: !t[m.id] }))}
                                    className="text-xs font-bold underline opacity-80"
                                  >
                                    {translated[m.id] ? 'Hide translation' : 'Translate'}
                                  </button>
                                )}
                                {m.correction && (
                                  <button
                                    onClick={() => setAiChecked((t) => ({ ...t, [m.id]: !t[m.id] }))}
                                    className="text-xs font-bold underline opacity-80"
                                  >
                                    AI check
                                  </button>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 border-t border-slate-100 p-3">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Write a message… (try a phone number to see the guard)"
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                    <button onClick={sendMessage} className="min-h-[44px] rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98]">
                      Send
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
              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <div className="grid gap-3 sm:grid-cols-3">
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
                  onClick={() => showToast('Profile saved (demo — stored in this browser session only).')}
                  className="rounded-xl bg-violet-600 py-3 font-bold text-white shadow-sm hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  Save profile
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
        {TABS.map((t) => tabButton(t, false))}
      </nav>

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
