'use client';

// components/ShareSheet.tsx — 공유 버튼 (PR #114)
// Web Share API 우선, 미지원 시 클립보드 복사 폴백.
import { useState } from 'react';

const FONT = "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";

interface ShareSheetProps {
  url: string;
  title: string;
  text: string;
  buttonLabel: string;
  copiedLabel?: string;
  /** 버튼 스타일 variant */
  variant?: 'primary' | 'secondary';
}

export default function ShareSheet({
  url, title, text, buttonLabel, copiedLabel = 'Link copied!',
  variant = 'primary',
}: ShareSheetProps) {
  const [state, setState] = useState<'idle' | 'shared' | 'copied' | 'failed'>('idle');

  const copyLink = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // clipboard API 미지원 폴백
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleShare = async () => {
    // Web Share API 우선 (모바일)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator).share({ title, text, url });
        setState('shared');
        return;
      } catch (e: any) {
        // 사용자가 공유 시트를 닫은 경우는 무시
        if (e?.name === 'AbortError') return;
        // 그 외 오류는 클립보드 폴백으로
      }
    }
    const ok = await copyLink();
    setState(ok ? 'copied' : 'failed');
    if (ok) setTimeout(() => setState('idle'), 2500);
  };

  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={handleShare}
      style={{
        border: isPrimary ? 'none' : '2px solid #E0E7FF',
        borderRadius: 99, cursor: 'pointer',
        padding: '14px 32px', fontSize: 15, fontWeight: 800,
        color: isPrimary ? '#fff' : '#4F46E5',
        background: isPrimary
          ? 'linear-gradient(135deg,#6366F1,#8B5CF6)'
          : '#F8FAFF',
        boxShadow: isPrimary ? '0 6px 24px rgba(99,102,241,0.35)' : 'none',
        fontFamily: FONT,
      }}
    >
      {state === 'copied' ? `✅ ${copiedLabel}`
        : state === 'shared' ? `✅ Shared!`
        : state === 'failed' ? `⚠️ Copy failed — long-press the link`
        : buttonLabel}
    </button>
  );
}
