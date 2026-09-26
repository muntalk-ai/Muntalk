
// components/CashEventWinnerBanner.tsx
// $100 이벤트 당첨자 인앱 배너 (Phase 2-1 PR-D)
//
// ⚠️ ENABLE_CASH_EVENT=false면 아무것도 렌더링하지 않음 (Jay "GO" 선언 전까지 비공개)
// 당첨자 본인만 자신의 cash_events 문서를 읽을 수 있음 (firestore.rules 참조)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ENABLE_CASH_EVENT, CASH_EVENT } from '@/lib/cashEvent';

export default function CashEventWinnerBanner({ uid }: { uid: string }) {
  const router = useRouter();
  const [winMonth, setWinMonth] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!ENABLE_CASH_EVENT || !uid) return;
    (async () => {
      try {
        const q = query(collection(db, 'cash_events'), where('winnerUid', '==', uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const months = snap.docs.map(d => d.id).sort().reverse();
          setWinMonth(months[0]);
        }
      } catch {}
    })();
  }, [uid]);

  if (!ENABLE_CASH_EVENT || !winMonth || dismissed) return null;

  return (
    <div style={{
      maxWidth: 900, margin: '0 auto', padding: '18px 24px 0', width: '100%',
      fontFamily: "'Nunito',sans-serif",
    }}>
      <div style={{
        background: 'linear-gradient(135deg,#F59E0B,#F97316)',
        borderRadius: 18, padding: '20px 24px', color: '#fff',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 8px 28px rgba(245,158,11,0.35)',
      }}>
        <span style={{ fontSize: 36 }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 17 }}>
            You won {CASH_EVENT.prizeLabel}! ({winMonth})
          </div>
          <div style={{ fontSize: 13, opacity: 0.92, fontWeight: 700, marginTop: 2 }}>
            Check your email to choose how to receive your prize — PayPal, Amazon gift card, or Wise.
          </div>
        </div>
        <button onClick={() => setDismissed(true)}
          style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff',
            width: 32, height: 32, borderRadius: '50%', fontSize: 15, cursor: 'pointer', fontWeight: 900 }}>
          ✕
        </button>
      </div>
    </div>
  );
}
