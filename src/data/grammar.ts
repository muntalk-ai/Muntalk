// ── Grammar Data — A1 to C2 ──────────────────────────────────────────────────
// MunTalk Grammar Hub — complete chapter data for all CEFR levels

export type GrammarLevel = 'a1'|'a2'|'b1'|'b2'|'c1'|'c2';

export interface StructureRow {
  cells: string[];
  highlight?: boolean; // highlight this row
}

export interface StructureTable {
  headers: string[];
  rows: StructureRow[];
}

export interface UseCase {
  color: string; // hex
  label: string;
  example: string;
  translation: string; // reserved (empty for generated chapters)
}

export interface Mistake {
  wrong: string;
  right: string;
  note: string;
}

export interface Example {
  en: string;
  ko: string; // Korean translation (shown only to ko-KR native learners)
  highlight?: string; // the grammar point to highlight in the sentence
}

export interface QuizItem {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface GrammarChapter {
  id: string;
  level: GrammarLevel;
  category: string;
  categoryColor: string;
  emoji: string;
  title: string;
  subtitle: string; // English one-liner
  color: string;    // card accent color
  bg: string;       // card background
  keyPoint: string; // one English sentence
  structure: StructureTable;
  useCases: UseCase[];
  examples: Example[];
  mistakes: Mistake[];
  quiz: QuizItem[];
  tip?: string; // pro tip in English
}

export interface GrammarCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

// ── Category definitions ──────────────────────────────────────────────────────

export const GRAMMAR_CATEGORIES: GrammarCategory[] = [
  { id:'tenses',    label:'Tenses',     emoji:'⏰', color:'#2563EB' },
  { id:'verbs',     label:'Verbs',     emoji:'⚡', color:'#059669' },
  { id:'nouns',     label:'Nouns & Articles', emoji:'📦', color:'#D97706' },
  { id:'questions', label:'Questions',   emoji:'❓', color:'#7C3AED' },
  { id:'modals',    label:'Modal Verbs',   emoji:'🎛️', color:'#0891B2' },
  { id:'conditionals', label:'Conditionals', emoji:'🔀', color:'#DC2626' },
  { id:'passive',   label:'Passive Voice',   emoji:'🔄', color:'#BE185D' },
  { id:'clauses',   label:'Clauses',    emoji:'🔗', color:'#065F46' },
  { id:'advanced',  label:'Advanced', emoji:'🎓', color:'#1D4ED8' },
];

// ── Helper functions ──────────────────────────────────────────────────────────

// Chapters are loaded per learning language from /api/grammar/chapters
// (Firestore grammar_cache → public/grammar/{base}.json).
export const getChaptersByLevel = (chapters: GrammarChapter[], level: GrammarLevel) =>
  chapters.filter(c => c.level === level);

export const getChapterById = (chapters: GrammarChapter[], id: string) =>
  chapters.find(c => c.id === id);

export const getLevelInfo = (level: GrammarLevel) => {
  const map: Record<GrammarLevel, { label: string; desc: string; color: string; bg: string; xpRange: string }> = {
    a1: { label:'A1', desc:'Beginner', color:'#059669', bg:'#ECFDF5', xpRange:'0–800 XP' },
    a2: { label:'A2', desc:'Elementary', color:'#0891B2', bg:'#F0F9FF', xpRange:'800–1,400 XP' },
    b1: { label:'B1', desc:'Intermediate', color:'#6366F1', bg:'#EEF2FF', xpRange:'1,400–2,400 XP' },
    b2: { label:'B2', desc:'Upper-Intermediate', color:'#7C3AED', bg:'#F5F3FF', xpRange:'2,400–4,000 XP' },
    c1: { label:'C1', desc:'Advanced', color:'#1D4ED8', bg:'#EFF6FF', xpRange:'4,000–6,500 XP' },
    c2: { label:'C2', desc:'Mastery', color:'#0F172A', bg:'#F8FAFC', xpRange:'6,500+ XP' },
  };
  return map[level];
};

export const LEVEL_ORDER: GrammarLevel[] = ['a1','a2','b1','b2','c1','c2'];
