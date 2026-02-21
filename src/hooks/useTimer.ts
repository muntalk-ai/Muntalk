'use client';
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// ✅ 1. 함수 밖 최상단에 관리자 이메일을 정의합니다.
const ADMIN_EMAIL = "muntalkofficial@gmail.com";

export function useTimer() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // ✅ 2. 위에서 정의한 ADMIN_EMAIL을 사용합니다.
      if (user?.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        setTimeLeft(9999);
      } else {
        setTimeLeft(user ? 420 : 180);
      }
    });

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : prev));
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []); // adminEmail 의존성을 제거해도 됩니다 (파일 안의 고정값이니까요)

  return { timeLeft, isAdmin };
}