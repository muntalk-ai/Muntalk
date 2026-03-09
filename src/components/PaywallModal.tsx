'use client';
// components/PaywallModal.tsx
// 유료 전환 모달 — 레벨 잠금 / 하트 부족 / AI 대화 초과 시 표시

import { useRouter } from 'next/navigation';
import { PLANS } from '@/lib/subscription';

type PaywallReason = 'level_locked' | 'no_hearts' | 'chat_limit' | 'general';

interface PaywallModalProps {
  reason:   PaywallReason;
  onClose:  () => void;
  levelName?: string;
}

const REASON_CONFIG: Record<PaywallReason, { emoji: string; title: string; subtitle: string }> = {
  level_locked: {
    emoji: '🔒',
    title: 'Unlock All Levels',
    subtitle: 'You\'ve completed A1! Upgrade to continue your journey to fluency.',
  },
  no_hearts: {
    emoji: '💔',
    title: 'Out of Hearts',
    subtitle: 'You\'ve used all your hearts. Upgrade for unlimited practice — no more waiting!',
  },
  chat_limit: {
    emoji: '🤖',
    title: 'Daily AI Limit Reached',
    subtitle: 'You\'ve used your 3 free AI tutor sessions today. Go Premium for unlimited conversations!',
  },
  general: {
    emoji: '⭐',
    title: 'Upgrade to Premium',
    subtitle: 'Get unlimited access to all features and accelerate your learning.',
  },
};

export default function PaywallModal({ reason, onClose, levelName }: PaywallModalProps) {
  const router = useRouter();
  const config = REASON_CONFIG[reason];

  const handleUpgrade = (planId: string) => {
    onClose();
    router.push(`/pricing?plan=${planId}`);
  };

  const highlightPlans = ['biannual', 'annual'] as const;

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
          @keyframes slideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
          .pw-plan:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(99,102,241,0.15) !important; }
          .pw-plan { transition: all .2s; }
          .pw-cta:hover { opacity: .88; }
          .pw-cta { transition: opacity .15s; }
        ` }} />

        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8', lineHeight: 1 }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>{config.emoji}</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '0 0 8px' }}>{config.title}</h2>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.6, maxWidth: 320, marginInline: 'auto' }}>{config.subtitle}</p>
        </div>

        {/* Free vs Premium comparison */}
        {reason === 'level_locked' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20, fontSize: 12 }}>
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px' }}>
              <div style={{ fontWeight: 900, color: '#94A3B8', marginBottom: 8 }}>🆓 Free</div>
              {['A1 only (12 lessons)', 'AI chat: 3×/day', '5 hearts/day', 'Basic streak'].map(f => (
                <div key={f} style={{ color: '#64748B', marginBottom: 4 }}>✓ {f}</div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius: 12, padding: '14px', border: '1.5px solid #C7D2FE' }}>
              <div style={{ fontWeight: 900, color: '#6366F1', marginBottom: 8 }}>⭐ Premium</div>
              {['A1 → C2 (72 lessons)', 'Unlimited AI chat', 'Unlimited hearts', 'League + SRS'].map(f => (
                <div key={f} style={{ color: '#374151', marginBottom: 4 }}>✓ {f}</div>
              ))}
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {highlightPlans.map(planId => {
            const plan = PLANS[planId];
            const isTop = planId === 'biannual';
            return (
              <div key={planId} className="pw-plan" style={{
                background: isTop ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#fff',
                borderRadius: 16, padding: '16px 20px',
                border: isTop ? 'none' : '1.5px solid #E5E7EB',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
              }} onClick={() => handleUpgrade(planId)}>
                {plan.badge && (
                  <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 11, fontWeight: 800, background: isTop ? 'rgba(255,255,255,0.25)' : '#EEF2FF', color: isTop ? '#fff' : '#6366F1', borderRadius: 8, padding: '2px 8px' }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: isTop ? '#fff' : '#0F172A' }}>{plan.name}</div>
                    <div style={{ fontSize: 11, color: isTop ? 'rgba(255,255,255,0.75)' : '#94A3B8', fontWeight: 600 }}>
                      ${plan.monthlyPrice.toFixed(2)}/month · billed ${plan.price} per {plan.period}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: isTop ? '#fff' : '#6366F1' }}>${plan.price}</div>
                    {plan.discount > 0 && (
                      <div style={{ fontSize: 11, fontWeight: 800, color: isTop ? 'rgba(255,255,255,0.8)' : '#16A34A' }}>
                        Save {plan.discount}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View all plans */}
        <button className="pw-cta" onClick={() => { onClose(); router.push('/pricing'); }}
          style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", marginBottom: 10 }}>
          See All Plans & Start Free →
        </button>

        <button onClick={onClose}
          style={{ width: '100%', padding: '10px', borderRadius: 14, border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 1000, padding: '0 0 0 0',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#fff', borderRadius: '28px 28px 0 0',
    padding: '32px 28px 28px',
    width: '100%', maxWidth: 480,
    position: 'relative',
    fontFamily: "'Nunito', sans-serif",
    animation: 'slideUp .3s ease',
    maxHeight: '90vh', overflowY: 'auto',
  },
};
