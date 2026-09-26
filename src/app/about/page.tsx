'use client';

import { useRouter } from 'next/navigation';

// Founder info — fill in when ready (photo: place image at /public/founder.jpg and update src below)
const FOUNDER = {
  name: '[Your Name]',
  role: 'Founder & solo developer',
  photo: '', // e.g. '/founder.jpg'
  location: 'British Columbia, Canada',
};

const SECTIONS = [
  {
    emoji: '🗣️',
    title: 'The problem I kept hitting',
    body: 'I tried every popular language app. They were great at teaching me to recognize words — tap the right tile, match the pair, keep the streak alive. But when I actually had to open my mouth and speak, I froze. None of them trained the one skill that matters most in real life: producing the language yourself, out loud, under pressure.',
  },
  {
    emoji: '🤖',
    title: 'Why I built MunTalk',
    body: 'MunTalk started as a personal experiment: what if an AI tutor could do what a great human coach does — listen to you speak, correct your pronunciation precisely, role-play real situations with you, and tell you exactly what to fix next? No multiple-choice comfort zone. Real speaking, from day one.',
  },
  {
    emoji: '💬',
    title: 'Speaking first, everything else second',
    body: 'Every feature in MunTalk is designed around one idea: you learn a language by using it. AI roleplay with voice in and voice out. Pronunciation scoring that tells you where to put your tongue, not just "try again". A personal AI coach that knows your weak areas. If a feature doesn\'t make you speak more, it doesn\'t ship.',
  },
  {
    emoji: '🌱',
    title: 'Honestly, we\'re early',
    body: 'MunTalk is in open beta, built and run by one person. There\'s no big team, no venture funding — just a developer obsessed with fixing language learning. That means you\'ll shape what this becomes: your feedback goes straight to the person writing the code. Early members get the best deal we\'ll ever offer, locked in.',
  },
];

export default function AboutPage() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', fontFamily: "'Nunito',sans-serif", color: '#0F172A' }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(24px)}}
      ` }} />

      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 200 }}>
        <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#38BDF8,#818CF8)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌐</div>
          <span style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-0.5px' }}>MunTalk</span>
          <span style={{ background: '#EFF6FF', color: '#38BDF8', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>BETA</span>
        </div>
        <button onClick={() => router.push('/signup')}
          style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
          Start Free
        </button>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#6366F1', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '6px 16px', marginBottom: 24, letterSpacing: 0.8 }}>
          👋 OUR STORY
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, lineHeight: 1.15, margin: '0 0 20px', letterSpacing: -1 }}>
          Built by one person who<br />couldn&apos;t learn to <span style={{ background: 'linear-gradient(95deg,#6366F1,#8B5CF6,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>speak</span>.
        </h1>
        <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.8, fontWeight: 600, maxWidth: 560, margin: '0 auto' }}>
          MunTalk is an independent, solo-built AI language tutor — made by a developer,
          not a corporation. This is why it exists.
        </p>
      </div>

      {/* Founder card */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 28, border: '1.5px solid #F1F5F9', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          {FOUNDER.photo ? (
            <img src={FOUNDER.photo} alt={FOUNDER.name} style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexShrink: 0 }}>
              👨‍💻
            </div>
          )}
          <div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{FOUNDER.name}</div>
            <div style={{ fontSize: 13, color: '#6366F1', fontWeight: 800, marginTop: 2 }}>{FOUNDER.role}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, marginTop: 2 }}>📍 {FOUNDER.location}</div>
          </div>
        </div>
      </div>

      {/* Story sections */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {SECTIONS.map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 20, padding: '26px 28px', border: '1.5px solid #F1F5F9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{s.emoji}</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 10px', letterSpacing: -0.3 }}>{s.title}</h2>
            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.85, margin: 0, fontWeight: 600 }}>{s.body}</p>
          </div>
        ))}
      </div>

      {/* Principles */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 24px' }}>
        <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E1B4B)', borderRadius: 24, padding: '32px 28px', color: '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2, color: '#A5B4FC', marginBottom: 18 }}>WHAT WE STAND FOR</div>
          {[
            ['🤝', 'No stealth marketing, ever', 'If you see MunTalk mentioned online by us, it will always say so. We never pretend to be a random happy user.'],
            ['🔓', 'No dark patterns', 'The free tier is free forever. Cancelling takes two taps. We\'d rather earn your subscription than trap it.'],
            ['🗣️', 'Speaking is the product', 'Not streaks, not gems, not leaderboards. Your ability to hold a real conversation.'],
          ].map(([e, t, d], i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 2 ? 20 : 0 }}>
              <div style={{ fontSize: 26, flexShrink: 0 }}>{e}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>{t}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontWeight: 600 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 24px 72px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, margin: '0 0 12px', letterSpacing: -0.5 }}>Come grow with us 🌱</h2>
        <p style={{ fontSize: 14, color: '#64748B', fontWeight: 600, margin: '0 0 24px', lineHeight: 1.7 }}>
          Free forever tier · No credit card · Find your level in 4 minutes
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/signup')}
            style={{ padding: '14px 32px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
            Start Learning Free 🚀
          </button>
          <button onClick={() => router.push('/lingua/placement')}
            style={{ padding: '14px 32px', borderRadius: 14, border: '2px solid #E2E8F0', background: '#fff', color: '#0F172A', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
            🎯 Take the Placement Test
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: 28, color: '#9CA3AF', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <a href="/" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>🏠 Home</a>
          <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💎 Pricing</a>
          <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💬 Help & FAQ</a>
          <a href="/privacy" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Terms of Service</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>
          &copy; {new Date().getFullYear()} MunTalk. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
