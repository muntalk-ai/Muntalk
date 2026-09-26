'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LessonPlayer from '@/components/LessonPlayer';
import CertificateModal from '@/components/CertificateModal';
import TestimonialPrompt from '@/components/TestimonialPrompt';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile, getUserProfile, recordActivity } from '@/lib/userProfile';
import { recordStudySession } from '@/lib/cashEvent';
import { useActiveStudyTimer } from '@/hooks/useActiveStudyTimer';
import { addWeeklyXp, ensureLeague } from '@/lib/league';
import { addCardToSRS } from '@/lib/spacedRepetition';
import { checkAndAwardCertificate, Certificate } from '@/lib/certificates';

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

  const [langId,  setLangId]  = useState(searchParams.get('lang')    || 'en-US');
  const [subLang, setSubLang] = useState(searchParams.get('subLang') || 'ko-KR');

  const [xp, setXp] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [tutorId, setTutorId] = useState<string | undefined>(undefined);
  const [earnedCert, setEarnedCert] = useState<Certificate | null>(null);
  const [showTestimonial, setShowTestimonial] = useState(false);

  // $100 이벤트: 활성 학습 시간 측정 (레슨 시작~완료)
  const studyTimer = useActiveStudyTimer();

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
      // URL에 lang 없으면 localStorage fallback (게스트 포함)
      if (!searchParams.get('lang')) {
        const lsLang = localStorage.getItem('mt_learn_lang');
        if (lsLang) setLangId(lsLang);
      }
      if (!searchParams.get('subLang')) {
        const lsNative = localStorage.getItem('mt_native_lang');
        if (lsNative) setSubLang(lsNative);
      }
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

      // 게스트용 활동 날짜 기록 — 레슨 완료 시점에만 (UTC 기준, 화면 방문 시에는 기록하지 않음)
      try {
        const todayUtc = new Date().toISOString().slice(0, 10);
        const datesParsed = JSON.parse(localStorage.getItem('mt_activity_dates') || '[]') as string[];
        if (!datesParsed.includes(todayUtc)) {
          datesParsed.push(todayUtc);
          localStorage.setItem('mt_activity_dates', JSON.stringify(datesParsed));
        }
      } catch { /* ignore */ }

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

        // 스트릭 활동 기록 — 레슨 완료 시점에만 (방문만으로 기록되지 않음)
        try {
          const fresh = await getUserProfile(user.uid);
          if (fresh) await recordActivity(user.uid, fresh);
        } catch (e) {
          console.warn('[lesson] recordActivity failed:', e);
        }

        // $100 이벤트: 일일 학습 시간/XP 기록 (활성 시간만)
        try {
          await recordStudySession(user.uid, studyTimer.stop(), xpEarned);
        } catch (e) {
          console.warn('[lesson] recordStudySession failed:', e);
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

        // CEFR 수료증 체크 (레벨 전체 완료 시 발급)
        try {
          const cert = await checkAndAwardCertificate(user.uid, level);
          if (cert) setEarnedCert(cert);
        } catch (e) {
          console.warn('[lesson] certificate check failed:', e);
        }

        // 테스티모니얼 수집 — 10개 레슨 완료 시 1회만 프롬프트
        try {
          if (doneParsed.length >= 10 && !localStorage.getItem('mt_testimonial_asked')) {
            setShowTestimonial(true);
          }
        } catch { /* ignore */ }
      }
    } catch (e) {
      console.error('[lesson] handleComplete error:', e);
    }
  };

  if (!loaded) return null;

  return (
    <>
      <LessonPlayer
        levelId={level}
        stepId={step}
        lessonId={lesson}
        langId={langId}
        tutorId={tutorId}
        subLang={subLang}
        onComplete={handleComplete}
      />
      {earnedCert && (
        <CertificateModal cert={earnedCert} onClose={() => setEarnedCert(null)} />
      )}
      {showTestimonial && user && (
        <TestimonialPrompt
          uid={user.uid}
          displayName={user.displayName || 'Learner'}
          onDone={() => {
            try { localStorage.setItem('mt_testimonial_asked', '1'); } catch { /* ignore */ }
            setShowTestimonial(false);
          }}
        />
      )}
    </>
  );
}
