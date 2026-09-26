// RTL (right-to-left) language detection — PR-I
// 아랍어/히브리어/페르시아어/우르두어 등 RTL 스크립트 학습 시
// 학습 화면(레슨·게임·채팅)에만 dir="rtl"을 적용하기 위한 판정 유틸.

const RTL_PREFIXES = ['ar', 'he', 'fa', 'ur', 'ps', 'yi', 'dv'];

export function isRtlLang(code?: string | null): boolean {
  if (!code) return false;
  const prefix = code.split('-')[0].toLowerCase();
  return RTL_PREFIXES.includes(prefix);
}
