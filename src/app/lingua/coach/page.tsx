'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/userProfile';
import { getTutorById } from '@/data/tutors';
import { CURRICULUM } from '@/data/curriculum';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMsg {
  role: 'coach' | 'user';
  text: string;
  ts: number;
}

interface LearnerSnapshot {
  name: string;
  nativeLang: string;
  nativeLangLabel: string;
  learnLang: string;
  learnLangLabel: string;
  xp: number;
  currentLevel: string;
  streak: number;
  completedLessons: string[];
  totalLessons: number;
  completedCount: number;
  recentLessons: { title: string; level: string }[];
  weakAreas: string[];
  tutorId: string;
}

// ── Language label map ────────────────────────────────────────────────────────

const LANG_LABELS: Record<string, string> = {
  // 영어 변형
  'en-US': 'English', 'en-GB': 'English', 'en-AU': 'English', 'en-CA': 'English',
  // 서유럽
  'es-ES': 'Español', 'es-MX': 'Español',
  'fr-FR': 'Français', 'fr-CA': 'Français',
  'de-DE': 'Deutsch',
  'it-IT': 'Italiano',
  'pt-BR': 'Português', 'pt-PT': 'Português',
  'nl-NL': 'Nederlands',
  'sv-SE': 'Svenska',
  'da-DK': 'Dansk',
  'nb-NO': 'Norsk',
  'fi-FI': 'Suomi',
  'pl-PL': 'Polski',
  'ru-RU': 'Русский',
  'uk-UA': 'Українська',
  'cs-CZ': 'Čeština',
  'sk-SK': 'Slovenčina',
  'hu-HU': 'Magyar',
  'ro-RO': 'Română',
  'el-GR': 'Ελληνικά',
  'tr-TR': 'Türkçe',
  'bg-BG': 'Български',
  'hr-HR': 'Hrvatski',
  'sl-SI': 'Slovenščina',
  'sr-RS': 'Српски',
  'et-EE': 'Eesti',
  'lv-LV': 'Latviešu',
  'lt-LT': 'Lietuvių',
  'ca-ES': 'Català',
  'gl-ES': 'Galego',
  'eu-ES': 'Euskara',
  'cy-GB': 'Cymraeg',
  'ga-IE': 'Gaeilge',
  'mt-MT': 'Malti',
  'is-IS': 'Íslenska',
  // 동유럽·발칸·코카서스
  'be-BY': 'Беларуская',
  'mk-MK': 'Македонски',
  'sq-AL': 'Shqip',
  'bs-BA': 'Bosanski',
  'hy-AM': 'Հայերեն',
  'ka-GE': 'ქართული',
  // 중앙아시아
  'az-AZ': 'Azərbaycan',
  'kk-KZ': 'Қазақша',
  'ky-KG': 'Кыргызча',
  'uz-UZ': 'Oʻzbekcha',
  'tg-TJ': 'Тоҷикӣ',
  'tk-TM': 'Türkmençe',
  'mn-MN': 'Монгол',
  // 동아시아
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'zh-CN': '中文(简体)',
  'zh-TW': '中文(繁體)',
  'yue-HK': '粵語',
  // 남아시아
  'hi-IN': 'हिन्दी',
  'bn-IN': 'বাংলা',
  'ur-IN': 'اردو',
  'ta-IN': 'தமிழ்',
  'te-IN': 'తెలుగు',
  'ml-IN': 'മലയാളം',
  'kn-IN': 'ಕನ್ನಡ',
  'gu-IN': 'ગુજરાતી',
  'mr-IN': 'मराठी',
  'pa-IN': 'ਪੰਜਾਬੀ',
  'ne-NP': 'नेपाली',
  'si-LK': 'සිංහල',
  'ps-AF': 'پښتو',
  // 동남아시아
  'vi-VN': 'Tiếng Việt',
  'th-TH': 'ภาษาไทย',
  'id-ID': 'Bahasa Indonesia',
  'ms-MY': 'Bahasa Melayu',
  'tl-PH': 'Filipino',
  'km-KH': 'ភាសាខ្មែរ',
  'lo-LA': 'ພາສາລາວ',
  'my-MM': 'မြန်မာဘာသာ',
  'jv-ID': 'Basa Jawa',
  'su-ID': 'Basa Sunda',
  // 중동
  'ar-XA': 'العربية',
  'he-IL': 'עברית',
  'fa-IR': 'فارسی',
  'ku-TR': 'Kurdî',
  // 아프리카
  'sw-KE': 'Kiswahili',
  'af-ZA': 'Afrikaans',
  'am-ET': 'አማርኛ',
  'zu-ZA': 'isiZulu',
  'xh-ZA': 'isiXhosa',
  'st-ZA': 'Sesotho',
  'yo-NG': 'Yorùbá',
  'ig-NG': 'Igbo',
  'ha-NG': 'Hausa',
  'so-SO': 'Soomaali',
  'ny-MW': 'Chichewa',
  'mg-MG': 'Malagasy',
  // 기타·국제어
  'ht-HT': 'Kreyòl ayisyen',
  'eo-XX': 'Esperanto',
  'la-XX': 'Latina',
};

