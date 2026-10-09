'use client';
// components/LangSetupPrompt.tsx
// 신규 가입자 언어 설정 확정 팝업.
// 가입 시 모국어(브라우저 감지/ko-KR 폴백)·학습 언어(en-US 기본값)가 자동으로
// 채워지므로, 사용자가 직접 선택할 때까지 1회 팝업으로 확정받는다.
// profile.langsConfirmed === false 일 때만 표시. 기존 유저(필드 없음)는
// DEFAULT_PROFILE 병합으로 true 취급되어 팝업이 뜨지 않는다.

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/userProfile';
import { LEARN_LANGUAGES, UI_LANGUAGES } from '@/data/languages';

export default function LangSetupPrompt() {
  const { user, profile, refreshProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nativeLang, setNativeLang] = useState<string | null>(null);
  const [learnLang, setLearnLang] = useState<string | null>(null);

  // 표시 조건: 로그인 + 프로필 로드 + 미확정 + 이번 세션에서 닫지 않음
  if (!user || !profile || profile.langsConfirmed !== false || dismissed) return null;

  const curNative = nativeLang ?? profile.nativeLang ?? 'ko-KR';
  const curLearn = learnLang ?? profile.learnLang ?? 'en-US';

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        nativeLang: curNative,
        learnLang: curLearn,
        langsConfirmed: true,
      });
      try {
        localStorage.setItem('mt_native_lang', curNative);
        localStorage.setItem('mt_learn_lang', curLearn);
      } catch { /* noop */ }
      await refreshProfile();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '28px 26px', width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        fontFamily: "'Nunito','Noto Sans KR',sans-serif",
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
          🌐 Choose your languages
        </div>
        <div style={{ fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 1.5 }}>
          Pick the language you speak and the one you want to learn.
          <br />사용하는 언어와 배우고 싶은 언어를 선택해 주세요.
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
          my native language
        </label>
        <select
          value={curNative}
          onChange={e => setNativeLang(e.target.value)}
          style={selectStyle}
        >
          {UI_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
          ))}
        </select>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6, marginTop: 16 }}>
          language I want to learn
        </label>
        <select
          value={curLearn}
          onChange={e => setLearnLang(e.target.value)}
          style={selectStyle}
        >
          {LEARN_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
          ))}
        </select>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', marginTop: 22, padding: '14px 0', border: 'none', borderRadius: 12,
            background: saving ? '#93C5FD' : '#2563EB', color: '#fff',
            fontSize: 16, fontWeight: 800, cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Saving…' : 'Start learning →'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            width: '100%', marginTop: 8, padding: '10px 0', border: 'none', background: 'none',
            color: '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Later · 나중에
        </button>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '13px 16px', border: '2px solid #E5E7EB', borderRadius: 12,
  fontSize: 15, outline: 'none', background: '#fff', color: '#0F172A', cursor: 'pointer',
  fontFamily: "'Nunito','Noto Sans KR',sans-serif",
};
