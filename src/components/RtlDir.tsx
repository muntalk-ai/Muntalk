'use client';

// PR-I: RTL 학습 언어일 때만 해당 학습 화면에 dir="rtl"을 적용하는 래퍼.
// 전역 뒤집기 금지 — 래핑된 화면(레슨·게임·채팅)의 레이아웃만 뒤집힌다.
// LTR 언어에서는 DOM을 그대로 두어(fragmnet) 레이아웃에 영향을 주지 않는다.
import { isRtlLang } from '@/lib/rtl';

export default function RtlDir({
  lang,
  children,
}: {
  lang?: string | null;
  children: React.ReactNode;
}) {
  if (!isRtlLang(lang)) return <>{children}</>;
  return (
    <div dir="rtl" style={{ minHeight: 'inherit' }}>
      {/* UX-infra #9: RTL에서 방향성 화살표(→)를 뒤집는 유틸리티 클래스 */}
      <style>{`[dir="rtl"] .mt-flip-rtl{display:inline-block;transform:scaleX(-1);}`}</style>
      {children}
    </div>
  );
}
