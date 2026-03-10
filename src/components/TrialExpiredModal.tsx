'use client';
/**
 * TrialExpiredModal
 * 10분 체험 만료 시 레슨 위에 오버레이되는 모달
 * Netflix 스타일 — 배경 블러 + 중앙 카드
 */

import { useRouter } from 'next/navigation';

interface Props {
  isGuest: boolean;         // 비로그인 게스트 여부
  langFlag?: string;        // 학습 언어 국기 이모지
  langLabel?: string;       // 학습 언어명
  onClose?: () => void;     // X 닫기 (다음날 재확인용, 무료회원만)
}

export default function TrialExpiredModal({ isGuest, langFlag = '🌐', langLabel = '', onClose }: Props) {
  const router = useRouter();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(9,11,20,0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      fontFamily: "'Nunito', sans-serif",
    }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        @keyframes popIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      `}} />

      <div style={{
        background: '#111827',
        border: '1px solid #1F2937',
        borderRadius: 24,
        padding: '36px 32px',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        animation: 'popIn .4s cubic-bezier(.34,1.56,.64,1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Icon */}
        <div style={{ fontSize: 52, marginBottom: 12, animation: 'float 2s ease-in-out infinite' }}>
          ⏰
        </div>

        {/* Title */}
        <div style={{ fontSize: 11, fontWeight: 900, color: '#6366F1', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
          Free Trial Ended
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 10px', lineHeight: 1.3 }}>
          Your 10-minute preview<br />is up!
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: '0 0 28px' }}>
          {isGuest
            ? <>Create a free account to get <strong style={{ color: '#CBD5E1' }}>10 minutes every day</strong>,<br />or go Premium for unlimited access to {langFlag} {langLabel}.</>
            : <>Come back tomorrow for another <strong style={{ color: '#CBD5E1' }}>10 free minutes</strong>,<br />or go Premium for unlimited {langFlag} {langLabel}.</>
          }
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Primary: upgrade */}
          <button onClick={() => router.push('/pricing')}
            style={{ padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 6px 20px rgba(99,102,241,0.4)' }}>
            🚀 Go Premium — Unlimited Access
          </button>

          {/* Secondary: sign up (guest only) */}
          {isGuest && (
            <button onClick={() => router.push('/signup')}
              style={{ padding: '13px', borderRadius: 12, border: '1px solid #374151', background: '#1F2937', color: '#D1D5DB', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
              📧 Sign up free — 10 min/day
            </button>
          )}

          {/* Tertiary: come back tomorrow (free member) or back to dashboard */}
          {!isGuest && onClose ? (
            <button onClick={onClose}
              style={{ padding: '12px', borderRadius: 12, border: 'none', background: 'transparent', color: '#4B5563', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
              ← Back to dashboard
            </button>
          ) : isGuest ? (
            <button onClick={() => router.push('/lingua')}
              style={{ padding: '12px', borderRadius: 12, border: 'none', background: 'transparent', color: '#4B5563', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
              ← Back to dashboard
            </button>
          ) : null}
        </div>

        {/* Fine print */}
        <div style={{ marginTop: 20, fontSize: 11, color: '#374151', fontWeight: 700 }}>
          {isGuest ? 'Free account · No credit card required' : 'Free plan resets every day at midnight'}
        </div>
      </div>
    </div>
  );
}
