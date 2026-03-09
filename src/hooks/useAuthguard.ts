// hooks/useAuthGuard.ts
// 보호된 페이지 상단에서 호출 → 미로그인 시 /login으로 자동 이동
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * 사용법:
 *   const { user, profile, loading } = useAuthGuard();
 *   if (loading) return <LoadingSpinner />;
 */
export function useAuthGuard(redirectTo = '/login') {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  return { user, profile, loading };
}
