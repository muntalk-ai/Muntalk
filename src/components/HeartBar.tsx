'use client';
// components/HeartBar.tsx
// 하트 UI — 레슨 중 상단 표시

import { useState, useEffect } from 'react';
import { MAX_HEARTS, Hearts, HEART_REFILL_HOURS } from '@/lib/subscription';

interface HeartBarProps {
  hearts: Hearts;
  onNoHearts?: () => void; // 하트 0개일 때 콜백
}

export default function HeartBar({ hearts, onNoHearts }: HeartBarProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (hearts.count >= MAX_HEARTS || !hearts.nextRefillAt) return;
    const update = () => {
      const diff = new Date(hearts.nextRefillAt!).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(''); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? `${h}h ` : ''}${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [hearts.nextRefillAt]);

  useEffect(() => {
    if (hearts.count === 0 && onNoHearts) onNoHearts();
  }, [hearts.count]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <span
          key={i}
          style={{
            fontSize: 18,
            filter: i < hearts.count ? 'none' : 'grayscale(1) opacity(0.3)',
            transition: 'filter 0.3s, transform 0.2s',
            transform: i < hearts.count ? 'scale(1)' : 'scale(0.85)',
          }}
        >
          ❤️
        </span>
      ))}
      {hearts.count < MAX_HEARTS && timeLeft && (
        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginLeft: 4 }}>
          +1 in {timeLeft}
        </span>
      )}
    </div>
  );
}
