'use client';
/**
 * TrialBanner
 * 상단에 표시되는 7일 체험 배너
 * - 7일 이상 남음: 파란색 정보 배너
 * - 3~7일: 주황색 경고
 * - 3일 미만: 빨간색 긴급
 * - 만료: 숨김 (TrialExpiredModal이 대신 표시)
 */

import { useRouter } from 'next/navigation';
import { TRIAL_DAYS } from '@/lib/trialPolicy';

interface Props {
  daysLeft: number;
  onDismiss?: () => void;
}

export default function TrialBanner({ daysLeft, onDismiss }: Props) {
  const router = useRouter();

  if (daysLeft <= 0) return null;

  const isUrgent  = daysLeft <= 3;
  const isWarning = daysLeft <= 7 && daysLeft > 3;

  const bg      = isUrgent ? '#450A0A' : isWarning ? '#431407' : '#0F172A';
  const border  = isUrgent ? '#DC2626' : isWarning ? '#F59E0B' : '#6366F1';
  const color   = isUrgent ? '#FCA5A5' : isWarning ? '#FDE68A' : '#A5B4FC';
  const emoji   = isUrgent ? '⚠️' : isWarning ? '⏳' : '🎁';

  return (
    <div style={{
      background: bg,
      borderBottom: `1px solid ${border}33`,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: "'Nunito', sans-serif",
    }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 800, color }}>
        {isUrgent
          ? `Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free trial!`
          : isWarning
          ? `${daysLeft} days left — don't lose your progress`
          : `Free trial · ${daysLeft} of ${TRIAL_DAYS} days remaining`
        }
      </div>
      <button
        onClick={() => router.push('/pricing')}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: `1px solid ${border}`,
          background: isUrgent ? '#DC2626' : isWarning ? '#F59E0B' : '#6366F1',
          color: '#fff',
          fontSize: 12,
          fontWeight: 900,
          cursor: 'pointer',
          fontFamily: "'Nunito', sans-serif",
          whiteSpace: 'nowrap',
        }}>
        Upgrade →
      </button>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color, fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>
          ×
        </button>
      )}
    </div>
  );
}
