'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CURRICULUM } from '@/data/curriculum';
import { getTutorById, getTutorForLang } from '@/data/tutors';
import { LEARN_LANGUAGES } from '@/data/languages';
import TrialExpiredModal from '@/components/TrialExpiredModal';
import { getTrialData, initTrial, isTrialExpired, isPremium, TRIAL_MAX_UNITS } from '@/lib/trialPolicy';

const hasStt = (langId: string) => LEARN_LANGUAGES.find(l => l.code === langId)?.stt ?? false;
const hasTts = (langId: string) => LEARN_LANGUAGES.find(l => l.code === langId)?.tts ?? false;

type Phase = 'vocab' | 'quiz' | 'chat' | 'complete';

interface ChatMessage {
  role: 'tutor' | 'user';
  text: string;
  subtitle?: string;
}

interface LessonPlayerProps {
  levelId: string;
  stepId: string;
  lessonId: string;
  langId?: string;
  tutorId?: string;
  subLang?: string;
  onComplete?: (xpEarned: number) => void;
}

export default function LessonPlayer({
  levelId, stepId, lessonId,
  langId = 'en-US', tutorId, subLang = 'ko-KR',
  onComplete,
}: LessonPlayerProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // -- Data --------------------------------------------------------------------
  const level = CURRICULUM.find(l => l.id === levelId);
  const step  = level?.steps.find(s => s.id === stepId);
  const lesson = step?.lessons.find(l => l.id === lessonId);
  const tutor = tutorId ? getTutorById(tutorId) : getTutorForLang(langId);

  // -- State -------------------------------------------------------------------
  const [phase, setPhase]       = useState<Phase>('vocab');
  const [vocabIdx, setVocabIdx] = useState(0);
  const [quizIdx, setQuizIdx]   = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXPPop, setShowXPPop] = useState(false);
  const [xpPopVal, setXpPopVal] = useState(0);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loadingTx, setLoadingTx] = useState<Record<string, boolean>>({});
  const [translatedLesson, setTranslatedLesson] = useState<typeof lesson | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // -- Trial timer -------------------------------------------------------------
  const [trialExpired, setTrialExpired]   = useState(false);
  const [trialExpireReason, setTrialExpireReason] = useState<'expired'|'lesson_limit'|'chat_limit'>('expired');

  // -- Video / Speech ----------------------------------------------------------
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [isListening,  setIsListening]  = useState(false);
  const recognitionRef   = useRef<any>(null);
  const chatAreaRef      = useRef<HTMLDivElement | null>(null);

  // -- STT setup ---------------------------------------------------------------
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = langId;
    rec.onresult = (e: any) => {
      setIsListening(false);
      const transcript = e.results[0][0].transcript;
      handleUserMessage(transcript);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recognitionRef.current = rec;
  }, [langId]);

  // -- Init trial status (14일 정책 기반) -------------------------------------
  useEffect(() => {
    if (!user) return; // 게스트는 trial 제한 없음
    async function checkTrial() {
      try {
        // 프리미엄이면 패스
        if (await isPremium(user!.uid)) return;
        // trial 데이터 읽기 (없으면 자동 생성)
        let trial = await getTrialData(user!.uid);
        if (!trial) trial = await initTrial(user!.uid);
        if (!trial) return;
        if (isTrialExpired(trial)) {
          setTrialExpireReason('expired');
          setTrialExpired(true);
        }
      } catch { /* Firestore 오류 시 제한 없이 허용 */ }
    }
    checkTrial();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // -- Translate lesson content when non-English --------------------------------
  const [txError, setTxError] = useState<string | null>(null);

  useEffect(() => {
    // lesson은 Guard 이후에 확정되지만 useEffect는 항상 실행되므로 직접 재계산
    const lvl = CURRICULUM.find(l => l.id === levelId);
    const stp = lvl?.steps.find(s => s.id === stepId);
    const lsn = stp?.lessons.find(l => l.id === lessonId);

    console.log('[translate] langId:', langId, 'lesson:', lsn?.title);

    if (!lsn) { console.warn('[translate] lesson not found'); return; }
    if (authLoading) { console.log('[translate] waiting for auth to load...'); return; }
    // 게스트도 번역 허용 (uid 없이 API 호출)
    if (langId === 'en-US' || langId === 'en-GB') {
      setTranslatedLesson(null);
      return;
    }

    const langNames: Record<string, string> = {
      'en-US': 'English', 'en-GB': 'English',
      'ja-JP': 'Japanese', 'ko-KR': 'Korean',
      'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
      'fr-FR': 'French', 'de-DE': 'German', 'es-ES': 'Spanish', 'es-MX': 'Spanish (Mexican)',
      'it-IT': 'Italian', 'pt-BR': 'Portuguese (Brazilian)', 'pt-PT': 'Portuguese (European)',
      'ru-RU': 'Russian', 'ar-XA': 'Arabic', 'hi-IN': 'Hindi', 'bn-IN': 'Bengali',
      'ta-IN': 'Tamil', 'te-IN': 'Telugu', 'ml-IN': 'Malayalam',
      'nl-NL': 'Dutch', 'pl-PL': 'Polish', 'tr-TR': 'Turkish', 'sv-SE': 'Swedish',
      'da-DK': 'Danish', 'nb-NO': 'Norwegian', 'fi-FI': 'Finnish', 'cs-CZ': 'Czech',
      'sk-SK': 'Slovak', 'hu-HU': 'Hungarian', 'ro-RO': 'Romanian', 'el-GR': 'Greek',
      'uk-UA': 'Ukrainian', 'ca-ES': 'Catalan',
      'vi-VN': 'Vietnamese', 'th-TH': 'Thai', 'id-ID': 'Indonesian', 'ms-MY': 'Malay',
      'tl-PH': 'Filipino', 'km-KH': 'Khmer', 'si-LK': 'Sinhala',
      'he-IL': 'Hebrew', 'fa-IR': 'Persian', 'ur-IN': 'Urdu',
      'sw-KE': 'Swahili', 'af-ZA': 'Afrikaans',
      'az-AZ': 'Azerbaijani', 'ka-GE': 'Georgian',
    };
    const nativeNames: Record<string, string> = {
      'ko-KR': 'Korean', 'en-US': 'English', 'ja-JP': 'Japanese', 'zh-CN': 'Chinese',
      'fr-FR': 'French', 'de-DE': 'German', 'es-ES': 'Spanish', 'pt-BR': 'Portuguese',
      'ru-RU': 'Russian', 'ar-XA': 'Arabic', 'vi-VN': 'Vietnamese', 'id-ID': 'Indonesian',
    };
    const targetLang = langNames[langId] || langId;
    const nativeLang = nativeNames[subLang] || 'English';

    setIsTranslating(true);
    setTxError(null);
    setTranslatedLesson(null);

    const lessonPayload = {
      vocab: lsn.vocab,
      quiz: lsn.quiz,
      tutorPrompt: lsn.tutorPrompt,
    };

    const prompt = `Convert this English language lesson into ${targetLang}. The student's native language is ${nativeLang}.

Lesson JSON:
${JSON.stringify(lessonPayload)}

Return ONLY a JSON object with keys: vocab (array), quiz (array), tutorPrompt (string).
- vocab[i].word: the word/phrase in ${targetLang}
- vocab[i].phonetic: pronunciation guide (romanization)
- vocab[i].meaning: 1-4 word meaning in ${nativeLang}
- vocab[i].example: simple ${targetLang} sentence
- quiz[i].q: question text in ${nativeLang}
- quiz[i].options: array of ${targetLang} answer choices
- quiz[i].answer: keep same index as original
- tutorPrompt: rewrite to teach ${targetLang}, student replies in ${nativeLang} or ${targetLang}
No markdown fences. Pure JSON only.`;

    console.log('[translate] calling /api/gemini for', targetLang);

    fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          uid: user?.uid ?? null, prompt, temperature: 0.3 }),
    })
      .then(async r => {
        const data = await r.json();
        console.log('[translate] response status:', r.status);
        if (data.error) throw new Error(data.error);
        const raw = data.text?.trim() ?? '';
        console.log('[translate] raw (first 200):', raw.slice(0, 200));
        const clean = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```[\s\S]*$/i,'').trim();
        const parsed = JSON.parse(clean);
        console.log('[translate] parsed vocab[0]:', parsed.vocab?.[0]);
        setTranslatedLesson({ ...lsn, ...parsed });
      })
      .catch(e => {
        console.error('[translate] ERROR:', e);
        setTxError(e?.message || String(e));
      })
      .finally(() => setIsTranslating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, langId, subLang, user?.uid]);

  // -- Auto-scroll chat --------------------------------------------------------
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chatMsgs]);

  // -- Stop all audio ----------------------------------------------------------
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAll = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  // -- TTS (Google Cloud TTS) ---------------------------------------------------
  const speakText = async (text: string, onEnd?: () => void): Promise<void> => {
    // TTS 미지원 언어면 바로 콜백만 실행
    if (!hasTts(langId)) { onEnd?.(); return; }
    stopAll();
    setIsSpeaking(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: langId, gender: tutor?.gender || 'female', level: levelId }),
      });
      if (!res.ok) { setIsSpeaking(false); onEnd?.(); return; }
      const data = await res.json();
      if (!data.audioContent) { setIsSpeaking(false); onEnd?.(); return; }
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); audioRef.current = null; onEnd?.(); };
      audio.onerror = () => { setIsSpeaking(false); audioRef.current = null; onEnd?.(); };
      await audio.play();
    } catch {
      setIsSpeaking(false);
      onEnd?.();
    }
  };

  // -- Translation -------------------------------------------------------------
  const getLangName = (code: string) => {
    const map: Record<string, string> = {
      'ko-KR': 'Korean', 'ja-JP': 'Japanese', 'zh-CN': 'Chinese (Simplified)',
      'fr-FR': 'French', 'de-DE': 'German', 'es-ES': 'Spanish', 'it-IT': 'Italian',
      'pt-BR': 'Portuguese', 'ru-RU': 'Russian', 'ar-XA': 'Arabic',
      'hi-IN': 'Hindi', 'nl-NL': 'Dutch', 'pl-PL': 'Polish', 'tr-TR': 'Turkish',
      'sv-SE': 'Swedish', 'vi-VN': 'Vietnamese', 'th-TH': 'Thai', 'id-ID': 'Indonesian',
      'en-US': 'English', 'en-GB': 'English',
    };
    return map[code] || code;
  };

  const translateText = async (text: string, key: string) => {
    if (!subLang || subLang === langId || subLang === 'en-US' && langId === 'en-US') return;
    if (translations[key] || loadingTx[key]) return;
    setLoadingTx(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid,
          prompt: `You are a translator. Translate the given text to ${getLangName(subLang)}. Reply with ONLY the translation, nothing else.\n\n${text}`,
          temperature: 0.3,
        }),
      });
      const data = await res.json();
      const tx = data.text?.trim();
      if (tx) setTranslations(prev => ({ ...prev, [key]: tx }));
    } catch { /* ignore */ }
    finally { setLoadingTx(prev => ({ ...prev, [key]: false })); }
  };

  // -- STT start ---------------------------------------------------------------
  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    stopAll();
    recognitionRef.current.start();
    setIsListening(true);
  };

  // -- XP pop ------------------------------------------------------------------
  const popXP = (val: number) => {
    setXpPopVal(val);
    setShowXPPop(true);
    setTimeout(() => setShowXPPop(false), 1600);
  };

  // -----------------------------------------------------------------------------
  // VOCAB PHASE
  // -----------------------------------------------------------------------------
  // Use translated lesson if available
  const activeLesson = translatedLesson ?? lesson;
  const vocabItem = activeLesson?.vocab[vocabIdx];

  const handleNextVocab = () => {
    if (!activeLesson) return;
    if (vocabIdx < activeLesson.vocab.length - 1) {
      setVocabIdx(v => v + 1);
    } else {
      setPhase('quiz');
    }
  };

  // auto-translate vocab on load
  useEffect(() => {
    if (vocabItem && subLang && subLang !== langId) {
      translateText(vocabItem.example, `vocab-ex-${vocabIdx}`);
      translateText(vocabItem.meaning, `vocab-meaning-${vocabIdx}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabIdx, phase]);

  const handleSpeakVocab = async () => {
    if (!vocabItem) return;
    await speakText(vocabItem.example);
  };

  // -----------------------------------------------------------------------------
  // QUIZ PHASE
  // -----------------------------------------------------------------------------
  const quizItem = activeLesson?.quiz[quizIdx];

  const handleSelectOpt = (idx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(idx);
    const correct = idx === quizItem?.answer;
    if (correct) {
      setQuizScore(s => s + 1);
      popXP(15);
      setXpEarned(x => x + 15);
    }
  };

  const handleNextQuiz = () => {
    if (!activeLesson) return;
    setSelectedOpt(null);
    if (quizIdx < activeLesson.quiz.length - 1) {
      setQuizIdx(q => q + 1);
    } else {
      // Quiz done -> enter chat
      setPhase('chat');
      startChat();
    }
  };

  // -----------------------------------------------------------------------------
  // CHAT PHASE
  // -----------------------------------------------------------------------------
  const startChat = async () => {
    if (!lesson) return;

    // Generate opening message in the learning language
    let openingText = "Great work on the quiz! 🎉 Let's practice conversation now!";
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid,
          prompt: `You are a friendly language tutor. Generate a short warm opening message (2 sentences max) to start a conversation practice session in ${langId} language at ${levelId.toUpperCase()} level (${levelId.startsWith('a') ? 'beginner' : levelId.startsWith('b') ? 'intermediate' : 'advanced'}). 
IMPORTANT: Write ONLY in ${langId}. Use very simple words for beginners. Be encouraging. End with a simple question or task for the student.`,
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      if (data.text) openingText = data.text.trim();
    } catch { /* use default */ }

    const openingMsg: ChatMessage = {
      role: 'tutor',
      text: openingText,
      subtitle: subLang !== langId ? '대화 연습을 시작해요!' : undefined,
    };
    setChatMsgs([openingMsg]);
    await speakText(openingMsg.text, () => {
      setTimeout(startListening, 400);
    });
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim() || isChatThinking || !lesson) return;

    const userMsg: ChatMessage = { role: 'user', text };
    setChatMsgs(prev => [...prev, userMsg]);
    popXP(10);
    setXpEarned(x => x + 10);

    const newHistory = [...chatHistory, { role: 'user' as const, content: text }];
    setChatHistory(newHistory);
    setIsChatThinking(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid,
          prompt: [
            `You are a friendly language tutor. The student is learning ${langId} at ${levelId.toUpperCase()} level (${levelId.startsWith('a') ? 'beginner -- use very simple words only' : levelId.startsWith('b') ? 'intermediate -- use everyday vocabulary' : 'advanced -- use natural expressions'}).
CRITICAL RULES:
- ALWAYS write your reply in ${langId} (the target language), never in English unless langId is en-US/en-GB
- Match vocabulary strictly to ${levelId.toUpperCase()} level
- Keep replies to 2-3 short sentences maximum
- Be warm, encouraging, use emojis occasionally
- Lesson context: ${activeLesson!.tutorPrompt ?? lesson!.tutorPrompt}`,
            ...newHistory.map((m: {role:string, content:string}) =>
              `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`
            ),
          ].join('\n\n'),
          temperature: 0.8,
        }),
      });
      const data = await res.json();

      // 제한 에러 처리
      if (!res.ok) {
        if (data.error === 'CHAT_LIMIT_REACHED') {
          setChatMsgs(prev => [...prev, {
            role: 'tutor',
            text: `오늘의 무료 AI 대화 ${data.limit}회를 모두 사용했어요 😢 프리미엄으로 업그레이드하면 무제한으로 대화할 수 있어요!`,
          }]);
          return;
        }
        if (data.error === 'LOGIN_REQUIRED') {
          setChatMsgs(prev => [...prev, {
            role: 'tutor',
            text: '🔒 AI 튜터를 사용하려면 로그인이 필요해요.',
          }]);
          return;
        }
      }

      const replyText = data.text?.trim() || "That's great! Keep going!";
      const replyMsg: ChatMessage = { role: 'tutor', text: replyText };

      setChatMsgs(prev => [...prev, replyMsg]);
      setChatHistory(h => [...h, { role: 'assistant', content: replyText }]);
      // translate tutor reply
      const msgKey = `chat-${chatHistory.length}`;
      translateText(replyText, msgKey);

      await speakText(replyText, () => {
        setTimeout(startListening, 400);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatThinking(false);
    }
  };

  const handleFinishLesson = () => {
    if (!lesson || !activeLesson) return;
    const totalXP = lesson.xp + xpEarned;
    popXP(lesson.xp);
    setXpEarned(totalXP);
    setPhase('complete');
    stopAll();
    onComplete?.(totalXP);
  };

  // -----------------------------------------------------------------------------
  // Guard
  // -----------------------------------------------------------------------------
  // -- Mobile detection (must be before any early return) ---------------------
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!level || !step || !lesson) {
    return <div style={{ color: '#fff', padding: 40, textAlign: 'center' }}>Lesson not found.</div>;
  }

  // -- Trial timer removed -- using 14-day policy -------------------------------

  const langInfo = LEARN_LANGUAGES.find(l => l.code === langId);

  // -----------------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------------
  return (
    <div style={styles.page}>


      {/* -- Trial timer bar (only for guest / free) ----------------------- */}

      {/* -- Trial expired overlay ----------------------------------------- */}
      {trialExpired && (
        <TrialExpiredModal
          reason={trialExpireReason}
          langFlag={langInfo?.flag}
          langLabel={langInfo?.native || langInfo?.label}
          onClose={() => router.push('/lingua')}
        />
      )}

      {/* Translation loading overlay */}
      {isTranslating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.92)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🌐</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Preparing lesson...</div>
          <div style={{ fontSize: 14, color: '#6B7280' }}>Preparing lesson content in your language</div>
          <div style={{ width: 200, height: 4, background: '#E9ECEF', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#38BDF8', borderRadius: 99, animation: 'progressSlide 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      )}
      {/* Translation error banner */}
      {txError && !isTranslating && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', padding: '12px 20px', fontSize: 13, color: '#C2410C', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>⚠️ AI translation unavailable -- showing in English.</span>
          <button
            onClick={() => { setTxError(null); setIsTranslating(true); }}
            style={{ background: '#EA580C', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 800, padding: '5px 14px', cursor: 'pointer' }}>
            Retry
          </button>
          <button onClick={() => setTxError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#C2410C', fontSize: 15 }}>✕</button>
        </div>
      )}
      {/* XP Pop */}
      {showXPPop && (
        <div style={styles.xpPop}>+{xpPopVal} XP ⚡</div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => { stopAll(); router.back(); }}>← Back</button>
        <div style={styles.lessonMeta}>
          <span style={{ ...styles.levelTag, background: level.accent }}>{level.label}</span>
          <span style={styles.lessonTitle}>{lesson.icon} {lesson.title}</span>
        </div>
        <div style={{ ...styles.xpDisplay, color: level.accent }}>+{lesson.xp} XP</div>
      </header>

      {/* Phase tabs */}
      <div style={{ ...styles.phaseTabs, borderBottom: `2px solid ${level.accent}20` }}>
        {(['vocab','quiz','chat'] as Phase[]).map((p, i) => (
          <div key={p} style={{
            ...styles.phaseTab,
            color: phase === p ? level.accent : phase === 'complete' || (['vocab','quiz','chat'] as Phase[]).indexOf(phase) > i ? level.accent + '80' : '#444',
            borderBottom: phase === p ? `3px solid ${level.accent}` : '3px solid transparent',
          }}>
            {i < (['vocab','quiz','chat'] as Phase[]).indexOf(phase) ? '✓ ' : `${i+1}. `}
            {p === 'vocab' ? '📖 Vocab' : p === 'quiz' ? '✏️ Quiz' : '💬 Chat'}
          </div>
        ))}
      </div>

      {/* -- VOCAB ------------------------------------------------------- */}
      {phase === 'vocab' && vocabItem && (
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: isMobile ? 'auto' : 'calc(100vh - 110px)',
          minHeight: isMobile ? '100dvh' : undefined,
          overflow: isMobile ? 'visible' : 'hidden',
          background: '#fff',
        }}>

          {/* -- Tutor panel -- */}
          {isMobile ? (
            /* MOBILE: 영상 상단 전체 너비로 크게 */
            <div style={{ background: '#F3F4F6', borderBottom: '1px solid #E9ECEF', paddingBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
                <div style={{ position: 'relative', width: 160, height: 220, borderRadius: 16, overflow: 'hidden', background: '#1a1a2e', flexShrink: 0 }}>
                  <video
                    key={`vocab-${isSpeaking ? 'talk' : 'idle'}`}
                    src={isSpeaking ? tutor.videoTalk : tutor.videoIdle}
                    autoPlay loop muted playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                    onError={e => console.warn('Video load error', e)}
                  />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }} />
                  {isSpeaking && (
                    <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: level.accent,
                      padding: '4px 10px', borderRadius: 20, color: '#fff', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
                      Speaking...
                    </div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'center', paddingTop: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: level.accent }}>{tutor.name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>AI Tutor · {lesson.icon} {lesson.title}</div>
              </div>
            </div>
          ) : (
            /* DESKTOP: 좌측 세로 패널 */
            <div style={styles.videoCol}>
              <div style={styles.videoWrap}>
                <video
                  key={`vocab-${isSpeaking ? 'talk' : 'idle'}`}
                  src={isSpeaking ? tutor.videoTalk : tutor.videoIdle}
                  autoPlay loop muted playsInline
                  style={styles.video}
                  onError={e => console.warn('Video load error', e)}
                />
                {isSpeaking && (
                  <div style={{ ...styles.listeningBadge, background: level.accent }}>🔊 Speaking...</div>
                )}
              </div>
              <div style={{ ...styles.tutorLabel, color: level.accent }}>{tutor.name}</div>
              <div style={styles.tutorSubLabel}>AI Tutor · {lesson.icon} {lesson.title}</div>
            </div>
          )}

          {/* -- Vocab 카드 -- */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 16px 40px' : '32px 40px', display: 'flex', flexDirection: 'column' }}>
            <div style={styles.vocabCounter}>{vocabIdx + 1} / {activeLesson!.vocab.length}</div>
            <div style={{ ...styles.vocabCard, background: level.color, border: `2px solid ${level.accent}30` }}>
              <div style={{ ...styles.vocabWord, color: level.dark }}>{vocabItem.word}</div>
              {vocabItem.phonetic && (
                <div style={styles.vocabPhonetic}>[{vocabItem.phonetic}]</div>
              )}
              <div style={{ ...styles.vocabMeaning, color: level.accent }}>{vocabItem.meaning}</div>
              <div style={styles.vocabExample}>"{vocabItem.example}"</div>
              {subLang && subLang !== langId && (
                <div style={styles.txLine}>
                  {loadingTx[`vocab-ex-${vocabIdx}`]
                    ? '⏳ 번역 중...'
                    : translations[`vocab-ex-${vocabIdx}`] || ''}
                </div>
              )}
              {subLang && subLang !== langId && vocabItem.meaning && (
                <div style={styles.txMeaning}>
                  {translations[`vocab-meaning-${vocabIdx}`] || ''}
                </div>
              )}
              <button
                style={{ ...styles.speakBtn, background: isSpeaking ? '#9CA3AF' : hasTts(langId) ? level.accent : '#E5E7EB', color: hasTts(langId) ? '#fff' : '#92400E', cursor: hasTts(langId) ? 'pointer' : 'default' }}
                onClick={hasTts(langId) ? handleSpeakVocab : undefined}
                disabled={isSpeaking || !hasTts(langId)}
              >
                {isSpeaking ? '🔊 Playing...' : hasTts(langId) ? '🔊 Hear example' : '🔇 Voice unavailable'}
              </button>
            </div>
            <div style={styles.btnRow}>
              {vocabIdx > 0 && (
                <button style={styles.prevBtn} onClick={() => setVocabIdx(v => v - 1)}>← Prev</button>
              )}
              <button style={{ ...styles.nextBtn, background: level.accent }} onClick={handleNextVocab}>
                {vocabIdx < activeLesson!.vocab.length - 1 ? 'Next ->' : 'Start Quiz ->'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* -- QUIZ -------------------------------------------------------- */}
      {phase === 'quiz' && quizItem && (
        <div style={styles.phaseContent}>
          <div style={styles.vocabCounter}>Question {quizIdx + 1} / {activeLesson!.quiz.length}</div>
          <div style={{ ...styles.quizCard, background: level.color, border: `2px solid ${level.accent}30` }}>
            <div style={{ ...styles.quizQ, color: level.dark }}>{quizItem.q}</div>
            <div style={styles.optionsGrid}>
              {quizItem.options.map((opt, i) => {
                const isSelected = selectedOpt === i;
                const isCorrect  = i === quizItem.answer;
                const revealed   = selectedOpt !== null;
                let bg = '#ffffff';
                if (revealed && isCorrect) bg = '#ECFDF5';
                else if (revealed && isSelected && !isCorrect) bg = '#FFF1F2';
                let border = '2px solid #ddd';
                if (revealed && isCorrect) border = `2px solid #16A34A`;
                else if (revealed && isSelected && !isCorrect) border = `2px solid #E11D48`;
                return (
                  <button key={i} style={{ ...styles.optBtn, background: bg, border, cursor: revealed ? 'default' : 'pointer' }}
                    onClick={() => handleSelectOpt(i)}>
                    <span style={styles.optLetter}>{['A','B','C','D'][i]}</span>
                    <span style={{ ...styles.optText, color: level.dark }}>{opt}</span>
                    {revealed && isCorrect && <span style={{ marginLeft: 'auto' }}>✅</span>}
                    {revealed && isSelected && !isCorrect && <span style={{ marginLeft: 'auto' }}>❌</span>}
                  </button>
                );
              })}
            </div>
            {selectedOpt !== null && (
              <div style={{ ...styles.feedback, color: selectedOpt === quizItem.answer ? '#16A34A' : '#E11D48' }}>
                {selectedOpt === quizItem.answer ? '✅ Correct! +15 XP' : `❌ The answer is: ${quizItem.options[quizItem.answer]}`}
              </div>
            )}
          </div>
          {selectedOpt !== null && (
            <div style={styles.btnRow}>
              <button style={{ ...styles.nextBtn, background: level.accent }} onClick={handleNextQuiz}>
                {quizIdx < activeLesson!.quiz.length - 1 ? 'Next Question ->' : 'Start Chat Practice ->'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* -- CHAT -------------------------------------------------------- */}
      {phase === 'chat' && (
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: isMobile ? 'auto' : 'calc(100vh - 110px)',
          minHeight: isMobile ? '100dvh' : undefined,
          overflow: isMobile ? 'visible' : 'hidden',
          background: '#fff',
        }}>

          {/* -- Tutor panel -- */}
          {isMobile ? (
            /* MOBILE: 영상 상단 전체 너비로 크게 + 버튼 오버레이 */
            <div style={{ background: '#F3F4F6', borderBottom: '1px solid #E9ECEF', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ position: 'relative', width: 160, height: 220, borderRadius: 16, overflow: 'hidden', background: '#1a1a2e' }}>
              <video
                key={isSpeaking || isListening ? 'talk' : 'idle'}
                src={isSpeaking || isListening ? tutor.videoTalk : tutor.videoIdle}
                autoPlay loop muted playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                onError={e => console.warn('Video load error', e)}
              />
              {isListening && (
                <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: '#E11D48',
                  padding: '4px 10px', borderRadius: 20, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <span style={styles.pulse} /> Listening...
                </div>
              )}
              {isSpeaking && (
                <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: level.accent,
                  padding: '4px 10px', borderRadius: 20, color: '#fff', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
                  🔊 Speaking...
                </div>
              )}
              </div>{/* inner video box */}
              </div>{/* center wrapper */}
              <div style={{ textAlign: 'center', padding: '6px 0 8px' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: level.accent }}>{tutor.name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>AI Tutor · {lesson.icon} {lesson.title}</div>
              </div>
              {/* 버튼 바 */}
              <div style={{ padding: '0 16px 10px', display: 'flex', gap: 8 }}>
                {hasStt(langId) ? (
                  <button
                    style={{ ...styles.micBtn, flex: 1, padding: '11px', fontSize: 14, background: isListening ? '#E11D48' : level.accent }}
                    onClick={isListening ? stopAll : startListening}
                    disabled={isSpeaking || isChatThinking}
                  >
                    {isListening ? '⏹ Stop' : '🎤 Speak'}
                  </button>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Type your answer..."
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '2px solid #E2E8F0', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          handleUserMessage(e.currentTarget.value.trim());
                          e.currentTarget.value = '';
                        }
                      }}
                      disabled={isSpeaking || isChatThinking}
                    />
                    <button
                      style={{ ...styles.micBtn, padding: '10px 14px', background: level.accent }}
                      onClick={e => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                        if (input?.value.trim()) { handleUserMessage(input.value.trim()); input.value = ''; }
                      }}
                      disabled={isSpeaking || isChatThinking}
                    >➤</button>
                  </>
                )}
                <button style={{ ...styles.doneBtn, flexShrink: 0, padding: '10px 14px' }} onClick={handleFinishLesson}>
                  Done ✓
                </button>
              </div>
            </div>
          ) : (
            /* DESKTOP: 좌측 세로 패널 */
            <div style={styles.videoCol}>
              <div style={styles.videoWrap}>
                <video
                  key={isSpeaking || isListening ? 'talk' : 'idle'}
                  src={isSpeaking || isListening ? tutor.videoTalk : tutor.videoIdle}
                  autoPlay loop muted playsInline
                  style={styles.video}
                  onError={e => console.warn('Video load error', e)}
                />
                {isListening && (
                  <div style={styles.listeningBadge}>
                    <span style={styles.pulse} /> Listening...
                  </div>
                )}
                {isSpeaking && (
                  <div style={{ ...styles.listeningBadge, background: level.accent }}>
                    🔊 Speaking...
                  </div>
                )}
              </div>
              <div style={{ ...styles.tutorLabel, color: level.accent }}>{tutor.name}</div>
              <div style={styles.tutorSubLabel}>AI Tutor · {lesson.icon} {lesson.title}</div>
              <div style={styles.controls}>
                {hasStt(langId) ? (
                  <button
                    style={{ ...styles.micBtn, background: isListening ? '#E11D48' : level.accent }}
                    onClick={isListening ? stopAll : startListening}
                    disabled={isSpeaking || isChatThinking}
                  >
                    {isListening ? '⏹ Stop' : '🎤 Speak'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Type your answer..."
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '2px solid #E2E8F0', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          handleUserMessage(e.currentTarget.value.trim());
                          e.currentTarget.value = '';
                        }
                      }}
                      disabled={isSpeaking || isChatThinking}
                    />
                    <button
                      style={{ ...styles.micBtn, background: level.accent }}
                      onClick={e => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                        if (input?.value.trim()) { handleUserMessage(input.value.trim()); input.value = ''; }
                      }}
                      disabled={isSpeaking || isChatThinking}
                    >
                      Send ➤
                    </button>
                  </div>
                )}
                <button style={styles.doneBtn} onClick={handleFinishLesson}>
                  Finish Lesson ✓
                </button>
              </div>
            </div>
          )}

          {/* -- Chat messages -- */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: isMobile ? 'visible' : 'hidden', background: '#fff' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }} ref={chatAreaRef}>
              {chatMsgs.map((msg, i) => (
                <div key={i} style={msg.role === 'tutor' ? { ...styles.tutorBubble, background: level.color } : styles.userBubble}>
                  <div style={{ fontWeight: 700, color: msg.role === 'tutor' ? level.dark : '#000', fontSize: 14 }}>{msg.text}</div>
                  {msg.subtitle && (
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{msg.subtitle}</div>
                  )}
                  {msg.role === 'tutor' && subLang && subLang !== langId && (() => {
                    const key = `chat-${i}`;
                    return translations[key]
                      ? <div style={styles.txBubble}>{translations[key]}</div>
                      : loadingTx[key]
                      ? <div style={styles.txBubble}>⏳</div>
                      : null;
                  })()}
                </div>
              ))}
              {isChatThinking && (
                <div style={{ ...styles.tutorBubble, background: level.color }}>
                  <div style={{ color: '#888', fontSize: 13 }}>Thinking...</div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* -- COMPLETE --------------------------------------------------- */}
      {phase === 'complete' && (
        <div style={styles.completeWrap}>
          <div style={{ ...styles.completeCard, background: level.color, border: `2px solid ${level.accent}` }}>
            <div style={styles.completeEmoji}>🎉</div>
            <h2 style={{ ...styles.completeTitle, color: level.dark }}>Lesson Complete!</h2>
            <p style={{ ...styles.completeDesc, color: level.dark }}>{lesson.title}</p>
            <div style={{ ...styles.xpBig, color: level.accent }}>+{lesson.xp} XP earned</div>
            {quizScore === lesson.quiz.length && (
              <div style={styles.perfectBadge}>⭐ Perfect Quiz!</div>
            )}
            <div style={styles.completeBtns}>
              <button style={{ ...styles.nextLessonBtn, background: level.accent }} onClick={() => router.back()}>
                ← Back to Level
              </button>
              <button style={styles.homeBtn} onClick={() => router.push('/lingua')}>
                🏠 Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles -------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F8F9FA', color: '#111', fontFamily: "'Nunito', sans-serif", position: 'relative' },
  xpPop: { position: 'fixed', top: 80, right: 30, background: 'linear-gradient(135deg,#FFD700,#FFA500)', color: '#000', fontWeight: 900, fontSize: 18, padding: '10px 20px', borderRadius: 30, zIndex: 9999, boxShadow: '0 4px 20px #FFD70060', animation: 'fadeUp 1.4s ease forwards', pointerEvents: 'none' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid #E9ECEF', position: 'sticky', top: 0, background: '#ffffffee', backdropFilter: 'blur(10px)', zIndex: 100 },
  backBtn: { background: 'none', border: '1px solid #E9ECEF', color: '#6B7280', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Nunito', sans-serif" },
  lessonMeta: { display: 'flex', alignItems: 'center', gap: 10 },
  levelTag: { fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, color: '#fff', letterSpacing: 1 },
  lessonTitle: { fontSize: 15, fontWeight: 800, color: '#111' },
  xpDisplay: { fontSize: 14, fontWeight: 800 },
  phaseTabs: { display: 'flex', justifyContent: 'center', gap: 0, background: '#fff' },
  phaseTab: { padding: '12px 28px', fontSize: 13, fontWeight: 800, cursor: 'default', transition: 'color 0.2s, border-bottom 0.2s' },
  phaseContent: { maxWidth: 600, margin: '40px auto', padding: '0 24px' },
  splitLayout: { display: 'flex', height: 'calc(100vh - 110px)', overflow: 'hidden' },
  vocabSide: { flex: 1, overflowY: 'auto' as const, padding: '32px 40px', display: 'flex', flexDirection: 'column' as const },
  vocabCounter: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginBottom: 20, fontWeight: 700, letterSpacing: 1 },
  vocabCard: { borderRadius: 20, padding: '36px 32px', textAlign: 'center', marginBottom: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  vocabWord: { fontSize: 32, fontWeight: 900, marginBottom: 8 },
  vocabPhonetic: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 12 },
  vocabMeaning: { fontSize: 16, fontWeight: 700, marginBottom: 16 },
  vocabExample: { fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 20, fontStyle: 'italic' },
  speakBtn: { padding: '10px 24px', borderRadius: 99, border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" },
  btnRow: { display: 'flex', gap: 12, justifyContent: 'center' },
  prevBtn: { padding: '14px 28px', borderRadius: 14, border: '2px solid #E9ECEF', background: '#fff', color: '#6B7280', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" },
  nextBtn: { padding: '14px 36px', borderRadius: 14, border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" },
  quizCard: { borderRadius: 20, padding: '32px', marginBottom: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  quizQ: { fontSize: 18, fontWeight: 800, marginBottom: 24, lineHeight: 1.4, color: '#111' },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  optBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, textAlign: 'left', fontFamily: "'Nunito', sans-serif", transition: 'transform 0.1s' },
  optLetter: { width: 28, height: 28, borderRadius: 99, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#6B7280', flexShrink: 0 },
  optText: { fontSize: 14, fontWeight: 700, flex: 1 },
  feedback: { marginTop: 16, fontWeight: 800, fontSize: 15, textAlign: 'center' },
  chatLayout: { display: 'flex', height: 'calc(100vh - 110px)', overflow: 'hidden' },
  videoCol: { width: 300, flexShrink: 0, background: '#F3F4F6', borderRight: '1px solid #E9ECEF', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', gap: 12, overflowY: 'auto' as const },
  videoWrap: { position: 'relative', width: '100%', height: 280, background: '#E5E7EB', borderRadius: 16, overflow: 'hidden', flexShrink: 0 },
  video: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', borderRadius: 16 },
  listeningBadge: { position: 'absolute', top: 12, left: 12, background: '#E11D48', padding: '6px 12px', borderRadius: 20, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 },
  pulse: { width: 8, height: 8, background: '#fff', borderRadius: 99, animation: 'pulse 1s infinite' },
  tutorLabel: { fontSize: 16, fontWeight: 900, color: '#111' },
  tutorSubLabel: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  controls: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 'auto' },
  micBtn: { padding: '14px', borderRadius: 14, border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", width: '100%' },
  doneBtn: { padding: '12px', borderRadius: 14, border: '1px solid #E9ECEF', background: '#fff', color: '#6B7280', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", width: '100%' },
  chatCol: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' },
  chatArea: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 },
  tutorBubble: { alignSelf: 'flex-start', maxWidth: '75%', padding: '14px 18px', borderRadius: '0 18px 18px 18px', border: '1px solid #E9ECEF' },
  userBubble: { alignSelf: 'flex-end', maxWidth: '75%', padding: '14px 18px', borderRadius: '18px 0 18px 18px', background: '#38BDF8', color: '#000', fontWeight: 700, fontSize: 14 },
  completeWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 110px)', padding: 24, background: '#F8F9FA' },
  completeCard: { borderRadius: 24, padding: '48px 36px', textAlign: 'center', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  completeEmoji: { fontSize: 64, marginBottom: 16 },
  completeTitle: { fontSize: 32, fontWeight: 900, marginBottom: 8 },
  completeDesc: { fontSize: 16, marginBottom: 20, opacity: 0.7 },
  xpBig: { fontSize: 36, fontWeight: 900, marginBottom: 12 },
  perfectBadge: { background: '#FFD700', color: '#000', padding: '8px 20px', borderRadius: 99, fontSize: 14, fontWeight: 800, marginBottom: 20, display: 'inline-block' },
  completeBtns: { display: 'flex', gap: 12, justifyContent: 'center' },
  nextLessonBtn: { padding: '14px 28px', borderRadius: 14, border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" },
  homeBtn: { padding: '14px 20px', borderRadius: 14, border: '2px solid #E9ECEF', background: '#fff', color: '#6B7280', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" },
  txLine: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginTop: 6, padding: '4px 10px', background: 'rgba(0,0,0,0.04)', borderRadius: 8 },
  txMeaning: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  txBubble: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginTop: 6, padding: '4px 8px', background: 'rgba(0,0,0,0.04)', borderRadius: 8 },
};
