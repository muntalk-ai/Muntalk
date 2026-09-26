// hooks/useActiveStudyTimer.ts
// 활성 학습 시간 측정 훅 — $100 이벤트의 minutes 집계용.
//
// - 탭이 백그라운드(document.hidden)면 집계 중단
// - 5분 무반응(포인터/키/터치 없음)이면 집계 중단 (매크로·방치 방지)
// - getSeconds()로 누적 활성 초 조회, stop()으로 종료
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { CASH_EVENT } from '@/lib/cashEvent';

export interface ActiveStudyTimer {
  /** 누적 활성 학습 초 */
  getSeconds: () => number;
  /** 타이머 정지 후 누적 초 반환 */
  stop: () => number;
}

export function useActiveStudyTimer(): ActiveStudyTimer {
  const accRef = useRef(0);          // 누적 활성 초
  const lastTickRef = useRef<number | null>(null);
  const lastActivityRef = useRef(Date.now());
  const stoppedRef = useRef(false);

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const;
    events.forEach(e => window.addEventListener(e, markActivity, { passive: true }));
    document.addEventListener('visibilitychange', markActivity);

    const iv = setInterval(() => {
      if (stoppedRef.current) return;
      const now = Date.now();
      // 백그라운드 탭이면 중단
      if (document.hidden) { lastTickRef.current = null; return; }
      // 무반응 타임아웃이면 중단 (CASH_EVENT.idleTimeoutSec)
      if (now - lastActivityRef.current > CASH_EVENT.idleTimeoutSec * 1000) {
        lastTickRef.current = null;
        return;
      }
      if (lastTickRef.current == null) {
        lastTickRef.current = now;
        return;
      }
      accRef.current += Math.min(5, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
    }, 1000);

    return () => {
      clearInterval(iv);
      events.forEach(e => window.removeEventListener(e, markActivity));
      document.removeEventListener('visibilitychange', markActivity);
    };
  }, [markActivity]);

  const getSeconds = useCallback(() => Math.floor(accRef.current), []);
  const stop = useCallback(() => {
    stoppedRef.current = true;
    return Math.floor(accRef.current);
  }, []);

  return { getSeconds, stop };
}
