'use client';

// components/ReferTab.tsx — 프로필 "Refer" 탭 (PR #114)
// 내 추천 링크 조회/생성 + 공유 + 초대 현황.
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/apiClient';
import { getReferralLink, REFERRAL_COPY, REFERRAL_REWARDS } from '@/lib/referral';
import ShareSheet from './ShareSheet';

const FONT = "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";

export default function ReferTab() {
  const { profile } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/referral/code', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d.code) setCode(d.code);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const link = code ? getReferralLink(code) : '';
  const joined = (profile as any)?.referralCount ?? 0;

  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '28px' }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 8, fontFamily: FONT }}>
        {REFERRAL_COPY.referHeadline}
      </div>
      <div style={{ fontSize: 14, color: '#64748B', fontWeight: 600, lineHeight: 1.6, marginBottom: 20, fontFamily: FONT }}>
        {REFERRAL_COPY.referBody}
      </div>

      {loading ? (
        <div style={{ color: '#94A3B8', fontWeight: 700, fontSize: 14, fontFamily: FONT }}>Loading your invite link…</div>
      ) : code ? (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              style={{ flex: 1, padding: '13px 16px', border: '2px solid #E5E7EB', borderRadius: 12,
                fontSize: 14, fontFamily: FONT, color: '#0F172A', background: '#F8FAFC', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <ShareSheet
              url={link}
              title={REFERRAL_COPY.inviteShareTitle}
              text={REFERRAL_COPY.inviteShareText}
              buttonLabel={REFERRAL_COPY.referCta}
              copiedLabel={REFERRAL_COPY.copied}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14,
              padding: '12px 20px', fontFamily: FONT }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#059669' }}>{joined}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>friends joined</div>
            </div>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14,
              padding: '12px 20px', fontFamily: FONT }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#D97706' }}>{REFERRAL_REWARDS.REFERRER_XP}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309' }}>XP per friend ({REFERRAL_REWARDS.LESSONS_REQUIRED} lessons)</div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: '#DC2626', fontWeight: 700, fontSize: 14, fontFamily: FONT }}>
          Could not load your invite link. Please try again later.
        </div>
      )}
    </div>
  );
}
