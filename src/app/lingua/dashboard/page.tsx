'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { LEARN_LANGUAGES } from '@/data/languages';
import { DashboardSkeleton } from '@/components/Skeleton';
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

  // Leaderboard hidden — no longer fetching other users' data

  // profile 또는 localStorage에서 값 읽기 (SSR 안전)
  const xp             = profile?.xp             ?? localXp;
  const streak         = profile?.streak          ?? localStreak;
  const learnLang      = profile?.learnLang       ?? localLang;
  const completedCount = profile?.completedLessons?.length ?? 0;
  const activityDates  = profile?.activityDates   ?? [];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <DashboardSkeleton />
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
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
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
              style={{ padding: '7px 16px', borderRadius: 20, border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif" }}>
              ✏️ Edit Profile
            </button>
          </div>
        )}
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* -- Hero Profile Card -- */}
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
            style={{ padding: '12px 24px', borderRadius: 16, border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif", fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Continue Learning →
          </button>
        </div>

        {/* -- Stats Grid -- */}
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

        {/* -- Certificates (CEFR 수료증) -- */}
        {(() => {
          const earned = profile?.certificates || [];
          return (
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '24px', marginBottom: 24 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>🎓 Certificates</div>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 16 }}>
                Complete all lessons in a level to earn a certificate — share it on LinkedIn
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['a1','a2','b1','b2','c1','c2'].map(lid => {
                  const info = { a1:['A1','🌱'], a2:['A2','🌿'], b1:['B1','💼'], b2:['B2','🚀'], c1:['C1','🌟'], c2:['C2','👑'] }[lid] as [string,string];
                  const got = earned.includes(lid);
                  return (
                    <div key={lid} style={{
                      flex: '1 1 90px', minWidth: 90, textAlign: 'center', padding: '14px 8px',
                      borderRadius: 16,
                      background: got ? 'linear-gradient(135deg,#FFFBEB,#FEF3C7)' : '#F8FAFC',
                      border: got ? '2px solid #F59E0B' : '2px dashed #E2E8F0',
                      opacity: got ? 1 : 0.55,
                    }}>
                      <div style={{ fontSize: 28, filter: got ? 'none' : 'grayscale(1)' }}>{info[1]}</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: got ? '#B45309' : '#94A3B8', marginTop: 4 }}>
                        {info[0]}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: got ? '#D97706' : '#CBD5E1', marginTop: 2 }}>
                        {got ? '✓ Earned' : 'Locked'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* -- Weak Areas -- */}
        {(() => {
          const doneIds: string[] = (profile?.completedLessons as string[] | undefined) ?? [];
          const weak: string[] = [];
          if (doneIds.length > 0) {
            const a1Count = doneIds.filter(id => id.split('-')[0] === 'a1').length;
            const bCount = doneIds.filter(id => id.split('-')[0].startsWith('b')).length;
            if (a1Count < 6) weak.push('Basic expressions (A1)');
            if (bCount < 3) weak.push('Intermediate grammar (B1+)');
          }
          return (
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '24px', marginBottom: 24 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A', marginBottom: 12 }}>🎯 Weak Areas</div>
              {doneIds.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                    Complete a few lessons and your weak spots will appear here.
                  </span>
                  <button onClick={() => router.push('/lingua')}
                    style={{ padding: '10px 20px', borderRadius: 14, border: 'none', background: '#6366F1', color: '#fff', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif", fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                    Start learning →
                  </button>
                </div>
              ) : weak.length === 0 ? (
                <div style={{ fontSize: 13, color: '#10B981', fontWeight: 700 }}>
                  No weak spots detected — nice work! 🎉
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {weak.map(w => (
                    <span key={w} style={{ padding: '8px 16px', borderRadius: 999, background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#B91C1C', fontSize: 13, fontWeight: 700 }}>
                      {w}
                    </span>
                  ))}
                  <button onClick={() => router.push('/lingua/coach')}
                    style={{ padding: '10px 20px', borderRadius: 14, border: 'none', background: '#6366F1', color: '#fff', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif", fontWeight: 800, fontSize: 13, cursor: 'pointer', marginLeft: 4 }}>
                    🧭 Get coaching →
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

          {/* -- Activity Calendar -- */}
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

          {/* -- Level Roadmap -- */}
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

        {/* -- My Progress Summary (leaderboard hidden) -- */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '24px' }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A', marginBottom: 20 }}>📊 My Progress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 14, background: '#EEF2FF', border: '1.5px solid #C7D2FE' }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                  {(user?.displayName || '?')[0].toUpperCase()}
                </div>
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>
                {user?.displayName || 'Learner'}
              </div>
              <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 700 }}>{streak}🔥 day streak</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#2563EB' }}>{xp.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>XP</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
