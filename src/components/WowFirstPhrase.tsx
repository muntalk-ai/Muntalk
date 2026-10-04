'use client';
// WowFirstPhrase v2 — 랜딩 게스트용 "Try it now" 3분 말하기 체험
// 언어 선택 → 3분 타이머 시작 → 듣기/말하기 반복 → 매 시도 1줄 영어 분석 → 다음 문장/단어 선택 → 종료 시 성적표
// 비로그인 전용. localStorage에 흔적을 남기지 않음.
import { useState, useRef, useMemo, useEffect, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import { FIRST_PHRASES, FirstPhrase, WowItem } from '@/data/first-phrase';
import { getTutorForLang, getTutorById } from '@/data/tutors';
import { LEARN_LANGUAGES, promptLangName } from '@/data/languages';

type Step = 'pick' | 'try' | 'listening' | 'analyzing' | 'feedback' | 'done';

const FONT = "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";
const ACCENT = '#6366F1';
const SESSION_SEC = 180;

type Analysis = { score: number | null; line: string };

const FALLBACK_LINES = [
  'Nice try! Listen once more and give it another go.',
  'Good effort! One more listen, then try again.',
];

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

// ── 문장/단어 뜻 모국어 번역 (PR #101 패턴: 영어 원문 먼저 표시 → 번역 교체, localStorage 캐시) ──
// 게스트 전용이라 프로필 없이 localStorage → 브라우저 언어 → 영어로 모국어 판별.
function TranslatedMeaning({ text, cacheKey, nativeLang, isEnglishNative, style }: {
  text: string; cacheKey: string; nativeLang: string; isEnglishNative: boolean; style?: CSSProperties;
}) {
  const [translated, setTranslated] = useState<string | null>(null);
  useEffect(() => {
    if (isEnglishNative || !text) { setTranslated(null); return; }
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setTranslated(cached); return; }
    } catch { /* 캐시 읽기 실패 → 번역 시도 */ }
    setTranslated(null);
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Translate the following short phrase into ${promptLangName(nativeLang)} (the learner's native language). Return ONLY the translation, no quotes, no explanation:\n\n"${text}"`,
            temperature: 0.2,
          }),
          timeoutMs: 15000,
        });
        const data = await res.json();
        const t = (data?.text || '').trim().replace(/^"|"$/g, '');
        if (cancelled || !t || t.length > 200) return;
        try { localStorage.setItem(cacheKey, t); } catch { /* 저장 실패 무시 */ }
        setTranslated(t);
      } catch { /* 번역 실패 → 영어 원문 유지 (조용히 폴백) */ }
    })();
    return () => { cancelled = true; };
  }, [cacheKey, isEnglishNative, text, nativeLang]);
  return <div dir="auto" style={style}>= {translated || text}</div>;
}