const LEARN_LABELS: Record<string, string> = {
  'en-US': 'English', 'en-GB': 'English (UK)', 'ja-JP': 'Japanese', 'ko-KR': 'Korean',
  'zh-CN': 'Chinese', 'fr-FR': 'French', 'de-DE': 'German', 'es-ES': 'Spanish',
  'it-IT': 'Italian', 'pt-BR': 'Portuguese', 'ru-RU': 'Russian', 'ar-XA': 'Arabic',
};

const LEVEL_LABELS: Record<string, string> = {
  a1: 'A1 Beginner', a2: 'A2 Elementary', b1: 'B1 Intermediate',
  b2: 'B2 Upper-Intermediate', c1: 'C1 Advanced', c2: 'C2 Mastery',
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function CoachPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [snapshot, setSnapshot]   = useState<LearnerSnapshot | null>(null);
  const [messages, setMessages]   = useState<ChatMsg[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [briefing, setBriefing]   = useState(false); // 초기 브리핑 중
  const [ready, setReady]         = useState(false);
  const [isListening, setIsListening] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const recRef  = useRef<any>(null);
  const msgId   = useRef(0);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // ── Build learner snapshot ────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    const build = async () => {
      const learnLang  = localStorage.getItem('mt_learn_lang')  || 'en-US';
      const nativeLang = localStorage.getItem('mt_native_lang') || 'ko-KR';
      const xp         = parseInt(localStorage.getItem('mt_xp') || '0', 10);
      const streak     = parseInt(localStorage.getItem('mt_streak') || '0', 10);
      const doneParsed = JSON.parse(localStorage.getItem('mt_done') || '[]') as string[];
      const tutorId    = localStorage.getItem('mt_tutor_id') || 't01';

      let name = '학습자';
      let firestoreDone: string[] = [];

      if (user) {
        try {
          const p = await getUserProfile(user.uid);
          if (p?.displayName) name = p.displayName;
          if (p?.completedLessons) firestoreDone = p.completedLessons;
        } catch {}
      }

      const completedLessons = [...new Set([...doneParsed, ...firestoreDone])];

      // Current level by XP
      const xpBounds: Record<string, [number, number]> = {
        a1:[0,800], a2:[800,1400], b1:[1400,2400],
        b2:[2400,4000], c1:[4000,6500], c2:[6500,9999],
      };
      let currentLevel = 'a1';
      for (const [lvl, [min]] of Object.entries(xpBounds)) {
        if (xp >= min) currentLevel = lvl;
      }

      // Total lessons
      const allLessons = CURRICULUM.flatMap(l => l.steps.flatMap(s => s.lessons));
      const totalLessons = allLessons.length;

      // Recent completed lessons (last 5)
      const recentLessons = completedLessons.slice(-5).map(id => {
        const lesson = allLessons.find(l => l.id === id);
        const level  = id.split('-')[0].toUpperCase();
        return { title: lesson?.title || id, level };
      }).reverse();

      // Weak areas — lessons done only once (low confidence proxy)
      const weakAreas: string[] = [];
      if (completedLessons.length > 0) {
        const levelCounts: Record<string, number> = {};
        completedLessons.forEach(id => {
          const lvl = id.split('-')[0];
          levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
        });
        if ((levelCounts['a1'] || 0) < 6) weakAreas.push('기초 표현');
        if (completedLessons.filter(id => id.startsWith('b')).length < 3) weakAreas.push('중급 문법');
      }

      const snap: LearnerSnapshot = {
        name,
        nativeLang,
        nativeLangLabel: LANG_LABELS[nativeLang] || nativeLang,
        learnLang,
        learnLangLabel: LEARN_LABELS[learnLang] || learnLang,
        xp,
        currentLevel,
        streak,
        completedLessons,
        totalLessons,
        completedCount: completedLessons.length,
        recentLessons,
        weakAreas,
        tutorId,
      };

      setSnapshot(snap);
      setReady(true);
      startBriefing(snap);
    };
    build();
  }, [user, authLoading]); // eslint-disable-line

  // ── STT ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!snapshot) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = snapshot.nativeLang;
    rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => handleSend(e.results[0][0].transcript);
    rec.onerror  = () => setIsListening(false);
    rec.onend    = () => setIsListening(false);
    recRef.current = rec;
  }, [snapshot]); // eslint-disable-line

  // ── Initial briefing ──────────────────────────────────────────────────────

  const startBriefing = async (snap: LearnerSnapshot) => {
    setBriefing(true);

    const systemPrompt = buildSystemPrompt(snap);
    const openingPrompt = `
지금 학습자와 첫 코칭 세션을 시작합니다.
다음을 ${snap.nativeLangLabel}로 작성하세요 (반드시 ${snap.nativeLangLabel}로만):

1. 따뜻하게 학습자 이름(${snap.name})을 불러 인사
2. 지금까지의 학습 현황을 구체적 숫자와 함께 브리핑 (XP: ${snap.xp}, 완료 레슨: ${snap.completedCount}개, 연속 학습: ${snap.streak}일)
3. 최근 완료한 레슨들(${snap.recentLessons.map(r => r.title).join(', ') || '없음'})을 언급하며 칭찬
4. 현재 레벨(${LEVEL_LABELS[snap.currentLevel]})에서 다음 단계로 가기 위한 핵심 조언 1가지
5. 오늘 어떤 도움이 필요한지 질문

자연스럽고 따뜻한 코치 말투로, 3-4문단 이내로 작성.`;

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: null, temperature: 0.85, prompt: `${systemPrompt}\n\n${openingPrompt}` }),
      });
      const data = await res.json();
      const text = data.text?.trim() || '안녕하세요! 학습 코치입니다.';
      setMessages([{ role: 'coach', text, ts: Date.now() }]);
    } catch {
      setMessages([{ role: 'coach', text: '안녕하세요! 오늘 학습 상담을 시작하겠습니다.', ts: Date.now() }]);
    } finally {
      setBriefing(false);
    }
  };

  // ── System prompt ─────────────────────────────────────────────────────────

  const buildSystemPrompt = (snap: LearnerSnapshot) => `
당신은 MunTalk의 AI 학습 코치입니다.
학습자 정보:
- 이름: ${snap.name}
- 모국어: ${snap.nativeLangLabel}
- 학습 언어: ${snap.learnLangLabel}
- 현재 레벨: ${LEVEL_LABELS[snap.currentLevel]}
- 총 XP: ${snap.xp}
- 완료 레슨: ${snap.completedCount}/${snap.totalLessons}개
- 연속 학습: ${snap.streak}일
- 최근 학습: ${snap.recentLessons.map(r => `${r.level} ${r.title}`).join(', ') || '없음'}
- 취약 영역: ${snap.weakAreas.join(', ') || '분석 중'}

규칙:
- 반드시 ${snap.nativeLangLabel}로만 대화
- 따뜻하고 동기부여가 되는 코치 말투
- 구체적인 학습 데이터를 활용한 맞춤 조언
- 학습자의 질문에 실질적으로 도움되는 답변
- 필요시 학습 링크나 다음 레슨을 추천
- 2-3문단 이내로 간결하게`;

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(async (text?: string) => {
    const txt = (text ?? input).trim();
    if (!txt || loading || !snapshot) return;
    setInput('');

    const userMsg: ChatMsg = { role: 'user', text: txt, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const history = messages.slice(-8).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    const prompt = `${buildSystemPrompt(snapshot)}

이전 대화:
${history.map(h => `${h.role === 'user' ? '학습자' : '코치'}: ${h.content}`).join('\n')}

학습자: ${txt}

코치:`;

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: null, temperature: 0.8, prompt }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'coach', text: data.text?.trim() || '죄송합니다, 다시 시도해주세요.', ts: Date.now(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'coach', text: '연결 오류가 발생했습니다. 다시 시도해주세요.', ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, snapshot]);

  // ── Quick questions ───────────────────────────────────────────────────────

  const quickQuestions = snapshot ? [
    `오늘 어떤 레슨을 하면 좋을까요?`,
    `제 약점이 뭔가요?`,
    `${LEVEL_LABELS[snapshot.currentLevel]}에서 가장 중요한 것은?`,
    `학습 동기가 떨어질 때 어떻게 하나요?`,
    `다음 레벨까지 얼마나 걸릴까요?`,
  ] : [];

  const tutor = snapshot ? getTutorById(snapshot.tutorId) : null;

  // ── Render ────────────────────────────────────────────────────────────────

  if (!ready) return (
    <div style={S.loadingPage}>
      <style>{CSS}</style>
      <div style={S.loadingInner}>
        <div className="pulse-ring"/>
        <div style={S.loadingText}>코치를 준비하고 있어요...</div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Nav */}
      <nav style={S.nav}>
        <button onClick={() => router.push('/lingua')} style={S.navBack}>← 홈</button>
        <div style={S.navCenter}>
          <span style={S.navIcon}>🧑‍🏫</span>
          <span style={S.navTitle}>AI 학습 코치</span>
        </div>
        <div style={S.navLang}>{snapshot?.nativeLangLabel}</div>
      </nav>

      {/* Stats strip */}
      {snapshot && (
        <div style={S.statsStrip}>
          {[
            { label: '현재 레벨', value: snapshot.currentLevel.toUpperCase(), icon: '📊' },
            { label: '총 XP', value: `${snapshot.xp.toLocaleString()}`, icon: '⭐' },
            { label: '완료 레슨', value: `${snapshot.completedCount}개`, icon: '✅' },
            { label: '연속 학습', value: `${snapshot.streak}일`, icon: '🔥' },
          ].map(s => (
            <div key={s.label} style={S.statItem}>
              <span style={S.statIcon}>{s.icon}</span>
              <span style={S.statValue}>{s.value}</span>
              <span style={S.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chat */}
      <div ref={chatRef} style={S.chat}>

        {/* Briefing loading */}
        {briefing && (
          <div style={S.briefingWrap}>
            <div style={S.briefingCard}>
              <div style={S.briefingDots}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ ...S.dot, animationDelay: `${i * 0.2}s` }}/>
                ))}
              </div>
              <div style={S.briefingText}>학습 기록을 분석하고 있어요...</div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeUp .3s ease',
          }}>
            {/* Coach header */}
            {msg.role === 'coach' && (
              <div style={S.coachHeader}>
                {tutor && (
                  <img src={tutor.thumbnail} alt="" style={S.coachAvatar}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}/>
                )}
                <span style={S.coachLabel}>AI 코치</span>
              </div>
            )}

            {/* Bubble */}
            <div style={{
              ...S.bubble,
              ...(msg.role === 'user' ? S.userBubble : S.coachBubble),
            }}>
              {msg.text.split('\n').map((line, j) => (
                <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br/>}</span>
              ))}
            </div>
          </div>
        ))}

        {/* Thinking */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {tutor && <img src={tutor.thumbnail} alt="" style={S.coachAvatar}/>}
            <div style={{ ...S.coachBubble, ...S.bubble, padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ ...S.dot, background: '#6366F1', animationDelay: `${i*0.2}s` }}/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick questions */}
      {messages.length > 0 && !loading && (
        <div style={S.quickWrap}>
          <div style={S.quickScroll}>
            {quickQuestions.map((q, i) => (
              <button key={i} className="quick-btn" onClick={() => handleSend(q)} style={S.quickBtn}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA — 학습 시작 버튼 */}
      {messages.length >= 2 && (
        <div style={S.ctaWrap}>
          <button onClick={() => router.push('/lingua')} style={S.ctaBtn}>
            📚 학습 시작하기 →
          </button>
          <button onClick={() => router.push('/lingua/roleplay')} style={S.ctaBtn2}>
            🎭 롤플레이 연습
          </button>
        </div>
      )}

      {/* Input */}
      <div style={S.inputBar}>
        <button
          onMouseDown={() => {
            if (!recRef.current || isListening || loading) return;
            try { recRef.current.start(); setIsListening(true); } catch {}
          }}
          style={{
            ...S.micBtn,
            background: isListening ? 'linear-gradient(135deg,#EF4444,#DC2626)' : '#F1F5F9',
            color: isListening ? '#fff' : '#64748B',
            animation: isListening ? 'pulse .8s infinite' : 'none',
          }}>
          {isListening ? '⏹' : '🎤'}
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          disabled={loading || briefing}
          placeholder={snapshot ? `${snapshot.nativeLangLabel}로 질문하세요...` : '질문을 입력하세요...'}
          style={{ ...S.input, opacity: loading || briefing ? 0.5 : 1 }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading || briefing}
          style={{
            ...S.sendBtn,
            background: input.trim() && !loading ? '#6366F1' : '#E5E7EB',
            color: input.trim() && !loading ? '#fff' : '#94A3B8',
          }}>
          ➤
        </button>
      </div>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Noto+Sans+KR:wght@400;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes thinking { 0%,100%{opacity:.2;transform:scale(.75)} 50%{opacity:1;transform:scale(1)} }
  @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 70%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
  @keyframes ripple { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.5);opacity:0} }
  .pulse-ring {
    width:64px;height:64px;border-radius:50%;
    background:linear-gradient(135deg,#6366F1,#8B5CF6);
    position:relative;margin:0 auto 20px;
    display:flex;align-items:center;justify-content:center;
    font-size:28px;
  }
  .pulse-ring::after {
    content:'';position:absolute;inset:0;border-radius:50%;
    background:linear-gradient(135deg,#6366F1,#8B5CF6);
    animation:ripple 1.5s ease-out infinite;
  }
  .quick-btn { transition:all .15s; }
  .quick-btn:hover { transform:translateY(-1px); opacity:.85; }
`;

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: {
    height: '100dvh', display: 'flex', flexDirection: 'column',
    background: '#F8FAFC', fontFamily: "'Nunito','Noto Sans KR',sans-serif",
    color: '#0F172A', overflow: 'hidden',
  },
  loadingPage: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#F8FAFC', fontFamily: "'Nunito',sans-serif",
  },
  loadingInner: { textAlign: 'center' },
  loadingText: { fontSize: 15, fontWeight: 700, color: '#64748B' },

  // Nav
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px', height: 56, background: '#fff',
    borderBottom: '1px solid #F1F5F9', flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  navBack: {
    background: '#F1F5F9', border: 'none', borderRadius: 10,
    padding: '7px 14px', color: '#64748B', fontSize: 13,
    fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
  },
  navCenter: { display: 'flex', alignItems: 'center', gap: 6 },
  navIcon: { fontSize: 20 },
  navTitle: { fontSize: 16, fontWeight: 900, color: '#0F172A' },
  navLang: {
    fontSize: 11, fontWeight: 800, color: '#6366F1',
    background: '#EEF2FF', padding: '4px 10px', borderRadius: 99,
  },

  // Stats
  statsStrip: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
    background: '#fff', borderBottom: '1px solid #F1F5F9',
    flexShrink: 0,
  },
  statItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '10px 4px', gap: 2,
    borderRight: '1px solid #F1F5F9',
  },
  statIcon: { fontSize: 16 },
  statValue: { fontSize: 14, fontWeight: 900, color: '#0F172A' },
  statLabel: { fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: 0.3 },

  // Chat
  chat: {
    flex: 1, overflowY: 'auto', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: 14,
  },

  // Briefing loading
  briefingWrap: { display: 'flex', justifyContent: 'flex-start' },
  briefingCard: {
    background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '16px 16px 16px 4px',
    padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  briefingDots: { display: 'flex', gap: 4 },
  briefingText: { fontSize: 13, fontWeight: 700, color: '#64748B' },
  dot: {
    width: 7, height: 7, borderRadius: '50%', background: '#6366F1',
    animation: 'thinking .9s infinite',
  },

  // Coach
  coachHeader: {
    display: 'flex', alignItems: 'center', gap: 6,
    marginBottom: 4, paddingLeft: 2,
  },
  coachAvatar: {
    width: 22, height: 22, borderRadius: '50%',
    objectFit: 'cover' as const, objectPosition: 'center 10%',
    border: '1.5px solid #E2E8F0',
  },
  coachLabel: { fontSize: 10, fontWeight: 800, color: '#6366F1', letterSpacing: 0.5 },

  // Bubbles
  bubble: {
    maxWidth: '84%', padding: '13px 16px', fontSize: 14,
    fontWeight: 600, lineHeight: 1.75,
  },
  coachBubble: {
    background: '#fff', border: '1.5px solid #E2E8F0',
    borderRadius: '16px 16px 16px 4px', color: '#0F172A',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  userBubble: {
    background: 'linear-gradient(135deg,#6366F1,#818CF8)',
    borderRadius: '16px 16px 4px 16px', color: '#fff',
  },

  // Quick questions
  quickWrap: {
    background: '#fff', borderTop: '1px solid #F1F5F9',
    padding: '8px 0', flexShrink: 0,
  },
  quickScroll: {
    display: 'flex', gap: 8, overflowX: 'auto',
    padding: '0 16px', scrollbarWidth: 'none' as const,
  },
  quickBtn: {
    flexShrink: 0, padding: '7px 14px', borderRadius: 99,
    border: '1.5px solid #E2E8F0', background: '#F8FAFC',
    color: '#475569', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
    whiteSpace: 'nowrap' as const,
  },

  // CTA
  ctaWrap: {
    display: 'flex', gap: 8, padding: '8px 16px',
    background: '#F8FAFC', flexShrink: 0,
  },
  ctaBtn: {
    flex: 1, padding: '11px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg,#6366F1,#818CF8)',
    color: '#fff', fontWeight: 800, fontSize: 13,
    cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
  },
  ctaBtn2: {
    flex: 1, padding: '11px', borderRadius: 12,
    border: '1.5px solid #E2E8F0', background: '#fff',
    color: '#475569', fontWeight: 700, fontSize: 13,
    cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
  },

  // Input
  inputBar: {
    display: 'flex', gap: 8, padding: '10px 12px 14px',
    background: '#fff', borderTop: '1px solid #F1F5F9',
    flexShrink: 0, alignItems: 'center',
  },
  micBtn: {
    width: 44, height: 44, borderRadius: '50%', border: 'none',
    flexShrink: 0, cursor: 'pointer', fontSize: 18, transition: 'all .2s',
  },
  input: {
    flex: 1, padding: '11px 16px', borderRadius: 12,
    background: '#F8FAFC', border: '1.5px solid #E5E7EB',
    color: '#0F172A', fontSize: 14, fontFamily: "'Nunito',sans-serif",
    outline: 'none', fontWeight: 600,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: '50%', border: 'none',
    flexShrink: 0, fontSize: 16, cursor: 'pointer', transition: 'all .15s',
  },
};
