'use client';

// Muntuz landing page (client part).
// Hero + how it works + People Rooms (waitlist notice)
// + Meet the house (5 AI friends) + waitlist email signup
// (Firestore `muntuz_waitlist`) + Muntuz footer. English, mobile-first.
//
// Only features that actually work are shown: 50 AI partners, voice-only
// calls, natural-expression corrections, gallery photos in chat, any
// language, free. People Rooms are NOT open yet — the waitlist section is
// their invite list. No video calls, no people chat, no group rooms.
//
// Waitlist storage: client-side Firestore write (same pattern as the
// Exchange waitlist in PR #151). Until the `muntuz_waitlist` console rules
// are published, the write fails with permission-denied — that is expected,
// and the form falls back to a "waitlist opens soon" message instead of
// claiming the signup succeeded. Rules snippet:
//   firestore-snippets/muntuz-waitlist.rules.txt
import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

type Friend = {
  id: string;
  name: string;
  photo: string;
  native: string;
  learning: string;
  line: string;
};

// Learning languages reflect the 2026-10-30 AI House diversification:
// Jiyoung English, Emily Korean, Chloe French, Sofia Spanish, Amara Chinese.
const FRIENDS: Friend[] = [
  {
    id: 'jiyoung',
    name: 'Jiyoung',
    photo: '/muntuz-avatars/jiyoung.jpg',
    native: 'Korean',
    learning: 'English',
    line: 'Kimbap lover, learning English one bite at a time.',
  },
  {
    id: 'emily',
    name: 'Emily',
    photo: '/muntuz-avatars/emily.jpg',
    native: 'English',
    learning: 'Korean',
    line: 'Outdoor lover, coffee first.',
  },
  {
    id: 'chloe',
    name: 'Chloe',
    photo: '/muntuz-avatars/chloe.jpg',
    native: 'English',
    learning: 'French',
    line: 'Learning French over coffee.',
  },
  {
    id: 'sofia',
    name: 'Sofia',
    photo: '/muntuz-avatars/sofia.jpg',
    native: 'English',
    learning: 'Spanish',
    line: 'Learning Spanish over salsa & cooking.',
  },
  {
    id: 'amara',
    name: 'Amara',
    photo: '/muntuz-avatars/amara.jpg',
    native: 'English',
    learning: 'Chinese',
    line: 'Learning Chinese over morning runs.',
  },
];

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: '1',
    title: 'Pick a partner',
    body: 'Choose from 50 AI friends — or meet the five who live in the house.',
  },
  {
    n: '2',
    title: 'Chat or call',
    body: 'Text or talk, in the language you’re learning.',
  },
  {
    n: '3',
    title: 'Get corrected, naturally',
    body: 'See a natural way to say it, one line at a time.',
  },
];

const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: '👋 Our Story', href: '/about' },
  { label: '💬 Help & FAQ', href: '/faq' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund' },
  { label: 'Cookie Policy', href: '/cookies' },
];

type FormStatus = 'idle' | 'loading' | 'done' | 'soon' | 'invalid';

