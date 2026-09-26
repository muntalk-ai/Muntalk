'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getLangLabel, hasStt } from '@/data/languages';
import { PURPOSE_OPTIONS, PURPOSE_LABEL } from '@/lib/purpose';
import type { LearningPurpose } from '@/lib/purpose';
import { truncateHistory } from '@/lib/history';
import { recordStudySession } from '@/lib/cashEvent';
import { useActiveStudyTimer } from '@/hooks/useActiveStudyTimer';
import {
  MICROTALK_SECONDS, GUEST_DAILY_LIMIT,
  buildMicroTalkPrompt, buildOpeningPrompt, buildReportPrompt,
  parseReportJson, resolveTopic, getGuestUsage, consumeGuestSession,
  type MicroTalkReport,
} from '@/lib/microtalk';

interface ChatMsg { role: 'user' | 'ai'; text: string }

type Phase = 'topic' | 'chat' | 'report';

async function callGemini(prompt: string, temperature: number): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, temperature }),
  });
  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  return (data?.text ?? '').trim();
}

export default function MicroTalkPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('topic');
  const [topic, setTopic] = useState<LearningPurpose>('daily');
  const [purpose, setPurpose] = useState<LearningPurpose | null>(null);
  const [learnLang, setLearnLang] = useState('en-US');
  const [nativeLang, setNativeLang] = useState('ko-KR');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MICROTALK_SECONDS);
  const [report, setReport] = useState<MicroTalkReport | null>(null);
  const [error, setError] = useState('');
  const [guestLeft, setGuestLeft] = useState(GUEST_DAILY_LIMIT);

  const messagesRef = useRef<ChatMsg[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // $100 이벤트: 활성 학습 시간 측정
  const studyTimer = useActiveStudyTimer();
  const studyTimerRef = useRef(studyTimer);
  studyTimerRef.current = studyTimer;
  const recRef = useRef<any>(null);
  const endRef = useRef<() => void>(() => {});
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const learnLangLabel = getLangLabel(learnLang);
  const nativeLangLabel = getLangLabel(nativeLang);
  const systemPrompt = buildMicroTalkPrompt({
    targetLangLabel: learnLangLabel,
    nativeLangLabel,
    topicLabel: PURPOSE_LABEL[topic],
    purpose,
  });

  // ── 초기 설정: 언어/목적/주제/게스트 횟수 ────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (profile) {
      setLearnLang(profile.learnLang || 'en-US');
      setNativeLang(profile.nativeLang || 'ko-KR');
      setPurpose(profile.purpose ?? null);
    } else {
      try {
        setLearnLang(localStorage.getItem('mt_learn_lang') || 'en-US');
        setNativeLang(localStorage.getItem('mt_native_lang') || 'ko-KR');
        const gp = localStorage.getItem('mt_purpose');
        setPurpose(gp === 'business' || gp === 'travel' || gp === 'daily' || gp === 'exam' || gp === 'hobby' ? gp : null);
      } catch { /* ignore */ }
    }
    // ?topic= 프리셋
    try {
      const p = new URLSearchParams(window.location.search).get('topic');
      setTopic(resolveTopic(p));
    } catch { /* ignore */ }
    setGuestLeft(Math.max(0, GUEST_DAILY_LIMIT - getGuestUsage().count));
    setReady(true);
  }, [authLoading, profile]);

  // ── STT (Coach 패턴: rec.lang = 학습 언어) ────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = learnLang;
    rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => { sendRef.current(e.results[0][0].transcript); };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recRef.current = rec;
  }, [ready, learnLang]); // eslint-disable-line

  const toggleListen = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (isListening) { try { rec.stop(); } catch {} return; }
    setIsListening(true);
    try { rec.start(); } catch { setIsListening(false); }
  };

  const speak = (text: string) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = learnLang;
      synth.speak(u);
    } catch { /* ignore */ }
  };

  // ── 메시지 전송 ───────────────────────────────────────────────────────────
  const pushMsg = (m: ChatMsg) => {
    messagesRef.current = [...messagesRef.current, m];
    setMessages(messagesRef.current);
  };

  const handleSend = useCallback(async (text?: string) => {
    const txt = (text ?? input).trim();
    if (!txt || loading || phase !== 'chat') return;
    setInput('');
    setError('');
    pushMsg({ role: 'user', text: txt });
    setLoading(true);
    const history = truncateHistory(messagesRef.current, 10)
      .map(m => `${m.role === 'user' ? 'Learner' : 'Tutor'}: ${m.text}`).join('\n');
    try {
      const reply = await callGemini(
        `${systemPrompt}\n\nConversation so far:\n${history}\n\nRespond as the tutor (max 2 short sentences, one follow-up question):`, 0.8);
      pushMsg({ role: 'ai', text: reply || '...' });
    } catch {
      setError("Couldn't reach the AI. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [input, loading, phase, systemPrompt]);

  const sendRef = useRef(handleSend);
  sendRef.current = handleSend;

  // ── 세션 시작 ─────────────────────────────────────────────────────────────
  const startTalk = async () => {
    setError('');
    if (!user) {
      if (!consumeGuestSession()) { setGuestLeft(0); return; }
      setGuestLeft(Math.max(0, GUEST_DAILY_LIMIT - getGuestUsage().count));
    }
    messagesRef.current = [];
    setMessages([]);
    setReport(null);
    setPhase('chat');
    setSecondsLeft(MICROTALK_SECONDS);
    setLoading(true);
    try {
      const opening = await callGemini(
        `${systemPrompt}\n\n${buildOpeningPrompt({ targetLangLabel: learnLangLabel, topicLabel: PURPOSE_LABEL[topic] })}`, 0.7);
      pushMsg({ role: 'ai', text: opening || '...' });
    } catch {
      setError("Couldn't reach the AI. Check your connection.");
    } finally {
      setLoading(false);
    }
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { endRef.current(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── 세션 종료 + 리포트 ────────────────────────────────────────────────────
  const endSession = useCallback(async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    try { window.speechSynthesis?.cancel(); } catch {}
    try { recRef.current?.stop(); } catch {}
    setIsListening(false);
    setPhase('report');
    const userCount = messagesRef.current.filter(m => m.role === 'user').length;
    const transcript = truncateHistory(messagesRef.current, 12)
      .map(m => `${m.role === 'user' ? 'Learner' : 'Tutor'}: ${m.text}`).join('\n');
    const fallback: MicroTalkReport = {
      utterances: userCount,
      newPhrase: messagesRef.current.filter(m => m.role === 'ai').slice(-1)[0]?.text ?? '—',
      feedback: 'Nice work showing up for 60 seconds — consistency beats intensity!',
    };
    try {
      const raw = await callGemini(buildReportPrompt({
        targetLangLabel: learnLangLabel, nativeLangLabel, transcript,
      }), 0.3);
      setReport(parseReportJson(raw, fallback));
    } catch {
      setReport(fallback);
    }
    // $100 이벤트: 일일 학습 시간 기록 (로그인 + 실제 발화 있을 때만)
    try {
      if (user && userCount > 0) {
        await recordStudySession(user.uid, studyTimerRef.current.stop(), 0);
      }
    } catch (e) {
      console.warn('[microtalk] recordStudySession failed:', e);
    }
  }, [learnLangLabel, nativeLangLabel]);
  endRef.current = endSession;

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, phase]);

  const reset = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    messagesRef.current = [];
    setMessages([]); setReport(null); setError(''); setInput('');
    setSecondsLeft(MICROTALK_SECONDS);
    setGuestLeft(Math.max(0, GUEST_DAILY_LIMIT - getGuestUsage().count));
    setPhase('topic');
  };

  const mm = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const sttOn = hasStt(learnLang);

  if (!ready) return (
    <div style={S.loadingPage}><div style={S.loadingText}>⚡ Loading Micro-Talk…</div></div>
  );

  return (
    <div style={S.page}>
      {/* Nav */}
      <nav style={S.nav}>
        <button onClick={() => router.push('/lingua')} style={S.navBack}>← Home</button>
        <div style={S.navCenter}><span style={S.navTitle}>⚡ Micro-Talk</span></div>
        <div style={S.navTimer}>{phase === 'chat' ? `⏱ ${mm}` : ''}</div>
      </nav>

      {/* ── Phase: topic ── */}
      {phase === 'topic' && (
        <div style={S.topicWrap}>
          <div style={S.topicBadge}>⚡ 60 seconds</div>
          <h1 style={S.topicTitle}>Pick a topic</h1>
          <p style={S.topicDesc}>One quick chat with your AI tutor — no pressure, just talking.</p>
          <div style={S.chipRow}>
            {PURPOSE_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setTopic(opt.id)}
                style={{ ...S.chip, ...(topic === opt.id ? S.chipActive : {}) }}>
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
          {error && <div style={S.errBox}>{error}</div>}
          {!user && guestLeft <= 0 ? (
            <div style={S.limitBox}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
                You've used all {GUEST_DAILY_LIMIT} free Micro-Talks today.
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>
                Sign in for unlimited 1-minute chats — it's free.
              </div>
              <button style={S.startBtn} onClick={() => router.push('/signup')}>🚀 Sign in free</button>
            </div>
          ) : (
            <>
              <button style={S.startBtn} onClick={startTalk}>🎤 Start 1-min talk</button>
              {!user && (
                <div style={S.guestNote}>🎁 {guestLeft} free talk{guestLeft === 1 ? '' : 's'} left today · no sign-up needed</div>
              )}
            </>
          )}
          <div style={S.langNote}>Speaking: <strong>{learnLangLabel}</strong></div>
        </div>
      )}

      {/* ── Phase: chat ── */}
      {phase === 'chat' && (
        <div style={S.chatWrap}>
          <div style={S.timerBar}>
            <div style={{ ...S.timerFill, width: `${(secondsLeft / MICROTALK_SECONDS) * 100}%` }} />
          </div>
          <div style={S.msgs}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === 'user' ? S.uMsg : S.aMsg}>
                <div>{m.text}</div>
                {m.role === 'ai' && (
                  <button onClick={() => speak(m.text)} style={S.speakBtn} aria-label="Listen">🔊</button>
                )}
              </div>
            ))}
            {loading && <div style={S.aMsg}><span style={S.typing}>•••</span></div>}
            {error && <div style={S.errBox}>{error} <button style={S.retryBtn} onClick={() => setError('')}>Dismiss</button></div>}
            <div ref={bottomRef} />
          </div>
          <div style={S.inputRow}>
            {sttOn && (
              <button onClick={toggleListen} style={{ ...S.micBtn, ...(isListening ? S.micOn : {}) }}
                aria-label="Voice input">🎤</button>
            )}
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder={`Type in ${learnLangLabel}…`} style={S.input} maxLength={500} />
            <button onClick={() => handleSend()} style={S.sendBtn} disabled={loading}>➤</button>
          </div>
          <button onClick={endSession} style={S.endBtn}>⏹ End & get recap</button>
        </div>
      )}

      {/* ── Phase: report ── */}
      {phase === 'report' && (
        <div style={S.reportOverlay}>
          <div style={S.reportCard}>
            <div style={S.reportBadge}>⚡ Your 60-second recap</div>
            {report ? (
              <>
                <div style={S.reportRow}><span>🗣️</span><span>You spoke <strong>{report.utterances}</strong> time{report.utterances === 1 ? '' : 's'}</span></div>
                <div style={S.reportBlock}>
                  <div style={S.reportLabel}>✨ New phrase</div>
                  <div style={S.reportText}>{report.newPhrase}</div>
                </div>
                <div style={S.reportBlock}>
                  <div style={S.reportLabel}>💡 Feedback</div>
                  <div style={S.reportText}>{report.feedback}</div>
                </div>
              </>
            ) : (
              <div style={S.loadingText}>Writing your recap…</div>
            )}
            <div style={S.reportBtns}>
              <button style={S.startBtn} onClick={reset}>🔁 Talk again</button>
              <button style={S.ghostBtn} onClick={() => router.push('/lingua/roleplay')}>🎭 More in Roleplay</button>
              <button style={S.ghostBtn} onClick={() => router.push('/lingua')}>← Home</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0B1020', color: '#F1F5F9', display: 'flex', flexDirection: 'column' },
  loadingPage: { minHeight: '100vh', background: '#0B1020', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94A3B8', fontWeight: 700 },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  navBack: { background: 'none', border: 'none', color: '#CBD5E1', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  navCenter: { flex: 1, textAlign: 'center' },
  navTitle: { fontSize: 16, fontWeight: 900 },
  navTimer: { minWidth: 70, textAlign: 'right', fontSize: 15, fontWeight: 800, color: '#FBBF24', fontVariantNumeric: 'tabular-nums' },
  topicWrap: { maxWidth: 560, margin: '0 auto', padding: '48px 24px', textAlign: 'center', width: '100%' },
  topicBadge: { display: 'inline-block', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: '#FBBF24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 99, padding: '6px 16px', marginBottom: 18 },
  topicTitle: { fontSize: 30, fontWeight: 900, margin: '0 0 8px', letterSpacing: -0.5 },
  topicDesc: { color: '#94A3B8', fontSize: 14, margin: '0 0 24px' },
  chipRow: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 },
  chip: { border: '1px solid rgba(255,255,255,0.2)', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: '#E2E8F0', padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  chipActive: { background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderColor: 'transparent', color: '#fff' },
  startBtn: { background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', borderRadius: 14, padding: '15px 40px', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(99,102,241,0.4)' },
  ghostBtn: { background: 'rgba(255,255,255,0.07)', color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 14, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  guestNote: { marginTop: 14, fontSize: 12.5, color: '#94A3B8', fontWeight: 600 },
  langNote: { marginTop: 22, fontSize: 12.5, color: '#64748B' },
  errBox: { margin: '0 0 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#FCA5A5' },
  retryBtn: { marginLeft: 8, background: 'none', border: '1px solid rgba(252,165,165,0.5)', color: '#FCA5A5', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' },
  limitBox: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 18, padding: '24px', maxWidth: 420, margin: '0 auto' },
  chatWrap: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 640, width: '100%', margin: '0 auto' },
  timerBar: { height: 4, background: 'rgba(255,255,255,0.08)' },
  timerFill: { height: '100%', background: 'linear-gradient(90deg,#FBBF24,#F59E0B)', transition: 'width 1s linear' },
  msgs: { flex: 1, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 200 },
  uMsg: { alignSelf: 'flex-end', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '11px 16px', maxWidth: '82%', fontSize: 15, lineHeight: 1.5 },
  aMsg: { alignSelf: 'flex-start', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', borderRadius: '18px 18px 18px 4px', padding: '11px 16px', maxWidth: '86%', fontSize: 15, lineHeight: 1.55, position: 'relative' },
  speakBtn: { background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', opacity: 0.6, marginTop: 6, padding: 0 },
  typing: { letterSpacing: 4, color: '#94A3B8' },
  inputRow: { display: 'flex', gap: 8, padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  micBtn: { width: 46, height: 46, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', fontSize: 20, cursor: 'pointer', flexShrink: 0 },
  micOn: { background: '#EF4444', borderColor: '#EF4444', animation: 'pulse 1.2s infinite' },
  input: { flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 23, padding: '12px 18px', color: '#fff', fontSize: 15, outline: 'none' },
  sendBtn: { width: 46, height: 46, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0 },
  endBtn: { margin: '4px auto 18px', background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#94A3B8', borderRadius: 99, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  reportOverlay: { position: 'fixed', inset: 0, background: 'rgba(3,6,18,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 },
  reportCard: { background: '#131A30', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '28px', maxWidth: 440, width: '100%', textAlign: 'left' },
  reportBadge: { fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: '#FBBF24', marginBottom: 16 },
  reportRow: { display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, fontWeight: 700, marginBottom: 16 },
  reportBlock: { background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 },
  reportLabel: { fontSize: 12, fontWeight: 800, color: '#94A3B8', marginBottom: 6, letterSpacing: 0.5 },
  reportText: { fontSize: 15, lineHeight: 1.6 },
  reportBtns: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 },
};
