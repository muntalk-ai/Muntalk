'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/userProfile';
import { ROLEPLAY_SCENARIOS } from '@/data/roleplay';

interface Message {
  role: 'npc' | 'user' | 'system';
  text: string;
  translation?: string;
  feedback?: string;      // AI가 주는 언어 피드백
  score?: number;         // 0~100
  timestamp: number;
}

interface SessionResult {
  totalMessages: number;
  avgScore: number;
  strongPoints: string[];
  improvements: string[];
  overallFeedback: string;
}

export default function RoleplaySession() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const scenario = ROLEPLAY_SCENARIOS.find(s => s.id === id);

  const [phase, setPhase] = useState<'briefing' | 'playing' | 'result'>('briefing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [langId, setLangId] = useState('en-US');
  const [turnCount, setTurnCount] = useState(0);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [popXpText, setPopXpText] = useState<string | null>(null);

  const chatRef    = useRef<HTMLDivElement>(null);
  const recRef     = useRef<any>(null);
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Load user language
  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(p => {
        if (p?.learnLang) setLangId(p.learnLang);
      });
    }
  }, [user]);

  // Auto scroll
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Pop XP
  const showXP = (pts: number) => {
    setXpEarned(x => x + pts);
    setPopXpText(`+${pts} XP`);
    setTimeout(() => setPopXpText(null), 1500);
  };

  // 이모지 제거 (TTS가 읽는 문제 방지)
  const stripForTts = (t: string) =>
    t.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{FE00}-\u{FEFF}\u200D\u20E3\uFE0F]/gu, '')
     .replace(/\s{2,}/g, ' ').trim();

  // TTS
  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    text = stripForTts(text);
    if (!text) { onEnd?.(); return; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: langId, gender: 'female', level: 'b1' }),
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); onEnd?.(); };
      audio.onerror = () => { setIsSpeaking(false); onEnd?.(); };
      await audio.play();
    } catch {
      setIsSpeaking(false);
      onEnd?.();
    }
  }, [langId]);

  // STT
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = langId;
    rec.interimResults = false;
    rec.onresult = e => {
      const t = e.results[0][0].transcript;
      handleUserTurn(t);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    rec.start();
    recRef.current = rec;
    setIsListening(true);
  }, [langId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start session
  const startSession = async () => {
    if (!scenario) return;
    setPhase('playing');
    setIsThinking(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid ?? null,
          prompt: `${scenario.npcPrompt}

Start the roleplay NOW. You are the ${scenario.npcRole}. 
The student is the ${scenario.userRole}.
Setting: ${scenario.setting}

Begin with your opening line in ${langId} language. Keep it natural and in-character.
Write ONLY the NPC's opening dialogue — nothing else. No stage directions. No explanations.`,
          temperature: 0.85,
        }),
      });
      const data = await res.json();
      const openingText = data.text?.trim() || `Hello! Welcome. How can I help you today?`;

      const openingMsg: Message = { role: 'npc', text: openingText, timestamp: Date.now() };
      setMessages([openingMsg]);
      historyRef.current = [{ role: 'assistant', content: openingText }];

      await speak(openingText);
    } catch {
      setMessages([{ role: 'npc', text: 'Hello! Let\'s begin.', timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handle user turn
  const handleUserTurn = async (userText: string) => {
    if (!userText.trim() || isThinking || !scenario) return;
    if (audioRef.current) { audioRef.current.pause(); }

    const userMsg: Message = { role: 'user', text: userText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    historyRef.current = [...historyRef.current, { role: 'user', content: userText }];
    setInput('');
    setIsThinking(true);
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);
    showXP(15);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid ?? null,
          prompt: `${scenario.npcPrompt}

CONVERSATION SO FAR:
${historyRef.current.map(m => `${m.role === 'user' ? 'Student' : 'NPC'}: ${m.content}`).join('\n')}

Now respond as the ${scenario.npcRole} in ${langId}.

ADDITIONALLY, after your in-character reply, add a JSON feedback block on a NEW LINE like this:
|||FEEDBACK|||{"score":85,"tip":"Great use of polite request form! Try adding 'please' for extra politeness.","translation":"[English translation of student's last message if needed]"}|||END|||

Score 0-100 based on: appropriateness, grammar, vocabulary for the situation.
Tip: ONE specific, actionable improvement in English.
Translation: English translation of the student's LAST message only (leave empty "" if it was correct/clear).

Your NPC reply first, then the feedback block. Keep NPC reply in character.`,
          temperature: 0.8,
        }),
      });
      const data = await res.json();
      const fullText = data.text?.trim() || '';

      // Parse NPC reply + feedback
      const feedbackMatch = fullText.match(/\|\|\|FEEDBACK\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
      let npcText = fullText.replace(/\|\|\|FEEDBACK\|\|\|[\s\S]*?\|\|\|END\|\|\|/, '').trim();
      let feedbackData: { score?: number; tip?: string; translation?: string } = {};

      if (feedbackMatch) {
        try { feedbackData = JSON.parse(feedbackMatch[1]); } catch { /* ignore */ }
      }

      // Update user message with feedback
      setMessages(prev => prev.map(m =>
        m === userMsg
          ? { ...m, feedback: feedbackData.tip, score: feedbackData.score, translation: feedbackData.translation }
          : m
      ));

      // Add NPC reply
      const npcMsg: Message = { role: 'npc', text: npcText, timestamp: Date.now() };
      setMessages(prev => [...prev, npcMsg]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: npcText }];

      if (feedbackData.score && feedbackData.score >= 80) showXP(10);

      await speak(npcText);

      // Auto-end after 10 turns
      if (newTurn >= 10) {
        setTimeout(() => endSession(), 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  // End session
  const endSession = async () => {
    if (!scenario) return;
    setPhase('result');
    setIsThinking(true);

    const scores = messages.filter(m => m.score !== undefined).map(m => m.score!);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 70;

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid ?? null,
          prompt: `You are a language coach. Analyse this roleplay conversation and give structured feedback.

Scenario: ${scenario.title} (${scenario.difficulty} level)
Conversation:
${historyRef.current.map(m => `${m.role === 'user' ? 'Student' : 'NPC'}: ${m.content}`).join('\n')}

Return ONLY valid JSON:
{
  "strongPoints": ["specific thing they did well 1", "specific thing 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "overallFeedback": "2-3 sentence encouraging summary with concrete next steps"
}`,
          temperature: 0.5,
        }),
      });
      const data = await res.json();
      const raw   = data.text?.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim() || '{}';
      const parsed = JSON.parse(raw);
      setSessionResult({ totalMessages: turnCount, avgScore, ...parsed });
      showXP(avgScore >= 80 ? 100 : avgScore >= 60 ? 60 : 30);
    } catch {
      setSessionResult({
        totalMessages: turnCount, avgScore,
        strongPoints:    ['You completed the roleplay!'],
        improvements:    ['Keep practising to improve fluency'],
        overallFeedback: 'Great effort! Consistent practice is the key to fluency.',
      });
    } finally {
      setIsThinking(false);
    }
  };

  if (!scenario) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#fff', fontFamily: "'Sora',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Scenario not found</div>
        <button onClick={() => router.push('/lingua/roleplay')}
          style={{ padding: '12px 24px', borderRadius: 14, border: 'none', background: '#6366F1',
            color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>
          Back to Roleplay
        </button>
      </div>
    </div>
  );

  // ── BRIEFING PHASE ────────────────────────────────────────────────────────
  if (phase === 'briefing') return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Sora',sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
      `}} />
      <div style={{ maxWidth: 560, width: '100%', animation: 'fadeUp .5s ease' }}>

        {/* Back */}
        <button onClick={() => router.push('/lingua/roleplay')}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '8px 16px', color: '#64748B', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif", marginBottom: 24 }}>
          ← 시나리오 목록
        </button>

        {/* Card */}
        <div style={{ background: scenario.bgGradient, borderRadius: 28, padding: 36,
          position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: 28 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{scenario.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{scenario.title}</div>
            <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20 }}>{scenario.titleKo}</div>
            <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 99,
              background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontWeight: 800 }}>
              {scenario.difficulty} Level
            </div>
          </div>
        </div>

        {/* Mission brief */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 24,
          border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#6366F1', letterSpacing: 1.5,
            marginBottom: 14 }}>📋 MISSION BRIEF</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 6 }}>🤖 AI 역할</div>
              <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600 }}>{scenario.npcRole}</div>
            </div>
            <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 700, marginBottom: 6 }}>🙋 내 역할</div>
              <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600 }}>{scenario.userRole}</div>
            </div>
          </div>

          <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 12, padding: 14,
            border: '1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ fontSize: 11, color: '#818CF8', fontWeight: 800, marginBottom: 6 }}>🎯 목표</div>
            <div style={{ fontSize: 14, color: '#C7D2FE', fontWeight: 600, lineHeight: 1.6 }}>
              {scenario.goalKo}
            </div>
          </div>
        </div>

        {/* Hints */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16,
          border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#F59E0B', letterSpacing: 1,
            marginBottom: 12 }}>💡 핵심 표현 힌트</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {scenario.successHints.map(h => (
              <span key={h} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12,
                background: 'rgba(245,158,11,0.1)', color: '#FCD34D',
                border: '1px solid rgba(245,158,11,0.2)', fontWeight: 600 }}>
                "{h}"
              </span>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 24, lineHeight: 1.7, textAlign: 'center' }}>
          대화는 최대 10턴 · 매 발화마다 AI 피드백 · 마이크 또는 타이핑 사용 가능
        </div>

        {/* Start */}
        <button onClick={startSession}
          style={{ width: '100%', padding: '18px', borderRadius: 18, border: 'none',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#fff', fontWeight: 800, fontSize: 18, cursor: 'pointer',
            fontFamily: "'Sora',sans-serif", boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            animation: 'pulse 2s infinite' }}>
          🎭 롤플레이 시작
        </button>
      </div>
    </div>
  );

  // ── RESULT PHASE ──────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: "'Sora',sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        {isThinking ? (
          <div style={{ textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: 40, marginBottom: 16, animation: 'pulse 1s infinite' }}>🤖</div>
            <div style={{ fontWeight: 700 }}>피드백 분석 중...</div>
          </div>
        ) : sessionResult && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>
                {sessionResult.avgScore >= 80 ? '🏆' : sessionResult.avgScore >= 60 ? '🎯' : '💪'}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                롤플레이 완료!
              </div>
              <div style={{ fontSize: 48, fontWeight: 800,
                background: sessionResult.avgScore >= 80
                  ? 'linear-gradient(135deg, #F59E0B, #FBBF24)'
                  : sessionResult.avgScore >= 60
                  ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                  : 'linear-gradient(135deg, #10B981, #34D399)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {sessionResult.avgScore}점
              </div>
              <div style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>
                {sessionResult.totalMessages}턴 완료 · +{xpEarned} XP 획득
              </div>
            </div>

            {/* Feedback cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 11, color: '#10B981', fontWeight: 800, marginBottom: 12, letterSpacing: 1 }}>
                  ✅ 잘한 점
                </div>
                {sessionResult.strongPoints?.map((p, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#A7F3D0', lineHeight: 1.6,
                    marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid #10B981' }}>
                    {p}
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 800, marginBottom: 12, letterSpacing: 1 }}>
                  📈 개선할 점
                </div>
                {sessionResult.improvements?.map((p, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#FDE68A', lineHeight: 1.6,
                    marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid #F59E0B' }}>
                    {p}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#818CF8', fontWeight: 800, marginBottom: 10, letterSpacing: 1 }}>
                💬 종합 피드백
              </div>
              <div style={{ fontSize: 14, color: '#C7D2FE', lineHeight: 1.7, fontWeight: 600 }}>
                {sessionResult.overallFeedback}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => { setPhase('briefing'); setMessages([]); setTurnCount(0); historyRef.current = []; }}
                style={{ padding: '16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#94A3B8', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>
                🔄 다시 하기
              </button>
              <button onClick={() => router.push('/lingua/roleplay')}
                style={{ padding: '16px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  fontFamily: "'Sora',sans-serif" }}>
                다른 시나리오 →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── PLAYING PHASE ─────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100dvh', background: '#0A0A0F', fontFamily: "'Sora',sans-serif",
      display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popXp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-40px)}}
        @keyframes thinking{0%,100%{opacity:0.3}50%{opacity:1}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        .msg-bubble{animation:fadeUp .3s ease}
        .send-btn:hover{opacity:0.85}
        .mic-btn{transition:all .15s}
      `}} />

      {/* ── Top bar ── */}
      <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => endSession()}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '7px 14px', color: '#64748B', fontSize: 12,
            fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif' " }}>
          ✕ 종료
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9' }}>
            {scenario.emoji} {scenario.title}
          </div>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>
            {turnCount}/10턴 · {scenario.difficulty}
          </div>
        </div>

        {/* XP + hints */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#6366F1' }}>+{xpEarned} XP</div>
          <button onClick={() => setShowHints(h => !h)}
            style={{ background: showHints ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${showHints ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10, padding: '7px 12px', color: showHints ? '#FCD34D' : '#64748B',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora',sans-serif" }}>
            💡 힌트
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
          width: `${(turnCount / 10) * 100}%`, transition: 'width .5s ease' }} />
      </div>

      {/* Hints panel */}
      {showHints && (
        <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.06)',
          borderBottom: '1px solid rgba(245,158,11,0.15)', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 800, marginBottom: 8 }}>
            💡 핵심 표현
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {scenario.successHints.map(h => (
              <button key={h}
                onClick={() => setInput(prev => prev ? prev + ' ' + h : h)}
                style={{ padding: '5px 11px', borderRadius: 8, fontSize: 12,
                  background: 'rgba(245,158,11,0.12)', color: '#FCD34D',
                  border: '1px solid rgba(245,158,11,0.25)', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Sora',sans-serif" }}>
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Chat area ── */}
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex',
        flexDirection: 'column', gap: 16 }}>

        {messages.map((msg, i) => (
          <div key={i} className="msg-bubble"
            style={{ display: 'flex', flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>

            {/* Role label */}
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 5,
              paddingLeft: msg.role === 'npc' ? 4 : 0,
              paddingRight: msg.role === 'user' ? 4 : 0 }}>
              {msg.role === 'npc' ? `🤖 ${scenario.npcRole}` : '🙋 나'}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '80%', padding: '12px 16px', borderRadius: msg.role === 'user'
                ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                : 'rgba(255,255,255,0.06)',
              border: msg.role === 'npc' ? '1px solid rgba(255,255,255,0.08)' : 'none',
              color: '#F1F5F9', fontSize: 15, lineHeight: 1.65, fontWeight: 600,
            }}>
              {msg.text}
            </div>

            {/* Translation */}
            {msg.translation && (
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4,
                paddingLeft: msg.role === 'npc' ? 4 : 0,
                paddingRight: msg.role === 'user' ? 4 : 0 }}>
                {msg.translation}
              </div>
            )}

            {/* Feedback chip */}
            {msg.feedback && msg.role === 'user' && (
              <div style={{ marginTop: 6, padding: '7px 12px', borderRadius: 10, maxWidth: '80%',
                background: msg.score && msg.score >= 80
                  ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                border: `1px solid ${msg.score && msg.score >= 80 ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                fontSize: 12, color: msg.score && msg.score >= 80 ? '#6EE7B7' : '#FDE68A',
                display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
                <span style={{ fontSize: 14, fontWeight: 800,
                  color: msg.score && msg.score >= 80 ? '#10B981' : '#F59E0B' }}>
                  {msg.score}점
                </span>
                {msg.feedback}
              </div>
            )}
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ padding: '12px 18px', borderRadius: '18px 18px 18px 4px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1',
                  animation: `thinking 1s ${d * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* XP pop */}
      {popXpText && (
        <div style={{ position: 'fixed', bottom: 100, right: 24, fontSize: 18, fontWeight: 800,
          color: '#6366F1', animation: 'popXp .8s ease forwards', pointerEvents: 'none' }}>
          {popXpText}
        </div>
      )}

      {/* ── Input bar ── */}
      <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
        borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>

          {/* Mic button */}
          <button className="mic-btn"
            onMouseDown={startListening}
            style={{ width: 50, height: 50, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: isListening
                ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                : 'rgba(255,255,255,0.07)',
              color: '#fff', fontSize: 20, cursor: 'pointer',
              animation: isListening ? 'pulse 0.8s infinite' : 'none',
              boxShadow: isListening ? '0 0 20px rgba(239,68,68,0.5)' : 'none' }}>
            {isListening ? '⏹' : '🎤'}
          </button>

          {/* Text input */}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserTurn(input); } }}
            placeholder={`${scenario.difficulty} 레벨로 대답하세요...`}
            disabled={isThinking || isSpeaking}
            style={{ flex: 1, padding: '14px 18px', borderRadius: 14,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#F1F5F9', fontSize: 15, fontFamily: "'Sora',sans-serif",
              outline: 'none', fontWeight: 600 }}
          />

          {/* Send */}
          <button className="send-btn"
            onClick={() => handleUserTurn(input)}
            disabled={!input.trim() || isThinking}
            style={{ width: 50, height: 50, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: input.trim() && !isThinking
                ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                : 'rgba(255,255,255,0.07)',
              color: '#fff', fontSize: 20, cursor: input.trim() ? 'pointer' : 'default',
              opacity: !input.trim() || isThinking ? 0.4 : 1 }}>
            ➤
          </button>
        </div>

        {/* End session button */}
        {turnCount >= 5 && (
          <button onClick={endSession}
            style={{ width: '100%', marginTop: 10, padding: '11px', borderRadius: 12,
              border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)',
              color: '#818CF8', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              fontFamily: "'Sora',sans-serif" }}>
            대화 마무리 & 피드백 받기 →
          </button>
        )}
      </div>
    </div>
  );
}
