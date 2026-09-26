// lib/purpose.ts
// 학습 목적(Goal) — B-11 온보딩 목적 선택 + 프롬프트 주입 중앙 관리

export type LearningPurpose = 'business' | 'travel' | 'daily' | 'exam' | 'hobby';

export const PURPOSE_OPTIONS: { id: LearningPurpose; emoji: string; label: string; desc: string }[] = [
  { id: 'business', emoji: '💼', label: 'Business', desc: 'Meetings, emails, presentations' },
  { id: 'travel',   emoji: '🧳', label: 'Travel',   desc: 'Airports, hotels, restaurants' },
  { id: 'daily',    emoji: '☕', label: 'Daily Life', desc: 'Casual everyday conversation' },
  { id: 'exam',     emoji: '🎓', label: 'Exam & Study', desc: 'Grammar, tests, certification' },
  { id: 'hobby',    emoji: '🎨', label: 'Hobby & Culture', desc: 'K-culture, friends, fun' },
];

export const PURPOSE_LABEL: Record<LearningPurpose, string> = {
  business: 'Business',
  travel:   'Travel',
  daily:    'Daily Life',
  exam:     'Exam & Study',
  hobby:    'Hobby & Culture',
};

/** 목적별 AI 튜터 레지스터 규칙 (프롬프트 주입용) */
export const PURPOSE_REGISTER: Record<LearningPurpose, string> = {
  business:
    'Use a professional, formal register. Prioritize workplace vocabulary (meetings, emails, negotiations). Gently correct casual slang toward business-appropriate alternatives.',
  travel:
    'Prioritize survival phrases and a polite casual register (airports, hotels, restaurants, directions). Teach immediately usable chunks first.',
  daily:
    'Use a warm, casual everyday register. Prioritize small talk, hobbies, and daily routines.',
  exam:
    'Be precise and grammar-focused. Explain rules explicitly, use a formal written register, and drill accuracy over fluency.',
  hobby:
    'Use a relaxed, culture-rich tone. Weave in pop culture, media, and conversational slang where natural.',
};

/** 목적이 설정된 경우에만 프롬프트에 붙일 주입 블록. 미설정 시 빈 문자열 (회귀 방지) */
export function purposePromptBlock(purpose?: LearningPurpose | string | null): string {
  if (!purpose || !(purpose in PURPOSE_REGISTER)) return '';
  const p = purpose as LearningPurpose;
  return `Learner's goal: ${PURPOSE_LABEL[p]}. ${PURPOSE_REGISTER[p]}`;
}

/** Placement의 placementTrack(travel/business/study) → LearningPurpose 자동 매핑 */
export function mapTrackToPurpose(track?: string | null): LearningPurpose | undefined {
  if (track === 'travel')   return 'travel';
  if (track === 'business') return 'business';
  if (track === 'study')    return 'exam';
  return undefined; // study 외의 값(및 null)은 추론하지 않음 — 미선택 상태 유지
}

export function isLearningPurpose(v: unknown): v is LearningPurpose {
  return typeof v === 'string' && v in PURPOSE_REGISTER;
}
