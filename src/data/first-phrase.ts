// src/data/first-phrase.ts — "30초 첫 문장 말하기" 와우 체험용 하드코딩 문장
// Gemini 호출 없이 비용 0으로 동작. 10개 인기 언어 × 첫 문장.

export type FirstPhrase = {
  /** TTS용 앱 언어 코드 (/api/tts VOICE_MAP 기준) */
  code: string;
  /** 브라우저 STT용 BCP-47 코드 */
  sttLang: string;
  label: string;
  flag: string;
  /** 목표 언어 문장 */
  phrase: string;
  /** 로마자 발음 가이드 */
  romanized: string;
  /** 영어 뜻 */
  meaning: string;
};

export const FIRST_PHRASES: FirstPhrase[] = [
  { code: 'es-ES', sttLang: 'es-ES', label: 'Spanish',    flag: '🇪🇸', phrase: 'Hola, ¿cómo estás?',      romanized: 'OH-lah, KOH-moh ehs-TAHS',   meaning: 'Hello, how are you?' },
  { code: 'en-US', sttLang: 'en-US', label: 'English',    flag: '🇺🇸', phrase: 'Hello! Nice to meet you.', romanized: 'heh-LOH! nyse tuh meet yoo',  meaning: 'Hello! Nice to meet you.' },
  { code: 'ja-JP', sttLang: 'ja-JP', label: 'Japanese',   flag: '🇯🇵', phrase: 'こんにちは！',                romanized: 'kohn-nee-chee-wah',             meaning: 'Hello!' },
  { code: 'ko-KR', sttLang: 'ko-KR', label: 'Korean',     flag: '🇰🇷', phrase: '안녕하세요!',                romanized: 'ahn-nyoung-hah-seh-yoh',       meaning: 'Hello!' },
  { code: 'fr-FR', sttLang: 'fr-FR', label: 'French',     flag: '🇫🇷', phrase: 'Bonjour, comment ça va ?', romanized: 'bohn-ZHOOR, koh-mahn sah vah', meaning: 'Hello, how are you?' },
  { code: 'de-DE', sttLang: 'de-DE', label: 'German',     flag: '🇩🇪', phrase: "Hallo, wie geht's?",       romanized: 'HAH-loh, vee gayts',            meaning: 'Hello, how are you?' },
  { code: 'zh-CN', sttLang: 'zh-CN', label: 'Chinese',    flag: '🇨🇳', phrase: '你好！',                     romanized: 'nee how',                      meaning: 'Hello!' },
  { code: 'vi-VN', sttLang: 'vi-VN', label: 'Vietnamese', flag: '🇻🇳', phrase: 'Xin chào!',                romanized: 'seen chow',                    meaning: 'Hello!' },
  { code: 'th-TH', sttLang: 'th-TH', label: 'Thai',       flag: '🇹🇭', phrase: 'สวัสดี!',                    romanized: 'sah-wah-dee',                  meaning: 'Hello!' },
  { code: 'ar-XA', sttLang: 'ar-SA', label: 'Arabic',     flag: '🇸🇦', phrase: 'مرحباً!',                    romanized: 'mar-HAH-bahn',                 meaning: 'Hello!' },
];
