// lib/subscription.ts
// 구독 상태, 하트 시스템, 레벨 잠금 로직

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// --- 플랜 정의 -------------------------------------------------------------

// --- 관리자 설정 -----------------------------------------------------------
export const ADMIN_EMAIL = 'muntalkofficial@gmail.com';

/** 관리자 이메일 여부 확인 */
export function isAdminEmail(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}

export type PlanId = 'free' | 'monthly' | 'biannual' | 'annual';

export const PLANS: Record<PlanId, {
  id: PlanId;
  name: string;
  price: number;        // USD
  period: string;
  monthlyPrice: number; // 월 환산
  discount: number;     // % 할인
  badge?: string;
  color: string;
  stripePriceId: string; // .env에서 설정
  features: string[];
}> = {
  free: {
    id: 'free', name: 'Free', price: 0, period: 'forever',
    monthlyPrice: 0, discount: 0, color: '#64748B',
    stripePriceId: '',
    features: [
      'A1 level — all 12 lessons',
      'AI tutor chat — 3 sessions/day',
      'Placement test',
      'Basic streak & XP tracking',
    ],
  },
  monthly: {
    id: 'monthly', name: 'Monthly', price: 9.99, period: 'month',
    monthlyPrice: 9.99, discount: 0, color: '#6366F1',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || '',
    features: [
      'All 6 levels (A1 → C2)',
      'Unlimited AI tutor sessions',
      'Full Word Bank + SRS review',
      'League system',
      'Daily email & push reminders',
      'Telegram bot',
    ],
  },
  biannual: {
    id: 'biannual', name: '6 Months', price: 39.99, period: '6 months',
    monthlyPrice: 6.67, discount: 33, badge: '⭐ Most Popular', color: '#8B5CF6',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BIANNUAL || '',
    features: [
      'Everything in Monthly',
      'Save 33% vs monthly',
      'Priority support',
      'Offline mode (coming soon)',
    ],
  },
  annual: {
    id: 'annual', name: 'Annual', price: 59.99, period: 'year',
    monthlyPrice: 5.00, discount: 50, badge: '🏆 Best Value', color: '#F59E0B',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || '',
    features: [
      'Everything in 6 Months',
      'Save 50% vs monthly',
      'Early access to new features',
      'All future languages included',
    ],
  },
};

// --- 구독 상태 --------------------------------------------------------------
export interface Subscription {
  planId:      PlanId;
  status:      'active' | 'canceled' | 'past_due' | 'trialing';
  stripeCustomerId?:     string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?:     string; // ISO date
  cancelAtPeriodEnd?:    boolean;
}

export async function getSubscription(uid: string): Promise<Subscription> {
  try {
    const snap = await getDoc(doc(db, 'subscriptions', uid));
    if (snap.exists()) return snap.data() as Subscription;
  } catch {}
  return { planId: 'free', status: 'active' };
}

export async function isPremium(uid: string, email?: string | null): Promise<boolean> {
  // 관리자는 항상 프리미엄
  if (isAdminEmail(email)) return true;
  const sub = await getSubscription(uid);
  return sub.planId !== 'free' && sub.status === 'active';
}

// --- 레벨 잠금 --------------------------------------------------------------
// Free: A1만 해금, Premium: 전체 해금
export function isLevelLocked(levelId: string, planId: PlanId, isAdmin = false, placementLevel?: string): boolean {
  // 관리자는 모든 레벨 접근 가능
  if (isAdmin) return false;
  // 프리미엄은 모두 오픈
  if (planId !== 'free') return false;

  // 레벨테스트 배정 결과: 배정 레벨까지는 Free도 접근 허용
  // 예) B1 배정 → A1, A2, B1 접근 가능
  if (placementLevel) {
    const ORDER = ['a1','a2','b1','b2','c1','c2'];
    const placedIdx = ORDER.indexOf(placementLevel.toLowerCase());
    const targetIdx = ORDER.indexOf(levelId.toLowerCase());
    if (placedIdx >= 0 && targetIdx >= 0 && targetIdx <= placedIdx) return false;
  }

  // Free 기본: A1만 허용
  return levelId !== 'a1';
}

export function isLessonLocked(levelId: string, planId: PlanId): boolean {
  return isLevelLocked(levelId, planId);
}

