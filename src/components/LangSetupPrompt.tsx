'use client';
// components/LangSetupPrompt.tsx
// 신규 가입자 언어 설정 확정 팝업 — 자동 노출되는 유일한 언어 프롬프트.
// (LevelHub의 언어 모달은 수동 전용. QA S-5/H-2)
// profile.langsConfirmed === false 일 때만 표시. 기존 유저(필드 없음)는
// DEFAULT_PROFILE 병합으로 true 취급되어 팝업이 뜨지 않는다.
// - "Later"는 localStorage에 타임스탬프로 저장 — 7일간 다시 뜨지 않는다.
// - 셀렉트는 profile/localStorage(mt_learn_lang/mt_native_lang)에 저장된
//   값으로 미리 채운다. 단, 저장 버튼을 눌러야 확정된다.
// - Escape 키 + 오버레이 클릭으로 닫을 수 있다 (닫기 = "Later"와 동일하게 스누즈).

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/userProfile';
import { LEARN_LANGUAGES, UI_LANGUAGES } from '@/data/languages';
import {
  isLangPromptSnoozed,
  snoozeLangPrompt,
  clearLangPromptSnooze,
  markLangChosen,
  hasExplicitLangChoice,
} from '@/lib/langPrompt';
import { lpGet, lpSet } from '@/lib/localProgress';

export default function LangSetupPrompt() {
  const { user, profile, refreshProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nativeLang, setNativeLang] = useState<string | null>(null);
  const [learnLang, setLearnLang] = useState<string | null>(null);
  // 마운트 시점의 스누즈 여부 — localStorage는 렌더 중 읽지 않고 state로 둔다.
  const [snoozed, setSnoozed] = useState(() => isLangPromptSnoozed());
  // 사용자가 셀렉트를 직접 건드렸으면 프리필이 덮어쓰지 않는다.
  const editedRef = useRef(false);

  // 표시 조건: 로그인 + 프로필 로드 + 미확정 + 이번 세션에서 닫지 않음 + 스누즈 아님
  // 2026-11-26 듀오링고식 온보딩: /lingua/starter는 레슨 전에 자체 언어 선택
  // 화면을 띄우므로 여기서는 겹쳐 띄우지 않는다. 이 기기에서 이 계정이 이미
  // 언어를 직접 골랐으면(가입 전 게스트 선택 이관 포함) 같은 질문을 다시 하지 않는다.
  const pathname = usePathname();
  const onStarter = pathname === '/lingua/starter';
  const alreadyChose = !!user && hasExplicitLangChoice(user.uid);
  const visible = !!user && !!profile && profile.langsConfirmed === false && !dismissed && !snoozed && !onStarter && !alreadyChose;

  // 프리필: profile/localStorage에 저장된 값으로 셀렉트를 미리 채운다.
  // profile은 로그인 직후 비동기로 도착하므로 effect에서 채운다.
  useEffect(() => {
    if (editedRef.current) return;
    if (nativeLang === null) {
      let saved: string | null = null;
      try { saved = lpGet('mt_native_lang'); } catch { /* ignore */ }
      const next = saved || profile?.nativeLang || null;
      if (next) setNativeLang(next);
    }
    if (learnLang === null) {
      let saved: string | null = null;
      try { saved = lpGet('mt_learn_lang'); } catch { /* ignore */ }
      const next = saved || profile?.learnLang || null;
      if (next) setLearnLang(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Escape 키로 닫기 (닫기 = "Later"와 동일하게 7일 스누즈)
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleDismiss = () => {
    snoozeLangPrompt();
    setSnoozed(true);
    setDismissed(true);
  };

  if (!visible) return null;

  const curNative = nativeLang ?? '';
  const curLearn = learnLang ?? '';
  const canSave = curNative !== '' && curLearn !== '';

  const handleSave = async () => {
    if (!user || saving || !canSave) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        nativeLang: curNative,
        learnLang: curLearn,
        langsConfirmed: true,
      });
      try {
        lpSet('mt_native_lang', curNative);
        lpSet('mt_learn_lang', curLearn);
      } catch { /* noop */ }
      markLangChosen();
      clearLangPromptSnooze();
      await refreshProfile();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose your languages"
      onClick={handleDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: '28px 26px', width: '100%', maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          fontFamily: "'Nunito','Noto Sans KR',sans-serif",
        }}
      >
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
          onChange={e => { editedRef.current = true; setNativeLang(e.target.value); }}
          style={selectStyle}
        >
          <option value="" disabled>🌐 —</option>
          {UI_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.native}{l.label ? ` (${l.label})` : ''}</option>
          ))}
        </select>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6, marginTop: 16 }}>
          language I want to learn
        </label>
        <select
          value={curLearn}
          onChange={e => { editedRef.current = true; setLearnLang(e.target.value); }}
          style={selectStyle}
        >
          <option value="" disabled>🌐 —</option>
          {LEARN_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.native}{l.label ? ` (${l.label})` : ''}</option>
          ))}
        </select>

        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            width: '100%', marginTop: 22, padding: '14px 0', border: 'none', borderRadius: 12,
            background: !canSave || saving ? '#93C5FD' : '#2563EB', color: '#fff',
            fontSize: 16, fontWeight: 800, cursor: !canSave || saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Saving…' : 'Start learning →'}
        </button>
        <button
          onClick={handleDismiss}
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
