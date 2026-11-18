'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StepMap from '@/components/StepMap';
import { useAuth } from '@/context/AuthContext';
import { isAdminEmail } from '@/lib/subscription';
import { resolveNativeLang, resolveLearnLang } from '@/lib/userProfile';

export default function LevelPage({ params }: { params: { level: string } }) {
  const { level } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  // QA L-10: Pre-A1(Starter)은 별도 경로(/lingua/starter)에 산다 — CURRICULUM에
  // 'pre-a1'이 없어 StepMap이 'Level not found'를 뱉었다. Starter로 보낸다.
  useEffect(() => {
    if (level === 'pre-a1') router.replace('/lingua/starter');
  }, [level, router]);
  // URL param 우선, 없으면 프로필(Firestore) → localStorage 순 — lesson 페이지와 동일 패턴.
  // (Back 버튼 등이 ?lang= 없이 들어와도 학습 언어가 en-US로 리셋되지 않도록)
  const [langId, setLangId]   = useState(searchParams.get('lang')    || 'en-US');
  const [subLang, setSubLang] = useState(searchParams.get('subLang') || 'en-US');

  const { user, profile, loading: authLoading } = useAuth();

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
        // QA S-5: 프로필 우선 — 새 기기(빈 localStorage)에서도 저장된 학습 언어 유지
        setLangId(resolveLearnLang(profile?.learnLang));
      }
      if (!searchParams.get('subLang')) {
        setSubLang(resolveNativeLang(profile?.nativeLang));
      }
    } catch { /* ignore */ }
    setLocalLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // auth 로딩 완료 + localStorage 로딩 완료 둘 다 기다림
  if (level === 'pre-a1') return null; // Starter로 리다이렉트 중
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
