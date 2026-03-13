'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/userProfile';
import { CURRICULUM, getCurrentLevel } from '@/data/curriculum';
import { LEARN_LANGUAGES, UI_LANGUAGES } from '@/data/languages';
import { getSubscription, getHearts, getLocalHearts, isLevelLocked, PlanId, Hearts } from '@/lib/subscription';
import PaywallModal from '@/components/PaywallModal';
import TrialBanner from '@/components/TrialBanner';
import TrialExpiredModal from '@/components/TrialExpiredModal';
import { getTrialData, isTrialExpired, trialDaysRemaining, addTrialLanguage, TRIAL_MAX_LANGUAGES, TrialData } from '@/lib/trialPolicy';

// 언어코드 → 국가코드 매핑 (flagcdn.com 사용)
const LANG_TO_COUNTRY: Record<string, string> = {
  'en-US':'us','en-GB':'gb','es-ES':'es','es-MX':'mx','fr-FR':'fr',
  'de-DE':'de','it-IT':'it','pt-BR':'br','pt-PT':'pt','ru-RU':'ru',
  'nl-NL':'nl','pl-PL':'pl','sv-SE':'se','da-DK':'dk','nb-NO':'no',
  'fi-FI':'fi','cs-CZ':'cz','sk-SK':'sk','hu-HU':'hu','ro-RO':'ro',
  'el-GR':'gr','tr-TR':'tr','uk-UA':'ua','ca-ES':'es',
  'bg-BG':'bg','hr-HR':'hr','sl-SI':'si','sr-RS':'rs',
  'et-EE':'ee','lv-LV':'lv','lt-LT':'lt',
  'ja-JP':'jp','ko-KR':'kr','zh-CN':'cn','zh-TW':'tw','hi-IN':'in',
  'bn-IN':'bd','ta-IN':'in','te-IN':'in','ml-IN':'in',
  'mr-IN':'in','gu-IN':'in','pa-IN':'in','kn-IN':'in',
  'vi-VN':'vn','th-TH':'th','id-ID':'id','ms-MY':'my','tl-PH':'ph',
  'km-KH':'kh','lo-LA':'la','si-LK':'lk','my-MM':'mm',
  'mn-MN':'mn','yue-HK':'hk',
  'ar-XA':'sa','he-IL':'il','fa-IR':'ir','ur-IN':'pk',
  'sw-KE':'ke','af-ZA':'za','am-ET':'et','zu-ZA':'za',
  'az-AZ':'az','ka-GE':'ge',
  'fr-CA':'ca','en-AU':'au','en-IN':'in',
};

