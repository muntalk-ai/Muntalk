'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

import { LEARN_LANGUAGES } from '@/data/languages';
import { CURRICULUM } from '@/data/curriculum';

const LEVELS = [
  { id: 'a1', label: 'A1', emoji: '🌱', color: '#10B981', xpNeeded: 800 },
  { id: 'a2', label: 'A2', emoji: '🏙️', color: '#3B82F6', xpNeeded: 1400 },
  { id: 'b1', label: 'B1', emoji: '💼', color: '#8B5CF6', xpNeeded: 2400 },
  { id: 'b2', label: 'B2', emoji: '🎓', color: '#F59E0B', xpNeeded: 4000 },
  { id: 'c1', label: 'C1', emoji: '🧠', color: '#EF4444', xpNeeded: 6500 },
  { id: 'c2', label: 'C2', emoji: '👑', color: '#EC4899', xpNeeded: 9999 },
];

const totalLessons = CURRICULUM.reduce((acc, lvl) =>
  acc + lvl.steps.reduce((a, s) => a + s.lessons.length, 0), 0);

interface LeaderEntry { uid: string; displayName: string; xp: number; streak: number; photoURL: string; }

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(true);

  // localStorage 값 — 클라이언트에서만 읽기
  const [localXp,     setLocalXp]     = useState(0);
  const [localStreak, setLocalStreak] = useState(0);
  const [localLang,   setLocalLang]   = useState('en-US');
  useEffect(() => {
    setLocalXp(parseInt(localStorage.getItem('mt_xp') || '0'));
    setLocalStreak(parseInt(localStorage.getItem('mt_streak') || '0'));
    setLocalLang(localStorage.getItem('mt_learn_lang') || 'en-US');
  }, []);

  // Firestore 리더보드 — xp 인덱스 없을 경우 fallback으로 전체 로드 후 클라이언트 정렬
  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(20));
        const snap = await getDocs(q);
        setLeaderboard(snap.docs.map(d => {
          const data = d.data();
          return {
            uid: d.id,
            displayName: data.displayName || 'Learner',
            xp: data.xp || 0,
            streak: data.streak || 0,
            photoURL: data.photoURL || '',
          };
        }));
      } catch (e: any) {
        // Firestore 인덱스 없을 때 → 인덱스 없이 전체 로드 후 클라이언트 정렬
        if (e?.code === 'failed-precondition' || e?.message?.includes('index')) {
          try {
            const snap = await getDocs(collection(db, 'users'));
            const all = snap.docs.map(d => {
              const data = d.data();
              return {
                uid: d.id,
                displayName: data.displayName || 'Learner',
                xp: data.xp || 0,
                streak: data.streak || 0,
                photoURL: data.photoURL || '',
              };
            });
            setLeaderboard(all.sort((a, b) => b.xp - a.xp).slice(0, 20));
          } catch { /* ignore */ }
        }
      } finally {
        setLbLoading(false);
      }
    };
    load();
  }, []);

  // profile 또는 localStorage에서 값 읽기 (SSR 안전)
  const xp             = profile?.xp             ?? localXp;
  const streak         = profile?.streak          ?? localStreak;
  const learnLang      = profile?.learnLang       ?? localLang;
  const completedCount = profile?.completedLessons?.length ?? 0;
  const activityDates  = profile?.activityDates   ?? [];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: "'Nunito',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #E5E7EB', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ color: '#94A3B8', fontWeight: 700 }}>Loading dashboard…</div>
      </div>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );

  const langInfo        = LEARN_LANGUAGES.find(l => l.code === learnLang);
  const currentLevel    = LEVELS.findLast(l => xp >= (LEVELS[LEVELS.indexOf(l) - 1]?.xpNeeded || 0)) || LEVELS[0];
  const nextLevel       = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const prevXp          = LEVELS[LEVELS.indexOf(currentLevel) - 1]?.xpNeeded || 0;
  const progressPct     = nextLevel ? Math.min(100, ((xp - prevXp) / (nextLevel.xpNeeded - prevXp)) * 100) : 100;

  // 최근 30일 활동 캘린더
  const today = new Date();
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });

  const stats = [
    { label: 'Total XP',     value: xp.toLocaleString(), icon: '⭐', color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Day Streak',   value: `${streak}🔥`,        icon: '🔥', color: '#EA580C', bg: '#FFF7ED' },
    { label: 'Lessons Done', value: completedCount,        icon: '📚', color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Completion',   value: `${Math.round((completedCount / totalLessons) * 100)}%`, icon: '🎯', color: '#9333EA', bg: '#FDF4FF' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito', sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .lb-row:hover { background: #F8FAFC !important; }
      ` }} />

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', height: 62, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 200 }}>
        <button onClick={() => router.push('/lingua')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }}>←</button>
        <div style={{ fontWeight: 900, fontSize: 18, color: '#0F172A' }}>📊 Dashboard</div>
        {user && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => router.push('/profile')}
              style={{ padding: '7px 16px', borderRadius: 20, border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
              ✏️ Edit Profile
            </button>
          </div>
        )}
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Hero Profile Card ── */}
        <div style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', borderRadius: 28, padding: '32px', marginBottom: 24, color: '#fff', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

          {/* Avatar */}
          {user?.photoURL
            ? <img src={user.photoURL} alt="" style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0, border: '3px solid rgba(255,255,255,0.3)' }}>
                {(user?.displayName || '?')[0].toUpperCase()}
              </div>
          }

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
              {user?.displayName || 'Language Learner'}
            </div>
            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 12 }}>
              Learning {langInfo?.label || learnLang} · Level <strong>{currentLevel.label}</strong> {currentLevel.emoji}
            </div>
            {/* XP Progress bar */}
            {nextLevel && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                  <span>{currentLevel.label} → {nextLevel.label}</span>
                  <span>{xp.toLocaleString()} / {nextLevel.xpNeeded.toLocaleString()} XP</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: '#fff', borderRadius: 4, transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{(nextLevel.xpNeeded - xp).toLocaleString()} XP to {nextLevel.label}</div>
              </div>
            )}
          </div>

          <button onClick={() => router.push('/lingua')}
            style={{ padding: '12px 24px', borderRadius: 16, border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Continue Learning →
          </button>
        </div>

        {/* ── Stats Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '22px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

          {/* ── Activity Calendar ── */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '24px' }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A', marginBottom: 16 }}>🗓️ Activity (Last 30 Days)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
              {last30.map(date => {
                const active = activityDates.includes(date);
                const isToday = date === today.toISOString().slice(0, 10);
                return (
                  <div key={date} title={date} style={{
                    aspectRatio: '1', borderRadius: 4,
                    background: active ? '#6366F1' : '#F1F5F9',
                    border: isToday ? '2px solid #6366F1' : '2px solid transparent',
                    transition: 'background .2s',
                  }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#F1F5F9', display: 'inline-block' }} /> No activity
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#6366F1', display: 'inline-block' }} /> Active day
              </span>
            </div>
          </div>

          {/* ── Level Roadmap ── */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '24px' }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A', marginBottom: 16 }}>🗺️ Level Roadmap</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LEVELS.map((lvl, i) => {
                const prevXpNeeded = LEVELS[i - 1]?.xpNeeded || 0;
                const done   = xp >= lvl.xpNeeded;
                const active = xp >= prevXpNeeded && xp < lvl.xpNeeded;
                return (
                  <div key={lvl.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: done ? lvl.color : active ? `${lvl.color}18` : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: done ? '#fff' : active ? lvl.color : '#CBD5E1', border: active ? `2px solid ${lvl.color}` : '2px solid transparent' }}>
                      {done ? '✓' : lvl.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: done || active ? '#0F172A' : '#CBD5E1' }}>
                        {lvl.label} {active && <span style={{ fontSize: 10, color: lvl.color, fontWeight: 700 }}>← YOU ARE HERE</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{lvl.xpNeeded.toLocaleString()} XP</div>
                    </div>
                    {done && <span style={{ fontSize: 10, fontWeight: 800, color: lvl.color }}>✓ Done</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Leaderboard ── */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '24px' }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A', marginBottom: 20 }}>🏆 Leaderboard — Top Learners</div>
          {lbLoading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8', fontWeight: 700 }}>Loading…</div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8', fontWeight: 700 }}>No data yet — be the first! 🚀</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {leaderboard.map((entry, i) => {
                const isMe = entry.uid === user?.uid;
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                return (
                  <div key={entry.uid} className="lb-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 14, background: isMe ? '#EEF2FF' : '#fff', border: isMe ? '1.5px solid #C7D2FE' : '1.5px solid transparent', transition: 'background .15s' }}>
                    <div style={{ width: 32, textAlign: 'center', fontSize: i < 3 ? 20 : 13, fontWeight: 900, color: '#94A3B8', flexShrink: 0 }}>{medal}</div>
                    {entry.photoURL
                      ? <img src={entry.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                          {(entry.displayName || '?')[0].toUpperCase()}
                        </div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {entry.displayName}
                        {isMe && <span style={{ fontSize: 10, background: '#6366F1', color: '#fff', borderRadius: 6, padding: '2px 6px', fontWeight: 700 }}>YOU</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{entry.streak}🔥 day streak</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#2563EB' }}>{entry.xp.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>XP</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
