'use client';

// app/r/[code] — 추천 링크 랜딩 (PR #114)
// 코드를 localStorage에 저장하고 /signup으로 안내.
// 코드는 가입 시점에 서버에서 검증 (유효하지 않으면 무시).
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { REFERRAL_CODE_KEY, REFERRAL_COPY, isValidReferralCode } from '@/lib/referral';

const FONT = "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";

export default function ReferralLandingPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const code = (params.code || '').toUpperCase();
  const [inviter, setInviter] = useState<string | null>(null);

  useEffect(() => {
    // 추천 코드 저장 (가입 시 ensureFirstLoginSetup에서 소비)
    try {
      if (isValidReferralCode(code)) {
        localStorage.setItem(REFERRAL_CODE_KEY, code);
      }
    } catch { /* ignore */ }
    // 추천인 이름 조회 (실패해도 generic 문구로 진행)
    if (isValidReferralCode(code)) {
      fetch(`/api/referral/resolve?code=${code}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.ok && d.displayName) setInviter(d.displayName);
        })
        .catch(() => {});
    }
  }, [code]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', padding: 24, fontFamily: FONT }}>
      <div style={{ background: '#fff', borderRadius: 28, padding: '48px 36px', maxWidth: 420,
        width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(99,102,241,0.15)',
        border: '2px solid #EEF2FF' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎁</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '0 0 12px' }}>
          {inviter ? REFERRAL_COPY.inviteTitle(inviter) : REFERRAL_COPY.inviteTitleGeneric}
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', fontWeight: 600, lineHeight: 1.6, margin: '0 0 28px' }}>
          {REFERRAL_COPY.inviteSubtitle}
        </p>
        <button
          onClick={() => router.push('/signup')}
          style={{ border: 'none', borderRadius: 99, cursor: 'pointer', padding: '16px 44px',
            fontSize: 16, fontWeight: 800, color: '#fff',
            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            boxShadow: '0 6px 24px rgba(99,102,241,0.35)', fontFamily: FONT }}>
          {REFERRAL_COPY.inviteCta}
        </button>
        <div style={{ marginTop: 20 }}>
          <button onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 13,
              fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            Learn more first →
          </button>
        </div>
      </div>
    </div>
  );
}
