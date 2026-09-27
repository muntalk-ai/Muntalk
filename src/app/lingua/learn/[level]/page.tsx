'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import StepMap from '@/components/StepMap';
import { useAuth } from '@/context/AuthContext';
import { isAdminEmail } from '@/lib/subscription';

export default function LevelPage({ params }: { params: { level: string } }) {
  const { level } = params;
  const searchParams = useSearchParams();
  // URL param 우선, 없으면 localStorage(프로필에서 저장된 학습 언어) 폴백 — lesson 페이지와 동일 패턴.
  // (Back 버튼 등이 ?lang= 없이 들어와도 학습 언어가 en-US로 리셋되지 않도록)
  const [langId, setLangId]   = useState(searchParams.get('lang')    || 'en-US');
  const [subLang, setSubLang] = useState(searchParams.get('subLang') || 'ko-KR');

  const { user, loading: authLoading } = useAuth();

  const [xp, setXp] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [localLoaded, setLocalLoaded] = useState(false);
  const [tutorId, setTutorId] = useState('t01');

  useEffect(() => {
    try {
      const savedXp = parseInt(localStorage.getItem('mt_xp') || '0', 10);
      const savedDone = JSON.parse(localStorage.getItem('mt_done') || '[]') as string[];
      const savedTutor = searchParams.get('tutor') || localStorage.getItem('mt_tutor_id') || 't01';
      setXp(savedXp);
      setCompletedLessons(new Set(savedDone));
      setTutorId(savedTutor);
      if (!searchParams.get('lang')) {
        const lsLang = localStorage.getItem('mt_learn_lang');
        if (lsLang) setLangId(lsLang);
      }
      if (!searchParams.get('subLang')) {
        const lsNative = localStorage.getItem('mt_native_lang');
        if (lsNative) setSubLang(lsNative);
      }
    } catch { /* ignore */ }
    setLocalLoaded(true);
  }, []);

  // auth 로딩 완료 + localStorage 로딩 완료 둘 다 기다림
  if (!localLoaded || authLoading) return null;

  const isAdmin = isAdminEmail(user?.email);

  return (
    <StepMap
      levelId={level}
      langId={langId}
      subLang={subLang}
      xp={xp}
      completedLessons={completedLessons}
      tutorId={tutorId}
      isAdmin={isAdmin}
    />
  );
}
