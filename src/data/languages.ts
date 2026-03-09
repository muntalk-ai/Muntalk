// 지원 언어 목록
export interface LangOption {
  code: string;      // BCP-47 (Google TTS용)
  label: string;     // 표시명
  flag: string;      // 이모지
  native: string;    // 해당 언어로 표기
  stt: boolean;      // Web Speech API STT 지원 여부
  tts: boolean;      // Google TTS 지원 여부
}

// stt: false인 언어는 LessonPlayer에서 텍스트 입력창으로 대체
export const LEARN_LANGUAGES: LangOption[] = [
  // ── 유럽 ───────────────────────────────────────────────────────────
  { code: 'en-US', label: 'English (US)',    flag: '🇺🇸', native: 'English',           stt: true,  tts: true },
  { code: 'en-GB', label: 'English (UK)',    flag: '🇬🇧', native: 'English (UK)',       stt: true,  tts: true },
  { code: 'es-ES', label: 'Spanish',         flag: '🇪🇸', native: 'Español',           stt: true,  tts: true },
  { code: 'es-MX', label: 'Spanish (MX)',    flag: '🇲🇽', native: 'Español (México)',  stt: true,  tts: true },
  { code: 'fr-FR', label: 'French',          flag: '🇫🇷', native: 'Français',          stt: true,  tts: true },
  { code: 'de-DE', label: 'German',          flag: '🇩🇪', native: 'Deutsch',           stt: true,  tts: true },
  { code: 'it-IT', label: 'Italian',         flag: '🇮🇹', native: 'Italiano',          stt: true,  tts: true },
  { code: 'pt-BR', label: 'Portuguese (BR)', flag: '🇧🇷', native: 'Português',         stt: true,  tts: true },
  { code: 'pt-PT', label: 'Portuguese (PT)', flag: '🇵🇹', native: 'Português (PT)',    stt: true,  tts: true },
  { code: 'ru-RU', label: 'Russian',         flag: '🇷🇺', native: 'Русский',           stt: true,  tts: true },
  { code: 'nl-NL', label: 'Dutch',           flag: '🇳🇱', native: 'Nederlands',        stt: true,  tts: true },
  { code: 'pl-PL', label: 'Polish',          flag: '🇵🇱', native: 'Polski',            stt: true,  tts: true },
  { code: 'sv-SE', label: 'Swedish',         flag: '🇸🇪', native: 'Svenska',           stt: true,  tts: true },
  { code: 'da-DK', label: 'Danish',          flag: '🇩🇰', native: 'Dansk',             stt: true,  tts: true },
  { code: 'nb-NO', label: 'Norwegian',       flag: '🇳🇴', native: 'Norsk',             stt: true,  tts: true },
  { code: 'fi-FI', label: 'Finnish',         flag: '🇫🇮', native: 'Suomi',             stt: true,  tts: true },
  { code: 'cs-CZ', label: 'Czech',           flag: '🇨🇿', native: 'Čeština',           stt: true,  tts: true },
  { code: 'sk-SK', label: 'Slovak',          flag: '🇸🇰', native: 'Slovenčina',        stt: false, tts: true },
  { code: 'hu-HU', label: 'Hungarian',       flag: '🇭🇺', native: 'Magyar',            stt: true,  tts: true },
  { code: 'ro-RO', label: 'Romanian',        flag: '🇷🇴', native: 'Română',            stt: true,  tts: true },
  { code: 'el-GR', label: 'Greek',           flag: '🇬🇷', native: 'Ελληνικά',          stt: true,  tts: true },
  { code: 'tr-TR', label: 'Turkish',         flag: '🇹🇷', native: 'Türkçe',            stt: true,  tts: true },
  { code: 'uk-UA', label: 'Ukrainian',       flag: '🇺🇦', native: 'Українська',        stt: true,  tts: true },
  { code: 'bg-BG', label: 'Bulgarian',       flag: '🇧🇬', native: 'Български',          stt: false, tts: true },
  { code: 'hr-HR', label: 'Croatian',        flag: '🇭🇷', native: 'Hrvatski',           stt: false, tts: true },
  { code: 'sl-SI', label: 'Slovenian',       flag: '🇸🇮', native: 'Slovenščina',        stt: false, tts: true },
  { code: 'sr-RS', label: 'Serbian',         flag: '🇷🇸', native: 'Српски',             stt: false, tts: true },
  { code: 'et-EE', label: 'Estonian',        flag: '🇪🇪', native: 'Eesti',              stt: false, tts: true },
  { code: 'lv-LV', label: 'Latvian',         flag: '🇱🇻', native: 'Latviešu',           stt: false, tts: true },
  { code: 'lt-LT', label: 'Lithuanian',      flag: '🇱🇹', native: 'Lietuvių',           stt: false, tts: true },
  { code: 'ca-ES', label: 'Catalan',         flag: '🇪🇸', native: 'Català',             stt: true,  tts: true },

  // ── 아시아 ─────────────────────────────────────────────────────────
  { code: 'ja-JP', label: 'Japanese',        flag: '🇯🇵', native: '日本語',             stt: true,  tts: true },
  { code: 'ko-KR', label: 'Korean',          flag: '🇰🇷', native: '한국어',             stt: true,  tts: true },
  { code: 'zh-CN', label: 'Chinese (CN)',     flag: '🇨🇳', native: '中文 (简体)',        stt: true,  tts: true },
  { code: 'zh-TW', label: 'Chinese (TW)',     flag: '🇹🇼', native: '中文 (繁體)',        stt: true,  tts: true },
  { code: 'hi-IN', label: 'Hindi',           flag: '🇮🇳', native: 'हिन्दी',             stt: true,  tts: true },
  { code: 'bn-IN', label: 'Bengali',         flag: '🇧🇩', native: 'বাংলা',              stt: false, tts: true },
  { code: 'gu-IN', label: 'Gujarati',        flag: '🇮🇳', native: 'ગુજરાતી',            stt: false, tts: true },
  { code: 'kn-IN', label: 'Kannada',         flag: '🇮🇳', native: 'ಕನ್ನಡ',              stt: false, tts: true },
  { code: 'ta-IN', label: 'Tamil',           flag: '🇮🇳', native: 'தமிழ்',              stt: true,  tts: true },
  { code: 'te-IN', label: 'Telugu',          flag: '🇮🇳', native: 'తెలుగు',             stt: false, tts: true },
  { code: 'ml-IN', label: 'Malayalam',       flag: '🇮🇳', native: 'മലയാളം',             stt: false, tts: true },
  { code: 'mr-IN', label: 'Marathi',         flag: '🇮🇳', native: 'मराठी',              stt: false, tts: true },
  { code: 'pa-IN', label: 'Punjabi',         flag: '🇮🇳', native: 'ਪੰਜਾਬੀ',             stt: false, tts: true },
  { code: 'vi-VN', label: 'Vietnamese',      flag: '🇻🇳', native: 'Tiếng Việt',        stt: true,  tts: true },
  { code: 'th-TH', label: 'Thai',            flag: '🇹🇭', native: 'ภาษาไทย',           stt: true,  tts: true },
  { code: 'id-ID', label: 'Indonesian',      flag: '🇮🇩', native: 'Bahasa Indonesia',  stt: true,  tts: true },
  { code: 'ms-MY', label: 'Malay',           flag: '🇲🇾', native: 'Bahasa Melayu',     stt: false, tts: true },
  { code: 'tl-PH', label: 'Filipino',        flag: '🇵🇭', native: 'Filipino',          stt: true,  tts: true },
  { code: 'km-KH', label: 'Khmer',           flag: '🇰🇭', native: 'ភាសាខ្មែរ',          stt: false, tts: true },
  { code: 'lo-LA', label: 'Lao',             flag: '🇱🇦', native: 'ພາສາລາວ',            stt: false, tts: true },
  { code: 'si-LK', label: 'Sinhala',         flag: '🇱🇰', native: 'සිංහල',              stt: false, tts: true },
  { code: 'my-MM', label: 'Burmese',         flag: '🇲🇲', native: 'မြန်မာဘာသာ',         stt: false, tts: false },
  { code: 'yue-HK',label: 'Cantonese',       flag: '🇭🇰', native: '粵語',               stt: false, tts: true },

  // ── 중동 / 아프리카 ────────────────────────────────────────────────
  { code: 'ar-XA', label: 'Arabic',          flag: '🇸🇦', native: 'العربية',            stt: true,  tts: true },
  { code: 'he-IL', label: 'Hebrew',          flag: '🇮🇱', native: 'עברית',              stt: true,  tts: true },
  { code: 'fa-IR', label: 'Persian',         flag: '🇮🇷', native: 'فارسی',              stt: false, tts: true },
  { code: 'ur-IN', label: 'Urdu',            flag: '🇵🇰', native: 'اردو',               stt: false, tts: true },
  { code: 'sw-KE', label: 'Swahili',         flag: '🇰🇪', native: 'Kiswahili',          stt: false, tts: true },
  { code: 'af-ZA', label: 'Afrikaans',       flag: '🇿🇦', native: 'Afrikaans',          stt: false, tts: true },

  // ── 기타 ───────────────────────────────────────────────────────────
  { code: 'az-AZ', label: 'Azerbaijani',     flag: '🇦🇿', native: 'Azərbaycan',         stt: false, tts: true },
  { code: 'ka-GE', label: 'Georgian',        flag: '🇬🇪', native: 'ქართული',             stt: false, tts: true },
];

