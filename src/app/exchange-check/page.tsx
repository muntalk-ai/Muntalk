'use client';

import { useState } from 'react';

// Temporary diagnostic page (NOT for merge): reproduces the Exchange profile
// interest-chip toggle logic verbatim, with no login and no Firestore, plus a
// plain-text readout so a browser test can read state instead of judging colors.
// Inline styles on purpose: independent of Tailwind loading.
const INTERESTS = ['Travel', 'Cooking', 'Football', 'Music', 'Movies', 'Reading', 'Hiking'];

export default function ExchangeCheckPage() {
  const [interestSel, setInterestSel] = useState<string[]>(['Travel', 'Cooking']);
  const [tapCount, setTapCount] = useState(0);

  const toggleInterest = (i: string) => {
    setTapCount((c) => c + 1);
    const next = interestSel.includes(i)
      ? interestSel.filter((x) => x !== i)
      : [...interestSel, i];
    setInterestSel(next);
  };

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 640 }}>
      <h1>Exchange interests check (no login)</h1>
      <p>기본값: Travel, Cooking이 선택된 상태로 시작해야 함.</p>
      <p data-testid="readout" style={{ fontSize: 20, fontWeight: 700 }}>
        선택됨: {interestSel.length ? interestSel.join(', ') : '(없음)'} / 탭 횟수: {tapCount}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {INTERESTS.map((i) => (
          <button
            key={i}
            onClick={() => toggleInterest(i)}
            style={{
              padding: '10px 16px',
              borderRadius: 9999,
              border: '1px solid #999',
              cursor: 'pointer',
              background: interestSel.includes(i) ? '#7c3aed' : '#ffffff',
              color: interestSel.includes(i) ? '#ffffff' : '#000000',
            }}
          >
            {i}
          </button>
        ))}
      </div>
    </main>
  );
}
