'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import LessonPlayer from '@/components/LessonPlayer';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/userProfile';
import { addWeeklyXp, ensureLeague } from '@/lib/league';
import { addCardToSRS } from '@/lib/spacedRepetition';

export default function LessonPage({
  params,
}: {
  params: { level: string; step: string; lesson: string };
}) {
  const { level, step, lesson } = params;
  const searchParams = useSearchParams();
  const { user, refreshProfile } = useAuth();

  const langId  = searchParams.get('lang')    || 'en-US';
  const subLang = searchParams.get('subLang') || 'ko-KR';

  const [xp, setXp] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [tutorId, setTutorId] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const saved = parseInt(localStorage.getItem('mt_xp') || '0', 10);
      setXp(saved);
      const urlTutor = searchParams.get('tutor');
      setTutorId(urlTutor || localStorage.getItem('mt_tutor_id') || 't01');
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const handleComplete = async (xpEarned: number) => {
    try {
      // localStorage 업데이트
      const prev = parseInt(localStorage.getItem('mt_xp') || '0', 10);
      const next = prev + xpEarned;
      localStorage.setItem('mt_xp', String(next));
      setXp(next);

      const doneParsed = JSON.parse(localStorage.getItem('mt_done') || '[]') as string[];
      if (!doneParsed.includes(lesson)) {
        doneParsed.push(lesson);
        localStorage.setItem('mt_done', JSON.stringify(doneParsed));
      }

      // Firestore + 리그 + SRS 업데이트 (로그인 시)
      if (user) {
        const displayName = user.displayName || 'Learner';
        const photoURL    = user.photoURL || '';

        await Promise.all([
          // XP & 진도 저장
          updateUserProfile(user.uid, { xp: next, completedLessons: doneParsed }),
          // 주간 리그 XP 추가
          ensureLeague(user.uid, displayName, photoURL)
            .then(() => addWeeklyXp(user.uid, xpEarned)),
        ]);

        // 레슨의 핵심 단어들을 SRS에 자동 추가 (예시 — 실제로는 LessonPlayer에서 단어 목록 받아야 함)
        // 여기서는 레슨 ID 기반으로 나중에 LessonPlayer의 vocabulary 연결
        await refreshProfile();
      }
    } catch { /* ignore */ }
  };

  if (!loaded) return null;

  return (
    <LessonPlayer
      levelId={level}
      stepId={step}
      lessonId={lesson}
      langId={langId}
      tutorId={tutorId}
      subLang={subLang}
      onComplete={handleComplete}
    />
  );
}