// --- AI 대화 제한 (무료: 하루 3회) -----------------------------------------
export const FREE_DAILY_CHAT_LIMIT = 3;

export interface ChatUsage {
  date:  string; // YYYY-MM-DD
  count: number;
}

export async function getChatUsage(uid: string): Promise<ChatUsage> {
  try {
    const snap = await getDoc(doc(db, 'chat_usage', uid));
    const today = new Date().toISOString().slice(0, 10);
    if (snap.exists()) {
      const data = snap.data() as ChatUsage;
      if (data.date === today) return data;
    }
  } catch {}
  return { date: new Date().toISOString().slice(0, 10), count: 0 };
}

export async function incrementChatUsage(uid: string): Promise<ChatUsage> {
  const today = new Date().toISOString().slice(0, 10);
  const current = await getChatUsage(uid);
  const updated: ChatUsage = {
    date:  today,
    count: current.date === today ? current.count + 1 : 1,
  };
  await setDoc(doc(db, 'chat_usage', uid), updated);
  return updated;
}

export async function canChat(uid: string, planId: PlanId): Promise<boolean> {
  if (planId !== 'free') return true;
  const usage = await getChatUsage(uid);
  const today = new Date().toISOString().slice(0, 10);
  return usage.date !== today || usage.count < FREE_DAILY_CHAT_LIMIT;
}

// --- 하트 시스템 (Free 유저만) -----------------------------------------------
export const MAX_HEARTS = 5;
export const HEART_REFILL_HOURS = 4; // 4시간마다 1개 회복

export interface Hearts {
  count:       number;
  lastLostAt?: string; // ISO timestamp
  nextRefillAt?: string;
}

export async function getHearts(uid: string): Promise<Hearts> {
  try {
    const snap = await getDoc(doc(db, 'hearts', uid));
    if (snap.exists()) {
      const data = snap.data() as Hearts;
      // 자동 회복 계산
      return calculateRefill(data);
    }
  } catch {}
  return { count: MAX_HEARTS };
}

function calculateRefill(hearts: Hearts): Hearts {
  if (hearts.count >= MAX_HEARTS) return { count: MAX_HEARTS };
  if (!hearts.lastLostAt) return hearts;

  const now         = Date.now();
  const lastLost    = new Date(hearts.lastLostAt).getTime();
  const elapsedHrs  = (now - lastLost) / (1000 * 60 * 60);
  const refilled    = Math.floor(elapsedHrs / HEART_REFILL_HOURS);

  if (refilled <= 0) {
    const nextRefillAt = new Date(lastLost + HEART_REFILL_HOURS * 3600000).toISOString();
    return { ...hearts, nextRefillAt };
  }

  const newCount = Math.min(MAX_HEARTS, hearts.count + refilled);
  return { count: newCount };
}

export async function loseHeart(uid: string): Promise<Hearts> {
  const current = await getHearts(uid);
  const updated: Hearts = {
    count:      Math.max(0, current.count - 1),
    lastLostAt: new Date().toISOString(),
    nextRefillAt: new Date(Date.now() + HEART_REFILL_HOURS * 3600000).toISOString(),
  };
  await setDoc(doc(db, 'hearts', uid), updated);
  return updated;
}

export async function refillHearts(uid: string): Promise<Hearts> {
  const full: Hearts = { count: MAX_HEARTS };
  await setDoc(doc(db, 'hearts', uid), full);
  return full;
}

// --- localStorage 기반 하트 (비로그인) --------------------------------------
export function getLocalHearts(): Hearts {
  try {
    const raw = localStorage.getItem('mt_hearts');
    if (raw) return calculateRefill(JSON.parse(raw));
  } catch {}
  return { count: MAX_HEARTS };
}

export function loseLocalHeart(): Hearts {
  const current = getLocalHearts();
  const updated: Hearts = {
    count: Math.max(0, current.count - 1),
    lastLostAt: new Date().toISOString(),
    nextRefillAt: new Date(Date.now() + HEART_REFILL_HOURS * 3600000).toISOString(),
  };
  try { localStorage.setItem('mt_hearts', JSON.stringify(updated)); } catch {}
  return updated;
}