export default function MuntuzLandingClient() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleaned)) {
      setStatus('invalid');
      return;
    }
    setStatus('loading');
    try {
      await addDoc(collection(db, 'muntuz_waitlist'), {
        email: cleaned,
        createdAt: serverTimestamp(),
      });
      setStatus('done');
    } catch {
      // Rules not published yet (permission-denied) or offline: do not
      // claim success — show the coming-soon fallback instead.
      setStatus('soon');
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF6EF] text-slate-900">
      <div className="mx-auto max-w-md px-5 pb-12 pt-10 sm:max-w-2xl">
        {/* Log in — signed-out users only; returns to /exchange after sign-in. */}
        {!authLoading && !user && (
          <div className="flex justify-end">
            <a
              href="/login?next=/exchange"
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-violet-700 shadow-sm ring-1 ring-slate-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Log in
            </a>
          </div>
        )}
        {/* Hero */}
        <header className="text-center">
          <img
            src="/logo.png"
            alt="Muntuz"
            className="mx-auto h-20 w-20 rounded-full object-cover shadow-md"
          />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Muntuz</h1>
          <p className="mt-4 text-xl font-bold leading-snug">
            Meet your AI friends. Practice any language.
          </p>
          <p className="mt-2 text-base text-slate-600">
            AI friends you can talk with, in the language you&rsquo;re
            learning. Real conversations, zero judgment.
          </p>
          <a
            href="/exchange"
            className="mt-6 inline-block rounded-full bg-violet-600 px-8 py-3 text-base font-bold text-white shadow-md hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            Start chatting
          </a>
          <p className="mt-2 text-sm text-slate-500">
            Free — no tutor, no scheduling.
          </p>
        </header>

        {/* How it works */}
        <section className="mt-12">
          <h2 className="text-center text-lg font-bold">How it works</h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-extrabold text-white">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* People Rooms — waitlist notice (not open yet) */}
        <section className="mt-12 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-bold">People Rooms — coming soon</h2>
          <p className="mt-1 text-sm text-slate-600">
            Real people to practice with are on the way. Join the waitlist
            below and we&rsquo;ll invite you when it opens.
          </p>
          <a
            href="#waitlist"
            className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Join the waitlist
          </a>
        </section>

        {/* 5 friends */}
        <section className="mt-12">
          <h2 className="text-lg font-bold">Meet the house</h2>
          <p className="mt-1 text-sm text-slate-600">
            Five AI friends live here. Each one is learning a language too.
          </p>
          <ul className="mt-4 space-y-4">
            {FRIENDS.map((f) => (
              <li
                key={f.id}
                className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
              >
                <img
                  src={f.photo}
                  alt={`${f.name}, AI friend`}
                  loading="lazy"
                  className="h-24 w-24 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">{f.name}</h3>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                      AI
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {f.native} native &middot; learning {f.learning}
                  </p>
                  <p className="mt-1 text-sm">{f.line}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Waitlist — People Rooms invite list */}
        <section
          id="waitlist"
          className="mt-12 scroll-mt-6 rounded-2xl bg-violet-600 p-5 text-white shadow-md"
        >
          <h2 className="text-lg font-bold">Get in first</h2>
          <p className="mt-1 text-sm text-violet-100">
            Leave your email and we&rsquo;ll invite you when People Rooms
            open. No spam, just one invite.
          </p>
          {status === 'done' ? (
            <p className="mt-4 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold">
              You&rsquo;re on the list! We&rsquo;ll email you when People
              Rooms open.
            </p>
          ) : (
            <form onSubmit={joinWaitlist} className="mt-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'invalid') setStatus('idle');
                  }}
                  placeholder="you@example.com"
                  aria-label="Email address"
                  autoComplete="email"
                  className="min-w-0 flex-1 rounded-xl border-0 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="shrink-0 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {status === 'loading' ? 'Joining…' : 'Join'}
                </button>
              </div>
              {status === 'invalid' && (
                <p className="mt-2 text-sm font-medium text-violet-100">
                  Please enter a valid email address.
                </p>
              )}
              {status === 'soon' && (
                <p className="mt-2 text-sm font-medium text-violet-100">
                  The waitlist opens soon — Muntuz isn&rsquo;t taking
                  emails just yet. Please check back at launch!
                </p>
              )}
            </form>
          )}
        </section>

        {/* Footer — mirrors the MunTalk homepage footer, Muntuz wording */}
        <footer className="mt-12 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm font-bold text-slate-700">
            🌐 Muntuz &middot; 50 AI partners &middot; Voice &amp; chat
            &middot; Any language
          </p>
          <nav className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs font-bold text-violet-600 no-underline hover:underline"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            These friends are AI, not real people.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            &copy; {new Date().getFullYear()} Muntuz. All rights reserved. |
            British Columbia, Canada |{' '}
            <a
              href="mailto:muntuz.official@gmail.com"
              className="text-slate-400 no-underline hover:underline"
            >
              muntuz.official@gmail.com
            </a>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Muntuz — a MunTalk project.
          </p>
        </footer>
      </div>
    </main>
  );
}
