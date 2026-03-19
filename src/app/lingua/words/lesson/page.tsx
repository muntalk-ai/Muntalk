'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { POS_META, PartOfSpeech, getSetKey } from '@/data/wordSets';
import { getTutorById } from '@/data/tutors';
import { hasTts } from '@/data/languages';

interface WordData {
  word: string;
  sentences: string[];
  translation: string;
  sentenceTranslations: string[];
  loading: boolean;
}
interface QuizQuestion { q: string; options: string[]; answer: number; }
interface ChatMessage  { role: 'user' | 'tutor'; text: string; }
type Phase = 'vocab' | 'quiz' | 'chat' | 'complete';

async function callGemini(prompt: string, temperature = 0.7): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, temperature }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gemini error');
  return data.text || '';
}

function WordLessonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pos     = (searchParams.get('pos')    || 'Verbs') as PartOfSpeech;
  const setIdx  = parseInt(searchParams.get('set')    || '1');
  const lessonIdx = parseInt(searchParams.get('lesson') || '1');
  const lang    = searchParams.get('lang')    || 'en-US';
  const subLang = searchParams.get('subLang') || 'ko-KR';

  const meta = POS_META[pos];

  // tutor
  const [tutorId, setTutorId] = useState('t01');
  useEffect(() => {
    setTutorId(localStorage.getItem('mt_tutor_id') || 't01');
  }, []);
  const tutor = getTutorById(tutorId);
  const ttsAvailable = hasTts(lang);

  // -- State ------------------------------------------------------------------
  const [words, setWords]               = useState<string[]>([]);
  const [wordDataMap, setWordDataMap]   = useState<Record<string, WordData>>({});
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [phase, setPhase]               = useState<Phase>('vocab');

  // TTS / video
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [isListening, setIsListening]   = useState(false);
  const audioRef                        = useRef<HTMLAudioElement | null>(null);
  const recognitionRef                  = useRef<any>(null);

  // Quiz
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading]   = useState(false);
  const [currentQ, setCurrentQ]         = useState(0);
  const [selected, setSelected]         = useState<number | null>(null);
  const [score, setScore]               = useState(0);
  const [quizDone, setQuizDone]         = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]       = useState('');
  const [chatLoading, setChatLoading]   = useState(false);
  const chatEndRef                      = useRef<HTMLDivElement>(null);

  // -- STT setup --------------------------------------------------------------
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false; rec.lang = lang;
    rec.onresult = (e: any) => {
      setIsListening(false);
      sendChatMessage(e.results[0][0].transcript);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recognitionRef.current = rec;
  }, [lang]);

  // -- TTS --------------------------------------------------------------------
  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(false);
  };

  const speakText = async (text: string, onEnd?: () => void) => {
    stopAudio();
    setIsSpeaking(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang, gender: tutor.gender, level: 'a1' }),
      });
      const data = await res.json();
      if (!data.audioContent) { setIsSpeaking(false); onEnd?.(); return; }
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); audioRef.current = null; onEnd?.(); };
      audio.onerror = () => { setIsSpeaking(false); audioRef.current = null; onEnd?.(); };
      await audio.play();
    } catch { setIsSpeaking(false); onEnd?.(); }
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    setIsListening(true);
    recognitionRef.current.start();
  };

  // -- Load words -------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/result.json');
        const data = await res.json();
        const langData = data[lang] || data['en-US'];
        const key = getSetKey(pos, setIdx);
        // Support both 'Phrases2' (new) and 'phrases2' (legacy lowercase keys)
        const keyLower = key.charAt(0).toLowerCase() + key.slice(1);
        const allWords: string[] = langData[key] || langData[keyLower] || [];
        const start = (lessonIdx - 1) * 10;
        const lessonWords = allWords.slice(start, start + 10);
        setWords(lessonWords);
        const init: Record<string, WordData> = {};
        lessonWords.forEach(w => { init[w] = { word: w, sentences: [], translation: '', sentenceTranslations: [], loading: false }; });
        setWordDataMap(init);
      } catch (e) { console.error('Failed to load words:', e); }
    })();
  }, [pos, setIdx, lessonIdx, lang]);

  // Load first word
  useEffect(() => { if (words.length > 0) loadWordData(words[0]); }, [words]);

  // -- Load word data ---------------------------------------------------------
  const loadWordData = async (word: string) => {
    if (wordDataMap[word]?.sentences.length > 0) return;
    setWordDataMap(prev => ({ ...prev, [word]: { ...prev[word], loading: true } }));
    try {
      const prompt = `For the ${pos.replace(/\d/g,'')} "${word}", generate:
1. Translation in ${subLang} (word only, no explanation)
2. Exactly 5 natural example sentences using "${word}"
3. ${subLang} translation for each sentence

Respond ONLY in this JSON (no markdown):
{
  "translation": "...",
  "sentences": ["s1","s2","s3","s4","s5"],
  "sentenceTranslations": ["t1","t2","t3","t4","t5"]
}`;
      const raw = await callGemini(prompt, 0.8);
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setWordDataMap(prev => ({
        ...prev,
        [word]: { word, translation: parsed.translation || '', sentences: parsed.sentences || [], sentenceTranslations: parsed.sentenceTranslations || [], loading: false },
      }));
    } catch {
      setWordDataMap(prev => ({ ...prev, [word]: { ...prev[word], loading: false } }));
    }
  };

  const goToWord = (idx: number) => {
    setCurrentWordIdx(idx);
    if (words[idx]) loadWordData(words[idx]);
  };

  // -- Quiz -------------------------------------------------------------------
  const generateQuiz = async () => {
    setQuizLoading(true);
    try {
      const prompt = `Create 5 multiple-choice quiz questions for these ${pos.replace(/\d/g,'')}:
${words.join(', ')}
Rules: 4 options each, mix question types, plausible distractors.
Respond ONLY in JSON (no markdown):
[{"q":"...","options":["A","B","C","D"],"answer":0},...]`;
      const raw = await callGemini(prompt, 0.5);
      setQuizQuestions(JSON.parse(raw.replace(/```json|```/g, '').trim()));
    } catch { console.error('Quiz gen failed'); }
    finally { setQuizLoading(false); }
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === quizQuestions[currentQ].answer) setScore(s => s + 1);
    setTimeout(() => {
      if (currentQ + 1 >= quizQuestions.length) { setQuizDone(true); }
      else { setCurrentQ(q => q + 1); setSelected(null); }
    }, 900);
  };

  // -- Chat -------------------------------------------------------------------
  const initChat = async () => {
    setChatLoading(true);
    try {
      const intro = await callGemini(
        `You are a friendly vocabulary tutor. Student just learned these ${pos.replace(/\d/g,'')}s: ${words.join(', ')}.
Greet them warmly and ask them to use one word in a sentence. Keep it to 2 sentences.`, 0.8);
      setChatMessages([{ role: 'tutor', text: intro }]);
    } catch {
      setChatMessages([{ role: 'tutor', text: `Great work! Try using one of these words: ${words.slice(0,3).join(', ')}.` }]);
    } finally { setChatLoading(false); }
  };

  const sendChatMessage = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    const updated: ChatMessage[] = [...chatMessages, { role: 'user', text }];
    setChatMessages(updated);
    setChatInput('');
    setChatLoading(true);
    try {
      const history = updated.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join('\n');
      const reply = await callGemini(
        `Vocab tutor. Student learned: ${words.join(', ')}. Encourage word usage. 2-3 sentences.\n\n${history}\nTutor:`, 0.8);
      const replyMsg: ChatMessage = { role: 'tutor', text: reply };
      setChatMessages(prev => [...prev, replyMsg]);
      speakText(reply);
    } catch {
      setChatMessages(prev => [...prev, { role: 'tutor', text: 'Keep practicing — you\'re doing great!' }]);
    } finally { setChatLoading(false); }
  };

  const handlePhaseChange = (next: Phase) => {
    stopAudio();
    setPhase(next);
    if (next === 'quiz') generateQuiz();
    if (next === 'chat') initChat();
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const currentWord = words[currentWordIdx] || '';
  const currentData = wordDataMap[currentWord];

  // accent colour from POS meta
  const accent = meta?.accent || '#2563EB';

  // -- UI ---------------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito', sans-serif" }}>
      

      {/* -- Nav -- */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', height: 62, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, position: 'sticky', top: 0, zIndex: 200 }}>
        <button onClick={() => { stopAudio(); router.push('/lingua/words'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }}>←</button>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: accent, textTransform: 'uppercase' }}>
            {meta?.icon} {pos.replace(/\d/g, '')} · Set {setIdx} · Lesson {lessonIdx}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>words {(setIdx-1)*50+(lessonIdx-1)*10+1}–{(setIdx-1)*50+lessonIdx*10}</div>
        </div>
        {/* Phase tabs */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['vocab','quiz','chat'] as Phase[]).map(p => (
            <button key={p} onClick={() => handlePhaseChange(p)} style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: phase === p ? accent : '#F1F5F9',
              color: phase === p ? '#fff' : '#64748B',
              fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 12,
            }}>
              {p === 'vocab' ? '📖 Vocab' : p === 'quiz' ? '✏️ Quiz' : '💬 Chat'}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 24px 60px' }}>

        {/* -- TOP: Tutor bar (horizontal) -- */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {/* Video — compact horizontal */}
            <div style={{ flexShrink: 0, width: 180, overflow: 'hidden' }}>
              <video
                key={isSpeaking ? 'talk' : 'idle'}
                src={isSpeaking ? tutor.videoTalk : tutor.videoIdle}
                autoPlay loop muted playsInline
                style={{ width: '100%', display: 'block', aspectRatio: '3/4', objectFit: 'cover' }}
              />
            </div>
            {/* Tutor info */}
            <div style={{ flex: 1, padding: '16px 20px' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', marginBottom: 2 }}>{tutor.name}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>AI Tutor · {meta?.icon} {pos.replace(/\d/g,'')}</div>
              {phase === 'vocab' && currentWord && (
                ttsAvailable ? (
                  <button
                    onClick={() => speakText(currentWord)}
                    disabled={isSpeaking}
                    style={{ padding: '8px 20px', borderRadius: 10, border: 'none',
                      background: isSpeaking ? '#E5E7EB' : accent,
                      color: isSpeaking ? '#9CA3AF' : '#fff',
                      fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13,
                      cursor: isSpeaking ? 'default' : 'pointer' }}
                  >{isSpeaking ? '🔊 Playing…' : '🔊 Hear word'}</button>
                ) : (
                  <div style={{ padding: '7px 14px', borderRadius: 10, display: 'inline-block',
                    background: '#FEF3C7', border: '1px solid #FDE68A', fontSize: 11, color: '#92400E', fontWeight: 700 }}>
                    🔇 Voice not available
                  </div>
                )
              )}
            </div>
            {/* Word list — horizontal scroll chips */}
            {phase === 'vocab' && (
              <div style={{ padding: '0 16px', flexShrink: 0, maxWidth: 200 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', letterSpacing: 2,
                  textTransform: 'uppercase', marginBottom: 6 }}>Words</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {words.map((w, i) => (
                    <button key={i} onClick={() => phase === 'vocab' && goToWord(i)} style={{
                      padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 10, fontWeight: i === currentWordIdx ? 800 : 600,
                      background: i === currentWordIdx ? accent : '#F1F5F9',
                      color: i === currentWordIdx ? '#fff' : '#64748B',
                      fontFamily: "'Nunito',sans-serif",
                      maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }} title={w}>{w}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* -- MAIN: Full-width content -- */}
        <div>

          {/* -- VOCAB -- */}
          {phase === 'vocab' && (
            <div>
              {/* Progress */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {words.map((w, i) => (
                  <button key={i} onClick={() => goToWord(i)}
                    title={w}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: `2px solid ${i === currentWordIdx ? accent : '#E5E7EB'}`,
                      background: i === currentWordIdx ? accent : wordDataMap[w]?.sentences.length > 0 ? '#DCFCE7' : '#fff',
                      color: i === currentWordIdx ? '#fff' : '#64748B',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
                    }}>{i+1}</button>
                ))}
              </div>

              {/* Word card */}
              <div style={{ background: '#fff', borderRadius: 24, border: `2px solid ${accent}33`, padding: '32px', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                {/* Word + translation */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                    {pos.replace(/\d/g,'')} · {lang}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: '#0F172A', letterSpacing: -2 }}>{currentWord}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: accent }}>
                      {currentData?.loading ? '...' : currentData?.translation || ''}
                    </span>
                  </div>
                </div>

                {/* Example sentences */}
                {currentData?.loading ? (
                  <div style={{ color: '#94A3B8', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
                    ✨ Generating examples...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {(currentData?.sentences || []).map((s, i) => (
                      <div key={i} style={{ background: '#F8FAFC', borderRadius: 14, padding: '14px 16px', borderLeft: `4px solid ${accent}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginRight: 8 }}>·</span>
                            <span style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.6 }}>{s}</span>
                          </div>
                          <button
                            onClick={() => speakText(s)}
                            disabled={isSpeaking || !ttsAvailable}
                            style={{ background: 'none', border: 'none', cursor: (isSpeaking || !ttsAvailable) ? 'default' : 'pointer', fontSize: 16, opacity: (isSpeaking || !ttsAvailable) ? 0.25 : 1, flexShrink: 0 }}
                            title={ttsAvailable ? 'Listen' : 'Voice not available for this language'}
                          >🔊</button>
                        </div>
                        {/* Subtitle translation */}
                        {currentData?.sentenceTranslations?.[i] && (
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 6, paddingLeft: 20, fontStyle: 'italic' }}>
                            {currentData.sentenceTranslations[i]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                <button onClick={() => goToWord(Math.max(0, currentWordIdx-1))} disabled={currentWordIdx === 0}
                  style={{ padding: '12px 24px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', color: currentWordIdx === 0 ? '#CBD5E1' : '#475569', cursor: currentWordIdx === 0 ? 'default' : 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 14 }}
                >← Prev</button>
                {currentWordIdx < words.length - 1 ? (
                  <button onClick={() => goToWord(currentWordIdx+1)}
                    style={{ padding: '12px 32px', borderRadius: 12, border: 'none', background: accent, color: '#fff', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14 }}
                  >Next →</button>
                ) : (
                  <button onClick={() => handlePhaseChange('quiz')}
                    style={{ padding: '12px 32px', borderRadius: 12, border: 'none', background: accent, color: '#fff', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14 }}
                  >Start Quiz ✏️</button>
                )}
              </div>
            </div>
          )}

          {/* -- QUIZ -- */}
          {phase === 'quiz' && (
            <div>
              {quizLoading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: 24, border: '1.5px solid #F1F5F9' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
                  <div style={{ color: '#94A3B8', fontSize: 15, fontWeight: 700 }}>Generating quiz...</div>
                </div>
              ) : quizDone ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: 24, border: '1.5px solid #F1F5F9' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>{score >= 4 ? '🎉' : score >= 3 ? '👍' : '💪'}</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>{score}/{quizQuestions.length}</div>
                  <div style={{ color: '#64748B', marginBottom: 32 }}>
                    {score >= 4 ? 'Excellent! You know these words well.' : score >= 3 ? 'Good work! Keep practicing.' : 'Keep going — practice makes perfect!'}
                  </div>
                  <button onClick={() => handlePhaseChange('chat')}
                    style={{ padding: '14px 36px', borderRadius: 14, border: 'none', background: accent, color: '#fff', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15 }}
                  >Start Chat 💬</button>
                </div>
              ) : quizQuestions.length > 0 ? (
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: '#64748B', fontWeight: 700 }}>Question {currentQ+1} / {quizQuestions.length}</span>
                      <span style={{ fontSize: 13, color: accent, fontWeight: 800 }}>Score: {score}</span>
                    </div>
                    <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${(currentQ/quizQuestions.length)*100}%`, background: accent, borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #F1F5F9', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', lineHeight: 1.6, marginBottom: 28 }}>
                      {quizQuestions[currentQ].q}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {quizQuestions[currentQ].options.map((opt, i) => {
                        const isCorrect = i === quizQuestions[currentQ].answer;
                        const isChosen  = i === selected;
                        let bg = '#F8FAFC', border = '#E5E7EB', color = '#1E293B';
                        if (selected !== null) {
                          if (isCorrect) { bg = '#F0FDF4'; border = '#16A34A'; color = '#15803D'; }
                          else if (isChosen) { bg = '#FEF2F2'; border = '#DC2626'; color = '#DC2626'; }
                        }
                        return (
                          <button key={i} onClick={() => handleAnswer(i)}
                            style={{ background: bg, border: `2px solid ${border}`, borderRadius: 14, padding: '14px 20px', textAlign: 'left', cursor: selected !== null ? 'default' : 'pointer', color, fontSize: 14, fontWeight: 600, fontFamily: "'Nunito',sans-serif", transition: 'all 0.2s' }}
                          >
                            <span style={{ fontWeight: 800, marginRight: 10, color: accent }}>{String.fromCharCode(65+i)}.</span>{opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* -- CHAT -- */}
          {phase === 'chat' && (
            <div>
              <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #F1F5F9', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                {/* Word chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20, padding: '12px 16px', background: '#F8FAFC', borderRadius: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginRight: 4 }}>PRACTICE:</span>
                  {words.map(w => (
                    <span key={w} style={{ fontSize: 12, fontWeight: 700, background: `${accent}18`, color: accent, borderRadius: 8, padding: '3px 10px' }}>{w}</span>
                  ))}
                </div>

                {/* Messages */}
                <div style={{ minHeight: 300, maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
                      {msg.role === 'tutor' && (
                        <img src={tutor.thumbnail} alt={tutor.name}
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 20%', flexShrink: 0, alignSelf: 'flex-end' }}
                        />
                      )}
                      <div style={{
                        maxWidth: '75%', padding: '12px 16px', fontSize: 14, lineHeight: 1.6,
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.role === 'user' ? accent : '#F1F5F9',
                        color: msg.role === 'user' ? '#fff' : '#1E293B',
                      }}>{msg.text}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <img src={tutor.thumbnail} alt={tutor.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 20%' }} />
                      <div style={{ background: '#F1F5F9', borderRadius: '18px 18px 18px 4px', padding: '12px 20px', color: '#94A3B8', fontSize: 14 }}>✨ typing...</div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage(chatInput)}
                    placeholder="Type your message..."
                    style={{ flex: 1, padding: '14px 18px', borderRadius: 14, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: "'Nunito',sans-serif", outline: 'none', background: '#fff' }}
                  />
                  <button onClick={startListening} disabled={isListening || isSpeaking}
                    style={{ padding: '14px 16px', borderRadius: 14, border: 'none', background: isListening ? '#EF4444' : '#F1F5F9', color: isListening ? '#fff' : '#64748B', cursor: 'pointer', fontSize: 18 }}
                  >{isListening ? '🔴' : '🎤'}</button>
                  <button onClick={() => sendChatMessage(chatInput)} disabled={!chatInput.trim() || chatLoading}
                    style={{ padding: '14px 20px', borderRadius: 14, border: 'none', background: accent, color: '#fff', cursor: 'pointer', fontSize: 18, opacity: !chatInput.trim() || chatLoading ? 0.4 : 1 }}
                  >→</button>
                </div>

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button onClick={() => setPhase('complete')}
                    style={{ background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '8px 24px', color: '#94A3B8', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 700 }}
                  >Finish Lesson ✓</button>
                </div>
              </div>
            </div>
          )}

          {/* -- COMPLETE -- */}
          {phase === 'complete' && (
            <div style={{ textAlign: 'center', padding: '60px 40px', background: '#fff', borderRadius: 24, border: '1.5px solid #F1F5F9', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Lesson Complete!</h2>
              <p style={{ color: '#64748B', marginBottom: 24 }}>You practiced {words.length} {pos.replace(/\d/g,'').toLowerCase()}s</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 }}>
                {words.map(w => <span key={w} style={{ background: `${accent}18`, color: accent, borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>{w}</span>)}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {lessonIdx < 5 && (
                  <button onClick={() => router.push(`/lingua/words/lesson?pos=${pos}&set=${setIdx}&lesson=${lessonIdx+1}&lang=${lang}&subLang=${subLang}`)}
                    style={{ padding: '14px 28px', borderRadius: 14, border: 'none', background: accent, color: '#fff', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14 }}
                  >Next Lesson →</button>
                )}
                <button onClick={() => router.push('/lingua/words')}
                  style={{ padding: '14px 28px', borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#fff', color: '#475569', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 14 }}
                >Back to Word Bank</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WordLessonPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F8FAFC' }} />}>
      <WordLessonContent />
    </Suspense>
  );
}
