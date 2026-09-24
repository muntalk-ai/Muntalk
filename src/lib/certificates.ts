// lib/certificates.ts
// CEFR 레벨 수료증 — 레벨의 모든 레슨 완료 시 발급

import { CURRICULUM } from '@/data/curriculum';
import { getUserProfile, updateUserProfile } from './userProfile';

export interface Certificate {
  levelId: string;
  label: string;    // 'A1'
  badge: string;    // '🌱'
  awardedAt: string; // YYYY-MM-DD
  certId: string;
  learnerName: string;
}

/**
 * 레벨의 모든 레슨을 완료했으면 수료증을 발급하고 Certificate를 반환.
 * 이미 발급됐거나 미완료면 null.
 */
export async function checkAndAwardCertificate(uid: string, levelId: string): Promise<Certificate | null> {
  const profile = await getUserProfile(uid);
  if (!profile) return null;

  const done = new Set(profile.completedLessons || []);
  const level = CURRICULUM.find(l => l.id === levelId);
  if (!level) return null;

  const allIds = level.steps.flatMap(s => s.lessons.map(x => x.id));
  if (allIds.length === 0 || !allIds.every(id => done.has(id))) return null;

  const certs = profile.certificates || [];
  if (certs.includes(levelId)) return null;

  const today = new Date().toISOString().slice(0, 10);
  const cert: Certificate = {
    levelId,
    label: level.label,
    badge: level.badge,
    awardedAt: today,
    certId: `MT-${levelId.toUpperCase()}-${uid.slice(0, 6).toUpperCase()}-${today.replace(/-/g, '')}`,
    learnerName: profile.displayName || 'Learner',
  };
  await updateUserProfile(uid, { certificates: [...certs, levelId] });
  return cert;
}

/** 발급된 수료증 목록 (표시용) */
export function getEarnedCertificates(levelIds: string[]): Certificate[] {
  const today = new Date().toISOString().slice(0, 10);
  return levelIds
    .map(id => CURRICULUM.find(l => l.id === id))
    .filter(Boolean)
    .map(l => ({
      levelId: l!.id, label: l!.label, badge: l!.badge,
      awardedAt: today, certId: '', learnerName: '',
    }));
}
