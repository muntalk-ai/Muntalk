'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type Side = 'for' | 'against';
type Lang = 'en' | 'native';

interface DebateTopic {
  id: string;
  emoji: string;
  titleEn: string;
  titleNative: string;
  subtitleEn: string;
  subtitleNative: string;
  gradient: string;
  accentFor: string;
  accentAgainst: string;
  subtopics: { en: string; native: string }[];
}

interface Message {
  id: number;
  role: 'user' | 'ai';
  side?: Side;
  text: string;
  ts: number;
}

// ── Topic Data ─────────────────────────────────────────────────────────────────

const TOPICS: DebateTopic[] = [
  {
    id: 'faith-vs-science',
    emoji: '⚗️',
    titleEn: 'Faith vs. Science',
    titleNative: '신앙 vs. 과학',
    subtitleEn: 'Biblical historicity · Creation vs. Evolution',
    subtitleNative: '성경의 역사적 사실성 · 창조론 vs 진화론',
    gradient: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
    accentFor: '#38BDF8',
    accentAgainst: '#FB923C',
    subtopics: [
      { en: 'Is the Bible historically accurate?', native: '성경은 역사적으로 사실인가?' },
      { en: 'Did humans evolve or were they created?', native: '인간은 진화했는가, 창조되었는가?' },
      { en: 'Can science and faith coexist?', native: '과학과 신앙은 공존할 수 있는가?' },
      { en: 'Is Genesis literal or metaphorical?', native: '창세기는 문자 그대로인가, 비유적인가?' },
    ],
  },
  {
    id: 'existence-of-god',
    emoji: '✝️',
    titleEn: 'God & Jesus',
    titleNative: '신의 존재와 예수',
    subtitleEn: 'Existence of God · Resurrection & Divinity of Jesus',
    subtitleNative: '신의 존재 여부 · 예수의 부활과 신성',
    gradient: 'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
    accentFor: '#F472B6',
    accentAgainst: '#FBBF24',
    subtopics: [
      { en: 'Does God exist?', native: '신은 존재하는가?' },
      { en: 'Did Jesus physically resurrect?', native: '예수는 실제로 부활했는가?' },
      { en: 'Was Jesus divine or merely a prophet?', native: '예수는 신인가, 선지자인가?' },
      { en: 'Is belief in God rational?', native: '신을 믿는 것은 이성적인가?' },
    ],
  },
  {
    id: 'life-and-death',
    emoji: '⚖️',
    titleEn: 'Life, Death & Beyond',
    titleNative: '삶과 죽음의 윤리',
    subtitleEn: 'Right to Die · Afterlife & Judgment',
    subtitleNative: '안락사와 존엄사 · 사후 세계와 심판',
    gradient: 'linear-gradient(135deg, #0D0D0D 0%, #1a1a2e 50%, #16213e 100%)',
    accentFor: '#34D399',
    accentAgainst: '#A78BFA',
    subtopics: [
      { en: 'Should euthanasia be legally permitted?', native: '안락사는 법적으로 허용되어야 하는가?' },
      { en: 'Does an afterlife exist?', native: '사후 세계는 존재하는가?' },
      { en: 'Is there a divine judgment after death?', native: '죽음 후 신의 심판이 있는가?' },
      { en: 'Who owns the right to end one\'s life?', native: '삶을 끝낼 권리는 누구에게 있는가?' },
    ],
  },
  {
    id: 'capitalism-vs-socialism',
    emoji: '🏛️',
    titleEn: 'Capitalism vs. Socialism',
    titleNative: '자본주의 vs. 사회주의',
    subtitleEn: 'Economic systems · Freedom vs. Equality',
    subtitleNative: '경제 체제 · 자유 vs. 평등',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b00 50%, #1a0a00 100%)',
    accentFor: '#F59E0B',
    accentAgainst: '#EF4444',
    subtopics: [
      { en: 'Is capitalism the best economic system?', native: '자본주의가 최선의 경제 체제인가?' },
      { en: 'Should healthcare be free for all?', native: '의료는 모든 사람에게 무료여야 하는가?' },
      { en: 'Does socialism suppress individual freedom?', native: '사회주의는 개인의 자유를 억압하는가?' },
      { en: 'Is wealth inequality inevitable?', native: '부의 불평등은 피할 수 없는가?' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

let msgId = 0;

// ── Component ─────────────────────────────────────────────────────────────────

export default function AgoraPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [lang, setLang] = useState<Lang>('en');
  const [view, setView] = useState<'lobby' | 'debate'>('lobby');
  const [topic, setTopic] = useState<DebateTopic | null>(null);
  const [subtopic, setSubtopic] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSide, setActiveSide] = useState<Side>('for');
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [hoveredSub, setHoveredSub] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const nativeLang = typeof window !== 'undefined'
    ? (localStorage.getItem('mt_native_lang') || 'ko-KR') : 'ko-KR';

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang === 'native' ? nativeLang : 'en-US';
    rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => handleSend(e.results[0][0].transcript);
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recRef.current = rec;
  }, [lang, nativeLang]); // eslint-disable-line

  const startDebate = (t: DebateTopic, sub: string) => {
    setTopic(t);
    setSubtopic(sub);
    setMessages([]);
    setView('debate');
    // Opening message from AI
    const opening: Message = {
      id: ++msgId, role: 'ai', ts: Date.now(),
      text: lang === 'en'
        ? `Welcome to the Agora. Today's motion:\n\n"${sub}"\n\nI will present arguments from BOTH sides — For and Against — so you can explore every angle. Which side would you like me to argue first, or ask me anything to begin the debate.`
        : `아고라에 오신 것을 환영합니다. 오늘의 주제:\n\n"${t.subtopics.find(s => s.en === sub)?.native || sub}"\n\n저는 찬성과 반대 양쪽 논거를 모두 제시합니다. 어느 쪽부터 시작할까요?`,
    };
    setMessages([opening]);
  };

  const handleSend = useCallback(async (text?: string) => {
    const txt = (text ?? input).trim();
    if (!txt || loading || !topic) return;
    setInput('');

    const userMsg: Message = { id: ++msgId, role: 'user', side: activeSide, text: txt, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const systemPrompt = `You are a world-class debate moderator and philosopher for MunTalk, an AI language learning platform.

The debate topic is: "${subtopic}"
The user's preferred language is: ${lang === 'en' ? 'English' : 'their native language (Korean or as detected)'}

Your role:
- Present BOTH the FOR (찬성) and AGAINST (반대) sides with equal depth and intellectual rigor
- Use strong philosophical, historical, scientific, and ethical arguments
- Be Socratic — challenge the user's thinking with follow-up questions
- Keep responses focused (150-200 words)
- Format clearly: start with "🔵 FOR:" or "🔴 AGAINST:" when presenting sides
- If the user asks for one side, present that side first, then briefly note the other exists
- Never take a personal position — remain a neutral intellectual guide
- Respond in ${lang === 'en' ? 'English' : 'the same language the user wrote in. If Korean, respond in Korean.'}`;

    const history = messages.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid ?? null,
          temperature: 0.8,
          prompt: `${systemPrompt}\n\nConversation so far:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nuser: ${txt}\n\nassistant:`,
        }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        id: ++msgId, role: 'ai', ts: Date.now(),
        text: data.text?.trim() || (lang === 'en' ? 'I could not generate a response. Please try again.' : '응답을 생성할 수 없습니다. 다시 시도해 주세요.'),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: ++msgId, role: 'ai', ts: Date.now(),
        text: lang === 'en' ? 'Error connecting. Please try again.' : '연결 오류. 다시 시도해 주세요.',
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, topic, subtopic, messages, activeSide, lang, user]);

  // ── LOBBY ──────────────────────────────────────────────────────────────────

  if (view === 'lobby') return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Nav */}
      <nav style={S.nav}>
        <button onClick={() => router.push('/lingua')} style={S.navBack}>
          ← {lang === 'en' ? 'Back' : '뒤로'}
        </button>
        <div style={S.navLogo}>
          <span style={{ fontSize: 20 }}>🏛️</span>
          <span style={S.navLogoText}>AGORA</span>
        </div>
        <button
          onClick={() => setLang(l => l === 'en' ? 'native' : 'en')}
          style={S.langToggle}>
          {lang === 'en' ? '🇰🇷 한국어' : '🇺🇸 English'}
        </button>
      </nav>

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroGlow} />
        <div style={S.heroInner}>
          <div style={S.heroBadge}>
            {lang === 'en' ? '⚡ AI-Powered Debate Arena' : '⚡ AI 토론 아레나'}
          </div>
          <h1 style={S.heroTitle}>
            {lang === 'en' ? 'Where Ideas Clash.' : '생각이 충돌하는 곳.'}
          </h1>
          <p style={S.heroSub}>
            {lang === 'en'
              ? 'Challenge your worldview. AI presents both sides with equal intellectual force.'
              : '세계관에 도전하세요. AI가 찬반 양쪽의 논거를 동등하게 제시합니다.'}
          </p>
          <div style={S.heroStats}>
            {['4 Topics', '16 Motions', 'Bilingual'].map(s => (
              <span key={s} style={S.heroStat}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Grid */}
      <div style={S.grid}>
        {TOPICS.map((t, i) => (
          <div key={t.id}
            className="topic-card"
            style={{
              ...S.card,
              background: t.gradient,
              animationDelay: `${i * 0.08}s`,
              outline: hoveredTopic === t.id ? `2px solid ${t.accentFor}` : '2px solid transparent',
            }}
            onMouseEnter={() => setHoveredTopic(t.id)}
            onMouseLeave={() => { setHoveredTopic(null); setHoveredSub(null); }}>

            <div style={S.cardEmoji}>{t.emoji}</div>
            <div style={S.cardTitle}>{lang === 'en' ? t.titleEn : t.titleNative}</div>
            <div style={S.cardSub}>{lang === 'en' ? t.subtitleEn : t.subtitleNative}</div>

            {/* Side indicators */}
            <div style={S.sideRow}>
              <span style={{ ...S.sideTag, background: `${t.accentFor}22`, color: t.accentFor, border: `1px solid ${t.accentFor}44` }}>
                🔵 {lang === 'en' ? 'For' : '찬성'}
              </span>
              <span style={{ ...S.sideTag, background: `${t.accentAgainst}22`, color: t.accentAgainst, border: `1px solid ${t.accentAgainst}44` }}>
                🔴 {lang === 'en' ? 'Against' : '반대'}
              </span>
            </div>

            {/* Subtopics */}
            <div style={S.subList}>
              {t.subtopics.map((sub, si) => (
                <button key={si}
                  className="sub-btn"
                  style={{
                    ...S.subBtn,
                    background: hoveredSub === si && hoveredTopic === t.id
                      ? `${t.accentFor}18` : 'rgba(255,255,255,0.04)',
                    borderColor: hoveredSub === si && hoveredTopic === t.id
                      ? `${t.accentFor}60` : 'rgba(255,255,255,0.08)',
                    color: hoveredSub === si && hoveredTopic === t.id ? t.accentFor : 'rgba(255,255,255,0.7)',
                  }}
                  onMouseEnter={() => setHoveredSub(si)}
                  onMouseLeave={() => setHoveredSub(null)}
                  onClick={() => startDebate(t, sub.en)}>
                  <span style={{ opacity: 0.5, marginRight: 6, fontSize: 10 }}>▶</span>
                  {lang === 'en' ? sub.en : sub.native}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={S.footerNote}>
        🏛️ {lang === 'en'
          ? 'Agora presents balanced arguments. All views are for educational purposes.'
          : '아고라는 균형 잡힌 논거를 제시합니다. 모든 견해는 교육 목적입니다.'}
      </div>
    </div>
  );

  // ── DEBATE ─────────────────────────────────────────────────────────────────

  if (!topic) return null;

  const subNative = topic.subtopics.find(s => s.en === subtopic)?.native || subtopic;

  return (
    <div style={S.debatePage}>
      <style>{CSS}</style>

      {/* Debate Nav */}
      <nav style={{ ...S.nav, background: '#0D0D0D', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => setView('lobby')} style={S.navBack}>
          ← {lang === 'en' ? 'Topics' : '주제'}
        </button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>
            {topic.emoji} {lang === 'en' ? topic.titleEn : topic.titleNative}
          </div>
          <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, marginTop: 1 }}>
            {lang === 'en' ? subtopic : subNative}
          </div>
        </div>
        <button
          onClick={() => setLang(l => l === 'en' ? 'native' : 'en')}
          style={S.langToggle}>
          {lang === 'en' ? '🇰🇷' : '🇺🇸'}
        </button>
      </nav>

      {/* Side selector */}
      <div style={S.sideSelector}>
        <button
          onClick={() => setActiveSide('for')}
          style={{
            ...S.sideSelectorBtn,
            background: activeSide === 'for' ? `${topic.accentFor}22` : 'transparent',
            color: activeSide === 'for' ? topic.accentFor : '#475569',
            borderBottom: activeSide === 'for' ? `2px solid ${topic.accentFor}` : '2px solid transparent',
          }}>
          🔵 {lang === 'en' ? 'For (찬성)' : '찬성 (For)'}
        </button>
        <div style={{ color: '#1E293B', fontSize: 18, fontWeight: 900 }}>⚡</div>
        <button
          onClick={() => setActiveSide('against')}
          style={{
            ...S.sideSelectorBtn,
            background: activeSide === 'against' ? `${topic.accentAgainst}22` : 'transparent',
            color: activeSide === 'against' ? topic.accentAgainst : '#475569',
            borderBottom: activeSide === 'against' ? `2px solid ${topic.accentAgainst}` : '2px solid transparent',
          }}>
          🔴 {lang === 'en' ? 'Against (반대)' : '반대 (Against)'}
        </button>
      </div>

      {/* Motion banner */}
      <div style={{ ...S.motionBanner, borderLeft: `3px solid ${activeSide === 'for' ? topic.accentFor : topic.accentAgainst}` }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#475569', letterSpacing: 1 }}>
          {lang === 'en' ? 'MOTION' : '주제'}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#CBD5E1', marginLeft: 10 }}>
          {lang === 'en' ? subtopic : subNative}
        </span>
      </div>

      {/* Chat */}
      <div ref={chatRef} style={S.chat}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeUp .3s ease',
          }}>
            {msg.role === 'ai' && (
              <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', marginBottom: 4, paddingLeft: 2, letterSpacing: 1 }}>
                🏛️ AGORA AI
              </div>
            )}
            {msg.role === 'user' && (
              <div style={{ fontSize: 10, fontWeight: 800, marginBottom: 4, paddingRight: 2, letterSpacing: 1,
                color: activeSide === 'for' ? topic.accentFor : topic.accentAgainst }}>
                {activeSide === 'for' ? '🔵' : '🔴'} {lang === 'en' ? 'YOU' : '나'}
              </div>
            )}
            <div style={{
              maxWidth: '84%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user'
                ? (activeSide === 'for' ? `${topic.accentFor}22` : `${topic.accentAgainst}22`)
                : '#141414',
              border: msg.role === 'user'
                ? `1.5px solid ${activeSide === 'for' ? topic.accentFor + '44' : topic.accentAgainst + '44'}`
                : '1.5px solid #1E293B',
              color: '#E2E8F0',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px',
              background: '#141414', border: '1.5px solid #1E293B',
              display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(d => (
                <div key={d} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: topic.accentFor,
                  animation: `thinking .9s ${d * .2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div style={S.quickRow}>
        {(lang === 'en' ? [
          `Argue FOR: ${subtopic.slice(0, 30)}...`,
          `Argue AGAINST`,
          `Steel-man both sides`,
          `Historical examples`,
        ] : [
          '찬성 논거 제시',
          '반대 논거 제시',
          '양쪽 최강 논거',
          '역사적 사례',
        ]).map((q, i) => (
          <button key={i}
            className="quick-btn"
            onClick={() => handleSend(q)}
            disabled={loading}
            style={{
              ...S.quickBtn,
              borderColor: i % 2 === 0 ? `${topic.accentFor}40` : `${topic.accentAgainst}40`,
              color: i % 2 === 0 ? topic.accentFor : topic.accentAgainst,
            }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={S.inputBar}>
        <button
          onMouseDown={() => {
            if (!recRef.current || isListening || loading) return;
            try { recRef.current.start(); setIsListening(true); } catch { }
          }}
          style={{
            ...S.micBtn,
            background: isListening ? 'linear-gradient(135deg,#EF4444,#DC2626)' : '#1E293B',
            color: isListening ? '#fff' : '#64748B',
            animation: isListening ? 'pulse .8s infinite' : 'none',
          }}>
          {isListening ? '⏹' : '🎤'}
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={loading}
          placeholder={lang === 'en'
            ? `State your argument or ask a question...`
            : '논거를 제시하거나 질문하세요...'}
          style={{
            ...S.input,
            borderColor: activeSide === 'for' ? `${topic.accentFor}40` : `${topic.accentAgainst}40`,
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          style={{
            ...S.sendBtn,
            background: input.trim() && !loading
              ? (activeSide === 'for' ? topic.accentFor : topic.accentAgainst)
              : '#1E293B',
            color: input.trim() && !loading ? '#000' : '#475569',
          }}>
          ➤
        </button>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes thinking { 0%,100%{opacity:.2;transform:scale(.75)} 50%{opacity:1;transform:scale(1)} }
  @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)} 70%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
  @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes cardIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .topic-card { animation: cardIn .5s ease both; transition: transform .2s, outline-color .2s !important; }
  .topic-card:hover { transform: translateY(-4px) !important; }
  .sub-btn { transition: all .15s; text-align:left; }
  .quick-btn { transition: all .15s; }
  .quick-btn:hover:not(:disabled) { opacity: .8; transform: translateY(-1px); }
`;

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#080810',
    fontFamily: "'Nunito','Noto Sans KR',sans-serif",
    color: '#E2E8F0',
  },
  debatePage: {
    height: '100dvh',
    background: '#080810',
    fontFamily: "'Nunito','Noto Sans KR',sans-serif",
    color: '#E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: 56,
    background: '#080810',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexShrink: 0,
  },
  navBack: {
    background: 'rgba(255,255,255,0.06)',
    border: 'none',
    borderRadius: 10,
    padding: '7px 14px',
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Nunito',sans-serif",
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  navLogoText: {
    fontFamily: "'Playfair Display',serif",
    fontSize: 18,
    fontWeight: 900,
    color: '#fff',
    letterSpacing: 3,
  },
  langToggle: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '7px 12px',
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Nunito',sans-serif",
  },

  // Hero
  hero: {
    position: 'relative',
    padding: '64px 24px 48px',
    textAlign: 'center',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -100,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 600,
    height: 300,
    background: 'radial-gradient(ellipse, rgba(56,189,248,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroInner: {
    position: 'relative',
    maxWidth: 600,
    margin: '0 auto',
  },
  heroBadge: {
    display: 'inline-block',
    background: 'rgba(56,189,248,0.1)',
    border: '1px solid rgba(56,189,248,0.3)',
    borderRadius: 99,
    padding: '6px 18px',
    fontSize: 12,
    fontWeight: 800,
    color: '#38BDF8',
    letterSpacing: 1,
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: "'Playfair Display',serif",
    fontSize: 52,
    fontWeight: 900,
    color: '#fff',
    margin: '0 0 16px',
    lineHeight: 1.1,
  },
  heroSub: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 1.7,
    fontWeight: 600,
    marginBottom: 24,
  },
  heroStats: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  heroStat: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 99,
    padding: '5px 14px',
    fontSize: 12,
    fontWeight: 800,
    color: '#475569',
    letterSpacing: 0.5,
  },

  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
    padding: '0 24px 60px',
    maxWidth: 1200,
    margin: '0 auto',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform .2s, outline-color .2s',
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: "'Playfair Display',serif",
    fontSize: 22,
    fontWeight: 900,
    color: '#fff',
    marginBottom: 6,
    lineHeight: 1.2,
  },
  cardSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: 700,
    marginBottom: 14,
    lineHeight: 1.4,
  },
  sideRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  sideTag: {
    fontSize: 11,
    fontWeight: 800,
    padding: '4px 12px',
    borderRadius: 99,
    letterSpacing: 0.5,
  },
  subList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  subBtn: {
    padding: '9px 12px',
    borderRadius: 10,
    border: '1px solid',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Nunito',sans-serif",
    lineHeight: 1.4,
  },
  footerNote: {
    textAlign: 'center',
    padding: '20px 24px 40px',
    fontSize: 12,
    color: '#1E293B',
    fontWeight: 700,
  },

  // Debate
  sideSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: '0 20px',
    background: '#0D0D0D',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  sideSelectorBtn: {
    flex: 1,
    maxWidth: 180,
    padding: '12px 8px',
    border: 'none',
    borderBottom: '2px solid transparent',
    background: 'transparent',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: "'Nunito',sans-serif",
    transition: 'all .2s',
    letterSpacing: 0.3,
  },
  motionBanner: {
    padding: '10px 20px',
    background: '#0A0A0A',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    gap: 0,
  },
  chat: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 16px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  quickRow: {
    display: 'flex',
    gap: 6,
    padding: '8px 12px',
    overflowX: 'auto',
    flexShrink: 0,
    background: '#0A0A0A',
    borderTop: '1px solid rgba(255,255,255,0.04)',
  },
  quickBtn: {
    flexShrink: 0,
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid',
    background: 'transparent',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Nunito',sans-serif",
    whiteSpace: 'nowrap',
  },
  inputBar: {
    display: 'flex',
    gap: 8,
    padding: '10px 12px 14px',
    background: '#0D0D0D',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
    alignItems: 'center',
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    flexShrink: 0,
    cursor: 'pointer',
    fontSize: 18,
    transition: 'all .2s',
  },
  input: {
    flex: 1,
    padding: '11px 16px',
    borderRadius: 12,
    background: '#141414',
    border: '1.5px solid',
    color: '#E2E8F0',
    fontSize: 14,
    fontFamily: "'Nunito',sans-serif",
    outline: 'none',
    fontWeight: 600,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    flexShrink: 0,
    fontSize: 16,
    cursor: 'pointer',
    transition: 'all .15s',
    fontWeight: 900,
  },
};
