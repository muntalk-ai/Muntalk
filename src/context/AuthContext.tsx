'use client';
// context/AuthContext.tsx
// 앱 전체에서 useAuth() 로 로그인 상태, 유저 프로필에 접근

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  getUserProfile,
  ensureFirstLoginSetup,
  UserProfile,
} from '@/lib/userProfile';
import LangSetupPrompt from '@/components/LangSetupPrompt';

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
    // Cold load에서 onAuthStateChanged는 저장된 세션을 복원하기 전
    // null을 먼저 내보내고, 복원된 유저로 한 번 더 호출된다. 예전
    // 코드는 첫 콜백에서 바로 loading을 풀어서 로그인된 유저에게
    // "Log in" 버튼이 번쩍 보였다 사라지는 깜빡임이 생겼다.
    // authStateReady()는 초기 상태가 확정될 때까지 기다리므로,
    // 그 뒤에 구독하면 첫 콜백부터 복원된 유저가 들어 있다.
    const handleAuthChange = async (u: User | null) => {
      // Firestore auth token이 준비될 때까지 대기 (권한 에러 방지)
      if (u) await u.getIdToken().catch(() => {});
      setUser(u);
      setLoading(false); // 초기 상태 확정 후에만 해제 — "Log in" 버튼 깜빡임 방지
      if (u) {
        // 프로필 로드는 백그라운드에서 비동기 처리
        let p = await getUserProfile(u.uid);
        if (!p) {
          // 첫 로그인 — 프로필 생성 + localStorage 마이그레이션 + 7일 체험 자동 시작
          // ensureFirstLoginSetup은 idempotent: 이메일 가입(handleSignup)과 동시 실행돼도
          // 중복 생성·이중 마이그레이션 없이 한 번만 수행됨
          await ensureFirstLoginSetup(u.uid, {
            email: u.email || '',
            displayName: u.displayName || 'Learner',
            photoURL: u.photoURL || '',
          });
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
        // ※ 활동(스트릭) 기록은 레슨/세션 완료 시점에만 수행 — 로그인/화면 방문만으로는 기록하지 않음
        p = (await getUserProfile(u.uid)) || p;
        setProfile(p);
      } else {
        setProfile(null);
      }
    };
    let unsub: (() => void) | undefined;
    let cancelled = false;
    void auth
      .authStateReady()
      .catch(() => {})
      .then(() => {
        if (cancelled) return;
        unsub = onAuthStateChanged(auth, handleAuthChange);
      });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  return (
    <Ctx.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
      {/* 신규 가입자 언어 확정 팝업 — langsConfirmed===false일 때만 표시 */}
      <LangSetupPrompt />
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
