'use client';
/**
 * TrialExpiredModal — 7일 체험 만료 모달
 * reason별로 다른 메시지 표시
 */

import { useRouter } from 'next/navigation';
import { TRIAL_MAX_LANGUAGES, TRIAL_MAX_UNITS, TRIAL_DAILY_CHATS } from '@/lib/trialPolicy';

type Reason = 'expired' | 'language_limit' | 'lesson_limit' | 'chat_limit' | 'level_test_done' | 'premium_only';

interface Props {
  reason: Reason;
  langFlag?: string;
  langLabel?: string;
  onClose?: () => void;
}

const MESSAGES: Record<Reason, { emoji: string; title: string; body: (langLabel?: string) => string }> = {
  expired: {
    emoji: '⏰',
    title: '14-Day Trial Ended',
    body: () => 'Your free trial has expired. Upgrade to Premium to continue learning.',
  },
  language_limit: {
    emoji: '🌐',
    title: `${TRIAL_MAX_LANGUAGES} Languages Reached`,
    body: () => `Free trial includes up to ${TRIAL_MAX_LANGUAGES} languages. Upgrade to access all 65 languages.`,
  },
  lesson_limit: {
    emoji: '📚',
    title: 'First 3 Units Complete',
    body: (lang) => `You've finished the free preview units${lang ? ` for ${lang}` : ''}. Upgrade to unlock the full curriculum.`,
  },
  chat_limit: {
    emoji: '🤖',
    title: `Daily AI Limit Reached`,
    body: () => `Free trial includes ${TRIAL_DAILY_CHATS} AI conversations per day. Upgrade for unlimited AI tutoring.`,
  },
  level_test_done: {
    emoji: '🎯',
    title: 'Level Test Used',
    body: () => 'Free trial includes 1 level placement test. Upgrade to retake anytime.',
  },
  premium_only: {
    emoji: '👑',
    title: 'Premium Feature',
    body: () => 'This feature is available for Premium members.',
  },
};

export default function TrialExpiredModal({ reason, langFlag, langLabel, onClose }: Props) {
  const router = useRouter();
  const msg = MESSAGES[reason] || MESSAGES.expired;

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
        padding: '36px 28px',
        maxWidth: 400,
        width: '100%',
        textAlign: 'center',
        animation: 'popIn .4s cubic-bezier(.34,1.56,.64,1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Icon */}
        <div style={{ fontSize: 48, marginBottom: 12, animation: 'float 2s ease-in-out infinite' }}>
          {msg.emoji}
        </div>

        <div style={{ fontSize: 11, fontWeight: 900, color: '#6366F1', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
          {reason === 'expired' ? 'Trial Ended' : 'Upgrade Required'}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 10px', lineHeight: 1.3 }}>
          {msg.title}
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: '0 0 24px' }}>
          {msg.body(langLabel ? `${langFlag || ''} ${langLabel}` : undefined)}
        </p>

        {/* Feature comparison */}
        <div style={{ background: '#1F2937', borderRadius: 14, padding: '16px', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#4B5563', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
            Premium includes
          </div>
          {[
            '🌐 All 65 languages',
            '🤖 Unlimited AI conversations',
            '📚 Full curriculum A1–C2',
            '🎯 Unlimited level tests',
            '📊 Complete learning history',
            '📴 Offline learning',
            '🏆 Exam prep courses',
          ].map((f, i) => (
            <div key={i} style={{ fontSize: 13, fontWeight: 700, color: '#D1D5DB', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#6366F1', fontSize: 12 }}>✓</span> {f}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => router.push('/pricing')}
            style={{ padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", boxShadow: '0 6px 20px rgba(99,102,241,0.4)' }}>
            🚀 Upgrade to Premium
          </button>
          {onClose && (
            <button onClick={onClose}
              style={{ padding: '12px', borderRadius: 12, border: 'none', background: 'transparent', color: '#4B5563', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
              ← Go back
            </button>
          )}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: '#374151', fontWeight: 700 }}>
          Cancel anytime · No hidden fees
        </div>
      </div>
    </div>
  );
}