export default function WowFirstPhrase() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('pick');
  const [fp, setFp] = useState<FirstPhrase | null>(null);
  const [itemIdx, setItemIdx] = useState(0);
  const [usedIdx, setUsedIdx] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // 세션 스탯
  const [attempts, setAttempts] = useState(0);
  const [scoredAttempts, setScoredAttempts] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [lastXp, setLastXp] = useState(0);
  const [milestone, setMilestone] = useState<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [ttsError, setTtsError] = useState(false);
  const [heard, setHeard] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [sttError, setSttError] = useState('');
  const [sttSupported, setSttSupported] = useState(true);
  const [listenedOnce, setListenedOnce] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<any>(null);
  const handledRef = useRef(false);

  const item: WowItem | null = fp ? fp.items[itemIdx] : null;

  const tutor = useMemo(() => {
    if (!fp) return getTutorForLang('en-US');
    // ar-XA는 LANG_TUTOR_MAP에 없어 TUTORS[0]으로 떨어지므로 중동 튜터로 고정
    if (fp.code === 'ar-XA') return getTutorById('t09');
    return getTutorForLang(fp.code);
  }, [fp]);

  // 모국어 판별 (게스트): localStorage → 브라우저 언어 → 영어
  const nativeLang = useMemo(() => {
    if (typeof window === 'undefined') return 'en-US';
    try {
      const stored = localStorage.getItem('mt_native_lang');
      if (stored) return stored;
    } catch { /* noop */ }
    const nav = (navigator.language || 'en-US');
    const base = nav.split('-')[0].toLowerCase();
    return LEARN_LANGUAGES.find(l => l.code.toLowerCase() === nav.toLowerCase())?.code
      || LEARN_LANGUAGES.find(l => l.code.toLowerCase().startsWith(base))?.code
      || 'en-US';
  }, []);
  const isEnglishNative = nativeLang.toLowerCase().startsWith('en');

  // 폭죽 조각 (마운트 시 1회 생성)
  const confetti = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      duration: 2.2 + Math.random() * 2.2,
      color: ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#38BDF8', '#FB7185'][i % 6],
      size: 6 + Math.random() * 8,
      round: Math.random() > 0.5,
    })),
    []
  );

  const stopAudio = () => {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch { /* noop */ } audioRef.current = null; }
    setPlaying(false);
  };
  const stopAll = () => {
    stopAudio();
    try { recRef.current?.abort(); } catch { /* noop */ }
    recRef.current = null;
  };

  const endSession = () => {
    stopAll();
    setStep('done');
  };
  const endSessionRef = useRef(endSession);
  endSessionRef.current = endSession;

  // 언마운트 시 오디오·STT 정리 + STT 지원 여부 사전 감지
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSttSupported(false);
    return () => { stopAll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3분 세션 타이머
  const sessionActive = timeLeft !== null && step !== 'done';
  useEffect(() => {
    if (!sessionActive) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) return prev;
        const next = prev - 1;
        if (next === 0) setTimeout(() => endSessionRef.current(), 0);
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [sessionActive]);

  const playItem = async () => {
    if (!fp || !item || playing) return;
    stopAudio();
    setTtsError(false);
    setPlaying(true);
    try {
      const res = await apiFetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.text, lang: fp.code, gender: tutor.gender, speed: 0.8 }),
        timeoutMs: 15000,
      });
      const data = await res.json();
      if (!data?.audioContent) { setPlaying(false); setTtsError(true); return; }
      const audio = new Audio(`data:${data.mimeType || 'audio/mp3'};base64,${data.audioContent}`);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
      setListenedOnce(true);
    } catch {
      setPlaying(false);
      setTtsError(true);
    }
  };
  const playItemRef = useRef(playItem);
  playItemRef.current = playItem;

  const resetItemState = () => {
    setHeard('');
    setAnalysis(null);
    setSttError('');
    setTtsError(false);
    setListenedOnce(false);
    setMilestone(null);
    setLastXp(0);
  };

  const pickLanguage = (p: FirstPhrase) => {
    stopAll();
    setFp(p);
    setItemIdx(0);
    setUsedIdx([]);
    resetItemState();
    if (timeLeft === null) setTimeLeft(SESSION_SEC);
    setStep('try');
    // 사용자 제스처 직후라 자동재생 시도 (막히면 🔊 버튼으로)
    setTimeout(() => playItemRef.current(), 350);
  };

  const selectItem = (i: number) => {
    stopAll();
    setItemIdx(i);
    resetItemState();
    setStep('try');
    setTimeout(() => playItemRef.current(), 350);
  };

  const backToPick = () => {
    stopAll();
    resetItemState();
    setStep('pick');
  };

  const resetSession = () => {
    stopAll();
    setFp(null);
    setItemIdx(0);
    setUsedIdx([]);
    setTimeLeft(null);
    setAttempts(0);
    setScoredAttempts(0);
    setTotalScore(0);
    setBestScore(0);
    setStreak(0);
    setBestStreak(0);
    setXp(0);
    resetItemState();
    setStep('pick');
  };

  // ── 1줄 영어 분석 (서버 purpose=wow-pron, IP 시간당 15회 제한) ──
  const analyze = async (target: WowItem, transcript: string) => {
    if (!fp) return;
    setStep('analyzing');
    let score: number | null = null;
    let line: string | null = null;
    try {
      const res = await apiFetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'wow-pron',
          wowLang: fp.label,
          wowTarget: target.text,
          wowMeaning: target.meaning,
          wowTranscript: transcript,
        }),
        timeoutMs: 20000,
      });
      const data = await res.json();
      if (typeof data?.score === 'number') score = data.score;
      if (typeof data?.line === 'string' && data.line.trim()) line = data.line.trim();
      if ((score === null || !line) && typeof data?.text === 'string') {
        try {
          const m = data.text.match(/\{[\s\S]*\}/);
          const p = m ? JSON.parse(m[0]) : null;
          if (p) {
            if (typeof p.score === 'number') score = Math.max(0, Math.min(100, Math.round(p.score)));
            if (typeof p.line === 'string' && p.line.trim()) line = p.line.trim().slice(0, 200);
          }
        } catch { /* fallthrough to fallback */ }
      }
    } catch { /* fallthrough to fallback */ }
    if (!line) line = FALLBACK_LINES[Math.floor(Math.random() * FALLBACK_LINES.length)];
    setAnalysis({ score, line });

    // 스탯 업데이트
    const newAttempts = attempts + 1;
    const gainedXp = 10 + (score !== null && score >= 85 ? 5 : 0);
    const newStreak = score !== null && score >= 70 ? streak + 1 : 0;
    setAttempts(newAttempts);
    setXp(x => x + gainedXp);
    setLastXp(gainedXp);
    setUsedIdx(prev => (prev.includes(itemIdx) ? prev : [...prev, itemIdx]));
    if (score !== null) {
      setScoredAttempts(n => n + 1);
      setTotalScore(s => s + score);
      setBestScore(b => Math.max(b, score));
      setStreak(newStreak);
      setBestStreak(b => Math.max(b, newStreak));
    } else {
      setStreak(0);
    }
    if (score !== null && score >= 90) setMilestone('🌟 Amazing pronunciation!');
    else if (newStreak >= 3) setMilestone(`🔥 ${newStreak} in a row — unstoppable!`);
    else if (newAttempts === 3) setMilestone("🔥 You're on a roll — 3 down, keep going!");
    else if (newAttempts === 6) setMilestone('💪 Half dozen! Your mouth is warming up.');
    setStep('feedback');
  };
  const analyzeRef = useRef(analyze);
  analyzeRef.current = analyze;

  const startListening = () => {
    if (!fp || !item) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSttSupported(false); return; }
    stopAudio();
    setSttError('');
    handledRef.current = false;
    const rec = new SR();
    rec.lang = fp.sttLang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    const finish = (ok: boolean, transcript?: string, errMsg?: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      try { rec.stop(); } catch { /* noop */ }
      recRef.current = null;
      if (ok && transcript && item) {
        setHeard(transcript);
        analyzeRef.current(item, transcript);
      } else {
        if (errMsg) setSttError(errMsg);
        setStep('try');
      }
    };
    rec.onresult = (e: any) => {
      const t: string | undefined = e.results?.[0]?.[0]?.transcript?.trim();
      finish(true, t || undefined, t ? undefined : "Didn't catch that. Try again!");
    };
    rec.onerror = (e: any) => {
      const code = e?.error;
      finish(false, undefined,
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone blocked — allow mic access and try again.'
          : code === 'no-speech'
            ? "Didn't hear anything. Try again!"
            : 'Speech hiccup. Try again!');
    };
    rec.onend = () => {
      // onresult/onerror 없이 끝나면 (무음 종료) try로 복귀
      if (!handledRef.current) {
        handledRef.current = true;
        recRef.current = null;
        setStep('try');
      }
    };
    recRef.current = rec;
    setStep('listening');
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setStep('try');
    }
  };

  // STT 미지원 폴백: 분석 없이 시도만 카운트
  const handleSaidIt = () => {
    if (!item) return;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setXp(x => x + 10);
    setLastXp(10);
    setUsedIdx(prev => (prev.includes(itemIdx) ? prev : [...prev, itemIdx]));
    setAnalysis({ score: null, line: 'Great effort! Tap 🔊 to listen again, or pick your next below.' });
    if (newAttempts === 3) setMilestone("🔥 You're on a roll — 3 down, keep going!");
    setStep('feedback');
  };

  const remaining = fp ? fp.items.map((it, i) => ({ it, i })).filter(({ i }) => !usedIdx.includes(i)) : [];
  const remainingPhrases = remaining.filter(({ it }) => it.kind === 'phrase');
  const remainingWords = remaining.filter(({ it }) => it.kind === 'word');
  const showConfetti = step === 'done' || (step === 'feedback' && (analysis?.score ?? 0) >= 85);
  const avgScore = scoredAttempts > 0 ? Math.round(totalScore / scoredAttempts) : null;

  const scoreBadge = (s: number | null) => {
    if (s === null) return null;
    const bg = s >= 85 ? '#DCFCE7' : s >= 70 ? '#FEF3C7' : '#E0E7FF';
    const fg = s >= 85 ? '#059669' : s >= 70 ? '#D97706' : '#4F46E5';
    const label = s >= 85 ? 'Excellent!' : s >= 70 ? 'Good!' : 'Keep going!';
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: bg, borderRadius: 99, padding: '8px 20px', marginBottom: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: fg }}>🎯 {s}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: fg }}>{label}</span>
      </div>
    );
  };

  const itemKindLabel = item ? (item.kind === 'phrase' ? '📝 PHRASE' : '🔤 WORD') : '';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '26px 24px 0', width: '100%', fontFamily: FONT }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wowpop { 0%{transform:scale(0.7);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes wowfall { 0%{transform:translateY(-10vh) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0.6} }
        @keyframes wowpulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes wowxp { 0%{opacity:0;transform:translateY(10px) scale(0.8)} 30%{opacity:1;transform:translateY(0) scale(1.1)} 70%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:translateY(-30px)} }
      `}} />

      <div style={{ background: '#fff', borderRadius: 24, padding: '32px 28px',
        boxShadow: '0 8px 32px rgba(99,102,241,0.10)', border: '2px solid #EEF2FF',
        position: 'relative', overflow: 'hidden' }}>
        {/* 폭죽 */}
        {showConfetti && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, overflow: 'hidden' }}>
            {confetti.map((c, i) => (
              <div key={i} style={{ position: 'absolute', top: '-4vh', left: `${c.left}%`,
                width: c.size, height: c.size * (c.round ? 1 : 0.5),
                background: c.color, borderRadius: c.round ? '50%' : 2,
                animation: `wowfall ${c.duration}s ease-in ${c.delay}s forwards` }} />
            ))}
          </div>
        )}

        {/* 3분 타이머 바 */}
        {sessionActive && timeLeft !== null && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#6366F1' }}>⏱ {fmtTime(timeLeft)} left</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8' }}>⭐ {xp} XP{streak >= 2 ? ` · 🔥 ${streak}` : ''}</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: '#EEF2FF', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(timeLeft / SESSION_SEC) * 100}%`, borderRadius: 99,
                background: timeLeft <= 30 ? 'linear-gradient(90deg,#F59E0B,#EF4444)' : 'linear-gradient(90deg,#6366F1,#818CF8)',
                transition: 'width 1s linear' }} />
            </div>
          </div>
        )}

        {step === 'pick' && (
          <div style={{ textAlign: 'center', animation: 'wowpop .35s ease' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>
              🗣️ Try it now — no signup
            </div>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginBottom: 20 }}>
              Pick a language. 3 minutes. Hear it, say it, get instant feedback.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {FIRST_PHRASES.map(p => (
                <button key={p.code} onClick={() => pickLanguage(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8,
                    border: '2px solid #E2E8F0', borderRadius: 99,
                    background: '#fff', padding: '10px 18px',
                    fontSize: 15, fontWeight: 800, color: '#0F172A',
                    cursor: 'pointer', fontFamily: FONT,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: 20 }}>{p.flag}</span> {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {(step === 'try' || step === 'listening' || step === 'analyzing') && fp && item && (
          <div style={{ animation: 'wowpop .35s ease' }}>
            <button onClick={backToPick}
              style={{ background: 'none', border: 'none', color: '#94A3B8',
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                marginBottom: 12, fontFamily: FONT }}>
              ← Choose another language
            </button>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* 튜터 비디오 */}
              <div style={{ position: 'relative', width: 96, height: 96, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                border: `3px solid ${playing || step === 'listening' ? ACCENT : '#E0E7FF'}`,
                boxShadow: playing || step === 'listening' ? `0 0 0 5px ${ACCENT}20` : 'none',
                transition: 'all .3s' }}>
                <video preload="metadata" poster={tutor.thumbnail} src={tutor.videoIdle}
                  autoPlay loop muted playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center 20%',
                    opacity: playing ? 0 : 1, transition: 'opacity .25s' }} />
                <video preload="metadata" poster={tutor.thumbnail} src={tutor.videoTalk}
                  autoPlay loop muted playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center 20%',
                    opacity: playing ? 1 : 0, transition: 'opacity .25s' }} />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8',
                  letterSpacing: 1, marginBottom: 6 }}>
                  {fp.flag} {itemKindLabel} · {fp.label.toUpperCase()}
                </div>
                <div dir="auto" style={{ fontSize: 30, fontWeight: 900, color: '#0F172A',
                  marginBottom: 4, lineHeight: 1.3 }}>{item.text}</div>
                <div style={{ fontSize: 14, color: '#94A3B8', fontWeight: 700,
                  fontStyle: 'italic', marginBottom: 2 }}>{item.romanized}</div>
                <TranslatedMeaning text={item.meaning}
                  cacheKey={`mt_wow_meaning_${fp.code}_${itemIdx}_${nativeLang}`}
                  nativeLang={nativeLang} isEnglishNative={isEnglishNative}
                  style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginBottom: 18 }} />

                {step === 'try' ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={playItem}
                      style={{ border: 'none', borderRadius: 99, cursor: 'pointer',
                        padding: '13px 26px', fontSize: 15, fontWeight: 800, color: '#fff',
                        background: `linear-gradient(135deg, ${ACCENT}, #818CF8)`,
                        boxShadow: `0 6px 20px ${ACCENT}40`, fontFamily: FONT,
                        animation: !listenedOnce ? 'wowpulse 1.6s infinite' : 'none' }}>
                      {playing ? '🔊 Playing…' : '🔊 Listen'}
                    </button>
                    {sttSupported ? (
                      <button onClick={startListening}
                        style={{ border: `2px solid ${ACCENT}`, borderRadius: 99, cursor: 'pointer',
                          padding: '12px 26px', fontSize: 15, fontWeight: 800, color: ACCENT,
                          background: '#fff', fontFamily: FONT }}>
                        🎤 Say it
                      </button>
                    ) : (
                      <button onClick={handleSaidIt}
                        style={{ border: `2px solid ${ACCENT}`, borderRadius: 99, cursor: 'pointer',
                          padding: '12px 26px', fontSize: 15, fontWeight: 800, color: ACCENT,
                          background: '#fff', fontFamily: FONT }}>
                        🎉 I said it!
                      </button>
                    )}
                  </div>
                ) : step === 'listening' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%',
                      border: '4px solid #E0E7FF', borderTopColor: '#EF4444',
                      animation: 'wowspin .8s linear infinite' }} />
                    <style dangerouslySetInnerHTML={{ __html: '@keyframes wowspin{to{transform:rotate(360deg)}}' }} />
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                      Listening… say <em>{item.text}</em>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%',
                      border: '4px solid #E0E7FF', borderTopColor: ACCENT,
                      animation: 'wowspin .8s linear infinite' }} />
                    <style dangerouslySetInnerHTML={{ __html: '@keyframes wowspin{to{transform:rotate(360deg)}}' }} />
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                      ✨ Analyzing your pronunciation…
                    </div>
                  </div>
                )}

                {ttsError && (
                  <div style={{ fontSize: 13, color: '#EF4444', fontWeight: 700, marginTop: 10 }}>
                    Couldn't play audio. Tap 🔊 to retry.
                  </div>
                )}
                {sttError && (
                  <div style={{ fontSize: 13, color: '#EF4444', fontWeight: 700, marginTop: 10 }}>
                    {sttError}
                  </div>
                )}
                {!sttSupported && (
                  <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginTop: 10 }}>
                    Mic not supported here — listen, repeat out loud, then tap "I said it!"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'feedback' && fp && item && analysis && (
          <div style={{ animation: 'wowpop .35s ease', position: 'relative', zIndex: 21 }}>
            {milestone && (
              <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 900, color: '#D97706',
                background: '#FFFBEB', border: '2px solid #FDE68A', borderRadius: 16,
                padding: '10px 16px', marginBottom: 16 }}>
                {milestone}
              </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              {scoreBadge(analysis.score)}
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                💬 {analysis.line}
              </div>
              {heard && (
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                  We heard: "{heard}"
                </div>
              )}
              {lastXp > 0 && (
                <div style={{ display: 'inline-block', fontSize: 16, fontWeight: 900, color: '#10B981',
                  background: '#DCFCE7', borderRadius: 99, padding: '6px 18px',
                  marginTop: 8, animation: 'wowxp 2.2s ease forwards' }}>
                  +{lastXp} XP ⭐
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', margin: '14px 0 20px' }}>
              <button onClick={() => { resetItemState(); setStep('try'); setTimeout(() => playItemRef.current(), 300); }}
                style={{ border: 'none', borderRadius: 99, cursor: 'pointer',
                  padding: '11px 24px', fontSize: 14, fontWeight: 800, color: '#fff',
                  background: `linear-gradient(135deg, ${ACCENT}, #818CF8)`, fontFamily: FONT }}>
                🎤 Try again
              </button>
              <button onClick={backToPick}
                style={{ border: '2px solid #E2E8F0', borderRadius: 99, cursor: 'pointer',
                  padding: '10px 24px', fontSize: 14, fontWeight: 800, color: '#64748B',
                  background: '#fff', fontFamily: FONT }}>
                ← Another language
              </button>
            </div>

            {remaining.length > 0 ? (
              <div>
                <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>
                  👇 Pick your next {fp.label} {remainingPhrases.length > 0 && remainingWords.length > 0 ? 'word or phrase' : remainingPhrases.length > 0 ? 'phrase' : 'word'}
                </div>
                {remainingPhrases.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: 1, marginBottom: 6 }}>📝 PHRASES</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {remainingPhrases.map(({ it, i }) => (
                        <button key={i} onClick={() => selectItem(i)}
                          style={{ border: '2px solid #E0E7FF', borderRadius: 14, background: '#F8FAFF',
                            padding: '8px 14px', cursor: 'pointer', fontFamily: FONT, textAlign: 'left' }}>
                          <div dir="auto" style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{it.text}</div>
                          <TranslatedMeaning text={it.meaning}
                            cacheKey={`mt_wow_meaning_${fp.code}_${i}_${nativeLang}`}
                            nativeLang={nativeLang} isEnglishNative={isEnglishNative}
                            style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {remainingWords.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: 1, marginBottom: 6 }}>🔤 WORDS</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {remainingWords.map(({ it, i }) => (
                        <button key={i} onClick={() => selectItem(i)}
                          style={{ border: '2px solid #E0E7FF', borderRadius: 14, background: '#F8FAFF',
                            padding: '8px 14px', cursor: 'pointer', fontFamily: FONT, textAlign: 'left' }}>
                          <div dir="auto" style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{it.text}</div>
                          <TranslatedMeaning text={it.meaning}
                            cacheKey={`mt_wow_meaning_${fp.code}_${i}_${nativeLang}`}
                            nativeLang={nativeLang} isEnglishNative={isEnglishNative}
                            style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#64748B' }}>
                You tried everything in {fp.label}! 🎉 Pick another language above to keep going.
              </div>
            )}
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', animation: 'wowpop .4s ease', position: 'relative', zIndex: 21 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>⏱️</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>
              Time's up!
            </div>
            <div style={{ fontSize: 15, color: '#64748B', fontWeight: 600, marginBottom: 16 }}>
              {attempts === 0
                ? 'The clock ran out before your first try — no worries, go again!'
                : `You tried ${attempts} ${attempts === 1 ? 'word/phrase' : 'words & phrases'} in 3 minutes!`}
            </div>
            {attempts > 0 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                {avgScore !== null && (
                  <div style={{ background: '#F8FAFF', border: '2px solid #E0E7FF', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                    🎯 Avg {avgScore}
                  </div>
                )}
                {bestScore > 0 && (
                  <div style={{ background: '#F8FAFF', border: '2px solid #E0E7FF', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                    🏆 Best {bestScore}
                  </div>
                )}
                {bestStreak >= 2 && (
                  <div style={{ background: '#FFFBEB', border: '2px solid #FDE68A', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                    🔥 Streak {bestStreak}
                  </div>
                )}
                <div style={{ background: '#DCFCE7', border: '2px solid #A7F3D0', borderRadius: 14, padding: '8px 16px', fontSize: 13, fontWeight: 800, color: '#059669' }}>
                  ⭐ +{xp} XP
                </div>
              </div>
            )}
            <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, marginBottom: 18 }}>
              Sign up free to keep your XP and unlock the full course.
            </div>
            <div>
              <button onClick={() => router.push('/signup')}
                style={{ border: 'none', borderRadius: 99, cursor: 'pointer',
                  padding: '15px 40px', fontSize: 16, fontWeight: 800, color: '#fff',
                  background: `linear-gradient(135deg, ${ACCENT}, #818CF8)`,
                  boxShadow: `0 6px 24px ${ACCENT}50`, fontFamily: FONT }}>
                Create free account →
              </button>
            </div>
            <button onClick={resetSession}
              style={{ background: 'none', border: 'none', color: '#94A3B8',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                marginTop: 14, fontFamily: FONT }}>
              ↻ Play again (3 min)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
