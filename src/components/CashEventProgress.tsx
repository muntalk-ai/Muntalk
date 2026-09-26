// components/CashEventProgress.tsx
// $100 월간 이벤트 응모 현황 프로그레스 바 (Phase 2-1 PR-D)
//
// ⚠️ ENABLE_CASH_EVENT=false면 아무것도 렌더링하지 않음 (Jay "GO" 선언 전까지 비공개)
'use client';

import { useEffect, useState } from 'react';
import {
  ENABLE_CASH_EVENT, CASH_EVENT, getMonthProgress, monthIdOf, utcToday,
  type MonthProgress,
} from '@/lib/cashEvent';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Props {
  uid: string;
  activityDates: string[];
  joinedDate?: string; // YYYY-MM-DD
}

export default function CashEventProgress({ uid, activityDates, joinedDate }: Props) {
  const [progress, setProgress] = useState<MonthProgress | null>(null);

  useEffect(() => {
    if (!ENABLE_CASH_EVENT || !uid) return;
    const monthId = monthIdOf(utcToday());
    getMonthProgress(uid, monthId, activityDates, joinedDate)
      .then(setProgress)
      .catch(() => {});
  }, [uid, activityDates, joinedDate]);

  // 플래그 off → 완전 숨김
  if (!ENABLE_CASH_EVENT) return null;
  if (!progress || progress.totalDays === 0) return null;

  const pct = Math.round((progress.qualifiedDays / progress.totalDays) * 100);
  const done = progress.monthQualified;

  return (
    <div style={{
      maxWidth: 900, margin: '0 auto', padding: '18px 24px 0', width: '100%',
      fontFamily: "'Nunito',sans-serif",
    }}>
      <div style={{
        background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)',
        border: '1.5px solid #FDE68A', borderRadius: 18, padding: '18px 22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>💰</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A' }}>
              {CASH_EVENT.prizeLabel} Monthly Challenge
            </div>
            <div style={{ fontSize: 12, color: '#92400E', fontWeight: 700 }}>
              Study 30+ min every day to enter the draw
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {done ? (
              <span style={{ background: '#10B981', color: '#fff', fontSize: 12, fontWeight: 900, padding: '6px 14px', borderRadius: 999 }}>
                ✅ Qualified
              </span>
            ) : (
              <span style={{ background: '#fff', color: '#B45309', fontSize: 12, fontWeight: 900, padding: '6px 14px', borderRadius: 999, border: '1.5px solid #FDE68A' }}>
                {progress.qualifiedDays}/{progress.totalDays} days
              </span>
            )}
          </div>
        </div>
        <div style={{ height: 10, background: '#fff', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 999,
            background: done ? 'linear-gradient(90deg,#10B981,#34D399)' : 'linear-gradient(90deg,#F59E0B,#FBBF24)',
            transition: 'width .5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#92400E', fontWeight: 700 }}>
            {progress.todayQualified ? '✅ Today qualified' : '⏳ Qualify today: 30 min + 50 XP'}
          </span>
          <span style={{ fontSize: 11, color: '#B45309', fontWeight: 700 }}>{pct}%</span>
        </div>
      </div>
    </div>
  );
}
