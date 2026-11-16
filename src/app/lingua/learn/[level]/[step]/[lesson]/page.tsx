'use client';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LessonPlayer from '@/components/LessonPlayer';
import CertificateModal from '@/components/CertificateModal';
import TestimonialPrompt from '@/components/TestimonialPrompt';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile, getUserProfile, recordActivity, resolveNativeLang } from '@/lib/userProfile';
import { addCardToSRS } from '@/lib/spacedRepetition';
import { checkAndAwardCertificate, Certificate } from '@/lib/certificates';
import { awardXp } from '@/lib/xpClient';
import { apiFetch } from '@/lib/apiClient';
import { REFERRAL_REWARDS } from '@/lib/referral';
import RtlDir from '@/components/RtlDir';

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
  const [subLang, setSubLang] = useState(searchParams.get('subLang') || 'en-US');

  const [xp, setXp] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [tutorId, setTutorId] = useState<string | undefined>(undefined);
  const [earnedCert, setEarnedCert] = useState<Certificate | null>(null);
  const [showTestimonial, setShowTestimonial] = useState(false);
  // PR-H: 어뷰징 탐지용 레슨 세션 시작 시각
  const lessonStartRef = useRef<number>(Date.now());
  // QA S-6: 서버 XP 지급 실패를 화면에 보여주고 재시도하기 위한 상태.
  // 게스트는 award 대상이 아니라서(awardXp가 {ok:false, reason:'guest'} 반환)
  // 이 배너를 띄우지 않는다 — 로그인 유저의 실패에만 표시한다.
  const [xpAwardError, setXpAwardError] = useState<string | null>(null);
  const [xpAwardRetrying, setXpAwardRetrying] = useState(false);
  // 같은 레슨의 완료 콜백이 두 번(완료 버튼 더블클릭 등) 실행돼 XP가
  // 이중 지급되는 것을 막는다. 마운트당 레슨 1회만 지급한다.
  const completedRef = useRef<string | null>(null);
  const lastXpEarnedRef = useRef(0);

  // QA S-6: awardXp 결과를 확인한다. 서버가 지급을 거절한 경우(401/422/429/500)는
  // 서버에 지급이 기록되지 않은 것이 확실하므로 2초 뒤 1회 자동 재시도한다.
  // 네트워크 오류(reason 'network')는 요청이 서버에 도달했는지 알 수 없어
  // 자동 재시도하지 않고(중복 지급 위험) 사용자가 직접 재시도 버튼을 누르게 한다.
  const awardLessonXp = async (xpEarned: number): Promise<boolean> => {
    const sessionSec = Math.max(1, Math.round((Date.now() - lessonStartRef.current) / 1000));
    const result = await awardXp({ source: 'lesson', xp: xpEarned, sessionSec, meta: { lessonId: lesson } });
    if (result.ok) return true;
    console.warn('[lesson] XP award failed:', result.reason);
    if (result.reason === 'network') return false;
    await new Promise(r => setTimeout(r, 2000));
    const retrySec = Math.max(1, Math.round((Date.now() - lessonStartRef.current) / 1000));
    const retry = await awardXp({ source: 'lesson', xp: xpEarned, sessionSec: retrySec, meta: { lessonId: lesson } });
    if (!retry.ok) console.warn('[lesson] XP award retry failed:', retry.reason);
    return retry.ok;
  };

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
        setSubLang(resolveNativeLang());
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const handleComplete = async (xpEarned: number) => {
    // QA S-6: 같은 레슨 완료가 두 번 실행되면(더블클릭 등) 여기서 차단한다.
    if (completedRef.current === lesson) return;
    completedRef.current = lesson;
    lastXpEarnedRef.current = xpEarned;
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
        try {
          // PR-H: XP는 서버 엔드포인트로 지급 — 클라이언트에서 xp 직접 쓰기 금지.
          // 완료 레슨 목록만 저장 (xp 필드 건드리지 않음).
          await updateUserProfile(user.uid, {
            completedLessons: doneParsed,
          });
          // QA S-6: awardXp 결과를 확인하고, 실패하면 화면에 알린다.
          // 이전에는 결과를 확인하지 않아 서버 거절 시 XP가 조용히 사라졌다.
          const awarded = await awardLessonXp(xpEarned);
          if (!awarded) {
            setXpAwardError(`XP 지급에 실패했어요. +${xpEarned} XP가 서버에 저장되지 않았습니다. 아래 버튼으로 다시 시도해 주세요.`);
          } else {
            setXpAwardError(null);
          }
          console.log('[lesson] Firestore saved — lessons:', doneParsed.length);

          // 추천 리워드 확인 (PR #114) — N개 레슨 완료 시 추천인에게 XP.
          // 서버가 모든 조건(추천인 존재·미지급·레슨 수)을 검증. fire-and-forget.
          if (doneParsed.length >= REFERRAL_REWARDS.LESSONS_REQUIRED) {
            apiFetch('/api/referral/claim', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: '{}',
            }).catch(() => {});
          }
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

  // QA S-6: XP 지급 실패 후 사용자가 직접 다시 시도한다.
  const retryXpAward = async () => {
    if (!user || xpAwardRetrying || !lastXpEarnedRef.current) return;
    setXpAwardRetrying(true);
    try {
      const ok = await awardLessonXp(lastXpEarnedRef.current);
      if (ok) {
        setXpAwardError(null);
        try { await refreshProfile(); } catch { /* ignore */ }
      } else {
        setXpAwardError(`XP 지급에 다시 실패했어요. +${lastXpEarnedRef.current} XP가 아직 서버에 저장되지 않았습니다. 잠시 뒤 다시 시도해 주세요.`);
      }
    } finally {
      setXpAwardRetrying(false);
    }
  };

  if (!loaded) return null;

  return (
    <RtlDir lang={langId}>
      {xpAwardError && (
        <div style={{ background: '#FEF3C7', borderBottom: '1px solid #F59E0B', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: '#92400E' }}>⚠️ {xpAwardError}</span>
          <button
            onClick={retryXpAward}
            disabled={xpAwardRetrying}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#F59E0B', color: '#fff', fontWeight: 700, fontSize: 13, cursor: xpAwardRetrying ? 'not-allowed' : 'pointer' }}
          >
            {xpAwardRetrying ? '다시 시도 중…' : 'XP 다시 지급받기'}
          </button>
        </div>
      )}
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
    </RtlDir>
  );
}
