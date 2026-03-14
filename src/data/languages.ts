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
  // -- 유럽 -----------------------------------------------------------
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

  // -- 아시아 ---------------------------------------------------------
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

  // -- 중동 / 아프리카 ------------------------------------------------
  { code: 'ar-XA', label: 'Arabic',          flag: '🇸🇦', native: 'العربية',            stt: true,  tts: true },
  { code: 'he-IL', label: 'Hebrew',          flag: '🇮🇱', native: 'עברית',              stt: true,  tts: true },
  { code: 'fa-IR', label: 'Persian',         flag: '🇮🇷', native: 'فارسی',              stt: false, tts: true },
  { code: 'ur-IN', label: 'Urdu',            flag: '🇵🇰', native: 'اردو',               stt: false, tts: true },
  { code: 'sw-KE', label: 'Swahili',         flag: '🇰🇪', native: 'Kiswahili',          stt: false, tts: true },
  { code: 'af-ZA', label: 'Afrikaans',       flag: '🇿🇦', native: 'Afrikaans',          stt: false, tts: true },

  // -- 기타 -----------------------------------------------------------
  { code: 'az-AZ', label: 'Azerbaijani',     flag: '🇦🇿', native: 'Azərbaycan',         stt: false, tts: true },
  { code: 'ka-GE', label: 'Georgian',        flag: '🇬🇪', native: 'ქართული',             stt: false, tts: true },
];

