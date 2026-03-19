'use client';
// context/AuthContext.tsx
// 앱 전체에서 useAuth() 로 로그인 상태, 유저 프로필에 접근

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  getUserProfile, createUserProfile, migrateFromLocalStorage,
  recordActivity, UserProfile,
} from '@/lib/userProfile';

interface AuthCtx {
  user:     User | null;
  profile:  UserProfile | null;
  loading:  boolean;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, profile: null, loading: true, refreshProfile: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    const p = await getUserProfile(user.uid);
    if (p) setProfile(p);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // Firestore auth token이 준비될 때까지 대기 (권한 에러 방지)
      if (u) await u.getIdToken().catch(() => {});
      setUser(u);
      setLoading(false); // ← user 확정 즉시 loading 해제 (UI flicker 방지)
      if (u) {
        // 프로필 로드는 백그라운드에서 비동기 처리
        let p = await getUserProfile(u.uid);
        if (!p) {
          // 첫 로그인 — 프로필 생성 + localStorage 마이그레이션
          p = await createUserProfile(
            u.uid,
            u.email || '',
            u.displayName || 'Learner',
            u.photoURL || '',
          );
          await migrateFromLocalStorage(u.uid);
          // 첫 로그인 → 7일 체험 자동 시작
          await import('@/lib/trialPolicy').then(({ initTrial }) => initTrial(u.uid)).catch(() => {});
          p = (await getUserProfile(u.uid)) || p;
        } else {
          // 기존 유저 — email/displayName/photoURL 항상 최신 Firebase Auth 값으로 동기화
          const needsEmailSync = !p.email || p.email !== (u.email || '');
          const needsPatch     = p.xp === undefined || p.completedLessons === undefined;
          if (needsEmailSync || needsPatch) {
            const lsXp   = parseInt(localStorage.getItem('mt_xp') || '0', 10);
            const lsDone = JSON.parse(localStorage.getItem('mt_done') || '[]') as string[];
            await import('@/lib/userProfile').then(({ updateUserProfile }) =>
              updateUserProfile(u.uid, {
                // 항상 최신 Auth 값으로 덮어씀
                email:       u.email       || p!.email       || '',
                displayName: u.displayName || p!.displayName || 'Learner',
                photoURL:    u.photoURL    || p!.photoURL    || '',
                // xp/lessons 보완
                ...(needsPatch ? {
                  xp:               lsXp  || 0,
                  completedLessons: lsDone.length ? lsDone : (p!.completedLessons || []),
                } : {}),
              })
            );
            p = (await getUserProfile(u.uid)) || p;
            if (needsEmailSync) console.log('[auth] synced email for existing user:', u.email);
          }
        }
        // 오늘 활동 기록
        await recordActivity(u.uid, p);
        p = (await getUserProfile(u.uid)) || p;
        setProfile(p);
      } else {
        setProfile(null);
      }
    });
    return unsub;
  }, []);

  return <Ctx.Provider value={{ user, profile, loading, refreshProfile }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
