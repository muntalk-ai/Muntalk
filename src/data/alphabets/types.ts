// Alphabet learning data model — Pre-A1 writing system pages.

export interface AlphabetLetter {
  char: string;           // 문자
  roman: string;          // 로마자 표기
  name: string;           // 문자 이름 (없으면 '')
  example: string;        // 예시 단어
  exampleRoman: string;   // 예시 단어 로마자 표기
  exampleMeaning: string; // 예시 단어 영어 뜻
}

export interface AlphabetGroup {
  title: string;          // e.g. "Consonants (14)"
  letters: AlphabetLetter[];
}

export interface AlphabetSystem {
  id: string;             // 'hangul' | 'hiragana' | ...
  name: string;           // "Hangul"
  nameNative: string;     // "한글"
  languageLabel: string;  // "Korean"
  direction: 'ltr' | 'rtl';
  letterCount: string;    // "24 basic letters"
  overview: string[];     // 3줄 개요
  notes: string[];        // 언어별 변형 노트
  groups: AlphabetGroup[];
  /** 이 문자 체계를 쓰는 학습 언어 코드들 (BCP-47) */
  languages: string[];
}

// 언어 코드 → 문자 체계 ID 매핑
export const LANG_TO_ALPHABET: Record<string, string> = {
  'ko-KR': 'hangul',
  'ja-JP': 'hiragana', // 히라가나 기본, 페이지 내에서 가타카나 탭 제공
  'zh-CN': 'pinyin', 'zh-TW': 'pinyin', 'yue-HK': 'pinyin',
  'ar-XA': 'arabic', 'fa-IR': 'arabic', 'ur-IN': 'arabic', 'ps-AF': 'arabic',
  'hi-IN': 'devanagari', 'mr-IN': 'devanagari', 'ne-NP': 'devanagari',
  'bn-IN': 'bengali',
  'ta-IN': 'tamil',
  'te-IN': 'telugu',
  'kn-IN': 'kannada',
  'ml-IN': 'malayalam',
  'gu-IN': 'gujarati',
  'pa-IN': 'gurmukhi',
  'si-LK': 'sinhala',
  'my-MM': 'myanmar',
  'th-TH': 'thai',
  'lo-LA': 'lao',
  'km-KH': 'khmer',
  'he-IL': 'hebrew',
  'ru-RU': 'cyrillic', 'uk-UA': 'cyrillic', 'be-BY': 'cyrillic', 'bg-BG': 'cyrillic',
  'sr-RS': 'cyrillic', 'mk-MK': 'cyrillic', 'kk-KZ': 'cyrillic', 'ky-KG': 'cyrillic',
  'tg-TJ': 'cyrillic', 'mn-MN': 'cyrillic',
  'el-GR': 'greek',
  'ka-GE': 'georgian',
  'hy-AM': 'armenian',
  'am-ET': 'ethiopic',
};

/** 학습 언어가 비라틴 문자 체계인지 */
export function isNonLatinLang(langCode: string | null | undefined): boolean {
  if (!langCode) return false;
  return langCode in LANG_TO_ALPHABET;
}

/** 문자 렌더링용 폰트 스택 (문자 체계별) */
export const ALPHABET_FONT_STACKS: Record<string, string> = {
  hangul: "'Noto Sans KR','Nunito',sans-serif",
  hiragana: "'Noto Sans JP','Hiragino Sans','Nunito',sans-serif",
  katakana: "'Noto Sans JP','Hiragino Sans','Nunito',sans-serif",
  pinyin: "'Noto Sans SC','Nunito',sans-serif",
  arabic: "'Noto Sans Arabic','Nunito',sans-serif",
  devanagari: "'Noto Sans Devanagari','Nunito',sans-serif",
  bengali: "'Noto Sans Bengali','Nunito',sans-serif",
  tamil: "'Noto Sans Tamil','Nunito',sans-serif",
  telugu: "'Noto Sans Telugu','Nunito',sans-serif",
  kannada: "'Noto Sans Kannada','Nunito',sans-serif",
  malayalam: "'Noto Sans Malayalam','Nunito',sans-serif",
  gujarati: "'Noto Sans Gujarati','Nunito',sans-serif",
  gurmukhi: "'Noto Sans Gurmukhi','Nunito',sans-serif",
  sinhala: "'Noto Sans Sinhala','Nunito',sans-serif",
  myanmar: "'Noto Sans Myanmar','Nunito',sans-serif",
  thai: "'Noto Sans Thai','Nunito',sans-serif",
  lao: "'Noto Sans Lao','Nunito',sans-serif",
  khmer: "'Noto Sans Khmer','Nunito',sans-serif",
  hebrew: "'Noto Sans Hebrew','Nunito',sans-serif",
  cyrillic: "'Nunito',sans-serif",
  greek: "'Nunito',sans-serif",
  georgian: "'Noto Serif Georgian','Nunito',sans-serif",
  armenian: "'Noto Sans Armenian','Nunito',sans-serif",
  ethiopic: "'Noto Sans Ethiopic','Nunito',sans-serif",
};
