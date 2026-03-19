'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FaqItem {
  q: string;
  a: string | React.ReactNode;
  tags: string[];
}

const CATEGORIES = [
  { id: 'all',      label: 'All',          emoji: '📋' },
  { id: 'mic',      label: 'Microphone',   emoji: '🎤' },
  { id: 'account',  label: 'Account',      emoji: '👤' },
  { id: 'lesson',   label: 'Lessons',      emoji: '📚' },
  { id: 'payment',  label: 'Payment',      emoji: '💳' },
  { id: 'tech',     label: 'Technical',    emoji: '🔧' },
  { id: 'trial',    label: 'Trial & Plan', emoji: '🎯' },
];

const FAQS: FaqItem[] = [
  // ── 마이크 ──────────────────────────────────────────────────
  {
    q: 'Why does the microphone permission popup appear every time I speak?',
    a: `On mobile browsers (especially Android Chrome), microphone permission may reset between sessions. To fix this permanently:
• Android Chrome: Tap the 🔒 lock icon in the address bar → Site settings → Microphone → Allow
• iOS Safari: Settings app → Safari → Microphone → Allow
• Desktop Chrome: Click the 🔒 lock icon → Microphone → Always allow

After allowing, refresh the page and the popup will no longer appear.`,
    tags: ['mic', 'tech'],
  },
  {
    q: 'The microphone button is not working. What should I do?',
    a: `Try these steps in order:
1. Make sure you've allowed microphone access in your browser settings
2. Check that no other app is currently using your microphone
3. Try refreshing the page (Ctrl+R / Cmd+R)
4. If using iOS Safari, voice input may not be supported — try Chrome on iOS instead
5. If the problem persists, use the text input box below the chat instead`,
    tags: ['mic', 'tech'],
  },
  {
    q: 'My voice is not being recognized correctly. What can I do?',
    a: `Speech recognition accuracy depends on several factors:
• Speak clearly and at a normal pace — avoid speaking too fast
• Reduce background noise as much as possible
• Make sure your device microphone is not blocked or covered
• Try speaking slightly closer to your device
• If your accent causes recognition issues, try typing your response instead — both methods are fully supported`,
    tags: ['mic', 'lesson'],
  },
  {
    q: 'Voice input is not available in my language. Why?',
    a: `Voice (speech-to-text) input is only available for languages that support Web Speech API. Languages without voice support will automatically show a text input box instead. You can still complete all lessons and chat with the AI tutor using text — the learning experience is identical.`,
    tags: ['mic', 'lesson'],
  },

  // ── 계정 ────────────────────────────────────────────────────
  {
    q: 'I forgot my password. How do I reset it?',
    a: `On the Login page, click "Forgot password?" below the password field. Enter your email address and we'll send you a reset link. Check your spam folder if you don't see it within a few minutes.

If you signed up with Google, you don't have a password — just click "Continue with Google" to log in.`,
    tags: ['account'],
  },
  {
    q: 'I can\'t log in with Google on my phone. What should I do?',
    a: `Google login on mobile browsers can sometimes fail due to popup blocking. Try these steps:
1. Make sure popups are allowed for muntalk.com in your browser settings
2. Try opening muntalk.com in Chrome (not an in-app browser like Instagram or Facebook)
3. If the issue continues, use email/password login instead
4. Contact us at muntalkofficial@gmail.com if the problem persists`,
    tags: ['account', 'tech'],
  },
  {
    q: 'How do I delete my account?',
    a: `To delete your account and all associated data, please email us at muntalkofficial@gmail.com with the subject line "Account Deletion Request". Include the email address associated with your account. We will process your request within 7 business days in accordance with our Privacy Policy.`,
    tags: ['account'],
  },
  {
    q: 'Can I change my learning language after signing up?',
    a: `Yes! Go to the main Lingua page and tap on your current language flag at the top. You can switch to any of the 65+ available languages at any time. Your progress for each language is saved separately, so switching won't erase your existing progress.`,
    tags: ['account', 'lesson'],
  },
  {
    q: 'I signed up twice by accident. What should I do?',
    a: `If you created two accounts, please email muntalkofficial@gmail.com with both email addresses. We can merge your progress or delete the duplicate account. If one account has a paid subscription, let us know and we'll make sure it's transferred correctly.`,
    tags: ['account'],
  },

  // ── 레슨 ────────────────────────────────────────────────────
  {
    q: 'My lesson progress was not saved. What happened?',
    a: `Lesson progress is saved automatically when you complete a lesson. If progress wasn't saved, it could be because:
• You closed the browser before the lesson fully completed
• You were in Guest mode (progress requires a free account to save)
• A temporary network issue occurred

Sign up for a free account to ensure your progress is always saved to the cloud.`,
    tags: ['lesson', 'tech'],
  },
  {
    q: 'What is the difference between Guest, Free, and Premium?',
    a: (
      <div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ textAlign: 'left', padding: '8px 4px', color: '#6366F1' }}>Feature</th>
              <th style={{ textAlign: 'center', padding: '8px 4px' }}>Guest</th>
              <th style={{ textAlign: 'center', padding: '8px 4px' }}>Free</th>
              <th style={{ textAlign: 'center', padding: '8px 4px', color: '#8B5CF6' }}>Premium</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Lessons available',    'A1 Lesson 1 only', 'All A1 (12 lessons)', 'All levels A1–C2'],
              ['AI tutor chat',        '3/day',            '3/day',               'Unlimited'],
              ['Progress saved',       '❌',               '✅',                  '✅'],
              ['Placement test',       '❌',               '✅',                  '✅'],
              ['Word Bank + SRS',      '❌',               '❌',                  '✅'],
              ['League system',        '❌',               '✅',                  '✅'],
              ['All 65 languages',     '❌',               '❌',                  '✅'],
            ].map(([f, g, fr, p], i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FAFAFA' : '#fff' }}>
                <td style={{ padding: '8px 4px', fontWeight: 700, color: '#374151' }}>{f}</td>
                <td style={{ padding: '8px 4px', textAlign: 'center', color: '#9CA3AF' }}>{g}</td>
                <td style={{ padding: '8px 4px', textAlign: 'center' }}>{fr}</td>
                <td style={{ padding: '8px 4px', textAlign: 'center', color: '#8B5CF6', fontWeight: 700 }}>{p}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    tags: ['lesson', 'trial'],
  },
  {
    q: 'I lost all my hearts. How long until they refill?',
    a: `Hearts refill automatically over time — 1 heart every 30 minutes. You start with 5 hearts. If you run out mid-lesson, you can wait for them to refill or upgrade to Premium for unlimited hearts. Premium members never lose hearts.`,
    tags: ['lesson'],
  },
  {
    q: 'The AI tutor is not responding or is stuck. What should I do?',
    a: `If the AI tutor stops responding:
1. Wait 10–15 seconds — sometimes the AI takes a moment to process
2. Refresh the page and continue the lesson from where you left off
3. If you hit "Daily AI limit reached", it means you've used your 3 free sessions for today — they reset at midnight
4. Check your internet connection — the AI requires an active connection

Premium members have unlimited AI sessions with no daily limits.`,
    tags: ['lesson', 'tech'],
  },
  {
    q: 'Can I retake a lesson I already completed?',
    a: `Yes! You can retake any lesson as many times as you like. Go to the level map, find the lesson, and tap it again. Retaking a lesson won't reset your completion status or reduce your XP.`,
    tags: ['lesson'],
  },
  {
    q: 'The placement test placed me at the wrong level. Can I retake it?',
    a: `The placement test can be retaken from your Profile page. Note that Free plan members can retake the test once — additional retakes require a Premium subscription. If you feel the result is significantly wrong, you can also manually choose your starting level by skipping the placement test and selecting "Start from A1".`,
    tags: ['lesson', 'trial'],
  },
  {
    q: 'The subtitles / translations are not showing up during lessons.',
    a: `Translations are powered by the Gemini AI API. If they're not appearing:
1. Make sure you have selected your native language in Settings (the language flag on the home screen)
2. Check your internet connection — translation requires an active connection
3. Try refreshing the page
4. If the issue persists, the translation service may be temporarily unavailable — try again in a few minutes`,
    tags: ['lesson', 'tech'],
  },

  // ── 결제 ────────────────────────────────────────────────────
  {
    q: 'How do I cancel my subscription?',
    a: `You can cancel anytime from your Profile page:
Profile → Subscription → Manage Subscription → Cancel

After canceling, you keep Premium access until the end of your current billing period. No refunds are issued for partial periods except under our 7-day money-back guarantee.`,
    tags: ['payment'],
  },
  {
    q: 'I was charged but my account still shows Free. What should I do?',
    a: `Subscription activation can take up to 5 minutes after payment. Please:
1. Wait 5 minutes and refresh the page
2. Log out and log back in
3. If your account still shows Free after 10 minutes, email us at muntalkofficial@gmail.com with your payment confirmation and we'll activate your Premium access manually within 24 hours.`,
    tags: ['payment'],
  },
  {
    q: 'Do you offer a refund?',
    a: `Yes — we offer a 7-day money-back guarantee on all new subscriptions. If you're not satisfied within the first 7 days of your first subscription, contact us at muntalkofficial@gmail.com for a full refund. See our Refund Policy page for full details.`,
    tags: ['payment'],
  },
  {
    q: 'Can I switch between Monthly, 6-Month, and Annual plans?',
    a: `Yes! You can upgrade or downgrade anytime from Profile → Subscription → Manage Subscription. When upgrading, the price difference is prorated automatically by Stripe. When downgrading, the change takes effect at the end of your current billing period.`,
    tags: ['payment'],
  },
  {
    q: 'What currencies and payment methods do you accept?',
    a: `We accept all major credit and debit cards (Visa, Mastercard, American Express) through Stripe. Prices are in USD. Stripe may convert to your local currency. We do not currently accept PayPal, cryptocurrency, or bank transfers.`,
    tags: ['payment'],
  },

  // ── 기술 ────────────────────────────────────────────────────
  {
    q: 'Which browsers and devices are supported?',
    a: `MunTalk works best on:
• Desktop: Chrome, Firefox, Safari, Edge (latest versions)
• Mobile: Chrome on Android, Safari on iOS 15+
• Voice input requires Chrome on Android or Safari on iOS

We recommend Chrome for the best experience. Internet Explorer is not supported.`,
    tags: ['tech'],
  },
  {
    q: 'The audio / text-to-speech is not playing.',
    a: `If you can't hear the AI tutor's voice:
1. Check your device volume and make sure it's not muted
2. On iOS, check that the mute switch on the side of your device is off
3. Make sure your browser has permission to play audio
4. Try a different browser (Chrome is recommended)
5. Some corporate/school networks block audio — try on a personal network or mobile data`,
    tags: ['tech'],
  },
  {
    q: 'The page is loading slowly or not loading at all.',
    a: `Slow loading is usually a network issue. Try:
1. Check your internet connection speed
2. Disable any VPN or proxy you may be using
3. Clear your browser cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
4. Try a different browser or device
5. If the site is completely down, check our status at muntalkofficial@gmail.com`,
    tags: ['tech'],
  },
  {
    q: 'The app looks broken on my phone (layout issues).',
    a: `Layout issues on mobile can usually be fixed by:
1. Refreshing the page
2. Clearing your browser cache
3. Making sure your browser is updated to the latest version
4. Try rotating your screen — some screens look better in portrait mode
5. If using an older device, some animations may be slower than usual`,
    tags: ['tech'],
  },

  // ── 트라이얼/플랜 ───────────────────────────────────────────
  {
    q: 'What happens after my 7-day free trial ends?',
    a: `After 7 days, your account automatically switches to the Free plan. You keep access to all A1 lessons and 3 AI chats per day — forever, for free. To continue learning beyond A1 and access all features, you can upgrade to a Premium plan at any time from the Pricing page.`,
    tags: ['trial'],
  },
  {
    q: 'How many languages can I learn at the same time?',
    a: `Free plan members can study up to 2 languages simultaneously. Premium members can study all 65+ languages with no limits. You can switch between languages anytime from the home screen.`,
    tags: ['trial', 'lesson'],
  },
  {
    q: 'Is there a student discount?',
    a: `We don't currently offer a formal student discount, but our Annual plan at $59.99/year works out to just $5/month — the most affordable option for serious learners. We're also planning educational institution pricing in the future. Stay tuned!`,
    tags: ['trial', 'payment'],
  },
];

