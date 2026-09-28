// Word sets data — sourced from result.json
// Structure: { [langId]: { [category]: string[] } }
// Categories: Verbs, Verbs2...Verbs9 | Adjectives...Adjectives8 | Adverbs...Adverbs8 | Phrases

export type PartOfSpeech = 'Verbs' | 'Adjectives' | 'Adverbs' | 'Phrases';

export interface WordSet {
  pos: PartOfSpeech;
  setIndex: number;   // 1-based
  setKey: string;     // e.g. 'Verbs', 'Verbs2', 'Adjectives3'
  label: string;      // e.g. 'Verbs · Set 1'
  words: string[];    // 50 words
}

export interface WordLesson {
  lessonIndex: number;  // 1-5
  words: string[];      // 10 words
}

// POS metadata
export const POS_META: Record<PartOfSpeech, { label: string; icon: string; color: string; accent: string; desc: string }> = {
  Verbs:      { label: 'Verbs',      icon: '⚡', color: '#EFF6FF', accent: '#2563EB', desc: 'Action & state words' },
  Adjectives: { label: 'Adjectives', icon: '🎨', color: '#FFF7ED', accent: '#EA580C', desc: 'Describing words' },
  Adverbs:    { label: 'Adverbs',    icon: '🔥', color: '#F0FDF4', accent: '#16A34A', desc: 'Modifying words' },
  Phrases:    { label: 'Phrases',    icon: '💬', color: '#FDF4FF', accent: '#9333EA', desc: 'Common expressions' },
};

// Build set key from POS + setIndex
export function getSetKey(pos: PartOfSpeech, setIndex: number): string {
  return setIndex === 1 ? pos : `${pos}${setIndex}`;
}

// Get number of sets per POS
export const POS_SET_COUNT: Record<PartOfSpeech, number> = {
  Verbs: 9,
  Adjectives: 8,
  Adverbs: 8,
  Phrases: 9,
};

// Intuitive set titles — derived from content analysis (2026-09-28):
// - Verbs/Adjectives/Adverbs: sets are ordered by frequency/difficulty
//   (Set 1 = most common words → later sets = rarer, more advanced words)
// - Phrases: sets are grouped by situation/domain
//   (survival → shopping/dining/travel → opinions → social → business →
//    idioms → formal letters → proverbs → news & current affairs)
export const SET_TITLES: Record<PartOfSpeech, string[]> = {
  Verbs: [
    'Essential Verbs', 'Everyday Verbs', 'Action Verbs',
    'Formal Verbs', 'Academic Verbs',
    'Advanced Verbs I', 'Advanced Verbs II',
    'Expert Verbs I', 'Expert Verbs II',
  ],
  Adjectives: [
    'Essential Adjectives', 'Everyday Adjectives', 'Formal Adjectives',
    'Advanced Adjectives I', 'Advanced Adjectives II',
    'Expert Adjectives I', 'Expert Adjectives II', 'Master Adjectives',
  ],
  Adverbs: [
    'Essential Adverbs', 'Everyday Adverbs', 'Common Adverbs', 'Formal Adverbs',
    'Advanced Adverbs I', 'Advanced Adverbs II',
    'Expert Adverbs', 'Master Adverbs',
  ],
  Phrases: [
    'First Words', 'Shopping, Dining & Travel', 'Opinions & Feelings',
    'Socializing', 'Business Meetings', 'Everyday Idioms',
    'Formal Letters', 'Proverbs', 'News & Current Affairs',
  ],
};

// Get the intuitive title for a given POS + setIndex (1-based)
export function getSetTitle(pos: PartOfSpeech, setIndex: number): string {
  return SET_TITLES[pos]?.[setIndex - 1] ?? `Set ${setIndex}`;
}

// Get all 50 words for a given lang + POS + setIndex
export function getWords(
  data: Record<string, Record<string, string[]>>,
  langId: string,
  pos: PartOfSpeech,
  setIndex: number
): string[] {
  const langData = data[langId] || data['en-US'];
  const key = getSetKey(pos, setIndex);
  return langData[key] || [];
}

// Split 50 words into 5 lessons of 10
export function getLessonWords(
  data: Record<string, Record<string, string[]>>,
  langId: string,
  pos: PartOfSpeech,
  setIndex: number,
  lessonIndex: number // 1-5
): string[] {
  const words = getWords(data, langId, pos, setIndex);
  const start = (lessonIndex - 1) * 10;
  return words.slice(start, start + 10);
}
