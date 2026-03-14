'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ROLEPLAY_SCENARIOS, SCENARIOS_BY_LEVEL, type RpDifficulty } from '@/data/roleplay';

const LEVELS: { id: RpDifficulty; label: string; desc: string; color: string }[] = [
  { id: 'A1', label: 'A1', desc: 'Beginner',        color: '#10B981' },
  { id: 'A2', label: 'A2', desc: 'Elementary',      color: '#3B82F6' },
  { id: 'B1', label: 'B1', desc: 'Intermediate',    color: '#8B5CF6' },
  { id: 'B2', label: 'B2', desc: 'Upper-Int',       color: '#F59E0B' },
  { id: 'C1', label: 'C1', desc: 'Advanced',        color: '#EF4444' },
];

export default function RoleplayLobby() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeLevel, setActiveLevel] = useState<RpDifficulty | 'all'>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const shown = activeLevel === 'all'
    ? ROLEPLAY_SCENARIOS
    : SCENARIOS_BY_LEVEL[activeLevel] || [];

  const getLevelColor = (lvl: RpDifficulty) =>
    LEVELS.find(l => l.id === lvl)?.color || '#6366F1';

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Sora', sans-serif", color: '#fff' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .scenario-card { transition: transform .2s, box-shadow .2s; cursor: pointer; }
        .scenario-card:hover { transform: translateY(-4px) scale(1.01); }
        .level-btn { transition: all .15s; }
        .level-btn:hover { transform: translateY(-2px); }
        .start-btn { transition: all .2s; }
        .start-btn:hover { transform: scale(1.04); box-shadow: 0 8px 32px rgba(99,102,241,0.5) !important; }
      `}} />

      {/* ── Header ── */}
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: '10px 18px', color: '#94A3B8', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>
          ← Back
        </button>
      </div>

      {/* ── Hero ── */}
      <div style={{ padding: '40px 24px 32px', textAlign: 'center', animation: 'fadeUp .5s ease' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)', borderRadius: 99, padding: '6px 16px',
          fontSize: 12, fontWeight: 700, color: '#818CF8', marginBottom: 20, letterSpacing: 1 }}>
          🎭 NEW — AI ROLEPLAY
        </div>
        <h1 style={{ fontSize: 'clamp(28px,6vw,52px)', fontWeight: 800, margin: '0 0 14px',
          background: 'linear-gradient(135deg, #fff 0%, #818CF8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>
          Real Situations.<br/>Real Conversations.
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', fontWeight: 600, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
          AI가 실제 상황을 연기합니다. 공항, 병원, 면접, 협상 —<br/>
          실제처럼 대화하고 즉각적인 피드백을 받으세요.
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
          {[
            { n: ROLEPLAY_SCENARIOS.length, label: '시나리오' },
            { n: 5, label: 'CEFR 레벨' },
            { n: '∞', label: 'AI 반응' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#6366F1' }}>{s.n}</div>
              <div style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Level filter ── */}
      <div style={{ padding: '0 24px 24px', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="level-btn"
          onClick={() => setActiveLevel('all')}
          style={{ padding: '8px 20px', borderRadius: 99, border: 'none', fontFamily: "'Sora',sans-serif",
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: activeLevel === 'all' ? '#6366F1' : 'rgba(255,255,255,0.07)',
            color: activeLevel === 'all' ? '#fff' : '#64748B' }}>
          All
        </button>
        {LEVELS.map(lv => (
          <button key={lv.id} className="level-btn"
            onClick={() => setActiveLevel(lv.id)}
            style={{ padding: '8px 20px', borderRadius: 99, border: 'none', fontFamily: "'Sora',sans-serif",
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              background: activeLevel === lv.id ? lv.color : 'rgba(255,255,255,0.07)',
              color: activeLevel === lv.id ? '#fff' : '#64748B' }}>
            {lv.id} <span style={{ opacity: 0.7, fontSize: 11 }}>{lv.desc}</span>
          </button>
        ))}
      </div>

      {/* ── Scenario Grid ── */}
      <div style={{ padding: '0 20px 80px', maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {shown.map((s, i) => {
          const isHovered = hoveredId === s.id;
          return (
            <div key={s.id}
              className="scenario-card"
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                if (!user) { router.push('/signup'); return; }
                router.push(`/lingua/roleplay/${s.id}`);
              }}
              style={{
                background: isHovered ? s.bgGradient : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isHovered ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20, padding: 24, animation: `fadeUp .4s ease ${i * 0.05}s both`,
                position: 'relative', overflow: 'hidden',
                boxShadow: isHovered ? `0 16px 48px ${s.accentColor}30` : 'none',
              }}>

              {/* Glow bg */}
              {isHovered && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                  borderRadius: 20, pointerEvents: 'none' }} />
              )}

              <div style={{ position: 'relative' }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ fontSize: 36 }}>{s.emoji}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                      background: `${getLevelColor(s.difficulty)}20`,
                      color: getLevelColor(s.difficulty), border: `1px solid ${getLevelColor(s.difficulty)}40` }}>
                      {s.difficulty}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9', marginBottom: 6 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 12 }}>
                  {s.titleKo}
                </div>

                {/* Goal */}
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16,
                  padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
                  🎯 {s.goalKo}
                </div>

                {/* Hints */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                  {s.successHints.slice(0, 2).map(h => (
                    <span key={h} style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11,
                      background: 'rgba(255,255,255,0.06)', color: '#94A3B8', fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.08)' }}>
                      "{h}"
                    </span>
                  ))}
                </div>

                {/* Roles */}
                <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)', color: '#64748B' }}>
                    🤖 <strong style={{ color: '#94A3B8' }}>AI:</strong> {s.npcRole}
                  </div>
                  <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8,
                    background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}>
                    🙋 <strong>나:</strong> {s.userRole}
                  </div>
                </div>

                {/* CTA */}
                <button className="start-btn"
                  style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                    background: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.2)',
                    color: isHovered ? '#fff' : '#818CF8',
                    fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Sora',sans-serif",
                    backdropFilter: 'blur(4px)' }}>
                  시작하기 →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
