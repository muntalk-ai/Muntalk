'use client';

// Muntuz.com Coming Soon landing page (client part: waitlist form).
// Hero + 5 AI-friend cards + waitlist email signup (Firestore `muntuz_waitlist`)
// + AI disclosure footer. English, mobile-first.
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

type FormStatus = 'idle' | 'loading' | 'done' | 'soon' | 'invalid';

export default function MuntuzLandingClient() {
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
        {/* Hero */}
        <header className="text-center">
          <img
            src="/logo.png"
            alt="Muntuz"
            className="mx-auto h-20 w-20 rounded-full object-cover shadow-md"
          />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Muntuz</h1>
          <p className="mt-1 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            Coming soon
          </p>
          <p className="mt-4 text-xl font-bold leading-snug">
            Meet your AI friends. Practice any language.
          </p>
          <p className="mt-2 text-base text-slate-600">
            AI friends you can talk with, in the language you&rsquo;re
            learning. Real conversations, zero judgment.
          </p>
        </header>

        {/* 5 friends */}
        <section className="mt-10">
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

        {/* Waitlist */}
        <section className="mt-10 rounded-2xl bg-violet-600 p-5 text-white shadow-md">
          <h2 className="text-lg font-bold">Get in first</h2>
          <p className="mt-1 text-sm text-violet-100">
            Leave your email and we&rsquo;ll tell you the moment Muntuz
            opens. No spam, just one invite.
          </p>
          {status === 'done' ? (
            <p className="mt-4 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold">
              You&rsquo;re on the list! We&rsquo;ll email you when Muntuz
              opens.
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

        {/* Footer */}
        <footer className="mt-10 text-center text-xs leading-relaxed text-slate-500">
          <p>These friends are AI, not real people.</p>
          <p className="mt-1">Muntuz — a MunTalk project. Coming soon.</p>
        </footer>
      </div>
    </main>
  );
}
