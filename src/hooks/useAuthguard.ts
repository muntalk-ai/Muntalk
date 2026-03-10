'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
```

`D:\muntalk\src\hooks\useAuthGuard.ts` 파일을 만들고 위 코드 붙여넣고 저장 후:
```
