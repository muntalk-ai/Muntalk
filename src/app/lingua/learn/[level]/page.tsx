'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ensureLeague, getLeagueMembers, getUserLeague, getPromotionMessage,
  LEAGUE_CONFIG, TIER_ORDER, LeagueMember, UserLeague, getWeekStart,
} from '@/lib/league';

const DAYS_LEFT = () => {
  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay();
  const diff = 7 - (day === 0 ? 6 : day - 1); // days until next Monday
  return diff;
};

export default function LeaguePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [userLeague, setUserLeague]   = useState<UserLeague | null>(null);
  const [members,    setMembers]      = useState<LeagueMember[]>([]);
  const [loading,    setLoading]      = useState(true);
  const [myRank,     setMyRank]       = useState<number>(-1);

  useEffect(() => {
    // authLoading 끝나기 전엔 실행 안 함 (무한로딩 방지)
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const league = await ensureLeague(
          user.uid,
          user.displayName || 'Learner',
          user.photoURL || '',
        );
        setUserLeague(league);
        const ms = await getLeagueMembers(league.leagueId);
        setMembers(ms);
        setMyRank(ms.findIndex(m => m.uid === user.uid) + 1);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user, authLoading]);

  // auth 로딩 중엔 스피너 표시 (user가 null인 것처럼 보이는 flicker 방지)
  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 48, height: 48, border: '4px solid #E5E7EB', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Sign in to join the league!</div>
        <button onClick={() => router.push('/login')}
          style={{ padding: '12px 28px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
          Sign In
        </button>
      </div>
    </div>
  );

  const tierConfig  = userLeague ? LEAGUE_CONFIG[userLeague.tier] : LEAGUE_CONFIG.bronze;
  const promoMsg    = userLeague && myRank > 0 ? getPromotionMessage(myRank, userLeague.tier) : null;
  const daysLeft    = DAYS_LEFT();
  const tierIdx     = userLeague ? TIER_ORDER.indexOf(userLeague.tier) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito',sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lb-row:hover { background:#F8FAFC !important; }
      ` }} />

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', height: 62, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 200 }}>
        <button onClick={() => router.push('/lingua')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }}>←</button>
        <div style={{ fontWeight: 900, fontSize: 18, color: '#0F172A' }}>🏆 League</div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#94A3B8', fontWeight: 700 }}>
          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left this week
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #E5E7EB', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ color: '#94A3B8', fontWeight: 700 }}>Loading league…</div>
          </div>
        ) : (
          <>
            {/* ── Current League Banner ── */}
            <div style={{
              background: `linear-gradient(135deg, ${tierConfig.color}22, ${tierConfig.color}44)`,
              border: `2px solid ${tierConfig.color}66`,
              borderRadius: 28, padding: '28px 24px', marginBottom: 20,
              textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `${tierConfig.color}18`, pointerEvents: 'none' }} />
              <div style={{ fontSize: 56, marginBottom: 8, animation: 'pulse 2s ease-in-out infinite' }}>{tierConfig.emoji}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: tierConfig.color }}>{tierConfig.name} League</div>
              <div style={{ fontSize: 14, color: '#64748B', fontWeight: 700, marginTop: 4 }}>
                {members.length} competitors this week
              </div>

              {/* My weekly XP */}
              <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 16, padding: '8px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: 20 }}>⭐</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#2563EB' }}>{(userLeague?.weeklyXp || 0).toLocaleString()}</span>
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 700 }}>XP this week</span>
              </div>

              {/* Rank badge */}
              {myRank > 0 && (
                <div style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: tierConfig.color, background: `${tierConfig.color}18`, borderRadius: 10, padding: '4px 14px' }}>
                    #{myRank} of {members.length}
                  </span>
                </div>
              )}
            </div>

            {/* ── Promotion Status ── */}
            {promoMsg && (
              <div style={{
                borderRadius: 16, padding: '14px 18px', marginBottom: 20, fontSize: 13, fontWeight: 700,
                background: promoMsg.type === 'promote' ? '#F0FDF4' : promoMsg.type === 'demote' ? '#FEF2F2' : '#EFF6FF',
                color: promoMsg.type === 'promote' ? '#16A34A' : promoMsg.type === 'demote' ? '#DC2626' : '#2563EB',
                border: `1px solid ${promoMsg.type === 'promote' ? '#BBF7D0' : promoMsg.type === 'demote' ? '#FECACA' : '#BFDBFE'}`,
              }}>
                {promoMsg.message}
              </div>
            )}

            {/* ── Tier Ladder ── */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '20px', marginBottom: 20 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#0F172A', marginBottom: 14 }}>League Tiers</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TIER_ORDER.map((tier, i) => {
                  const cfg = LEAGUE_CONFIG[tier];
                  const isActive = tier === userLeague?.tier;
                  const isPast   = tierIdx > i;
                  return (
                    <div key={tier} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      padding: '8px 10px', borderRadius: 12, flex: '1 1 60px', minWidth: 52,
                      background: isActive ? `${cfg.color}18` : isPast ? '#F0FDF4' : '#F8FAFC',
                      border: isActive ? `2px solid ${cfg.color}` : '2px solid transparent',
                    }}>
                      <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: isActive ? cfg.color : isPast ? '#10B981' : '#CBD5E1' }}>
                        {isPast ? '✓' : cfg.name.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 10, fontWeight: 600 }}>
                Top {tierConfig.promoteRank} promote · Bottom {LEAGUE_CONFIG[userLeague?.tier || 'bronze'].size - tierConfig.minRank + 1} demote each week
              </div>
            </div>

            {/* ── Leaderboard ── */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '20px' }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: '#0F172A', marginBottom: 16 }}>
                This Week's Rankings
              </div>

              {members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8', fontWeight: 700 }}>
                  No competitors yet — you're in the lead! 🏆
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Promotion zone header */}
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', background: '#F0FDF4', borderRadius: 8, padding: '4px 10px', marginBottom: 4 }}>
                    🔼 PROMOTION ZONE (Top {tierConfig.promoteRank})
                  </div>

                  {members.map((m, i) => {
                    const isMe = m.uid === user?.uid;
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                    const isPromote = i < tierConfig.promoteRank;
                    const isDemote  = i >= tierConfig.minRank;
                    const showDemoteLine = i === tierConfig.minRank && userLeague?.tier !== 'bronze';

                    return (
                      <div key={m.uid}>
                        {showDemoteLine && (
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#EF4444', background: '#FEF2F2', borderRadius: 8, padding: '4px 10px', margin: '8px 0 4px' }}>
                            🔽 DEMOTION ZONE
                          </div>
                        )}
                        <div className="lb-row" style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                          borderRadius: 14, transition: 'background .15s',
                          background: isMe ? '#EEF2FF' : '#fff',
                          border: isMe ? '1.5px solid #C7D2FE' : '1.5px solid transparent',
                          opacity: isDemote && !isMe ? 0.7 : 1,
                        }}>
                          <div style={{ width: 28, textAlign: 'center', fontSize: medal ? 18 : 12, fontWeight: 900, color: '#94A3B8', flexShrink: 0 }}>
                            {medal || `${i + 1}`}
                          </div>
                          {m.photoURL
                            ? <img src={m.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: isPromote && i < 3 ? `2px solid ${tierConfig.color}` : 'none' }} />
                            : <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,${tierConfig.color},#8B5CF6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                                {(m.displayName || '?')[0].toUpperCase()}
                              </div>
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.displayName}</span>
                              {isMe && <span style={{ fontSize: 10, background: '#6366F1', color: '#fff', borderRadius: 6, padding: '2px 6px', fontWeight: 700, flexShrink: 0 }}>YOU</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: isPromote ? '#16A34A' : '#2563EB' }}>{m.weeklyXp.toLocaleString()}</div>
                            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>XP</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
