/**
 * TTS용 텍스트에서 이모지를 제거한다.
 * TTS 엔진이 이모지를 단어로 읽어버리는 문제 방지 (예: 🎉 → "party popper").
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

/**
 * TTS용 텍스트에서 "학습 문장이 아닌 것"을 제거한다.
 * 모든 수업의 모든 TTS 출력에 적용 — 서버(/api/tts)와 기기 TTS(speakWithDeviceTts)
 * 두 경로에서 모두 사용한다.
 *
 * 제거 대상:
 * - 이모지 (stripEmojis와 동일)
 * - 괄호 안 내용 `( ... )` / `（ ... ）`: 미니챗 등의 "모국어 번역"이 괄호 안에
 *   들어가는데, TTS가 목표 언어 음성으로 그대로 읽어버리면 알아들을 수 없는
 *   잡음이 된다. 학습 문장(괄호 밖)만 읽는다.
 * - 장식용 따옴표 « » ‹ › 「 」 『 』: 일부 TTS 엔진이 기호를 소리로 읽음
 *
 * 유지하는 것: ? ! . , — 억양·휴지를 위한 문장부호로, TTS가 단어로 읽지 않는다.
 */
export function cleanTtsText(text: string): string {
  if (!text) return '';
  let out = stripEmojis(text);
  // 괄호 안 내용 제거 (중첩 괄호 대응을 위해 반복 적용)
  for (let i = 0; i < 5; i++) {
    const next = out
      .replace(/\([^()]*\)/g, ' ')
      .replace(/（[^（）]*）/g, ' ');
    if (next === out) break;
    out = next;
  }
  // 장식용 따옴표 제거
  out = out.replace(/[«»‹›「」『』]/g, '');
  // 슬래시로 묶인 단어("ser/estar", "이다/있다", "être/avoir")는 TTS가
  // "?" 억양이나 붙여 읽기로 오발음하므로 쉼표로 바꿔 나눠 읽게 한다
  // (Word Bank Verbs 1번은 전 언어 공통으로 "to be / to have" 쌍).
  // 숫자 분수(1/2)는 건드리지 않는다 — 양쪽이 문자일 때만. URL이 들어간
  // 문장은 그대로 둔다 (https://의 마지막 슬래시가 오인식되는 것 방지).
  if (!out.includes('://')) {
    out = out.replace(/(?<=\p{L})\s*\/\s*(?=\p{L})/gu, ', ');
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}
