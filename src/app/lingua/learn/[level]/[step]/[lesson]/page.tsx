'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LessonPlayer from '@/components/LessonPlayer';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/userProfile';
import { addWeeklyXp, ensureLeague } from '@/lib/league';
import { addCardToSRS } from '@/lib/spacedRepetition';

// 비로그인 허용 레슨 (A1 첫 레슨만)
const GUEST_ALLOWED_LESSON = 'a1-1-1';

export default function LessonPage({
  params,
}: {
  params: { level: string; step: string; lesson: string };
}) {
  const { level, step, lesson } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, refreshProfile } = useAuth();

  const langId  = searchParams.get('lang')    || 'en-US';
  const subLang = searchParams.get('subLang') || 'ko-KR';

  const [xp, setXp] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [tutorId, setTutorId] = useState<string | undefined>(undefined);

  // 비로그인 게스트 접근 제한 — a1-1-1 외 모든 레슨 차단
  useEffect(() => {
    if (authLoading) return;
    if (!user && lesson !== GUEST_ALLOWED_LESSON) {
      router.replace('/login');
    }
  }, [user, authLoading, lesson]);

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

      // Firestore 저장 (로그인 시)
      if (user) {
        const displayName = user.displayName || 'Learner';
        const photoURL    = user.photoURL || '';

        try {
          // XP & 완료 레슨 저장 (setDoc merge 방식 — 필드 없어도 안전)
          await updateUserProfile(user.uid, {
            xp: next,
            completedLessons: doneParsed,
          });
          console.log('[lesson] Firestore saved — xp:', next, 'lessons:', doneParsed.length);
        } catch (e) {
          console.error('[lesson] Firestore save FAILED:', e);
        }

        // 리그 XP (실패해도 레슨에 영향 없음)
        try {
          await ensureLeague(user.uid, displayName, photoURL);
          await addWeeklyXp(user.uid, xpEarned);
        } catch (e) {
          console.warn('[lesson] league update failed:', e);
        }

        // 프로필 갱신
        try { await refreshProfile(); } catch { /* ignore */ }
      }
    } catch (e) {
      console.error('[lesson] handleComplete error:', e);
    }
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