export default function FaqPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = FAQS.filter(faq => {
    const matchCat = activeCategory === 'all' || faq.tags.includes(activeCategory);
    const matchSearch = search === '' ||
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      (typeof faq.a === 'string' && faq.a.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito', sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideDown { from { opacity:0; max-height:0 } to { opacity:1; max-height:1000px } }
        .faq-item { transition: box-shadow .2s, border-color .2s; }
        .faq-item:hover { box-shadow: 0 4px 20px rgba(99,102,241,0.1) !important; border-color: #C7D2FE !important; }
        .cat-btn { transition: all .15s; }
        .cat-btn:hover { transform: translateY(-1px); }
        .faq-answer { animation: slideDown .25s ease; }
        .search-input:focus { outline: none; border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
      `}} />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)', padding: '48px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.2) 0%, transparent 40%)', pointerEvents: 'none' }} />

        <button onClick={() => router.back()} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 16px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
          ← Back
        </button>

        <div style={{ position: 'relative', animation: 'fadeUp .5s ease' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 10px', lineHeight: 1.2 }}>
            Help & FAQ
          </h1>
          <p style={{ fontSize: 15, color: '#A5B4FC', fontWeight: 700, margin: '0 0 28px' }}>
            Quick answers to common questions
          </p>

          {/* Search */}
          <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
            <input
              className="search-input"
              value={search}
              onChange={e => { setSearch(e.target.value); setOpenIndex(null); }}
              placeholder="Search questions..."
              style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: "'Nunito',sans-serif", boxSizing: 'border-box', backdropFilter: 'blur(10px)' }}
            />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E9ECEF', padding: '0 24px', overflowX: 'auto', display: 'flex', gap: 4, scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className="cat-btn"
            onClick={() => { setActiveCategory(cat.id); setOpenIndex(null); }}
            style={{
              padding: '14px 16px', background: 'none', border: 'none',
              borderBottom: activeCategory === cat.id ? '3px solid #6366F1' : '3px solid transparent',
              color: activeCategory === cat.id ? '#6366F1' : '#64748B',
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              fontFamily: "'Nunito',sans-serif", whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <span>{cat.emoji}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ list */}
      <div style={{ maxWidth: 760, margin: '32px auto', padding: '0 20px 60px' }}>

        {/* Result count */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', marginBottom: 16 }}>
          {filtered.length} question{filtered.length !== 1 ? 's' : ''} found
          {search && <span> for "<strong style={{ color: '#6366F1' }}>{search}</strong>"</span>}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid #E9ECEF' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>No results found</div>
            <div style={{ fontSize: 14, color: '#64748B', fontWeight: 700, marginBottom: 20 }}>
              Try different keywords or browse by category
            </div>
            <button onClick={() => { setSearch(''); setActiveCategory('all'); }}
              style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#6366F1', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
              Clear search
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className="faq-item"
                  style={{ background: '#fff', borderRadius: 16, border: `1px solid ${isOpen ? '#C7D2FE' : '#E9ECEF'}`, overflow: 'hidden', boxShadow: isOpen ? '0 4px 20px rgba(99,102,241,0.12)' : '0 1px 4px rgba(0,0,0,0.04)' }}>

                  {/* Question */}
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontFamily: "'Nunito',sans-serif" }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                      <span style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }}>
                        {faq.tags.includes('mic') ? '🎤' :
                         faq.tags.includes('payment') ? '💳' :
                         faq.tags.includes('account') ? '👤' :
                         faq.tags.includes('trial') ? '🎯' :
                         faq.tags.includes('tech') ? '🔧' : '📚'}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1.5 }}>
                        {faq.q}
                      </span>
                    </div>
                    <span style={{ fontSize: 20, color: '#6366F1', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .25s' }}>
                      ⌄
                    </span>
                  </button>

                  {/* Answer */}
                  {isOpen && (
                    <div className="faq-answer" style={{ padding: '0 20px 20px 50px', borderTop: '1px solid #F1F5F9' }}>
                      <div style={{ paddingTop: 16 }}>
                        {typeof faq.a === 'string' ? (
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                            {faq.a}
                          </div>
                        ) : (
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', lineHeight: 1.8 }}>
                            {faq.a}
                          </div>
                        )}

                        {/* Tags */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                          {faq.tags.map(tag => (
                            <span key={tag} onClick={() => { setActiveCategory(tag); setOpenIndex(null); }}
                              style={{ padding: '3px 10px', borderRadius: 99, background: '#EEF2FF', color: '#6366F1', fontSize: 11, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5 }}>
                              {CATEGORIES.find(c => c.id === tag)?.emoji} {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Still need help */}
        <div style={{ marginTop: 40, background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', border: '1px solid #C7D2FE' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🙋</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#1E1B4B', marginBottom: 6 }}>
            Still need help?
          </div>
          <div style={{ fontSize: 14, color: '#6366F1', fontWeight: 700, marginBottom: 16 }}>
            We usually respond within 24 hours
          </div>
          <a href="mailto:muntalkofficial@gmail.com"
            style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 900, fontSize: 15, textDecoration: 'none', fontFamily: "'Nunito',sans-serif", boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
            ✉️ muntalkofficial@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
