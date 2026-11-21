'use client';
// context/AuthContext.tsx
// 앱 전체에서 useAuth() 로 로그인 상태, 유저 프로필에 접근

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  getUserProfile,
  ensureFirstLoginSetup,
  migrateExistingUserGuestData,
  UserProfile,
} from '@/lib/userProfile';
import { claimLocalProgress, releaseLocalProgress, lpGetInt, lpGetJson } from '@/lib/localProgress';
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
      // 계정 분리: 로컬 진도 네임스페이스를 인증 상태보다 먼저 확정한다.
      // claim은 동기라 setUser 전에 공용 키 → uid 키 이어받기가 끝나고,
      // 이후 렌더·이펙트는 올바른 계정의 키만 본다. 로그아웃이면 게스트
      // (공용 키) 기준으로 되돌린다.
      if (u) claimLocalProgress(u.uid);
      else releaseLocalProgress();
      // QA H-12: 헤더 아바타는 user만으로 그려지는데, 예전 코드는 토큰
      // 갱신 await 뒤에 setUser를 둬서 느린 네트워크에서 헤더 프로필
      // 버튼이 한동안 빈 자리로 보였다. getIdToken 실패 시에도 catch로
      // 그냥 진행하던 코드라 순서를 바꿔도 결과는 같고 표시만 빨라진다.
      // 토큰 대기는 프로필 로드 직전에만 유지한다 (Firestore 읽기 전).
      setUser(u);
      setLoading(false); // 초기 상태 확정 후에만 해제 — "Log in" 버튼 깜빡임 방지
      if (u) await u.getIdToken().catch(() => {});
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
            // 계정별 로컬 키 — 전 계정의 기기 값이 이 프로필에 들어가지 않는다.
            const lsXp   = lpGetInt('mt_xp');
            const lsDone = lpGetJson<string[]>('mt_done', []);
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
          // QA L-5/S-5: 표시 이름 수렴 — Auth 이름과 Firestore 이름 중 비어 있지
          // 않은 쪽으로 맞춘다. 위 동기화는 이메일·패치 조건 때만 실행돼서,
          // 프로필 displayName이 ''/'Learner'인 채로 남으면 헤더가 계속
          // 'Learner'를 보여줬다. 이름은 발명하지 않고 양쪽에 이미 있는 값만 쓴다.
          try {
            const authName = (u.displayName || '').trim();
            const profName = (p?.displayName || '').trim();
            // Firestore 이름이 비어 있거나 플레이스홀더('Learner')일 때만 Auth
            // 이름으로 채운다. 둘 다 실제 이름인데 다르면 사용자가 앱 안에서
            // 바꾼 이름일 수 있으므로 건드리지 않는다.
            if (authName && (!profName || profName === 'Learner')) {
              const { updateUserProfile } = await import('@/lib/userProfile');
              await updateUserProfile(u.uid, { displayName: authName });
              p = (await getUserProfile(u.uid)) || p;
            } else if (!authName && profName && profName !== 'Learner') {
              // Auth 이름이 비어 있고 Firestore에 이름이 있으면 Auth 쪽을 채운다
              // (프로필 페이지에서 빈 이름으로 저장해 Auth 이름이 지워진 경우 복구).
              const { updateProfile } = await import('firebase/auth');
              await updateProfile(u, { displayName: profName });
            }
          } catch { /* ignore — 이름 수렴 실패가 로그인을 막지 않는다 */ }
        }
        // ※ 활동(스트릭) 기록은 레슨/세션 완료 시점에만 수행 — 로그인/화면 방문만으로는 기록하지 않음
        // QA S-2 동기화 지점: 기존 유저도 로그인 시 로컬 XP/진도를 서버와
        // 따라잡는다 (게스트 플레이분 + 지급 실패분). 차분 공식이 멱등이라
        // 재실행해도 이중 지급되지 않고, 실패하면 다음 로그인에 다시 시도한다.
        if (p) await migrateExistingUserGuestData(u.uid, p).catch(() => {});
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
