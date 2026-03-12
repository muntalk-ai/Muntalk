'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getDueCards, reviewCard, getSRSStats, SRSCard, ReviewQuality } from '@/lib/spacedRepetition';
import { addWeeklyXp } from '@/lib/league';
import { updateUserProfile } from '@/lib/userProfile';

type CardState = 'question' | 'answer' | 'done';

export default function ReviewPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [cards,      setCards]      = useState<SRSCard[]>([]);
  const [current,    setCurrent]    = useState(0);
  const [cardState,  setCardState]  = useState<CardState>('question');
  const [loading,    setLoading]    = useState(true);
  const [stats,      setStats]      = useState({ total: 0, due: 0, mastered: 0, learning: 0, new: 0 });
  const [sessionResults, setResults] = useState({ correct: 0, wrong: 0, xpEarned: 0 });
  const [flipping,   setFlipping]   = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const [due, s] = await Promise.all([
          getDueCards(user.uid, profile?.learnLang),
          getSRSStats(user.uid),
        ]);
        setCards(due.slice(0, 20)); // 최대 20장
        setStats(s);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user, authLoading]);

  const card = cards[current];
  const progress = cards.length > 0 ? (current / cards.length) * 100 : 0;

  const handleFlip = () => {
    setFlipping(true);
    setTimeout(() => { setCardState('answer'); setFlipping(false); }, 200);
  };

  const handleQuality = async (quality: ReviewQuality) => {
    if (!user || !card) return;
    const xpForCard = quality >= 4 ? 15 : quality >= 3 ? 10 : 5;

    try {
      await reviewCard(user.uid, card, quality);

      // XP 업데이트
      const newXp = (profile?.xp || 0) + xpForCard;
      const storedXp = parseInt(localStorage.getItem('mt_xp') || '0') + xpForCard;
      localStorage.setItem('mt_xp', String(storedXp));
      await updateUserProfile(user.uid, { xp: newXp });
      await addWeeklyXp(user.uid, xpForCard);

      setResults(r => ({
        correct:   r.correct   + (quality >= 3 ? 1 : 0),
        wrong:     r.wrong     + (quality <  3 ? 1 : 0),
        xpEarned:  r.xpEarned  + xpForCard,
      }));
    } catch (e) { console.error(e); }

    // Next card
    if (current + 1 >= cards.length) {
      setCardState('done');
      await refreshProfile();
    } else {
      setCurrent(c => c + 1);
      setCardState('question');
    }
  };

  // auth 또는 SRS 로딩 중 스피너 표시
  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif" }}>
      <div style={{ width: 48, height: 48, border: '4px solid #E5E7EB', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Sign in to review</div>
        <button onClick={() => router.push('/login')}
          style={{ padding: '12px 28px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
          Sign In
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito',sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
* { box-sizing: border-box; }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes flip   { 0% { transform:rotateY(0deg); } 50% { transform:rotateY(90deg); } 100% { transform:rotateY(0deg); } }
        .quality-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
        .quality-btn { transition: all .15s; }
      ` }} />

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', height: 62, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 200 }}>
        <button onClick={() => router.push('/lingua')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }}>✕</button>
        <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A' }}>📚 SRS Review</div>
        {cards.length > 0 && cardState !== 'done' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 700 }}>{current + 1} / {cards.length}</span>
          </div>
        )}
      </nav>

      {/* Progress bar */}
      {cards.length > 0 && cardState !== 'done' && (
        <div style={{ height: 4, background: '#F1F5F9' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)', transition: 'width .4s ease' }} />
        </div>
      )}

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #E5E7EB', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ color: '#94A3B8', fontWeight: 700 }}>Loading cards…</div>
          </div>

        ) : cardState === 'done' || cards.length === 0 ? (
          // ── Session Complete ──
          <div style={{ textAlign: 'center', animation: 'fadeUp .4s ease' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>
              {cards.length === 0 ? '✅' : sessionResults.correct > sessionResults.wrong ? '🎉' : '📖'}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>
              {cards.length === 0 ? "All caught up!" : "Session Complete!"}
            </h1>
            <p style={{ fontSize: 15, color: '#64748B', marginBottom: 32 }}>
              {cards.length === 0
                ? "No cards due today. Check back tomorrow!"
                : `You reviewed ${cards.length} cards today.`}
            </p>

            {/* Stats */}
            {cards.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
                {[
                  { label: 'Correct', value: sessionResults.correct, color: '#16A34A', bg: '#F0FDF4', icon: '✓' },
                  { label: 'Wrong',   value: sessionResults.wrong,   color: '#EF4444', bg: '#FEF2F2', icon: '✗' },
                  { label: 'XP',      value: `+${sessionResults.xpEarned}`, color: '#2563EB', bg: '#EFF6FF', icon: '⭐' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: '16px', border: `1px solid ${s.bg}` }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700 }}>{s.icon} {s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Overall SRS stats */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '20px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#0F172A', marginBottom: 14 }}>Your Vocabulary Bank</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total words', value: stats.total, color: '#6366F1' },
                  { label: 'Mastered 🏆',  value: stats.mastered, color: '#16A34A' },
                  { label: 'Learning',     value: stats.learning, color: '#F59E0B' },
                  { label: 'New',          value: stats.new,      color: '#3B82F6' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '12px 14px', borderRadius: 12, background: '#F8FAFC' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/lingua')}
                style={{ padding: '13px 28px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                Continue Learning →
              </button>
              <button onClick={() => router.push('/lingua/league')}
                style={{ padding: '13px 24px', borderRadius: 16, border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                🏆 View League
              </button>
            </div>
          </div>

        ) : (
          // ── Flashcard ──
          <div style={{ animation: 'fadeUp .3s ease' }}>

            {/* Card */}
            <div style={{
              background: '#fff', borderRadius: 28, border: '1.5px solid #F1F5F9',
              padding: '40px 32px', textAlign: 'center', marginBottom: 24,
              boxShadow: '0 8px 32px rgba(99,102,241,0.08)',
              animation: flipping ? 'flip .2s ease' : 'none',
              minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: 1.5, marginBottom: 20, textTransform: 'uppercase' }}>
                {card?.langId} · {cardState === 'question' ? 'Translate this word' : 'Answer'}
              </div>

              <div style={{ fontSize: 36, fontWeight: 900, color: '#0F172A', marginBottom: 12, lineHeight: 1.2 }}>
                {cardState === 'question' ? card?.word : card?.translation}
              </div>

              {cardState === 'answer' && (
                <div style={{ marginTop: 8, fontSize: 15, color: '#64748B', fontWeight: 700, padding: '10px 20px', background: '#F8FAFC', borderRadius: 12 }}>
                  {card?.word}
                </div>
              )}

              {/* Interval info */}
              {cardState === 'answer' && (
                <div style={{ marginTop: 16, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                  Seen {card?.timesCorrect + card?.timesWrong} times ·
                  {card?.repetitions > 0 ? ` ${card.repetitions} streak` : ' new card'}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {cardState === 'question' ? (
              <button onClick={handleFlip}
                style={{ width: '100%', padding: '16px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                Show Answer
              </button>
            ) : (
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 }}>
                  HOW WELL DID YOU KNOW IT?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {([
                    { q: 1 as ReviewQuality, label: 'Again', sub: 'Forgot', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
                    { q: 2 as ReviewQuality, label: 'Hard',  sub: 'Barely', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
                    { q: 4 as ReviewQuality, label: 'Good',  sub: 'Recall', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
                    { q: 5 as ReviewQuality, label: 'Easy',  sub: 'Perfect', color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
                  ]).map(btn => (
                    <button key={btn.q} className="quality-btn" onClick={() => handleQuality(btn.q)}
                      style={{ padding: '14px 8px', borderRadius: 16, border: `2px solid ${btn.border}`, background: btn.bg, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: btn.color }}>{btn.label}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, marginTop: 2 }}>{btn.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Due count */}
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
              {cards.length - current - 1} more cards remaining
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
