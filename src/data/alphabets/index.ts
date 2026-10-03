import type { AlphabetSystem } from './types';
import { ARABIC } from './arabic';
import { ARMENIAN } from './armenian';
import { BENGALI } from './bengali';
import { CYRILLIC } from './cyrillic';
import { DEVANAGARI } from './devanagari';
import { ETHIOPIC } from './ethiopic';
import { GEORGIAN } from './georgian';
import { GREEK } from './greek';
import { GUJARATI } from './gujarati';
import { GURMUKHI } from './gurmukhi';
import { HANGUL } from './hangul';
import { HEBREW } from './hebrew';
import { HIRAGANA } from './hiragana';
import { KANNADA } from './kannada';
import { KATAKANA } from './katakana';
import { KHMER } from './khmer';
import { LAO } from './lao';
import { MALAYALAM } from './malayalam';
import { MYANMAR } from './myanmar';
import { PINYIN } from './pinyin';
import { SINHALA } from './sinhala';
import { TAMIL } from './tamil';
import { TELUGU } from './telugu';
import { THAI } from './thai';

export const ALPHABET_SYSTEMS: Record<string, AlphabetSystem> = {
  'arabic': ARABIC,
  'armenian': ARMENIAN,
  'bengali': BENGALI,
  'cyrillic': CYRILLIC,
  'devanagari': DEVANAGARI,
  'ethiopic': ETHIOPIC,
  'georgian': GEORGIAN,
  'greek': GREEK,
  'gujarati': GUJARATI,
  'gurmukhi': GURMUKHI,
  'hangul': HANGUL,
  'hebrew': HEBREW,
  'hiragana': HIRAGANA,
  'kannada': KANNADA,
  'katakana': KATAKANA,
  'khmer': KHMER,
  'lao': LAO,
  'malayalam': MALAYALAM,
  'myanmar': MYANMAR,
  'pinyin': PINYIN,
  'sinhala': SINHALA,
  'tamil': TAMIL,
  'telugu': TELUGU,
  'thai': THAI,
};

export function getAlphabetSystem(id: string): AlphabetSystem | null {
  return ALPHABET_SYSTEMS[id] || null;
}

/** 자매 문자 체계 (예: 히라가나↔가타카나) */
const SIBLINGS: Record<string, string[]> = {
  'hiragana': ['katakana'],
  'katakana': ['hiragana'],
};

export function getSiblingSystems(id: string): AlphabetSystem[] {
  return (SIBLINGS[id] || []).map(s => ALPHABET_SYSTEMS[s]).filter(Boolean);
}
