'use client';

import { useState } from 'react';
import { requestPushPermission } from '@/lib/notifications';
import { updateUserProfile } from '@/lib/userProfile';

// 첫 레슨 완료 후 보여주는 푸시 옵트인 카드 (soft-prime).
// 브라우저 기본 권한 팝업을 바로 띄우지 않고, 먼저 가치를 설명한 뒤 요청.
export default function PushPrimeCard({ uid, onDone }: { uid: string; onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'ok' | 'denied' | null>(null);

  const dismiss = () => {
    try { localStorage.setItem('mt_push_prime_dismissed', '1'); } catch { /* ignore */ }
    onDone();
  };

  const enable = async () => {
    setLoading(true);
    try {
      const token = await requestPushPermission(uid);
      if (token) {
        await updateUserProfile(uid, { pushNotifications: true } as any).catch(() => {});
        setResult('ok');
        setTimeout(onDone, 1800);
      } else {
        setResult('denied');
      }
    } catch {
      setResult('denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg,#EEF2FF 0%,#E0E7FF 100%)',
      border: '1.5px solid #C7D2FE', borderRadius: 16, padding: '16px 18px',
      display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16,
      fontFamily: "'Nunito','Noto Sans KR',sans-serif",
    }}>
      <div style={{ fontSize: 32, flexShrink: 0 }}>🔔</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 14, color: '#1E1B4B', marginBottom: 4 }}>
          {result === 'ok' ? '알림이 켜졌어요! 🎉' : '내일도 이어서 학습할 수 있게 알려드릴까요?'}
        </div>
        <div style={{ fontSize: 12.5, color: '#4F46E5', fontWeight: 600, lineHeight: 1.5 }}>
          {result === 'ok'
            ? '오늘 학습을 마치면 저녁에 알려드려요.'
            : result === 'denied'
              ? '브라우저에서 알림이 차단됐어요. 주소창 옆 🔒 아이콘에서 허용할 수 있어요.'
              : '매일 저녁, 오늘의 학습을 마치면 알려드려요. 스트릭이 끊기지 않게요.'}
        </div>
        {result !== 'ok' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={enable} disabled={loading}
              style={{
                background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 999,
                padding: '8px 20px', fontWeight: 900, fontSize: 13, cursor: 'pointer',
                opacity: loading ? 0.6 : 1, fontFamily: 'inherit',
              }}>
              {loading ? '켜는 중…' : '🔔 알림 켜기'}
            </button>
            <button onClick={dismiss}
              style={{
                background: 'transparent', color: '#6B7280', border: 'none',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}>
              나중에
            </button>
          </div>
        )}
      </div>
      {result !== 'ok' && (
        <button onClick={dismiss} aria-label="닫기"
          style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 18, cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start' }}>
          ×
        </button>
      )}
    </div>
  );
}
