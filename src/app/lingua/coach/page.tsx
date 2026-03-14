'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/userProfile';
import { LEARN_LANGUAGES } from '@/data/languages';

// ── Types ────────────────────────────────────────────────────────────────────

interface GrammarError {
  original: string;
  corrected: string;
  explanation: string;
  type: 'grammar' | 'vocabulary' | 'word-order' | 'tense' | 'spelling';
}

interface PronunciationHint {
  word: string;
  phonetic: string;
  tip: string;
}

interface AnalysisResult {
  grammarScore: number;       // 0–100
  pronunciationScore: number; // 0–100 (STT 신뢰도 기반)
  fluencyScore: number;       // 0–100
  overallScore: number;
  errors: GrammarError[];
  pronunciationHints: PronunciationHint[];
  correctedSentence: string;
  naturalAlternative: string;
  encouragement: string;
  level: string;              // 감지된 CEFR 레벨
}

interface Turn {
  id: number;
  userText: string;
  sttConfidence: number;      // 0–1 (Web Speech API confidence)
  analysis: AnalysisResult | null;
  aiReply: string;
  timestamp: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const hasStt = (code: string) => LEARN_LANGUAGES.find(l => l.code === code)?.stt ?? false;
const hasTts = (code: string) => LEARN_LANGUAGES.find(l => l.code === code)?.tts ?? false;

const scoreColor = (s: number) =>
  s >= 85 ? '#10B981' : s >= 70 ? '#3B82F6' : s >= 55 ? '#F59E0B' : '#EF4444';

const scoreLabel = (s: number) =>
  s >= 85 ? 'Excellent' : s >= 70 ? 'Good' : s >= 55 ? 'Fair' : 'Needs work';

const errorTypeColor: Record<string, string> = {
  grammar: '#EF4444', vocabulary: '#8B5CF6',
  'word-order': '#F59E0B', tense: '#3B82F6', spelling: '#EC4899',
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function CoachPage() {
  const router  = useRouter();
  const { user } = useAuth();

  const [langId,  setLangId]  = useState('en-US');
  const [subLang, setSubLang] = useState('ko-KR');
  const [langLabel, setLangLabel] = useState('English');
  const [topic,   setTopic]   = useState('free');
  const [turns,   setTurns]   = useState<Turn[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [inputText,   setInputText]   = useState('');
  const [sessionXP,   setSessionXP]   = useState(0);
  const [xpPop,       setXpPop]       = useState<string | null>(null);
  const [activeTurn,  setActiveTurn]  = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState({ grammar: 0, pronunciation: 0, fluency: 0, turns: 0 });

  const recRef   = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatRef  = useRef<HTMLDivElement>(null);
  const turnId   = useRef(0);

  // Load user settings
  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then(p => {
      if (p?.learnLang) {
        setLangId(p.learnLang);
        const info = LEARN_LANGUAGES.find(l => l.code === p.learnLang);
        setLangLabel(info?.label ?? 'English');
      }
      if (p?.nativeLang) setSubLang(p.nativeLang);
    });
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, isAnalysing]);

  // Init STT
  useEffect(() => {
    const SR = (window as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
            || (window as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR || !hasStt(langId)) return;

    const rec = new SR();
    rec.lang = langId;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 3;

    rec.onresult = e => {
      const best = e.results[0][0];
      const confidence = best.confidence || 0.75;
      handleSubmit(best.transcript, confidence);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recRef.current = rec;

    // Pre-request mic permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).catch(() => {});
    }
  }, [langId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 이모지 제거 (TTS가 "웃음" 등으로 읽는 문제 방지)
  const stripForTts = (text: string): string =>
    text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{FE00}-\u{FEFF}\u200D\u20E3\uFE0F]/gu, '')
        .replace(/\s{2,}/g, ' ').trim();

  // TTS
  const speak = useCallback(async (text: string) => {
    text = stripForTts(text);
    if (!text) return;
    if (!hasTts(langId) || !text) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: langId, gender: 'female', level: 'b1' }),
      });
      if (!res.ok) { setIsSpeaking(false); return; }
      const data = await res.json();
      if (!data.audioContent) { setIsSpeaking(false); return; }
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); audioRef.current = null; };
      await audio.play();
    } catch { setIsSpeaking(false); }
  }, [langId]);

  // Start mic
  const startListening = useCallback(() => {
    if (!recRef.current || isListening || isAnalysing) return;
    if (audioRef.current) { audioRef.current.pause(); }
    try { recRef.current.start(); setIsListening(true); } catch {}
  }, [isListening, isAnalysing]);

  // Show XP pop
  const popXP = (pts: number) => {
    setSessionXP(x => x + pts);
    setXpPop(`+${pts} XP`);
    setTimeout(() => setXpPop(null), 1500);
  };

  // ── Core: Analyse + Reply ──────────────────────────────────────────────────
  const handleSubmit = useCallback(async (text: string, confidence = 0.8) => {
    if (!text.trim() || isAnalysing) return;
    setInputText('');
    setIsAnalysing(true);

    const id = ++turnId.current;
    const newTurn: Turn = { id, userText: text, sttConfidence: confidence, analysis: null, aiReply: '', timestamp: Date.now() };
    setTurns(prev => [...prev, newTurn]);
    setActiveTurn(id);

    const topicContext = topic === 'free'
      ? 'a free conversation about any topic'
      : topic === 'daily' ? 'daily life and routines'
      : topic === 'travel' ? 'travelling and tourism'
      : topic === 'business' ? 'business and professional communication'
      : topic === 'academic' ? 'academic discussion and debate'
      : 'any topic';

    const pronunciationScore = Math.round(
      (confidence * 0.7 + 0.3) * 100  // STT confidence → pronunciation proxy
    );

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid ?? null,
          temperature: 0.3,
          prompt: `You are an expert ${langLabel} language coach. A student said the following in ${langLabel}:

"${text}"

Context: The student is having a conversation about ${topicContext}.
STT confidence score: ${(confidence * 100).toFixed(0)}% (use this to inform pronunciation score).

Analyse their utterance and return ONLY valid JSON (no markdown):
{
  "grammarScore": <0-100, strict grammar accuracy>,
  "pronunciationScore": <0-100, based on STT confidence ${(confidence * 100).toFixed(0)}% and typical errors for this text>,
  "fluencyScore": <0-100, naturalness, flow, appropriate vocabulary>,
  "overallScore": <weighted average>,
  "errors": [
    {
      "original": "<exact wrong phrase from their text>",
      "corrected": "<correct version>",
      "explanation": "<short English explanation, max 12 words>",
      "type": "<grammar|vocabulary|word-order|tense|spelling>"
    }
  ],
  "pronunciationHints": [
    {
      "word": "<word likely mispronounced>",
      "phonetic": "<IPA or simple phonetic>",
      "tip": "<one concrete tip, max 10 words>"
    }
  ],
  "correctedSentence": "<their sentence fully corrected, natural>",
  "naturalAlternative": "<a more natural/fluent way to say the same thing>",
  "encouragement": "<one warm, specific sentence praising what they did well>",
  "level": "<estimated CEFR level: A1|A2|B1|B2|C1|C2>",
  "aiReply": "<a natural conversational reply IN ${langLabel} to continue the conversation about ${topicContext}, 1-2 sentences, appropriate to their level>"
}

Rules:
- errors array: only real errors, max 4. Empty array [] if no errors.
- pronunciationHints: only if confidence < 0.8, max 3 words. Empty array [] if confidence >= 0.8.
- Be encouraging but honest. Don't fabricate errors that don't exist.
- aiReply must be in ${langLabel}, not English (unless ${langLabel} is English).`,
        }),
      });

      const data = await res.json();
      const raw  = data.text?.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim() || '{}';
      let parsed: Partial<AnalysisResult & { aiReply: string }> = {};
      try { parsed = JSON.parse(raw); } catch { /* fallback below */ }

      const analysis: AnalysisResult = {
        grammarScore:       parsed.grammarScore       ?? 70,
        pronunciationScore: parsed.pronunciationScore ?? pronunciationScore,
        fluencyScore:       parsed.fluencyScore       ?? 70,
        overallScore:       parsed.overallScore       ?? 70,
        errors:             parsed.errors             ?? [],
        pronunciationHints: parsed.pronunciationHints ?? [],
        correctedSentence:  parsed.correctedSentence  ?? text,
        naturalAlternative: parsed.naturalAlternative ?? text,
        encouragement:      parsed.encouragement      ?? 'Good effort! Keep practising.',
        level:              parsed.level              ?? 'B1',
      };

      const aiReply = parsed.aiReply ?? '';

      setTurns(prev => prev.map(t => t.id === id ? { ...t, analysis, aiReply } : t));

      // Update session stats
      setSessionStats(prev => {
        const n = prev.turns + 1;
        return {
          grammar:       Math.round((prev.grammar * prev.turns + analysis.grammarScore) / n),
          pronunciation: Math.round((prev.pronunciation * prev.turns + analysis.pronunciationScore) / n),
          fluency:       Math.round((prev.fluency * prev.turns + analysis.fluencyScore) / n),
          turns: n,
        };
      });

      // XP
      const xp = analysis.errors.length === 0 ? 30
               : analysis.overallScore >= 80 ? 25
               : analysis.overallScore >= 60 ? 15 : 10;
      popXP(xp);

      // Speak AI reply
      if (aiReply) await speak(aiReply);

    } catch (e) {
      console.error('[coach]', e);
      setTurns(prev => prev.map(t => t.id === id
        ? { ...t, analysis: { grammarScore:70, pronunciationScore:70, fluencyScore:70,
            overallScore:70, errors:[], pronunciationHints:[], correctedSentence:text,
            naturalAlternative:text, encouragement:'Good effort!', level:'B1' }, aiReply:'' }
        : t));
    } finally {
      setIsAnalysing(false);
    }
  }, [isAnalysing, langLabel, topic, user, speak]);

  // ── Topic pills ──────────────────────────────────────────────────────────
  const TOPICS = [
    { id: 'free',     label: 'Free Talk',   emoji: '💬' },
    { id: 'daily',    label: 'Daily Life',  emoji: '🌅' },
    { id: 'travel',   label: 'Travel',      emoji: '✈️'  },
    { id: 'business', label: 'Business',    emoji: '💼'  },
    { id: 'academic', label: 'Academic',    emoji: '🎓'  },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100dvh', background:'#05080F', display:'flex', flexDirection:'column',
      fontFamily:"'Outfit', sans-serif", overflow:'hidden', color:'#F1F5F9' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ripple{0%{transform:scale(1);opacity:1}100%{transform:scale(2.5);opacity:0}}
        @keyframes xpPop{0%{opacity:1;transform:translateY(0) scale(1)}60%{transform:translateY(-28px) scale(1.2)}100%{opacity:0;transform:translateY(-48px) scale(0.9)}}
        @keyframes thinking{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.6)}70%{box-shadow:0 0 0 14px rgba(99,102,241,0)}}
        @keyframes waveBar{0%,100%{height:6px}50%{height:22px}}
        .topic-pill{transition:all .15s;cursor:pointer;}
        .topic-pill:hover{transform:translateY(-1px);}
        .score-ring{transition:stroke-dashoffset .8s cubic-bezier(.4,0,.2,1);}
        .error-chip{transition:all .15s;cursor:default;}
        .send-btn:hover:not(:disabled){opacity:.85;transform:scale(1.05);}
        .mic-btn:active{transform:scale(.95);}
      `}}/>

      {/* ── TOP BAR ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
        background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.06)',
        flexShrink:0 }}>
        <button onClick={() => router.back()}
          style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:10, padding:'8px 14px', color:'#64748B', fontSize:12, fontWeight:700,
            cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>← Back</button>

        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#F1F5F9', lineHeight:1 }}>
            🧠 AI Language Coach
          </div>
          <div style={{ fontSize:11, color:'#475569', fontWeight:600, marginTop:2 }}>
            {langLabel} · 발음 · 문법 · 실시간 교정
          </div>
        </div>

        {/* Session stats mini */}
        {sessionStats.turns > 0 && (
          <div style={{ display:'flex', gap:8 }}>
            {[
              { label:'G', val:sessionStats.grammar, title:'Grammar' },
              { label:'P', val:sessionStats.pronunciation, title:'Pronunciation' },
              { label:'F', val:sessionStats.fluency, title:'Fluency' },
            ].map(s => (
              <div key={s.label} title={s.title}
                style={{ width:38, height:38, borderRadius:'50%', display:'flex',
                  flexDirection:'column', alignItems:'center', justifyContent:'center',
                  background:`${scoreColor(s.val)}18`,
                  border:`2px solid ${scoreColor(s.val)}50` }}>
                <div style={{ fontSize:11, fontWeight:900, color:scoreColor(s.val), lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:8, color:'#475569', fontWeight:700 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize:13, fontWeight:800, color:'#6366F1' }}>+{sessionXP} XP</div>
      </div>

      {/* ── TOPIC PILLS ── */}
      <div style={{ display:'flex', gap:8, padding:'10px 16px', overflowX:'auto',
        borderBottom:'1px solid rgba(255,255,255,0.04)', flexShrink:0,
        scrollbarWidth:'none' }}>
        {TOPICS.map(t => (
          <button key={t.id} className="topic-pill"
            onClick={() => setTopic(t.id)}
            style={{ padding:'7px 14px', borderRadius:99, border:'none', whiteSpace:'nowrap',
              fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:12, cursor:'pointer',
              background: topic === t.id ? '#6366F1' : 'rgba(255,255,255,0.06)',
              color: topic === t.id ? '#fff' : '#64748B',
              boxShadow: topic === t.id ? '0 4px 14px rgba(99,102,241,0.35)' : 'none' }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── CHAT + ANALYSIS AREA ── */}
      <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'16px',
        display:'flex', flexDirection:'column', gap:20 }}>

        {/* Empty state */}
        {turns.length === 0 && !isAnalysing && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', textAlign:'center', padding:'40px 24px' }}>
            <div style={{ fontSize:64, marginBottom:20 }}>🎙️</div>
            <div style={{ fontSize:22, fontWeight:800, marginBottom:10, color:'#E2E8F0' }}>
              말해보세요!
            </div>
            <div style={{ fontSize:14, color:'#475569', fontWeight:600, lineHeight:1.7,
              maxWidth:320, marginBottom:28 }}>
              마이크 버튼을 누르거나 텍스트를 입력하면<br/>
              AI가 <strong style={{color:'#6366F1'}}>문법</strong>과{' '}
              <strong style={{color:'#10B981'}}>발음</strong>을 실시간으로 분석합니다
            </div>
            {/* Starter prompts */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
              {[
                'Tell me about yourself',
                'What did you do today?',
                'Describe your hometown',
                'What are your hobbies?',
              ].map(p => (
                <button key={p} onClick={() => handleSubmit(p)}
                  style={{ padding:'8px 14px', borderRadius:10, border:'1px solid rgba(99,102,241,0.3)',
                    background:'rgba(99,102,241,0.08)', color:'#818CF8', fontSize:12,
                    fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Turns */}
        {turns.map(turn => (
          <div key={turn.id} style={{ animation:'fadeUp .35s ease' }}>

            {/* User bubble */}
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
              <div style={{ maxWidth:'80%' }}>
                <div style={{ fontSize:11, color:'#475569', fontWeight:700,
                  textAlign:'right', marginBottom:4 }}>🙋 나</div>
                <div style={{ background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  borderRadius:'16px 16px 4px 16px', padding:'12px 16px',
                  fontSize:15, fontWeight:600, lineHeight:1.6, color:'#fff' }}>
                  {turn.userText}
                </div>
                {/* STT confidence badge */}
                <div style={{ textAlign:'right', marginTop:4 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'#475569' }}>
                    STT 신뢰도: {Math.round(turn.sttConfidence * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Analysis card */}
            {turn.analysis && (
              <div style={{ background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)', borderRadius:20,
                padding:18, marginBottom:8 }}>

                {/* Score row */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
                  {[
                    { label:'문법',  val:turn.analysis.grammarScore,       icon:'📝' },
                    { label:'발음',  val:turn.analysis.pronunciationScore, icon:'🔊' },
                    { label:'유창성', val:turn.analysis.fluencyScore,      icon:'💫' },
                    { label:'종합',  val:turn.analysis.overallScore,       icon:'⭐' },
                  ].map(s => (
                    <div key={s.label}
                      style={{ textAlign:'center', padding:'10px 6px', borderRadius:12,
                        background:`${scoreColor(s.val)}10`,
                        border:`1px solid ${scoreColor(s.val)}25` }}>
                      <div style={{ fontSize:16, marginBottom:2 }}>{s.icon}</div>
                      <div style={{ fontSize:20, fontWeight:900, color:scoreColor(s.val),
                        lineHeight:1 }}>{s.val}</div>
                      <div style={{ fontSize:9, color:'#475569', fontWeight:700,
                        marginTop:2 }}>{s.label}</div>
                      <div style={{ fontSize:8, color:scoreColor(s.val), fontWeight:700 }}>
                        {scoreLabel(s.val)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Encouragement */}
                <div style={{ padding:'10px 14px', borderRadius:12,
                  background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)',
                  fontSize:13, color:'#6EE7B7', fontWeight:600, marginBottom:12, lineHeight:1.6 }}>
                  ✨ {turn.analysis.encouragement}
                </div>

                {/* Grammar errors */}
                {turn.analysis.errors.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:'#EF4444',
                      letterSpacing:1, marginBottom:8 }}>⚠️ 교정사항</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {turn.analysis.errors.map((err, i) => (
                        <div key={i} style={{ background:'rgba(239,68,68,0.06)',
                          border:'1px solid rgba(239,68,68,0.15)', borderRadius:10,
                          padding:'10px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center',
                            gap:8, marginBottom:6, flexWrap:'wrap' }}>
                            <span style={{ padding:'2px 8px', borderRadius:6, fontSize:10,
                              fontWeight:800, background:`${errorTypeColor[err.type]}20`,
                              color:errorTypeColor[err.type], border:`1px solid ${errorTypeColor[err.type]}40` }}>
                              {err.type}
                            </span>
                            {/* strikethrough original */}
                            <span style={{ fontSize:13, color:'#EF4444', fontWeight:600,
                              textDecoration:'line-through', opacity:0.7 }}>
                              {err.original}
                            </span>
                            <span style={{ color:'#475569' }}>→</span>
                            <span style={{ fontSize:13, color:'#6EE7B7', fontWeight:700 }}>
                              {err.corrected}
                            </span>
                          </div>
                          <div style={{ fontSize:12, color:'#64748B', fontWeight:600 }}>
                            {err.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Corrected sentence */}
                {turn.analysis.correctedSentence !== turn.userText && (
                  <div style={{ marginBottom:12, padding:'10px 14px', borderRadius:10,
                    background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ fontSize:10, fontWeight:800, color:'#818CF8',
                      letterSpacing:1, marginBottom:6 }}>✅ 교정된 문장</div>
                    <div style={{ fontSize:14, color:'#C7D2FE', fontWeight:700,
                      lineHeight:1.6 }}>
                      {turn.analysis.correctedSentence}
                    </div>
                  </div>
                )}

                {/* Natural alternative */}
                {turn.analysis.naturalAlternative !== turn.analysis.correctedSentence && (
                  <div style={{ marginBottom:12, padding:'10px 14px', borderRadius:10,
                    background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.18)' }}>
                    <div style={{ fontSize:10, fontWeight:800, color:'#F59E0B',
                      letterSpacing:1, marginBottom:6 }}>💡 더 자연스러운 표현</div>
                    <div style={{ fontSize:14, color:'#FDE68A', fontWeight:700,
                      lineHeight:1.6, cursor:'pointer' }}
                      onClick={() => speak(turn.analysis!.naturalAlternative)}>
                      {turn.analysis.naturalAlternative}
                      <span style={{ fontSize:11, color:'#F59E0B', marginLeft:8 }}>🔊</span>
                    </div>
                  </div>
                )}

                {/* Pronunciation hints */}
                {turn.analysis.pronunciationHints.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:'#10B981',
                      letterSpacing:1, marginBottom:8 }}>🔊 발음 가이드</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {turn.analysis.pronunciationHints.map((h, i) => (
                        <div key={i} style={{ padding:'8px 12px', borderRadius:10,
                          background:'rgba(16,185,129,0.08)',
                          border:'1px solid rgba(16,185,129,0.2)' }}>
                          <div style={{ fontSize:13, fontWeight:800, color:'#F1F5F9',
                            marginBottom:2 }}>{h.word}</div>
                          <div style={{ fontSize:12, color:'#10B981',
                            fontWeight:700, marginBottom:3 }}>[{h.phonetic}]</div>
                          <div style={{ fontSize:11, color:'#64748B',
                            fontWeight:600 }}>{h.tip}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Level badge */}
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <span style={{ padding:'3px 10px', borderRadius:99, fontSize:10,
                    fontWeight:800, background:'rgba(99,102,241,0.15)',
                    color:'#818CF8', border:'1px solid rgba(99,102,241,0.3)' }}>
                    감지 레벨: {turn.analysis.level}
                  </span>
                </div>
              </div>
            )}

            {/* AI reply bubble */}
            {turn.aiReply && (
              <div style={{ display:'flex', justifyContent:'flex-start', marginTop:4 }}>
                <div style={{ maxWidth:'80%' }}>
                  <div style={{ fontSize:11, color:'#475569', fontWeight:700, marginBottom:4 }}>
                    🤖 AI Coach
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.06)',
                    border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:'16px 16px 16px 4px', padding:'12px 16px',
                    fontSize:15, fontWeight:600, lineHeight:1.65, color:'#E2E8F0',
                    cursor:'pointer' }}
                    onClick={() => speak(turn.aiReply)}>
                    {turn.aiReply}
                    <span style={{ fontSize:12, color:'#475569', marginLeft:8 }}>🔊</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Thinking indicator */}
        {isAnalysing && (
          <div style={{ animation:'fadeUp .3s ease' }}>
            <div style={{ display:'flex', justifyContent:'flex-start' }}>
              <div style={{ padding:'14px 18px', borderRadius:'16px 16px 16px 4px',
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.08)',
                display:'flex', gap:5, alignItems:'center' }}>
                {[0,1,2].map(d => (
                  <div key={d} style={{ width:8, height:8, borderRadius:'50%',
                    background:'#6366F1',
                    animation:`thinking 1s ${d*0.2}s infinite` }} />
                ))}
                <span style={{ fontSize:12, color:'#475569', fontWeight:700, marginLeft:6 }}>
                  분석 중...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* XP pop */}
      {xpPop && (
        <div style={{ position:'fixed', bottom:90, right:24, fontSize:18, fontWeight:900,
          color:'#6366F1', animation:'xpPop .9s ease forwards', pointerEvents:'none',
          zIndex:999 }}>
          {xpPop}
        </div>
      )}

      {/* ── INPUT BAR ── */}
      <div style={{ padding:'10px 14px 14px', background:'rgba(255,255,255,0.02)',
        borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>

        {/* Session summary bar (shows after 3+ turns) */}
        {sessionStats.turns >= 3 && (
          <div style={{ display:'flex', gap:8, marginBottom:10, padding:'8px 12px',
            background:'rgba(99,102,241,0.07)', borderRadius:12,
            border:'1px solid rgba(99,102,241,0.15)', alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:800, color:'#818CF8' }}>
              세션 평균
            </span>
            {[
              { l:'문법', v:sessionStats.grammar },
              { l:'발음', v:sessionStats.pronunciation },
              { l:'유창성', v:sessionStats.fluency },
            ].map(s => (
              <div key={s.l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:32, height:4, borderRadius:2,
                  background:'rgba(255,255,255,0.1)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${s.v}%`,
                    background:scoreColor(s.v), borderRadius:2 }} />
                </div>
                <span style={{ fontSize:11, fontWeight:800, color:scoreColor(s.v) }}>
                  {s.v}
                </span>
                <span style={{ fontSize:10, color:'#475569' }}>{s.l}</span>
              </div>
            ))}
            <span style={{ marginLeft:'auto', fontSize:11, color:'#475569',
              fontWeight:700 }}>{sessionStats.turns}턴</span>
          </div>
        )}

        <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>

          {/* Mic button */}
          <button className="mic-btn"
            onMouseDown={hasStt(langId) ? startListening : undefined}
            onTouchStart={hasStt(langId) ? startListening : undefined}
            disabled={isAnalysing || isSpeaking || !hasStt(langId)}
            style={{ width:52, height:52, borderRadius:'50%', border:'none', flexShrink:0,
              cursor: hasStt(langId) ? 'pointer' : 'not-allowed',
              background: isListening
                ? 'linear-gradient(135deg,#EF4444,#DC2626)'
                : 'rgba(255,255,255,0.08)',
              color:'#fff', fontSize:22,
              animation: isListening ? 'pulse 1s infinite' : 'none',
              boxShadow: isListening ? '0 0 0 0 rgba(239,68,68,.6)' : 'none',
              opacity: isAnalysing || isSpeaking ? 0.4 : 1,
              position:'relative' }}>
            {isListening ? '⏹' : '🎤'}
            {/* Wave bars when listening */}
            {isListening && (
              <div style={{ position:'absolute', bottom:-16, left:'50%',
                transform:'translateX(-50%)', display:'flex', gap:3, alignItems:'flex-end' }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ width:3, borderRadius:2, background:'#EF4444',
                    animation:`waveBar .6s ${i*0.1}s infinite` }} />
                ))}
              </div>
            )}
          </button>

          {/* Text input */}
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); handleSubmit(inputText);
            }}}
            placeholder={hasStt(langId)
              ? `마이크 또는 타이핑으로 ${langLabel}를 연습하세요...`
              : `${langLabel}로 입력하세요...`}
            disabled={isAnalysing}
            style={{ flex:1, padding:'14px 18px', borderRadius:16,
              background:'rgba(255,255,255,0.07)',
              border:'1px solid rgba(255,255,255,0.1)',
              color:'#F1F5F9', fontSize:14, fontFamily:"'Outfit',sans-serif",
              outline:'none', fontWeight:600,
              opacity: isAnalysing ? 0.5 : 1 }}
          />

          {/* Send */}
          <button className="send-btn"
            onClick={() => handleSubmit(inputText)}
            disabled={!inputText.trim() || isAnalysing}
            style={{ width:52, height:52, borderRadius:'50%', border:'none', flexShrink:0,
              background: inputText.trim() && !isAnalysing
                ? 'linear-gradient(135deg,#6366F1,#8B5CF6)'
                : 'rgba(255,255,255,0.07)',
              color:'#fff', fontSize:20, cursor: inputText.trim() ? 'pointer' : 'default',
              opacity: !inputText.trim() || isAnalysing ? 0.4 : 1,
              transition:'all .15s' }}>
            ➤
          </button>
        </div>

        {!hasStt(langId) && (
          <div style={{ textAlign:'center', fontSize:11, color:'#475569',
            fontWeight:600, marginTop:8 }}>
            ⚠️ 이 언어는 음성 입력을 지원하지 않습니다 — 텍스트로 입력하세요
          </div>
        )}
      </div>
    </div>
  );
}