// 모국어(UI) 선택용 — 인기순 100개 (Google Translate 지원)
export const UI_LANGUAGES: LangOption[] = [
  // 1-10: 세계 최다 사용 언어
  { code: 'en-US', label: 'English (US)',           flag: '🇺🇸', native: 'English',              stt: true,  tts: true },
  { code: 'zh-CN', label: 'Chinese (Simplified)',   flag: '🇨🇳', native: '中文 (简体)',           stt: true,  tts: true },
  { code: 'zh-TW', label: 'Chinese (Traditional)',  flag: '🇹🇼', native: '中文 (繁體)',           stt: true,  tts: true },
  { code: 'hi-IN', label: 'Hindi',                  flag: '🇮🇳', native: 'हिन्दी',               stt: true,  tts: true },
  { code: 'es-ES', label: 'Spanish',                flag: '🇪🇸', native: 'Español',              stt: true,  tts: true },
  { code: 'es-MX', label: 'Spanish (Mexico)',       flag: '🇲🇽', native: 'Español (México)',     stt: true,  tts: true },
  { code: 'ar-XA', label: 'Arabic',                 flag: '🇸🇦', native: 'العربية',              stt: true,  tts: true },
  { code: 'fr-FR', label: 'French',                 flag: '🇫🇷', native: 'Français',             stt: true,  tts: true },
  { code: 'ru-RU', label: 'Russian',                flag: '🇷🇺', native: 'Русский',              stt: true,  tts: true },
  { code: 'pt-BR', label: 'Portuguese (Brazil)',    flag: '🇧🇷', native: 'Português (Brasil)',   stt: true,  tts: true },
  // 11-20
  { code: 'pt-PT', label: 'Portuguese (Portugal)',  flag: '🇵🇹', native: 'Português (Portugal)', stt: true,  tts: true },
  { code: 'de-DE', label: 'German',                 flag: '🇩🇪', native: 'Deutsch',              stt: true,  tts: true },
  { code: 'ja-JP', label: 'Japanese',               flag: '🇯🇵', native: '日本語',               stt: true,  tts: true },
  { code: 'ko-KR', label: 'Korean',                 flag: '🇰🇷', native: '한국어',               stt: true,  tts: true },
  { code: 'vi-VN', label: 'Vietnamese',             flag: '🇻🇳', native: 'Tiếng Việt',          stt: true,  tts: true },
  { code: 'tr-TR', label: 'Turkish',                flag: '🇹🇷', native: 'Türkçe',              stt: true,  tts: true },
  { code: 'it-IT', label: 'Italian',                flag: '🇮🇹', native: 'Italiano',             stt: true,  tts: true },
  { code: 'th-TH', label: 'Thai',                   flag: '🇹🇭', native: 'ภาษาไทย',             stt: true,  tts: true },
  { code: 'id-ID', label: 'Indonesian',             flag: '🇮🇩', native: 'Bahasa Indonesia',    stt: true,  tts: true },
  { code: 'pl-PL', label: 'Polish',                 flag: '🇵🇱', native: 'Polski',               stt: true,  tts: true },
  // 21-30
  { code: 'nl-NL', label: 'Dutch',                  flag: '🇳🇱', native: 'Nederlands',           stt: true,  tts: true },
  { code: 'uk-UA', label: 'Ukrainian',              flag: '🇺🇦', native: 'Українська',           stt: true,  tts: true },
  { code: 'ms-MY', label: 'Malay',                  flag: '🇲🇾', native: 'Bahasa Melayu',       stt: false, tts: true },
  { code: 'tl-PH', label: 'Filipino',               flag: '🇵🇭', native: 'Filipino',             stt: true,  tts: true },
  { code: 'bn-IN', label: 'Bengali',                flag: '🇧🇩', native: 'বাংলা',               stt: true,  tts: true },
  { code: 'fa-IR', label: 'Persian',                flag: '🇮🇷', native: 'فارسی',               stt: false, tts: true },
  { code: 'ur-IN', label: 'Urdu',                   flag: '🇵🇰', native: 'اردو',                stt: false, tts: true },
  { code: 'ro-RO', label: 'Romanian',               flag: '🇷🇴', native: 'Română',              stt: true,  tts: true },
  { code: 'sv-SE', label: 'Swedish',                flag: '🇸🇪', native: 'Svenska',              stt: true,  tts: true },
  { code: 'el-GR', label: 'Greek',                  flag: '🇬🇷', native: 'Ελληνικά',             stt: true,  tts: true },
  // 31-40
  { code: 'cs-CZ', label: 'Czech',                  flag: '🇨🇿', native: 'Čeština',              stt: true,  tts: true },
  { code: 'hu-HU', label: 'Hungarian',              flag: '🇭🇺', native: 'Magyar',               stt: true,  tts: true },
  { code: 'he-IL', label: 'Hebrew',                 flag: '🇮🇱', native: 'עברית',               stt: true,  tts: true },
  { code: 'ta-IN', label: 'Tamil',                  flag: '🇮🇳', native: 'தமிழ்',               stt: true,  tts: true },
  { code: 'te-IN', label: 'Telugu',                 flag: '🇮🇳', native: 'తెలుగు',              stt: false, tts: true },
  { code: 'ml-IN', label: 'Malayalam',              flag: '🇮🇳', native: 'മലയാളം',              stt: false, tts: true },
  { code: 'mr-IN', label: 'Marathi',                flag: '🇮🇳', native: 'मराठी',               stt: false, tts: true },
  { code: 'pa-IN', label: 'Punjabi',                flag: '🇮🇳', native: 'ਪੰਜਾਬੀ',              stt: false, tts: true },
  { code: 'sw-KE', label: 'Swahili',                flag: '🇰🇪', native: 'Kiswahili',            stt: true,  tts: true },
  { code: 'da-DK', label: 'Danish',                 flag: '🇩🇰', native: 'Dansk',                stt: true,  tts: true },
  // 41-50
  { code: 'fi-FI', label: 'Finnish',                flag: '🇫🇮', native: 'Suomi',                stt: true,  tts: true },
  { code: 'nb-NO', label: 'Norwegian',              flag: '🇳🇴', native: 'Norsk',                stt: true,  tts: true },
  { code: 'yue-HK',label: 'Cantonese',              flag: '🇭🇰', native: '粵語',                 stt: false, tts: true },
  { code: 'bg-BG', label: 'Bulgarian',              flag: '🇧🇬', native: 'Български',            stt: false, tts: true },
  { code: 'hr-HR', label: 'Croatian',               flag: '🇭🇷', native: 'Hrvatski',             stt: false, tts: true },
  { code: 'sk-SK', label: 'Slovak',                 flag: '🇸🇰', native: 'Slovenčina',           stt: true,  tts: true },
  { code: 'af-ZA', label: 'Afrikaans',              flag: '🇿🇦', native: 'Afrikaans',            stt: true,  tts: true },
  { code: 'ka-GE', label: 'Georgian',               flag: '🇬🇪', native: 'ქართული',              stt: false, tts: true },
  { code: 'az-AZ', label: 'Azerbaijani',            flag: '🇦🇿', native: 'Azərbaycan',           stt: false, tts: true },
  { code: 'km-KH', label: 'Khmer',                  flag: '🇰🇭', native: 'ភាសាខ្មែរ',             stt: false, tts: true },
  // 51-60
  { code: 'kn-IN', label: 'Kannada',                flag: '🇮🇳', native: 'ಕನ್ನಡ',               stt: false, tts: true },
  { code: 'gu-IN', label: 'Gujarati',               flag: '🇮🇳', native: 'ગુજરાતી',              stt: false, tts: true },
  { code: 'my-MM', label: 'Burmese',                flag: '🇲🇲', native: 'မြန်မာဘာသာ',           stt: false, tts: true },
  { code: 'si-LK', label: 'Sinhala',                flag: '🇱🇰', native: 'සිංහල',               stt: false, tts: true },
  { code: 'ne-NP', label: 'Nepali',                 flag: '🇳🇵', native: 'नेपाली',               stt: false, tts: true },
  { code: 'lt-LT', label: 'Lithuanian',             flag: '🇱🇹', native: 'Lietuvių',             stt: false, tts: true },
  { code: 'lv-LV', label: 'Latvian',                flag: '🇱🇻', native: 'Latviešu',             stt: false, tts: true },
  { code: 'et-EE', label: 'Estonian',               flag: '🇪🇪', native: 'Eesti',                stt: false, tts: true },
  { code: 'sr-RS', label: 'Serbian',                flag: '🇷🇸', native: 'Српски',               stt: false, tts: true },
  { code: 'sl-SI', label: 'Slovenian',              flag: '🇸🇮', native: 'Slovenščina',          stt: false, tts: true },
  // 61-70
  { code: 'lo-LA', label: 'Lao',                    flag: '🇱🇦', native: 'ພາສາລາວ',              stt: false, tts: true },
  { code: 'hy-AM', label: 'Armenian',               flag: '🇦🇲', native: 'Հայերեն',              stt: false, tts: true },
  { code: 'mn-MN', label: 'Mongolian',              flag: '🇲🇳', native: 'Монгол',               stt: false, tts: true },
  { code: 'mk-MK', label: 'Macedonian',             flag: '🇲🇰', native: 'Македонски',           stt: false, tts: true },
  { code: 'sq-AL', label: 'Albanian',               flag: '🇦🇱', native: 'Shqip',                stt: false, tts: true },
  { code: 'bs-BA', label: 'Bosnian',                flag: '🇧🇦', native: 'Bosanski',             stt: false, tts: true },
  { code: 'ca-ES', label: 'Catalan',                flag: '🇪🇸', native: 'Català',               stt: true,  tts: true },
  { code: 'gl-ES', label: 'Galician',               flag: '🇪🇸', native: 'Galego',               stt: false, tts: true },
  { code: 'eu-ES', label: 'Basque',                 flag: '🇪🇸', native: 'Euskara',              stt: false, tts: true },
  { code: 'cy-GB', label: 'Welsh',                  flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', native: 'Cymraeg',              stt: true,  tts: true },
  // 71-80
  { code: 'mt-MT', label: 'Maltese',                flag: '🇲🇹', native: 'Malti',                stt: false, tts: true },
  { code: 'is-IS', label: 'Icelandic',              flag: '🇮🇸', native: 'Íslenska',             stt: false, tts: true },
  { code: 'ga-IE', label: 'Irish',                  flag: '🇮🇪', native: 'Gaeilge',              stt: false, tts: true },
  { code: 'be-BY', label: 'Belarusian',             flag: '🇧🇾', native: 'Беларуская',           stt: false, tts: true },
  { code: 'kk-KZ', label: 'Kazakh',                 flag: '🇰🇿', native: 'Қазақша',              stt: false, tts: true },
  { code: 'uz-UZ', label: 'Uzbek',                  flag: '🇺🇿', native: 'Oʻzbekcha',            stt: false, tts: true },
  { code: 'ky-KG', label: 'Kyrgyz',                 flag: '🇰🇬', native: 'Кыргызча',             stt: false, tts: true },
  { code: 'tg-TJ', label: 'Tajik',                  flag: '🇹🇯', native: 'Тоҷикӣ',               stt: false, tts: true },
  { code: 'tk-TM', label: 'Turkmen',                flag: '🇹🇲', native: 'Türkmençe',            stt: false, tts: true },
  { code: 'am-ET', label: 'Amharic',                flag: '🇪🇹', native: 'አማርኛ',                stt: false, tts: true },
  // 81-90
  { code: 'zu-ZA', label: 'Zulu',                   flag: '🇿🇦', native: 'isiZulu',              stt: false, tts: true },
  { code: 'yo-NG', label: 'Yoruba',                 flag: '🇳🇬', native: 'Yorùbá',               stt: false, tts: true },
  { code: 'ig-NG', label: 'Igbo',                   flag: '🇳🇬', native: 'Igbo',                 stt: false, tts: true },
  { code: 'ha-NG', label: 'Hausa',                  flag: '🇳🇬', native: 'Hausa',                stt: false, tts: true },
  { code: 'so-SO', label: 'Somali',                 flag: '🇸🇴', native: 'Soomaali',             stt: false, tts: true },
  { code: 'ny-MW', label: 'Chichewa',               flag: '🇲🇼', native: 'Chichewa',             stt: false, tts: true },
  { code: 'mg-MG', label: 'Malagasy',               flag: '🇲🇬', native: 'Malagasy',             stt: false, tts: true },
  { code: 'eo-XX', label: 'Esperanto',              flag: '🌍', native: 'Esperanto',              stt: false, tts: true },
  { code: 'la-XX', label: 'Latin',                  flag: '🏛️', native: 'Latina',                stt: false, tts: true },
  { code: 'ht-HT', label: 'Haitian Creole',         flag: '🇭🇹', native: 'Kreyòl ayisyen',       stt: false, tts: true },
  // 91-100
  { code: 'en-GB', label: 'English (UK)',            flag: '🇬🇧', native: 'English (UK)',         stt: true,  tts: true },
  { code: 'en-AU', label: 'English (AU)',            flag: '🇦🇺', native: 'English (AU)',         stt: true,  tts: true },
  { code: 'en-CA', label: 'English (CA)',            flag: '🇨🇦', native: 'English (CA)',         stt: true,  tts: true },
  { code: 'fr-CA', label: 'French (Canada)',         flag: '🇨🇦', native: 'Français (Canada)',    stt: true,  tts: true },
  { code: 'ps-AF', label: 'Pashto',                 flag: '🇦🇫', native: 'پښتو',                stt: false, tts: true },
  { code: 'ku-TR', label: 'Kurdish',                flag: '🏳️', native: 'Kurdî',                 stt: false, tts: true },
  { code: 'xh-ZA', label: 'Xhosa',                  flag: '🇿🇦', native: 'isiXhosa',             stt: false, tts: true },
  { code: 'st-ZA', label: 'Sesotho',                flag: '🇿🇦', native: 'Sesotho',              stt: false, tts: true },
  { code: 'su-ID', label: 'Sundanese',              flag: '🇮🇩', native: 'Basa Sunda',           stt: false, tts: true },
  { code: 'jv-ID', label: 'Javanese',               flag: '🇮🇩', native: 'Basa Jawa',            stt: false, tts: true },
]

export function getLangLabel(code: string): string {
  return [...LEARN_LANGUAGES, ...UI_LANGUAGES].find(l => l.code === code)?.label ?? code;
}

export function hasStt(code: string): boolean {
  return LEARN_LANGUAGES.find(l => l.code === code)?.stt ?? false;
}

export function hasTts(code: string): boolean {
  return LEARN_LANGUAGES.find(l => l.code === code)?.tts ?? false;
}
