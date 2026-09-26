'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CURRICULUM } from '@/data/curriculum';
import { getTutorById, getTutorForLang } from '@/data/tutors';
import { LEARN_LANGUAGES } from '@/data/languages';
import TrialExpiredModal from '@/components/TrialExpiredModal';
import { getTrialData, initTrial, isTrialExpired, isPremium, TRIAL_MAX_UNITS } from '@/lib/trialPolicy';
import { isAdminEmail } from '@/lib/subscription';
import { addCardToSRS } from '@/lib/spacedRepetition';

const hasStt = (langId: string) => LEARN_LANGUAGES.find(l => l.code === langId)?.stt ?? false;
const hasTts = (langId: string) => LEARN_LANGUAGES.find(l => l.code === langId)?.tts ?? false;

// -- Bulk translation validation (Option A hardening) --------------------------
// Returns an error description string, or null when the payload is acceptable.
function validateBulkTranslation(parsed: any, lsn: { vocab?: any[]; quiz?: any[] } | undefined | null): string | null {
  if (!parsed || typeof parsed !== 'object') return 'empty payload';
  const baseVocab = lsn?.vocab || [];
  const baseQuiz = lsn?.quiz || [];
  if (!Array.isArray(parsed.vocab) || parsed.vocab.length !== baseVocab.length) {
    return `vocab length mismatch (got ${Array.isArray(parsed.vocab) ? parsed.vocab.length : 'n/a'}, expected ${baseVocab.length})`;
  }
  for (let i = 0; i < parsed.vocab.length; i++) {
    const v = parsed.vocab[i];
    if (!v || !v.word || !v.meaning || !v.example) return `vocab[${i}] missing word/meaning/example`;
    if (!v.exampleKo) return `vocab[${i}] missing exampleKo`;
    if (!v.phonetic) return `vocab[${i}] missing phonetic`;
  }
  if (!Array.isArray(parsed.quiz) || parsed.quiz.length !== baseQuiz.length) {
    return `quiz length mismatch (got ${Array.isArray(parsed.quiz) ? parsed.quiz.length : 'n/a'}, expected ${baseQuiz.length})`;
  }
  for (let i = 0; i < parsed.quiz.length; i++) {
    const q = parsed.quiz[i];
    if (!q || !q.q || !Array.isArray(q.options) || q.options.length < 2) return `quiz[${i}] missing q/options`;
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
      return `quiz[${i}] answer index out of range (${q.answer})`;
    }
    // answerText must equal the correct option — catches silent option reordering
    if (!q.answerText || q.options[q.answer] !== q.answerText) {
      return `quiz[${i}] answer/answerText mismatch`;
    }
  }
  return null;
}

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
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  // Pronunciation practice (vocab phase)
  const [pronListening, setPronListening] = useState(false);
  const [pronLoading, setPronLoading] = useState(false);
  const [pronError, setPronError] = useState<string|null>(null);
  const [pronResult, setPronResult] = useState<Record<number, { heard: string; score: number; feedback: string } | null>>({});
  // Save vocab to SRS Review deck
  const [savedWords, setSavedWords] = useState<Record<number, boolean>>({});
  const [savingWord, setSavingWord] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatLangMode, setChatLangMode] = useState<'target'|'native'|'mixed'>('target');
  const [chatLevel,    setChatLevel]    = useState<'easy'|'normal'|'advanced'>('normal');
  const [msgTranslations, setMsgTranslations] = useState<Record<number,string>>({});
  const [translatingIdx,  setTranslatingIdx]  = useState<number|null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXPPop, setShowXPPop] = useState(false);
  const [xpPopVal, setXpPopVal] = useState(0);
  const [resumeOffer, setResumeOffer] = useState<null | { phase: Phase; vocabIdx: number; quizIdx: number; xpEarned: number }>(null);
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

  // -- STT setup + 마이크 권한 미리 요청 -------------------------------------
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

    // 마이크 권한 미리 요청 (한 번만) — 이후 매번 팝업 방지
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(status => {
          if (status.state === 'prompt') {
            // 아직 허용 안 됨 → getUserMedia로 미리 요청
            navigator.mediaDevices?.getUserMedia({ audio: true })
              .then(stream => stream.getTracks().forEach(t => t.stop()))
              .catch(() => {}); // 거부해도 무시
          }
        }).catch(() => {});
    }
  }, [langId]);

  // -- Init trial status (7일 정책 기반) --------------------------------------
  useEffect(() => {
    if (!user) return; // 게스트는 trial 제한 없음
    async function checkTrial() {
      try {
        // 프리미엄이면 패스
        if (await isPremium(user!.uid, user?.email)) return;
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

  // -- P1-6: 레슨 진행 상황 저장/복원 -----------------------------------------
  const PROGRESS_KEY = 'mt_lesson_progress';

  // 마운트 시 저장된 진행 확인 → 이어하기 제안
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.lessonId !== lessonId || saved.phase === 'complete') return;
      // 의미 있는 진행이 있을 때만 제안 (vocab 첫 카드 제외)
      const hasProgress = saved.phase !== 'vocab' || (saved.vocabIdx || 0) > 0;
      if (hasProgress) setResumeOffer(saved);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 진행 변경 시 저장 / 완료 시 삭제
  useEffect(() => {
    if (resumeOffer) return; // 이어하기 선택 전에는 덮어쓰지 않음
    try {
      if (phase === 'complete') {
        localStorage.removeItem(PROGRESS_KEY);
        return;
      }
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        lessonId, phase, vocabIdx, quizIdx, xpEarned, savedAt: Date.now(),
      }));
    } catch { /* ignore */ }
  }, [lessonId, phase, vocabIdx, quizIdx, xpEarned, resumeOffer]);

  // 레슨 중 새로고침/탭 닫기 경고
  useEffect(() => {
    if (phase === 'complete') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [phase]);

  // -- Translate lesson content when non-English --------------------------------
  const [txError, setTxError] = useState<string | null>(null);
  // Incremented by the error banner's Retry button to re-run the translation effect
  const [txAttempt, setTxAttempt] = useState(0);

  // 사전생성 JSON이 있는 언어 목록 (public/curriculum/ 폴더)
  const PREGENERATED_LANGS = new Set([
    'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW',
    'es-ES', 'fr-FR', 'de-DE', 'pt-BR', 'it-IT', 'ru-RU',
  ]);

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

  useEffect(() => {
    const lvl = CURRICULUM.find(l => l.id === levelId);
    const stp = lvl?.steps.find(s => s.id === stepId);
    const lsn = stp?.lessons.find(l => l.id === lessonId);

    if (!lsn) { console.warn('[lesson] lesson not found'); return; }
    if (authLoading) return;

    // 영어는 번역 불필요
    if (langId === 'en-US' || langId === 'en-GB') {
      setTranslatedLesson(null);
      return;
    }

    setIsTranslating(true);
    setTxError(null);
    setTranslatedLesson(null);

    const targetLang = langNames[langId] || langId;
    const nativeLang = nativeNames[subLang] || 'English';

    // 관리자 설정: localStorage의 curriculum_mode 확인
    // 'api' = Gemini 우선 (기본), 'json' = JSON 우선
    const curriculumMode = typeof window !== 'undefined'
      ? (localStorage.getItem('mt_curriculum_mode') || 'api')
      : 'api';

    if (curriculumMode === 'json' && PREGENERATED_LANGS.has(langId)) {
      // Admin 패널에서 JSON 모드로 설정한 경우만 실행
      // 일반 학습자는 이 분기에 절대 진입하지 않음
      console.log(`[lesson] 📦 Admin JSON mode: ${langId}`);
      fetch(`/curriculum/${langId}.json`)
        .then(async r => {
          if (!r.ok) throw new Error(`JSON file missing: ${r.status}`);
          const data = await r.json();
          const pre = data.lessons?.find((l: { id: string }) => l.id === lessonId);
          if (!pre) throw new Error(`Lesson ${lessonId} not in JSON`);
          console.log('[lesson] ✅ JSON loaded (Admin mode)');
          setTranslatedLesson({ ...lsn, ...pre });
          setIsTranslating(false);
        })
        .catch(e => {
          // JSON 모드 실패 → Gemini로 자동 전환하지 않음. Admin이 파일을 고쳐야 함
          console.error('[lesson] Admin JSON mode failed:', e.message);
          setTxError(`JSON unavailable for ${targetLang}. Fix in Admin panel or switch to API mode.`);
          setIsTranslating(false);
        });
      return;
    }

    // API 모드 (기본값) — Gemini만 사용, JSON fallback 없음
    // 학습창은 항상 이 경로로 실행됨
    console.log(`[lesson] 🤖 Gemini API: translating to ${targetLang}...`);
    callGeminiFallback(lsn, targetLang, nativeLang);

    function callGeminiFallback(lsn: typeof lesson, targetLang: string, nativeLang: string, attempt = 0) {
      // Slim payload — exclude tutorPrompt to reduce token count ~40%
      // NOTE: example is included so the model TRANSLATES it (never invents a new one)
      // topic is included so discourse markers/connectors can be disambiguated by context
      const vocabOnly = (lsn!.vocab || []).map((v: any) => ({ word: v.word, meaning: v.meaning, example: v.example }));
      const quizOnly  = (lsn!.quiz  || []).map((q: any) => ({ q: q.q, options: q.options, answer: q.answer }));
      const lessonPayload = { topic: (lsn as any)?.title || '', vocab: vocabOnly, quiz: quizOnly };
      const prompt = `Translate this lesson to ${targetLang}. Student speaks ${nativeLang}.

Input: ${JSON.stringify(lessonPayload)}

Return ONLY valid JSON, no markdown, no explanation:
{"vocab":[{"word":"TARGET_WORD","phonetic":"PRONUNCIATION","meaning":"NATIVE_GLOSS","example":"TARGET_SENTENCE","exampleKo":"NATIVE_TRANSLATION"}],"quiz":[{"q":"NATIVE_QUESTION","options":["TARGET_OPTION"],"answer":INDEX,"answerText":"TARGET_CORRECT_OPTION_TEXT"}]}

Rules:
- vocab[i].word: the word/expression translated into ${targetLang}
- vocab[i].phonetic: pronunciation guide a ${nativeLang} speaker can read aloud. If ${nativeLang} is Korean, use Hangul-style notation (e.g. "봉주르"); otherwise simple romanization.
- vocab[i].meaning: 1-3 word gloss of the TARGET expression itself in ${nativeLang}. Do NOT translate the usage note from the input — give what the expression actually means (e.g. Korean "~인 것 같다" for "Il semblerait que"). When the expression carries register or pragmatic nuance, append a tag in ${nativeLang} (e.g. Korean "[격식]", "[비격식]", "[문어체]", "[구어]", "[빈정]", "[반어]", "[완곡]").
- Idioms: NEVER translate an idiom literally. If ${targetLang} has an equivalent idiom, use it; otherwise translate the actual meaning explanatorily (e.g. "kick the can down the road" must become "문제를 뒤로 미루다"-style meaning, never a literal kick/can rendering).
- Discourse markers / connectors (e.g. "Nevertheless", "That said", "What is more", "Notwithstanding"): use the lesson topic to choose the nuance that fits the context — do not default to one generic translation for every lesson.
- Grammar with no ${targetLang} equivalent (e.g. English inversion "Were it not for…", "Should you need…"): keep the original structure, translate the sentence naturally, and add a short grammar note in ${nativeLang} inside the meaning field (in parentheses) explaining the structure and the natural ${targetLang} equivalent.
- vocab[i].example: translate the GIVEN example sentence into ${targetLang}, keeping the same meaning. Do NOT invent a new sentence.
- vocab[i].exampleKo: translation of the example sentence into ${nativeLang}
- quiz[i].q: question in ${nativeLang}
- quiz[i].options: answer choices in ${targetLang}
- quiz[i].answer: integer index (0-based) of the correct option
- quiz[i].answerText: the EXACT text of the correct option (must be identical to options[answer]) — this guards against option reordering
IMPORTANT: Output must be complete valid JSON. Do not truncate.`;

      fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user?.uid ?? null, prompt, temperature: 0.3 }),
      })
        .then(async r => {
          const data = await r.json();
          if (data.error) throw new Error(data.error);
          const raw = data.text?.trim() ?? '';

          // Step 1: strip markdown fences
          let clean = raw
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```[\s\S]*$/i, '')
            .trim();

          // Step 2: extract JSON object if embedded in text
          const jsonMatch = clean.match(/\{[\s\S]*\}/);
          if (jsonMatch) clean = jsonMatch[0];

          // Step 3: parse with truncation recovery
          let parsed: any = null;
          try {
            parsed = JSON.parse(clean);
          } catch (e1) {
            // Try to fix truncated JSON — add closing brackets
            console.warn('[lesson] JSON truncated, attempting repair...');
            let fixed = clean;
            // Count open/close braces and brackets
            const openBraces   = (fixed.match(/\{/g) || []).length;
            const closeBraces  = (fixed.match(/\}/g) || []).length;
            const openBrackets = (fixed.match(/\[/g) || []).length;
            const closeBrackets= (fixed.match(/\]/g) || []).length;
            // Remove trailing comma if any
            fixed = fixed.replace(/,\s*$/, '');
            // Close incomplete string
            const lastQuote = fixed.lastIndexOf('"');
            const secondLast = fixed.lastIndexOf('"', lastQuote - 1);
            if (lastQuote > secondLast && (fixed.length - lastQuote) > 30) {
              fixed = fixed.slice(0, lastQuote) + '"'; // truncate dangling string
            }
            // Append missing closing brackets/braces
            for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
            for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
            try {
              parsed = JSON.parse(fixed);
              console.log('[lesson] ✅ JSON repaired successfully');
            } catch (e2) {
              console.error('[lesson] JSON repair failed:', e2);
              throw new Error('Invalid JSON from Gemini: ' + String(e1));
            }
          }

          if (!parsed?.vocab && !parsed?.quiz) throw new Error('Empty lesson data');

          // Option A: validate bulk translation before accepting it
          const validationError = validateBulkTranslation(parsed, lsn);
          if (validationError) {
            if (attempt < 1) {
              console.warn(`[lesson] validation failed (${validationError}) — retrying once...`);
              callGeminiFallback(lsn, targetLang, nativeLang, attempt + 1);
              return;
            }
            throw new Error('Translation validation failed: ' + validationError);
          }

          setTranslatedLesson({ ...lsn!, ...parsed });
          setIsTranslating(false);
        })
        .catch(e => {
          // API 모드: JSON fallback 없음 — 에러 표시
          console.error('[lesson] Gemini API error:', e.message || e);
          setTxError(e?.message || 'Translation failed. Please try again.');
          setIsTranslating(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, langId, subLang, user?.uid, txAttempt]);

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
  // 이모지 및 특수문자 제거 (TTS가 "웃음", "하트" 등으로 읽는 문제 방지)
  const stripForTts = (text: string): string => {
    return text
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')   // 이모지 전체 범위
      .replace(/[\u{2600}-\u{27BF}]/gu, '')      // 기호 이모지
      .replace(/[\u{FE00}-\u{FEFF}]/gu, '')      // variation selectors
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')    // supplemental symbols
      .replace(/[\u200D\u20E3\uFE0F]/gu, '')    // ZWJ, keycap, variation
      .replace(/\s{2,}/g, ' ')                    // 연속 공백 정리
      .trim();
  };

  const speakText = async (text: string, onEnd?: () => void): Promise<void> => {
    const cleanText = stripForTts(text);
    if (!cleanText) { onEnd?.(); return; }
    // TTS 미지원 언어면 바로 콜백만 실행
    if (!hasTts(langId)) { onEnd?.(); return; }
    stopAll();
    setIsSpeaking(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, lang: langId, gender: tutor?.gender || 'female', level: levelId }),
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

  // Translate a specific chat message on demand
  const translateMsgAtIdx = async (idx: number, text: string) => {
    if (msgTranslations[idx]) return; // already translated
    setTranslatingIdx(idx);
    try {
      const res = await fetch('/api/gemini', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ uid:user?.uid??null, temperature:0.1,
          prompt:`Translate to ${nativeNames[subLang]||'Korean'}. Reply ONLY with translation:
"${text}"` })
      });
      const data = await res.json();
      if (data.text) {
        setMsgTranslations(prev => ({...prev, [idx]: data.text.trim().replace(/^"|"$/g,'')}));
      }
    } catch {}
    setTranslatingIdx(null);
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
    setPronError(null);
    if (vocabIdx < activeLesson.vocab.length - 1) {
      setVocabIdx(v => v + 1);
    } else {
      setPhase('quiz');
    }
  };

  // auto-translate vocab on load — FALLBACK ONLY.
  // The bulk translation already provides `exampleKo` (native example translation)
  // and a native `meaning` gloss; per-item calls run only when bulk data is absent
  // (e.g. translation failed and we fell back to the English lesson).
  const vocabExKey = `${lessonId}:${langId}:vocab-ex-${vocabIdx}`;
  const vocabMeanKey = `${lessonId}:${langId}:vocab-meaning-${vocabIdx}`;
  const bulkNative = !!((vocabItem as any)?.exampleKo);
  useEffect(() => {
    if (vocabItem && subLang && subLang !== langId && !bulkNative) {
      translateText(vocabItem.example, vocabExKey);
      translateText(vocabItem.meaning, vocabMeanKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabIdx, phase, langId, lessonId, translatedLesson]);

  const handleSpeakVocab = async () => {
    if (!vocabItem) return;
    await speakText(vocabItem.example);
  };

  // Save current vocab word to the SRS Review deck
  const handleSaveToReview = async () => {
    if (!vocabItem || savingWord || savedWords[vocabIdx]) return;
    if (!user) { setPronError('Log in to save words to Review.'); return; }
    setSavingWord(true);
    try {
      await addCardToSRS(user.uid, vocabItem.word, vocabItem.meaning, langId);
      setSavedWords(s => ({ ...s, [vocabIdx]: true }));
    } catch (e) {
      console.warn('[lesson] save to SRS failed:', e);
      setPronError('Could not save this word. Please try again.');
    } finally {
      setSavingWord(false);
    }
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
    setExplanation(null);
    setExplaining(false);
    if (quizIdx < activeLesson.quiz.length - 1) {
      setQuizIdx(q => q + 1);
    } else {
      // Quiz done -> enter chat
      setPhase('chat');
      startChat();
    }
  };

  // "왜 틀렸어요?" — AI explains the wrong answer (Explain My Answer)
  const handleExplain = async () => {
    if (!quizItem || selectedOpt === null || explaining) return;
    setExplaining(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid,
          temperature: 0.4,
          prompt: `You are a friendly language tutor. A student learning ${langNames[langId] || langId} got this quiz question wrong.\nQuestion: ${quizItem.q}\nOptions: ${quizItem.options.map((o: string, i: number) => `${['A','B','C','D'][i]}) ${o}`).join(' | ')}\nCorrect answer: ${quizItem.options[quizItem.answer]}\nStudent chose: ${quizItem.options[selectedOpt]}\nExplain in ${nativeNames[subLang] || 'Korean'}, in 2-3 short sentences: why the correct answer is right, and why the student's choice is wrong. Be encouraging, never condescending. No emojis.`,
        }),
      });
      const data = await res.json();
      if (data.text) setExplanation(data.text.trim());
    } catch { /* keep silent on failure */ }
    finally { setExplaining(false); }
  };

  // Pronunciation practice — speak the vocab word, get AI feedback on specific sounds
  const handlePronPractice = () => {
    if (!vocabItem || pronListening || pronLoading) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setPronError('Speech recognition is not supported in this browser. Please use Chrome on desktop or Android.');
      return;
    }
    setPronError(null);
    const rec = new SR();
    rec.lang = langId;
    rec.continuous = false;
    rec.interimResults = false;
    setPronListening(true);
    rec.onresult = async (e: any) => {
      setPronListening(false);
      const transcript: string = e.results[0][0].transcript;
      setPronLoading(true);
      try {
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user?.uid,
            temperature: 0.3,
            prompt: `You are a pronunciation coach for ${langNames[langId] || langId} learners.\nThe student tried to say: "${vocabItem.word}" (pronunciation guide: ${vocabItem.phonetic || 'n/a'}, meaning: ${vocabItem.meaning}).\nSpeech recognition heard them say: "${transcript}".\nCompare what they said vs the target. Reply in ${nativeNames[subLang] || 'Korean'} with ONLY JSON, no markdown:\n{"score":<0-100>,"heard":"<what you think they actually said>","feedback":"<1-2 sentences: which exact sound was off and how to fix it (e.g. tongue position, sound length). If great, praise briefly and specifically>"}`,
          }),
        });
        const data = await res.json();
        const parsed = JSON.parse((data.text || '').replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim());
        setPronResult(prev => ({
          ...prev,
          [vocabIdx]: {
            heard: parsed.heard || transcript,
            score: typeof parsed.score === 'number' ? parsed.score : 70,
            feedback: parsed.feedback || '',
          },
        }));
      } catch {
        setPronResult(prev => ({ ...prev, [vocabIdx]: { heard: transcript, score: 0, feedback: '' } }));
        setPronError('Could not analyze your pronunciation. Please try again.');
      } finally {
        setPronLoading(false);
      }
    };
    rec.onerror = () => {
      setPronListening(false);
      setPronError('Speech recognition ran into a problem. Please try again.');
    };
    rec.onend = () => setPronListening(false);
    try { rec.start(); } catch { setPronListening(false); }
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
          prompt: `You are a ${langNames[langId] || langId} language tutor.
TARGET LANGUAGE: ${langNames[langId] || langId}
CHAT LEVEL: ${chatLevel === 'easy' ? 'EASY — use only the simplest words, very short sentences, like talking to a 5-year-old learner' : chatLevel === 'advanced' ? 'ADVANCED — natural, complex sentences' : 'NORMAL — simple but natural sentences'}
LANGUAGE MODE: ${chatLangMode === 'native' ? `Reply in ${nativeNames[subLang]||'the student native language'} — student wants to understand fully` : chatLangMode === 'mixed' ? `Mix ${langNames[langId]||langId} and ${nativeNames[subLang]||'native language'} — help student understand` : `Reply ONLY in ${langNames[langId]||langId}`}
Generate a warm 1-2 sentence opening. End with a simple question.`,
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
            `You are a ${langNames[langId]||langId} language tutor.
LANGUAGE RULES:
${chatLangMode==='native' ? `- Reply ONLY in ${nativeNames[subLang]||'the student native language'} so student understands fully` : chatLangMode==='mixed' ? `- Mix ${langNames[langId]||langId} and ${nativeNames[subLang]||'native language'} naturally` : `- Reply ONLY in ${langNames[langId]||langId}`}
LEVEL: ${chatLevel==='easy' ? 'EASY — extremely simple words, max 1 sentence, like for a complete beginner child' : chatLevel==='advanced' ? 'ADVANCED — natural complex expressions' : `${levelId.toUpperCase()} — ${levelId.startsWith('a')?'beginner simple words':levelId.startsWith('b')?'intermediate everyday':' advanced natural'}`}
RULES:
- 2-3 short sentences max
- Warm and encouraging
- No emojis (TTS will read them)
- Topic context: ${(activeLesson!.tutorPrompt??lesson!.tutorPrompt)}`,
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
        if (data.error === 'CHAT_LIMIT_REACHED' && !isAdminEmail(user?.email)) {
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

  // -- Trial timer removed -- using 7-day policy --------------------------------

  const langInfo = LEARN_LANGUAGES.find(l => l.code === langId);

  // -----------------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------------
  return (
    <div style={styles.page}>

      {/* -- Resume offer (P1-6) ------------------------------------------- */}
      {resumeOffer && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.45)', zIndex:9000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, maxWidth:380, width:'100%',
            textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📖</div>
            <div style={{ fontSize:18, fontWeight:900, color:'#0F172A', marginBottom:8 }}>
              Continue where you left off?
            </div>
            <div style={{ fontSize:13, color:'#64748B', fontWeight:600, marginBottom:20 }}>
              You were in the {resumeOffer.phase === 'vocab' ? 'Vocabulary' : resumeOffer.phase === 'quiz' ? 'Quiz' : 'Conversation'} step.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => {
                  setPhase(resumeOffer.phase);
                  setVocabIdx(resumeOffer.vocabIdx || 0);
                  setQuizIdx(resumeOffer.quizIdx || 0);
                  setXpEarned(resumeOffer.xpEarned || 0);
                  setResumeOffer(null);
                }}
                style={{ flex:1, padding:'12px 0', borderRadius:12, border:'none',
                  background:'#6366F1', color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer' }}>
                ▶ Resume
              </button>
              <button onClick={() => {
                  try { localStorage.removeItem('mt_lesson_progress'); } catch { /* ignore */ }
                  setResumeOffer(null);
                }}
                style={{ flex:1, padding:'12px 0', borderRadius:12, border:'1px solid #E2E8F0',
                  background:'#fff', color:'#64748B', fontWeight:800, fontSize:14, cursor:'pointer' }}>
                Start over
              </button>
            </div>
          </div>
        </div>
      )}


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
            onClick={() => setTxAttempt(a => a + 1)}
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
                  {bulkNative ? (vocabItem as any).exampleKo
                    : loadingTx[vocabExKey]
                    ? '⏳ 번역 중...'
                    : translations[vocabExKey] || ''}
                </div>
              )}
              {subLang && subLang !== langId && vocabItem.meaning && !bulkNative && (
                <div style={styles.txMeaning}>
                  {loadingTx[vocabMeanKey] ? '⏳ 번역 중...' : translations[vocabMeanKey] || ''}
                </div>
              )}
              <button
                style={{ ...styles.speakBtn, background: isSpeaking ? '#9CA3AF' : hasTts(langId) ? level.accent : '#E5E7EB', color: hasTts(langId) ? '#fff' : '#92400E', cursor: hasTts(langId) ? 'pointer' : 'default' }}
                onClick={hasTts(langId) ? handleSpeakVocab : undefined}
                disabled={isSpeaking || !hasTts(langId)}
              >
                {isSpeaking ? '🔊 Playing...' : hasTts(langId) ? '🔊 Hear example' : '🔇 Voice unavailable'}
              </button>
              {hasStt(langId) && (
                <button
                  onClick={handlePronPractice}
                  disabled={pronListening || pronLoading}
                  style={{
                    ...styles.speakBtn, marginTop: 8,
                    background: pronListening ? '#EF4444' : '#fff',
                    color: pronListening ? '#fff' : level.dark,
                    border: `1.5px solid ${pronListening ? '#EF4444' : level.accent + '50'}`,
                    cursor: pronListening || pronLoading ? 'default' : 'pointer',
                    opacity: pronLoading ? 0.6 : 1,
                  }}
                >
                  {pronListening ? '🎤 Listening... speak now!' : pronLoading ? '⏳ Analyzing...' : '🎤 Practice pronunciation'}
                </button>
              )}
              <button
                onClick={handleSaveToReview}
                disabled={savingWord || !!savedWords[vocabIdx]}
                style={{
                  ...styles.speakBtn, marginTop: 8,
                  background: savedWords[vocabIdx] ? '#ECFDF5' : '#fff',
                  color: savedWords[vocabIdx] ? '#059669' : level.dark,
                  border: `1.5px solid ${savedWords[vocabIdx] ? '#A7F3D0' : level.accent + '50'}`,
                  cursor: savedWords[vocabIdx] ? 'default' : 'pointer',
                  opacity: savingWord ? 0.6 : 1,
                }}
              >
                {savedWords[vocabIdx] ? '✅ Saved to Review' : savingWord ? '⏳ Saving...' : '🔖 Save to Review'}
              </button>
              {pronError && (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#B91C1C' }}>
                  ⚠️ {pronError}
                </div>
              )}
              {pronResult[vocabIdx]?.feedback ? (
                <div style={{
                  marginTop: 10, padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                  background: pronResult[vocabIdx]!.score >= 80 ? '#ECFDF5' : '#FFFBEB',
                  border: `1px solid ${pronResult[vocabIdx]!.score >= 80 ? '#A7F3D0' : '#FDE68A'}`,
                  animation: 'fadeUp .3s ease',
                }}>
                  <div style={{
                    fontSize: 13, fontWeight: 900,
                    color: pronResult[vocabIdx]!.score >= 80 ? '#059669' : '#D97706', marginBottom: 4,
                  }}>
                    🎯 Pronunciation score: {pronResult[vocabIdx]!.score}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>
                    Heard: &ldquo;{pronResult[vocabIdx]!.heard}&rdquo;
                  </div>
                  <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, lineHeight: 1.7 }}>
                    {pronResult[vocabIdx]!.feedback}
                  </div>
                </div>
              ) : null}
            </div>
            <div style={styles.btnRow}>
              {vocabIdx > 0 && (
                <button style={styles.prevBtn} onClick={() => { setPronError(null); setVocabIdx(v => v - 1); }}>← Prev</button>
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
            {selectedOpt !== null && selectedOpt !== quizItem.answer && (
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button
                  onClick={handleExplain}
                  disabled={explaining}
                  style={{
                    padding: '9px 18px', borderRadius: 99, border: `1.5px solid ${level.accent}40`,
                    background: '#fff', color: level.dark, fontWeight: 800, fontSize: 13,
                    cursor: explaining ? 'default' : 'pointer', fontFamily: "'Nunito',sans-serif",
                    opacity: explaining ? 0.6 : 1,
                  }}>
                  {explaining ? '⏳ 설명 가져오는 중...' : '🤔 왜 틀렸어요?'}
                </button>
                {explanation && (
                  <div style={{
                    marginTop: 10, padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                    background: '#EFF6FF', border: '1px solid #BFDBFE',
                    color: '#1E3A8A', fontSize: 13, fontWeight: 600, lineHeight: 1.7,
                    animation: 'fadeUp .3s ease',
                  }}>
                    <span style={{ fontWeight: 900 }}>💡 </span>{explanation}
                  </div>
                )}
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
                  {/* Demand translation result */}
                  {msg.role === 'tutor' && msgTranslations[i] && (
                    <div style={{ marginTop:6, paddingTop:6, borderTop:`1px solid ${level.accent}30`,
                      fontSize:12, color:'#6B7280', fontStyle:'italic', lineHeight:1.5 }}>
                      {msgTranslations[i]}
                    </div>
                  )}
                  {/* Translate button */}
                  {msg.role === 'tutor' && subLang && subLang !== langId && (
                    <button
                      onClick={() => translateMsgAtIdx(i, msg.text)}
                      disabled={translatingIdx === i}
                      style={{ marginTop:5, padding:'2px 8px', borderRadius:6,
                        border:`1px solid ${level.accent}40`, background:'#fff',
                        fontSize:10, fontWeight:700, color:level.accent, cursor:'pointer',
                        fontFamily:"'Nunito',sans-serif", display:'block' }}>
                      {translatingIdx===i ? '...' : msgTranslations[i] ? '✓' : '🌐 Translate'}
                    </button>
                  )}
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
            {/* 게스트(a1-1-1 완료) 업셀 안내 */}
            {!user && (
              <div style={{ margin: '20px 0', padding: '20px', background: 'linear-gradient(135deg,#6366F120,#8B5CF620)', borderRadius: 18, border: '2px solid #6366F140' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>🚀</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>
                  Great job! Ready for more?
                </div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>
                  Sign up free to unlock all A1 lessons and track your progress!
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => router.push('/signup')}
                    style={{ padding: '11px 22px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                    Sign Up Free 🎉
                  </button>
                  <button
                    onClick={() => router.push('/pricing')}
                    style={{ padding: '11px 22px', borderRadius: 14, border: '2px solid #6366F1', background: '#fff', color: '#6366F1', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                    View Plans
                  </button>
                </div>
              </div>
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
