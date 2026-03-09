'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import StepMap from '@/components/StepMap';

export default function LevelPage({ params }: { params: { level: string } }) {
  const { level } = params;
  const searchParams = useSearchParams();
  const langId  = searchParams.get('lang')    || 'en-US';
  const subLang = searchParams.get('subLang') || 'ko-KR';

  const [xp, setXp] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [tutorId, setTutorId] = useState('t01');

  useEffect(() => {
    try {
      const savedXp = parseInt(localStorage.getItem('mt_xp') || '0', 10);
      const savedDone = JSON.parse(localStorage.getItem('mt_done') || '[]') as string[];
      const savedTutor = searchParams.get('tutor') || localStorage.getItem('mt_tutor_id') || 't01';
      setXp(savedXp);
      setCompletedLessons(new Set(savedDone));
      setTutorId(savedTutor);
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <StepMap
      levelId={level}
      langId={langId}
      subLang={subLang}
      xp={xp}
      completedLessons={completedLessons}
      tutorId={tutorId}
    />
  );
}
