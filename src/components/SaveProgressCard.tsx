'use client';
// SaveProgressCard — 게스트 첫 활동 완료 후 "가입하고 진도를 저장" 카드 (2026-11-26).
// Starter 완료 화면과 Micro-Talk 리포트에서 같은 카드를 쓴다.
// [Create account] / [Later]는 같은 크기·같은 무게. 흰 카드라 밝은 화면·어두운
// 화면 둘 다에서 보인다.
// 로컬 기록 (PR A 퍼널용, uid-free — 가입 시 프로필에 붙는다):
//   mt_signup_prompt_shown_at / mt_signup_prompt_accepted_at (첫 1회만 기록)

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const FONT = "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";

function setOnce(key: string) {
  try {
    if (!localStorage.getItem(key)) localStorage.setItem(key, new Date().toISOString());
  } catch { /* ignore */ }
}

export default function SaveProgressCard() {
  const router = useRouter();

  useEffect(() => { setOnce('mt_signup_prompt_shown_at'); }, []);

  return (
    <div style={{ background: '#fff', border: '2px solid #6366F140', borderRadius: 18, padding: 20, marginBottom: 16, maxWidth: 360, width: '100%', boxSizing: 'border-box', textAlign: 'center', fontFamily: FONT }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>
        Save your progress
      </div>
      <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>
        Create a free account to keep your XP and streak.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => { setOnce('mt_signup_prompt_accepted_at'); router.push('/signup?next=/lingua'); }}
          style={{ flex: 1, padding: '12px 8px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: FONT }}>
          Create account
        </button>
        <button
          onClick={() => router.push('/lingua')}
          style={{ flex: 1, padding: '12px 8px', borderRadius: 14, border: '2px solid #6366F1', background: '#fff', color: '#6366F1', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: FONT }}>
          Later
        </button>
      </div>
    </div>
  );
}
