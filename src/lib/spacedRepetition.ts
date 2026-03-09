// lib/spacedRepetition.ts
// SM-2 알고리즘 기반 Spaced Repetition System
// 참고: SuperMemo SM-2 algorithm

import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface SRSCard {
  id: string;           // 단어 또는 레슨 ID
  word: string;
  translation: string;
  langId: string;
  // SM-2 파라미터
  easeFactor: number;   // 기본 2.5, 틀릴수록 낮아짐
  interval: number;     // 다음 복습까지 일수
  repetitions: number;  // 연속 정답 횟수
  nextReview: string;   // YYYY-MM-DD
  lastReview: string;
  // 통계
  timesCorrect: number;
  timesWrong: number;
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0-1: 완전 틀림, 2: 힌트 후 맞음, 3: 어렵게 맞음, 4: 정상, 5: 완벽

/**
 * SM-2 알고리즘으로 다음 복습 일정 계산
 */
export function calculateNextReview(card: SRSCard, quality: ReviewQuality): SRSCard {
  let { easeFactor, interval, repetitions } = card;

  if (quality >= 3) {
    // 정답
    if (repetitions === 0)      interval = 1;
    else if (repetitions === 1) interval = 6;
    else                        interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    // 오답 — 처음부터 다시
    repetitions = 0;
    interval = 1;
  }

  // EaseFactor 업데이트 (1.3 이하로 내려가지 않음)
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  const nextReview = nextDate.toISOString().slice(0, 10);
  const lastReview = new Date().toISOString().slice(0, 10);

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReview,
    timesCorrect: quality >= 3 ? card.timesCorrect + 1 : card.timesCorrect,
    timesWrong:   quality <  3 ? card.timesWrong  + 1 : card.timesWrong,
  };
}

/** 새 카드 초기값 */
export function createCard(id: string, word: string, translation: string, langId: string): SRSCard {
  return {
    id, word, translation, langId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString().slice(0, 10),
    lastReview: '',
    timesCorrect: 0,
    timesWrong: 0,
  };
}

/** Firestore에서 오늘 복습할 카드 가져오기 */
export async function getDueCards(uid: string, langId?: string): Promise<SRSCard[]> {
  const today = new Date().toISOString().slice(0, 10);
  const ref = collection(db, 'users', uid, 'srs_cards');
  const snap = await getDocs(ref);
  return snap.docs
    .map(d => d.data() as SRSCard)
    .filter(c => c.nextReview <= today && (!langId || c.langId === langId))
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview));
}

/** 카드 복습 결과 저장 */
export async function reviewCard(uid: string, card: SRSCard, quality: ReviewQuality): Promise<SRSCard> {
  const updated = calculateNextReview(card, quality);
  const ref = doc(db, 'users', uid, 'srs_cards', card.id);
  await setDoc(ref, updated);
  return updated;
}

/** 새 단어를 SRS에 추가 */
export async function addCardToSRS(uid: string, word: string, translation: string, langId: string): Promise<void> {
  const id = `${langId}_${word.toLowerCase().replace(/\s+/g, '_')}`;
  const ref = doc(db, 'users', uid, 'srs_cards', id);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, createCard(id, word, translation, langId));
  }
}

/** 오늘 복습할 카드 수 */
export async function getDueCount(uid: string): Promise<number> {
  const cards = await getDueCards(uid);
  return cards.length;
}

/** SRS 전체 통계 */
export async function getSRSStats(uid: string) {
  const ref = collection(db, 'users', uid, 'srs_cards');
  const snap = await getDocs(ref);
  const cards = snap.docs.map(d => d.data() as SRSCard);
  const today = new Date().toISOString().slice(0, 10);
  return {
    total:    cards.length,
    due:      cards.filter(c => c.nextReview <= today).length,
    mastered: cards.filter(c => c.repetitions >= 5).length,
    learning: cards.filter(c => c.repetitions > 0 && c.repetitions < 5).length,
    new:      cards.filter(c => c.repetitions === 0).length,
  };
}