// 모국어(UI) 선택용 — 주요 언어만
export const UI_LANGUAGES: LangOption[] = [
  { code: 'ko-KR', label: 'Korean',          flag: '🇰🇷', native: '한국어',             stt: true,  tts: true },
  { code: 'en-US', label: 'English',         flag: '🇺🇸', native: 'English',           stt: true,  tts: true },
  { code: 'ja-JP', label: 'Japanese',        flag: '🇯🇵', native: '日本語',             stt: true,  tts: true },
  { code: 'zh-CN', label: 'Chinese (CN)',     flag: '🇨🇳', native: '中文 (简体)',        stt: true,  tts: true },
  { code: 'zh-TW', label: 'Chinese (TW)',     flag: '🇹🇼', native: '中文 (繁體)',        stt: true,  tts: true },
  { code: 'es-ES', label: 'Spanish',         flag: '🇪🇸', native: 'Español',           stt: true,  tts: true },
  { code: 'fr-FR', label: 'French',          flag: '🇫🇷', native: 'Français',          stt: true,  tts: true },
  { code: 'de-DE', label: 'German',          flag: '🇩🇪', native: 'Deutsch',           stt: true,  tts: true },
  { code: 'pt-BR', label: 'Portuguese',      flag: '🇧🇷', native: 'Português',         stt: true,  tts: true },
  { code: 'ru-RU', label: 'Russian',         flag: '🇷🇺', native: 'Русский',           stt: true,  tts: true },
  { code: 'ar-XA', label: 'Arabic',          flag: '🇸🇦', native: 'العربية',            stt: true,  tts: true },
  { code: 'hi-IN', label: 'Hindi',           flag: '🇮🇳', native: 'हिन्दी',             stt: true,  tts: true },
  { code: 'vi-VN', label: 'Vietnamese',      flag: '🇻🇳', native: 'Tiếng Việt',        stt: true,  tts: true },
  { code: 'id-ID', label: 'Indonesian',      flag: '🇮🇩', native: 'Bahasa Indonesia',  stt: true,  tts: true },
  { code: 'tr-TR', label: 'Turkish',         flag: '🇹🇷', native: 'Türkçe',            stt: true,  tts: true },
];

export function getLangLabel(code: string): string {
  return [...LEARN_LANGUAGES, ...UI_LANGUAGES].find(l => l.code === code)?.label ?? code;
}

export function hasStt(code: string): boolean {
  return LEARN_LANGUAGES.find(l => l.code === code)?.stt ?? false;
}

export function hasTts(code: string): boolean {
  return LEARN_LANGUAGES.find(l => l.code === code)?.tts ?? false;
}