const FlagImg = ({ code, size = 28 }: { code: string; size?: number }) => {
  const country = LANG_TO_COUNTRY[code] || code.split('-')[1]?.toLowerCase() || 'un';
  return (
    <img
      src={`https://flagcdn.com/w40/${country}.png`}
      width={size}
      height={size * 0.75}
      alt={code}
      style={{ borderRadius: 3, objectFit: 'cover', display: 'block' }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  );
};

const XP_BOUNDS: Record<string, [number, number]> = {
  a1: [0, 800], a2: [800, 1400], b1: [1400, 2400], b2: [2400, 4000],
  c1: [4000, 6500], c2: [6500, 9999],
};

export default function LevelHub() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [planId, setPlanId] = useState<PlanId>('free');
  const [hearts, setHearts] = useState<Hearts>({ count: 5 });
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<'level_locked'|'no_hearts'|'chat_limit'|'general'>('general');

  // -- Trial state ------------------------------------------------------------
  const [trialData, setTrialData]       = useState<TrialData | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(14);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  const [langBlockedModal, setLangBlockedModal] = useState(false);

  // Auto-clear toast
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); }
  }, [toast]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  // 언어 설정 (localStorage 저장)
  const [learnLang, setLearnLang]   = useState('en-US');
  const [nativeLang, setNativeLang] = useState('ko-KR');

  // 언어 선택 모달
  const [showLangModal, setShowLangModal]   = useState(false);
  const [pendingLevelId, setPendingLevelId] = useState<string | null>(null);
  const [langStep, setLangStep]             = useState<'learn' | 'native'>('learn');
  const [showPlacementModal, setShowPlacementModal] = useState(false);

  // -- 스트릭 계산 --------------------------------------------------------------
  const calcStreak = () => {
    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const raw = localStorage.getItem('mt_activity_dates');
      const dates: string[] = raw ? JSON.parse(raw) : [];

      // 오늘 날짜 기록
      if (!dates.includes(today)) {
        dates.push(today);
        localStorage.setItem('mt_activity_dates', JSON.stringify(dates));
      }

      // 연속 날짜 계산
      const sorted = [...new Set(dates)].sort().reverse();
      let count = 0;
      let cursor = new Date(today);
      for (const d of sorted) {
        const diff = (cursor.getTime() - new Date(d).getTime()) / 86400000;
        if (diff <= 1) { count++; cursor = new Date(d); }
        else break;
      }
      setStreak(count);
      localStorage.setItem('mt_streak', String(count));
    } catch { setStreak(0); }
  };

  // -- 진단 테스트 리다이렉트 ------------------------------------------------
  useEffect(() => {
    if (authLoading) return; // 아직 auth 확인 중 → 대기

    if (!user) {
      // -- 비로그인 게스트 --------------------------------------------------
      // localStorage 기준으로 판단 (계정 무관)
      const lsPlaced = localStorage.getItem('mt_placement_done');
      if (!lsPlaced) {
        // 한 번도 테스트 안 함 → 언어 선택됐으면 placement 팝업, 아니면 언어 먼저
        const lang = localStorage.getItem('mt_learn_lang') || '';
        if (!lang || lang === 'en-US') {
          setShowLangModal(true);
          setLangStep('learn');
        } else {
          setShowPlacementModal(true);
        }
      }
      // lsPlaced 있으면 → 그대로 LevelHub 표시
      return;
    }

    // -- 로그인 유저 --------------------------------------------------------
    if (!profile) return; // profile 아직 로딩 중 → 대기

    const firestoreDone = (profile as any).placementDone === true;
    const localDone     = localStorage.getItem('mt_placement_done') === 'true';

    // Firestore 또는 localStorage 둘 중 하나라도 완료면 통과
    if (firestoreDone || localDone) {
      localStorage.setItem('mt_placement_done', 'true');
      return;
    }

    localStorage.setItem('mt_placement_done', 'pending');
    const lang = profile.learnLang || localStorage.getItem('mt_learn_lang') || '';
    if (!lang || lang === 'en-US') {
      setShowLangModal(true);
      setLangStep('learn');
    } else {
      setShowPlacementModal(true);
    }

  }, [user, authLoading, profile]);

  // Firestore 프로필 우선, 없으면 localStorage fallback
  useEffect(() => {
    if (profile) {
      setXp(profile.xp || 0);
      setStreak(profile.streak || 0);
      setLearnLang(profile.learnLang || 'en-US');
      setNativeLang(profile.nativeLang || 'ko-KR');
      setCompletedLessons(new Set(profile.completedLessons || []));
      localStorage.setItem('mt_learn_lang', profile.learnLang || 'en-US');
      localStorage.setItem('mt_native_lang', profile.nativeLang || 'ko-KR');
      // tutorId: localStorage에 이미 값이 있고 profile이 default 't01'이면 localStorage 우선
      const storedTutor = localStorage.getItem('mt_tutor_id');
      if (profile.tutorId && profile.tutorId !== 't01') {
        // Firestore에 실제 저장된 값 우선
        localStorage.setItem('mt_tutor_id', profile.tutorId);
      } else if (!storedTutor) {
        // localStorage도 없을 때만 default 세팅
        localStorage.setItem('mt_tutor_id', 't01');
      }
      // storedTutor가 있고 profile이 't01'이면 → localStorage 값 유지 (덮어쓰지 않음)
    } else {
      try {
        const savedXp     = parseInt(localStorage.getItem('mt_xp') || '0', 10);
        const savedDone   = JSON.parse(localStorage.getItem('mt_done') || '[]') as string[];
        const savedLearn  = localStorage.getItem('mt_learn_lang') || 'en-US';
        const savedNative = localStorage.getItem('mt_native_lang') || 'ko-KR';
        setXp(savedXp);
        setCompletedLessons(new Set(savedDone));
        setLearnLang(savedLearn);
        setNativeLang(savedNative);
        calcStreak();
      } catch { /* ignore */ }
    }
  }, [profile]);

  // 구독 상태 + 하트 로드
  useEffect(() => {
    const loadSub = async () => {
      if (user) {
        const sub = await getSubscription(user.uid);
        setPlanId(sub.planId);
        const h = await getHearts(user.uid);
        setHearts(h);
      } else {
        setPlanId('free');
        setHearts(getLocalHearts());
      }
    };
    loadSub();
  }, [user]);

  // -- Load trial data --------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    getTrialData(user.uid).then(data => {
      if (!data) return;
      setTrialData(data);
      setTrialDaysLeft(trialDaysRemaining(data));
      if (isTrialExpired(data)) setTrialExpired(true);
    }).catch(() => {});
  }, [user?.uid]);

  const saveLangPrefs = (learn: string, native: string) => {
    try {
      localStorage.setItem('mt_learn_lang', learn);
      localStorage.setItem('mt_native_lang', native);
      if (user) updateUserProfile(user.uid, { learnLang: learn, nativeLang: native });
    } catch { /* ignore */ }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setShowUserMenu(false);
    router.push('/login');
  };

  const currentLevel = getCurrentLevel(xp);

  const getLevelProgress = (levelId: string) => {
    const [min, max] = XP_BOUNDS[levelId] || [0, 800];
    const clamped = Math.max(0, Math.min(xp - min, max - min));
    return Math.round((clamped / (max - min)) * 100);
  };
  const isLevelUnlocked  = (levelId: string) => xp >= (XP_BOUNDS[levelId]?.[0] ?? 0);
  const isLevelCompleted = (levelId: string) => xp >= (XP_BOUNDS[levelId]?.[1] ?? 0);

  const totalLessonsCount = CURRICULUM.flatMap(l => l.steps.flatMap(s => s.lessons)).length;
  const [activeTab] = useState('learn');

  // 레벨 클릭 → 언어가 이미 설정돼 있으면 바로 이동, 없으면 모달
  const handleLevelClick = (levelId: string, unlocked: boolean) => {
    if (!unlocked) return;
    // 구독 레벨 잠금 체크
    if (isLevelLocked(levelId, planId)) {
      setPaywallReason('level_locked');
      setShowPaywall(true);
      return;
    }
    // 하트 체크 (Free 유저)
    if (planId === 'free' && hearts.count === 0) {
      setPaywallReason('no_hearts');
      setShowPaywall(true);
      return;
    }
    const savedLearn  = localStorage.getItem('mt_learn_lang');
    const savedNative = localStorage.getItem('mt_native_lang');
    const savedTutor  = localStorage.getItem('mt_tutor_id') || 't01';
    if (savedLearn && savedNative) {
      router.push(`/lingua/learn/${levelId}?lang=${savedLearn}&subLang=${savedNative}&tutor=${savedTutor}`);
    } else {
      setPendingLevelId(levelId);
      setLangStep('learn');
      setShowLangModal(true);
    }
  };

  // 언어 확정 후 이동
  const handleConfirmLang = async (learn: string, native: string) => {
    // -- 체험 언어 제한 체크 --------------------------------------------------
    if (user && trialData && !isTrialExpired(trialData)) {
      const alreadyAdded = trialData.languages.includes(learn);
      if (!alreadyAdded && trialData.languages.length >= TRIAL_MAX_LANGUAGES) {
        // planId가 premium이면 통과
        if (planId === 'free') {
          setShowLangModal(false);
          setLangBlockedModal(true);
          return;
        }
      }
      // 언어 추가 기록
      if (!alreadyAdded) {
        await addTrialLanguage(user.uid, learn).catch(() => {});
        setTrialData(prev => prev ? { ...prev, languages: [...prev.languages, learn] } : prev);
      }
    }

    saveLangPrefs(learn, native);
    setLearnLang(learn);
    setNativeLang(native);
    setShowLangModal(false);
    const savedTutor = localStorage.getItem('mt_tutor_id') || 't01';

    if (pendingLevelId) {
      router.push(`/lingua/learn/${pendingLevelId}?lang=${learn}&subLang=${native}&tutor=${savedTutor}`);
      return;
    }

    const placed = localStorage.getItem('mt_placement_done');
    if (!placed || placed === 'pending') {
      setShowPlacementModal(true);
    }
  };

  const learnLangInfo  = LEARN_LANGUAGES.find(l => l.code === learnLang);
  const nativeLangInfo = UI_LANGUAGES.find(l => l.code === nativeLang);

  return (
    <div style={styles.page}>
      <style suppressHydrationWarning>{`
*{box-sizing:border-box;}
        .mt-nav-tab{padding:8px 16px;border-radius:10px;border:none;background:transparent;font-weight:700;font-size:13px;cursor:pointer;color:#64748B;transition:all .15s;font-family:'Nunito',sans-serif;}
        .mt-nav-tab:hover{color:#38BDF8;}
        .mt-nav-tab.active{background:#EFF6FF;color:#38BDF8;}
        .mt-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;}
      `}</style>

      {/* -- Trial: 만료 모달 -- */}
      {trialExpired && planId === 'free' && (
        <TrialExpiredModal
          reason="expired"
          onClose={() => router.push('/pricing')}
        />
      )}

      {/* -- Trial: 언어 제한 모달 -- */}
      {langBlockedModal && (
        <TrialExpiredModal
          reason="language_limit"
          onClose={() => setLangBlockedModal(false)}
        />
      )}

      {/* -- Trial: 상단 배너 -- */}
      {!trialExpired && trialData && planId === 'free' && !trialBannerDismissed && (
        <TrialBanner
          daysLeft={trialDaysLeft}
          onDismiss={() => setTrialBannerDismissed(true)}
        />
      )}

      {/* -- Placement Test 안내 모달 -- */}
      {showPlacementModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}
          onClick={() => setShowPlacementModal(false)}>
          <div style={{ background: '#fff', borderRadius: 28, padding: '40px 32px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            {/* 닫기 버튼 */}
            <button onClick={() => setShowPlacementModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: '#F3F4F6', border: 'none', borderRadius: 99, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito',sans-serif" }}>
              ✕
            </button>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 10, fontFamily: "'Nunito',sans-serif" }}>
              What's your level?
            </div>
            <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 28, fontFamily: "'Nunito',sans-serif", fontWeight: 600 }}>
              Take a quick 5-minute placement test so we can put you in the right level. No pressure — it's just to personalize your journey!
            </div>
            {/* 통계 뱃지 */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
              {[['⚡', '5 min'], ['🎯', 'Auto-place'], ['🆓', 'Free']].map(([icon, label]) => (
                <div key={label} style={{ background: '#F8FAFC', borderRadius: 14, padding: '10px 16px', fontSize: 13, fontWeight: 800, color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: "'Nunito',sans-serif" }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
            <button
              onClick={() => { setShowPlacementModal(false); router.push(`/lingua/placement?lang=${learnLang}`); }}
              style={{ width: '100%', padding: '15px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#38BDF8,#818CF8)', color: '#fff', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", marginBottom: 10 }}>
              Start Placement Test 🚀
            </button>
            <button
              onClick={() => { setShowPlacementModal(false); localStorage.setItem('mt_placement_done', 'skip'); }}
              style={{ width: '100%', padding: '12px', borderRadius: 16, border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
              Skip for now, start from A1
            </button>
          </div>
        </div>
      )}

      {/* -- 언어 선택 모달 -- */}
      {showLangModal && (
        <div className="mt-modal-overlay" onClick={() => setShowLangModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowLangModal(false)}>✕</button>

            {langStep === 'learn' ? (
              <>
                <div style={styles.modalTitle}>🌐 Choose a Language to Learn</div>
                <div style={styles.modalSub}>Select the language you want to study</div>
                <div style={styles.langGrid}>
                  {[
                    // -- 최다 학습자 순 ------------------------------
                    'en-US','en-GB','es-ES','fr-FR','de-DE','ja-JP',
                    'zh-CN','ko-KR','pt-BR','it-IT','ru-RU','ar-XA',
                    'hi-IN','zh-TW','vi-VN','tr-TR','pl-PL','nl-NL',
                    'th-TH','id-ID','sv-SE','da-DK','nb-NO','fi-FI',
                    'cs-CZ','el-GR','hu-HU','ro-RO','uk-UA','he-IL',
                    'ms-MY','tl-PH','yue-HK','pt-PT','es-MX','fa-IR',
                    'sk-SK','bg-BG','hr-HR','sl-SI','sr-RS','ca-ES',
                    'et-EE','lv-LV','lt-LT','az-AZ','ka-GE',
                    'bn-IN','ta-IN','te-IN','ml-IN','gu-IN','kn-IN',
                    'mr-IN','pa-IN','ur-IN','sw-KE','af-ZA',
                    'km-KH','lo-LA','si-LK','my-MM',
                  ].map(code => {
                    const lang = LEARN_LANGUAGES.find(l => l.code === code);
                    if (!lang) return null;
                    const isSelected = learnLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => { setLearnLang(lang.code); setLangStep('native'); }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          textAlign: 'center', padding: '14px 10px', gap: 8,
                          borderRadius: 12, border: `2px solid ${isSelected ? '#38BDF8' : '#E9ECEF'}`,
                          background: isSelected ? '#EFF6FF' : '#fff',
                          cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                          transition: 'all .15s', position: 'relative',
                        }}
                      >
                        <FlagImg code={lang.code} size={32} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: isSelected ? '#2563EB' : '#0F172A', display: 'block' }}>{lang.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', display: 'block' }}>{lang.native}</span>
                        {!lang.tts && (
                          <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF3C7', color: '#92400E', borderRadius: 4, padding: '1px 5px' }}>🔇 no voice</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* -- 모국어 선택 — 완전히 다른 배경/디자인 -- */}
                <div style={{ margin: '-32px -28px 24px', padding: '24px 28px', background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', borderRadius: '24px 24px 0 0' }}>
                  <button
                    onClick={() => setLangStep('learn')}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '5px 12px', color: '#fff', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 12, marginBottom: 16 }}
                  >← Back</button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <FlagImg code={learnLang} size={36} />
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Learning</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{learnLangInfo?.label}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: '#F59E0B' }} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>What's your native language?</div>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Used for subtitles & translations during lessons</div>
                  </div>
                </div>

                <div style={styles.langGrid}>
                  {UI_LANGUAGES.map(lang => {
                    const isSelected = nativeLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => handleConfirmLang(learnLang, lang.code)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          textAlign: 'center', padding: '14px 10px', gap: 8,
                          borderRadius: 12, border: `2px solid ${isSelected ? '#F59E0B' : '#E9ECEF'}`,
                          background: isSelected ? '#FFFBEB' : '#fff',
                          cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                          transition: 'all .15s',
                        }}
                      >
                        <FlagImg code={lang.code} size={32} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: isSelected ? '#B45309' : '#0F172A', display: 'block' }}>{lang.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', display: 'block' }}>{lang.native}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* -- NAV -- */}
      <nav style={styles.nav}>
        <div style={styles.navLogo} onClick={() => router.push('/')}>
          <div style={styles.navLogoIcon}>🌍</div>
          <span style={styles.navLogoText}>MunTalk</span>
          <span style={styles.navBeta}>BETA</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {([
            { label: '📚 Learn',      action: () => router.push('/lingua') },
            { label: '🏠 Home',       action: () => router.push('/lingua') },
            { label: '🎯 Placement Test', action: () => router.push(`/lingua/placement?lang=${learnLang}`) },
            { label: '🌐 Languages',  action: () => { setPendingLevelId(null); setLangStep('learn'); setShowLangModal(true); } },
            { label: '🏆 League',     action: () => router.push('/lingua/league') },
            { label: '🔁 Review',     action: () => router.push('/lingua/review') },
            { label: '👩‍🏫 Tutors',   action: () => router.push('/lingua/tutors') },
            { label: '📊 Dashboard',  action: () => router.push('/lingua/dashboard') },
          ]).map(({ label, action }, i) => (
            <button key={label} className={`mt-nav-tab${i === 0 ? ' active' : ''}`}
              onClick={action}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* 현재 언어 표시 + 변경 버튼 */}
          <button style={styles.langPill} onClick={() => { setPendingLevelId(null); setLangStep('learn'); setShowLangModal(true); }}>
            <span>{learnLang ? <FlagImg code={learnLang} size={20} /> : '🌐'}</span>
            <span style={{ fontWeight: 800, fontSize: 12, color: '#2563EB' }}>{learnLangInfo?.label ?? 'English'}</span>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>▾</span>
          </button>
          <div style={styles.navStreak}><span>🔥</span><span style={{ fontWeight: 800, color: '#EA580C', fontSize: 13 }}>{streak} {streak === 1 ? 'day' : 'days'}</span></div>
          <div style={styles.navXp}><span>⭐</span><span style={{ fontWeight: 800, color: '#2563EB', fontSize: 13 }}>{xp} XP</span></div>
          {/* 하트바 + Upgrade — auth 로딩 완료 후에만 표시 */}
          {!authLoading && planId === 'free' && user && (
            <button onClick={() => router.push('/pricing')}
              style={{ padding:'6px 14px', borderRadius:20, border:'none', background:'linear-gradient(135deg,#F59E0B,#F97316)', color:'#fff', fontSize:11, fontWeight:900, cursor:'pointer', fontFamily:"'Nunito',sans-serif", letterSpacing:0.3 }}>
              ⭐ Upgrade
            </button>
          )}

          {/* -- User Avatar / Login -- */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(m => !m)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F1F5F9', border: 'none', borderRadius: 20, padding: '5px 10px 5px 5px', cursor: 'pointer' }}
              >
                {user.photoURL
                  ? <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                }
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>
              {showUserMenu && (
                <div style={{ position: 'absolute', right: 0, top: 40, background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #F1F5F9', minWidth: 160, zIndex: 300, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{user.displayName || 'Learner'}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{user.email}</div>
                  </div>
                  <button onClick={() => { router.push('/lingua/dashboard'); setShowUserMenu(false); }}
                    style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                    📊 Dashboard
                  </button>
                  <button onClick={() => { router.push('/profile'); setShowUserMenu(false); }}
                    style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                    ✏️ Edit Profile
                  </button>
                  <button onClick={handleSignOut}
                    style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#EF4444', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : authLoading ? (
            // auth 로딩 중 — 빈 자리표시 (깜빡임 방지)
            <div style={{ width: 72, height: 28 }} />
          ) : (
            <button onClick={() => router.push('/login')}
              style={{ padding: '7px 16px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#1E293B', color: '#F8FAFC', padding: '12px 24px', borderRadius: 14, fontSize: 13, fontWeight: 700, zIndex: 999, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', animation: 'fadeIn .2s ease' }}>
          {toast}
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal
          reason={paywallReason}
          onClose={() => setShowPaywall(false)}
        />
      )}

      {/* -- Hero Banner -- */}
      <div style={styles.heroBanner}>
        <div style={styles.heroBubble1} /><div style={styles.heroBubble2} />
        <div style={styles.heroInner}>
          <div style={styles.heroBadgeRow}>
            <div style={styles.heroBadge52}>🌐 52 Languages</div>
            <div style={{ ...styles.heroBadgeTutors, cursor: 'pointer' }} onClick={() => setShowPlacementModal(true)}>
              <span style={{ fontSize: 15 }}>🎯</span>
              <span>Take <strong>Placement</strong> Test</span>
              <span style={styles.newTag}>FREE</span>
            </div>
          </div>
          <h1 style={styles.heroTitle}>Every language in the world<br />Meet +150 AI tutors</h1>
          <p style={styles.heroDesc}>No judgment. No pressure. Your pace, your rules.<br />Our AI tutors get total beginners talking in under 10 minutes.</p>
          <div style={styles.heroBtnRow}>
            <button style={styles.heroBtn1} onClick={() => { setPendingLevelId(null); setLangStep('learn'); setShowLangModal(true); }}>
              🌐 Choose a Language
            </button>
            <button style={styles.heroBtn2} onClick={() => router.push('/lingua/words')}>📚 Word Bank</button>
            <button style={styles.heroBtn2} onClick={() => router.push('/lingua/tutors')}>👩‍🏫 Meet +150 AI Tutors</button>
          </div>
        </div>
      </div>

      {/* -- Stats -- */}
      <div style={styles.statsWrap}>
        {([
          ['150+','AI Tutors','🤖','#EFF6FF','#2563EB'],
          ['52','Languages','🌍','#F0FDF4','#16A34A'],
          [String(totalLessonsCount),'Lessons','📚','#FFF7ED','#EA580C'],
          ['A1→C2','CEFR Levels','🎓','#FAF5FF','#7C3AED'],
        ] as [string,string,string,string,string][]).map(([v,l,e,bg,ac]) => (
          <div key={l} style={{ ...styles.statBox, background: bg }}>
            <span style={styles.statEmoji}>{e}</span>
            <span style={{ ...styles.statValue, color: '#0F172A' }}>{v}</span>
            <span style={{ ...styles.statLabel, color: ac }}>{l}</span>
          </div>
        ))}
      </div>

      {/* -- Current Level -- */}
      <section style={styles.currentSection}>
        <p style={styles.currentSub}>YOUR LEARNING PATH</p>
        <h2 style={styles.currentTitle}>
          You&apos;re at{' '}
          <span style={{ color: currentLevel.accent }}>{currentLevel.badge} {currentLevel.label}</span>
        </h2>
        <p style={styles.currentDesc}>{currentLevel.desc}</p>
        <div style={styles.xpBarWrap}>
          <div style={styles.xpBar}>
            <div style={{ ...styles.xpBarFill, width: `${Math.min(100,(xp/9999)*100)}%`, background: currentLevel.accent }} />
          </div>
          <span style={styles.xpLabel}>{xp} / 9,999 XP</span>
        </div>
      </section>

      {/* -- Level Grid -- */}
      <section style={styles.grid}>
        {CURRICULUM.map((level) => {
          const unlocked    = isLevelUnlocked(level.id);
          const subLocked   = isLevelLocked(level.id, planId); // 구독 잠금
          const completed   = isLevelCompleted(level.id);
          const active      = level.id === currentLevel.id;
          const progress    = getLevelProgress(level.id);
          const totalLessons = level.steps.flatMap(s => s.lessons).length;
          const doneLessons  = level.steps.flatMap(s => s.lessons).filter(l => completedLessons.has(l.id)).length;
          const isLocked    = !unlocked || subLocked;

          return (
            <div key={level.id} style={{
              ...styles.card,
              background: isLocked ? '#F3F4F6' : level.color,
              border: active ? `2px solid ${level.accent}` : completed ? `2px solid ${level.accent}60` : '2px solid #E5E7EB',
              opacity: isLocked ? 0.7 : 1,
              cursor: isLocked ? 'pointer' : 'pointer',
              boxShadow: active ? `0 4px 24px ${level.accent}30` : '0 2px 12px rgba(0,0,0,0.06)',
            }}
              onClick={() => handleLevelClick(level.id, unlocked)}
            >
              {/* XP 잠금 */}
              {!unlocked && (
                <div style={styles.lockOverlay}>
                  <span style={{ fontSize: 28 }}>🔒</span>
                  <span style={styles.lockText}>{level.xpRange} XP needed</span>
                </div>
              )}
              {/* 구독 잠금 */}
              {unlocked && subLocked && (
                <div style={{ ...styles.lockOverlay, background: 'linear-gradient(135deg,rgba(99,102,241,0.92),rgba(139,92,246,0.92))' }}>
                  <span style={{ fontSize: 28 }}>⭐</span>
                  <span style={{ ...styles.lockText, color: '#fff' }}>Premium only</span>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: 700 }}>Tap to upgrade</div>
                </div>
              )}
              <div style={styles.cardTop}>
                <span style={{ fontSize: 34, lineHeight: '1' }}>{level.badge}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: level.accent }}>CEFR {level.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: level.dark }}>{level.persona}</div>
                </div>
                {completed && !subLocked && <span style={{ fontSize: 20 }}>✅</span>}
                {active && !subLocked && <span style={{ ...styles.activePill, background: level.accent }}>Current</span>}
                {subLocked && <span style={{ ...styles.activePill, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>⭐ Pro</span>}
              </div>
              <p style={{ fontSize: 13, lineHeight: '1.6', marginBottom: 16, opacity: 0.85, color: level.dark }}>{level.desc}</p>
              <div style={styles.stepPills}>
                {level.steps.map(step => {
                  const stepDone = step.lessons.every(l => completedLessons.has(l.id));
                  return (
                    <div key={step.id} style={{ ...styles.stepPill, background: stepDone ? level.accent : level.accent+'20', color: stepDone ? '#fff' : level.accent }}>
                      {step.badge}
                    </div>
                  );
                })}
              </div>
              {!isLocked && (
                <div style={{ marginBottom: 16 }}>
                  <div style={styles.progressBar}>
                    <div style={{ height: '100%', borderRadius: 99, transition: 'width 0.6s ease', width: `${progress}%`, background: level.accent }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, color: level.dark }}>
                    {completed ? '✅ Complete' : active ? `${doneLessons}/${totalLessons} lessons · ${progress}%` : `${level.xpRange} XP`}
                  </div>
                </div>
              )}
              {!isLocked && (
                <button style={{ ...styles.cardBtn, background: level.accent }}
                  onClick={e => { e.stopPropagation(); handleLevelClick(level.id, true); }}>
                  {completed ? 'Review' : active ? 'Continue →' : 'Start →'}
                </button>
              )}
              {subLocked && (
                <button style={{ ...styles.cardBtn, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}
                  onClick={e => { e.stopPropagation(); setPaywallReason('level_locked'); setShowPaywall(true); }}>
                  🔓 Unlock with Premium
                </button>
              )}
            </div>
          );
        })}
      </section>

      <footer style={styles.footer}>
        <div style={{ marginBottom: 12 }}>🌐 MunTalk · {totalLessonsCount} lessons · A1 to C2 · 150+ AI Tutors</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <a href="/privacy" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Terms of Service</a>
          <a href="/refund" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Refund Policy</a>
          <a href="/cookies" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Cookie Policy</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>
          &copy; {new Date().getFullYear()} MunTalk. All rights reserved. | British Columbia, Canada |{' '}
          <a href="mailto:muntalkofficial@gmail.com" style={{ color: '#94A3B8', textDecoration: 'none' }}>muntalkofficial@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F8F9FA', color: '#111', fontFamily: "'Nunito','Noto Sans KR',sans-serif" },
  nav: { background: '#fff', borderBottom: '1px solid #F1F5F9', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 200 },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  navLogoIcon: { width: 36, height: 36, background: 'linear-gradient(135deg,#38BDF8,#818CF8)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  navLogoText: { fontWeight: 900, fontSize: 19, color: '#0F172A', letterSpacing: '-0.5px' },
  navBeta: { background: '#EFF6FF', color: '#38BDF8', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 },
  navStreak: { display: 'flex', alignItems: 'center', gap: 5, background: '#FFF7ED', padding: '6px 12px', borderRadius: 20 },
  navXp: { display: 'flex', alignItems: 'center', gap: 5, background: '#EFF6FF', padding: '6px 12px', borderRadius: 20 },
  langPill: { display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 20, padding: '6px 12px', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" },

  // Modal
  modal: { background: '#fff', borderRadius: 24, padding: '32px 28px', width: '92vw', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' },
  modalClose: { position: 'absolute', top: 16, right: 16, background: '#F3F4F6', border: 'none', borderRadius: 99, width: 32, height: 32, cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBack: { background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontWeight: 700, fontSize: 13, fontFamily: "'Nunito',sans-serif", marginBottom: 12, padding: 0 },
  modalTitle: { fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#6B7280', marginBottom: 20, fontWeight: 600 },
  langGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 },

  // Hero
  heroBanner: { background: 'linear-gradient(135deg,#38BDF8 0%,#818CF8 55%,#FB7185 100%)', borderRadius: 28, margin: '28px 32px 0', padding: '52px 44px', color: '#fff', position: 'relative', overflow: 'hidden' },
  heroBubble1: { position: 'absolute', top: -40, right: -40, width: 260, height: 260, background: 'rgba(255,255,255,0.07)', borderRadius: '50%' },
  heroBubble2: { position: 'absolute', bottom: -60, right: 110, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' },
  heroInner: { position: 'relative', maxWidth: 580 },
  heroBadgeRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 },
  heroBadge52: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 800, letterSpacing: 0.8, backdropFilter: 'blur(6px)' },
  heroBadgeTutors: { display: 'inline-flex', alignItems: 'center', gap: 7, background: '#ffffff', borderRadius: 20, padding: '8px 18px', fontSize: 13, fontWeight: 900, color: '#7C3AED', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', border: '2px solid rgba(124,58,237,0.15)', transition: 'transform 0.15s, box-shadow 0.15s' },
  newTag: { background: '#7C3AED', color: '#fff', borderRadius: 12, padding: '1px 8px', fontSize: 10 },
  heroTitle: { fontSize: 36, fontWeight: 900, lineHeight: 1.25, marginBottom: 14, color: '#fff' },
  heroDesc: { opacity: 0.9, fontSize: 15, lineHeight: 1.75, marginBottom: 32, color: '#fff' },
  heroBtnRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  heroBtn1: { background: '#fff', color: '#2563EB', border: 'none', borderRadius: 14, padding: '13px 26px', fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', fontFamily: "'Nunito',sans-serif" },
  heroBtn2: { background: 'rgba(255,255,255,0.18)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 14, padding: '13px 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" },

  // Stats
  statsWrap: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, padding: '24px 32px 0', maxWidth: 1200, margin: '0 auto' },
  statBox: { borderRadius: 18, padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #E9ECEF' },
  statEmoji: { fontSize: 24, marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: 900 },
  statLabel: { fontSize: 12, fontWeight: 700 },

  // Current level
  currentSection: { textAlign: 'center', padding: '44px 24px 24px', maxWidth: 600, margin: '0 auto' },
  currentSub: { fontSize: 11, letterSpacing: 3, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 },
  currentTitle: { fontSize: 32, fontWeight: 900, color: '#0F172A', marginBottom: 10, lineHeight: 1.2 },
  currentDesc: { fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 20 },
  xpBarWrap: { display: 'flex', alignItems: 'center', gap: 12, maxWidth: 440, margin: '0 auto' },
  xpBar: { flex: 1, height: 8, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 99, transition: 'width 0.8s ease' },
  xpLabel: { fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap', fontWeight: 600 },

  // Grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, padding: '20px 32px 60px', maxWidth: 1200, margin: '0 auto' },
  card: { borderRadius: 20, padding: 24, position: 'relative', transition: 'transform 0.18s, box-shadow 0.18s', overflow: 'hidden' },
  lockOverlay: { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(3px)', borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 2 },
  lockText: { fontSize: 11, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' },
  cardTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  activePill: { marginLeft: 'auto', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 99, color: '#fff', letterSpacing: 0.5 },
  stepPills: { display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  stepPill: { width: 34, height: 34, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, transition: 'background 0.2s' },
  progressBar: { height: 6, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', marginBottom: 6 },
  cardBtn: { width: '100%', padding: '12px', borderRadius: 12, border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', letterSpacing: 0.3, transition: 'opacity 0.15s', fontFamily: "'Nunito',sans-serif" },

  footer: { textAlign: 'center', padding: '28px', color: '#9CA3AF', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff' },
};
