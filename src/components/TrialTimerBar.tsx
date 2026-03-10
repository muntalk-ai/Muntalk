'use client';
/**
 * TrialTimerBar
 * 레슨 상단에 표시되는 체험 시간 카운트다운 바
 * - 남은 시간이 2분 이하면 주황색, 1분 이하면 빨간색 + 진동
 * - onExpire 콜백으로 부모에게 만료 알림
 */

import { useEffect, useState, useRef } from 'react';
import { TRIAL_SECONDS } from '@/lib/trialTimer';

interface Props {
  initialRemaining: number;    // 시작 시점의 남은 초
  onExpire: () => void;        // 만료 시 호출
  onTick?: (remaining: number, elapsed: number) => void; // 매초 콜백 (저장용)
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function TrialTimerBar({ initialRemaining, onExpire, onTick }: Props) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const expiredRef = useRef(false);
  const startRef   = useRef(Date.now());
  const initRef    = useRef(initialRemaining);

  useEffect(() => {
    if (initialRemaining <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const newRemaining = Math.max(0, initRef.current - elapsed);
      setRemaining(newRemaining);
      onTick?.(newRemaining, elapsed);

      if (newRemaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct   = (remaining / TRIAL_SECONDS) * 100;
  const isWarn = remaining <= 120 && remaining > 60;
  const isDanger = remaining <= 60;
  const barColor = isDanger ? '#EF4444' : isWarn ? '#F59E0B' : '#6366F1';
  const textColor = isDanger ? '#EF4444' : isWarn ? '#F59E0B' : '#94A3B8';

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: '#0F172A',
      borderBottom: '1px solid #1E293B',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      {/* Clock icon */}
      <span style={{ fontSize: 14, animation: isDanger ? 'shake .4s infinite' : 'none' }}>
        {isDanger ? '⏰' : '⏱️'}
      </span>

      {/* Progress bar */}
      <div style={{ flex: 1, height: 6, background: '#1E293B', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          borderRadius: 99,
          transition: 'width 1s linear, background .5s',
        }} />
      </div>

      {/* Time */}
      <div style={{
        fontSize: 13,
        fontWeight: 900,
        color: textColor,
        minWidth: 40,
        textAlign: 'right',
        fontFamily: "'Nunito', sans-serif",
        animation: isDanger ? 'pulse .8s infinite' : 'none',
      }}>
        {fmt(remaining)}
      </div>

      {/* Label */}
      <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, whiteSpace: 'nowrap' }}>
        Free trial
      </div>

      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          25%{transform:translateX(-2px)}
          75%{transform:translateX(2px)}
        }
        @keyframes pulse {
          0%,100%{opacity:1}
          50%{opacity:0.5}
        }
      `}} />
    </div>
  );
}
