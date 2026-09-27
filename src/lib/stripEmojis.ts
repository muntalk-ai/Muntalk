/**
 * TTS용 텍스트에서 이모지를 제거한다.
 * TTS 엔진이 이모지를 단어로 읽어버리는 문제 방지 (예: 🎉 → "party popper").
 * 모든 수업의 모든 TTS 출력에 적용 — 서버(/api/tts)와 기기 TTS(speakWithDeviceTts)
 * 두 경로에서 모두 사용한다.
 *
 * - \p{Extended_Pictographic}: 이모지 본체 (얼굴, 사물, 국기, 키캡 숫자 제외한 기호 등)
 * - \uFE0F (variation selector-16), \u200D (ZWJ), \u20E3 (keycap 결합문자): 잔여 조각 제거
 * - "1️⃣" 같은 키캡 숫자는 숫자만 남기고 기호만 제거
 */
export function stripEmojis(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\uFE0F\u200D\u20E3]|\p{Extended_Pictographic}/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
