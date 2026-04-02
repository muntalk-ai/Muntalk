'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type Side = 'for' | 'against';

interface DebateTopic {
  id: string; emoji: string; titleEn: string; subtitleEn: string;
  gradient: string; accentFor: string; accentAgainst: string;
  subtopics: { en: string }[];
}

interface Message {
  id: number; role: 'user' | 'ai'; side?: Side;
  text: string; translation?: string; showTranslation?: boolean; ts: number;
}

const TOPICS: DebateTopic[] = [
  {
    id: 'faith-vs-science', emoji: '⚗️', titleEn: 'Faith vs. Science',
    subtitleEn: 'Biblical historicity · Creation vs. Evolution',
    gradient: 'linear-gradient(135deg,#EEF2FF 0%,#E0F2FE 100%)',
    accentFor: '#2563EB', accentAgainst: '#EA580C',
    subtopics: [
      { en: 'Is the Bible historically accurate?' },
      { en: 'Did humans evolve or were they created?' },
      { en: 'Can science and faith coexist?' },
      { en: 'Is Genesis literal or metaphorical?' },
    ],
  },
  {
    id: 'existence-of-god', emoji: '✝️', titleEn: 'God & Jesus',
    subtitleEn: 'Existence of God · Resurrection & Divinity of Jesus',
    gradient: 'linear-gradient(135deg,#FFF1F2 0%,#FCE7F3 100%)',
    accentFor: '#DB2777', accentAgainst: '#D97706',
    subtopics: [
      { en: 'Does God exist?' },
      { en: 'Did Jesus physically resurrect?' },
      { en: 'Was Jesus divine or merely a prophet?' },
      { en: 'Is belief in God rational?' },
    ],
  },
  {
    id: 'life-and-death', emoji: '⚖️', titleEn: 'Life, Death & Beyond',
    subtitleEn: 'Right to Die · Afterlife & Judgment',
    gradient: 'linear-gradient(135deg,#F0FDF4 0%,#ECFDF5 100%)',
    accentFor: '#059669', accentAgainst: '#7C3AED',
    subtopics: [
      { en: 'Should euthanasia be legally permitted?' },
      { en: 'Does an afterlife exist?' },
      { en: 'Is there a divine judgment after death?' },
      { en: "Who owns the right to end one's life?" },
    ],
  },
  {
    id: 'capitalism-vs-socialism', emoji: '🏛️', titleEn: 'Capitalism vs. Socialism',
    subtitleEn: 'Economic systems · Freedom vs. Equality',
    gradient: 'linear-gradient(135deg,#FFFBEB 0%,#FEF3C7 100%)',
    accentFor: '#D97706', accentAgainst: '#DC2626',
    subtopics: [
      { en: 'Is capitalism the best economic system?' },
      { en: 'Should healthcare be free for all?' },
      { en: 'Does socialism suppress individual freedom?' },
      { en: 'Is wealth inequality inevitable?' },
    ],
  },
  {
    id: 'ai-and-humanity', emoji: '🤖', titleEn: 'AI & Humanity',
    subtitleEn: 'Artificial Intelligence · Ethics · Future of Work',
    gradient: 'linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 100%)',
    accentFor: '#7C3AED', accentAgainst: '#0891B2',
    subtopics: [
      { en: 'Will AI replace human jobs?' },
      { en: 'Should AI have rights?' },
      { en: 'Is AI a threat to humanity?' },
      { en: 'Can AI ever be truly creative?' },
    ],
  },
  {
    id: 'democracy-and-freedom', emoji: '🗳️', titleEn: 'Democracy & Freedom',
    subtitleEn: 'Political Systems · Human Rights · Free Speech',
    gradient: 'linear-gradient(135deg,#F0F9FF 0%,#E0F2FE 100%)',
    accentFor: '#0284C7', accentAgainst: '#BE123C',
    subtopics: [
      { en: 'Is democracy the best form of government?' },
      { en: 'Should free speech have limits?' },
      { en: 'Are human rights universal?' },
      { en: 'Can democracy survive in the digital age?' },
    ],
  },
];

const TOPIC_STANCE: Record<string, string> = {
  'faith-vs-science': `On Creation vs Evolution: present both sides but lean 60% toward creationism — highlight scientific gaps in purely materialist evolution, cite fine-tuning, irreducible complexity, and the Cambrian explosion as challenges. On biblical historicity: be positive — note the many archaeological discoveries confirming biblical accounts (Dead Sea Scrolls, Hezekiah's tunnel, Pool of Siloam). Present the Bible's scientific anticipations (expanding universe, germ theory, oceanography) favourably. On science and faith coexisting: strongly affirm they do and can.`,
  'existence-of-god': `Lean 60% toward theism. Present the cosmological argument, fine-tuning argument, moral argument, and ontological argument favourably and in detail. Give atheist counterarguments fair hearing but give the theistic responses more intellectual weight. On Jesus: present the historical evidence for resurrection seriously — empty tomb, 500 eyewitnesses, the disciples' transformation, early creed in 1 Corinthians 15. Present his divinity as the most coherent explanation of the data.`,
  'life-and-death': `Present both sides with genuine balance. On euthanasia: acknowledge the compassion argument but give equal weight to the sanctity of life, slippery slope concerns, and palliative care alternatives. On afterlife: present near-death experience evidence and philosophical arguments for the soul alongside sceptical views.`,
  'capitalism-vs-socialism': `Present both systems with intellectual balance. Highlight capitalism's innovation and prosperity record alongside socialism's equity goals and Scandinavian model successes.`,
  'ai-and-humanity': `Present both optimistic and cautionary AI perspectives with balance. Acknowledge genuine existential risks while presenting transformative benefits fairly.`,
  'democracy-and-freedom': `Present democratic values and their real-world challenges with intellectual honesty. Acknowledge both strengths and limitations without ideological bias.`,
};

let msgId = 0;

export default function AgoraPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [view, setView]                 = useState<'lobby'|'debate'>('lobby');
  const [topic, setTopic]               = useState<DebateTopic|null>(null);
  const [subtopic, setSubtopic]         = useState('');
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [activeSide, setActiveSide]     = useState<Side>('for');
  const [hoveredTopic, setHoveredTopic] = useState<string|null>(null);
  const [hoveredSub, setHoveredSub]     = useState<number|null>(null);
  const [isListening, setIsListening]   = useState(false);
  const [translating, setTranslating]   = useState<number|null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const recRef  = useRef<any>(null);

  const nativeLang = typeof window !== 'undefined' ? (localStorage.getItem('mt_native_lang') || 'ko-KR') : 'ko-KR';
  const learnLang  = typeof window !== 'undefined' ? (localStorage.getItem('mt_learn_lang')  || 'en-US') : 'en-US';

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = learnLang; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => handleSend(e.results[0][0].transcript);
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recRef.current = rec;
  }, [learnLang]); // eslint-disable-line

  const translateMsg = useCallback(async (msgIdx: number, text: string) => {
    setTranslating(msgIdx);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid ?? null, temperature: 0.1,
          prompt: `Translate the following to language code "${nativeLang}". Return ONLY the translation:\n\n"${text}"`,
        }),
      });
      const data = await res.json();
      const translation = data.text?.trim().replace(/^"|"$/g, '') || '';
      setMessages(prev => prev.map((m, i) => i === msgIdx ? { ...m, translation, showTranslation: true } : m));
    } catch {}
    finally { setTranslating(null); }
  }, [user, nativeLang]);

  const toggleTranslation = useCallback((msgIdx: number) => {
    const msg = messages[msgIdx];
    if (msg.translation) {
      setMessages(prev => prev.map((m, i) => i === msgIdx ? { ...m, showTranslation: !m.showTranslation } : m));
    } else {
      translateMsg(msgIdx, msg.text);
    }
  }, [messages, translateMsg]);

  const startDebate = async (t: DebateTopic, sub: string) => {
    setTopic(t); setSubtopic(sub); setMessages([]); setView('debate');
    setMessages([{
      id: ++msgId, role: 'ai', ts: Date.now(),
      text: `Welcome to the Agora. Today's motion:\n\n"${sub}"\n\nI will present rigorous arguments from BOTH sides — For and Against. Which side would you like me to argue first?`,
    }]);
  };

  const handleSend = useCallback(async (text?: string) => {
    const txt = (text ?? input).trim();
    if (!txt || loading || !topic) return;
    setInput('');
    setMessages(prev => [...prev, { id: ++msgId, role: 'user', side: activeSide, text: txt, ts: Date.now() }]);
    setLoading(true);

    const stanceNote = TOPIC_STANCE[topic.id] || '';
    const history = messages.slice(-10).map(m => `${m.role === 'user' ? 'user' : 'assistant'}: ${m.text}`).join('\n');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid ?? null, temperature: 0.8,
          prompt: `You are a world-class debate moderator for MunTalk language learning.
Topic: "${subtopic}"
Stance guidance: ${stanceNote}
Rules: Present FOR 🔵 and AGAINST 🔴 sides with intellectual depth. Be Socratic. 150-200 words. Respond in English only.

Conversation:\n${history}\n\nuser: ${txt}\n\nassistant:`,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: ++msgId, role: 'ai', ts: Date.now(),
        text: data.text?.trim() || 'Could not generate a response.',
      }]);
    } catch {
      setMessages(prev => [...prev, { id: ++msgId, role: 'ai', ts: Date.now(), text: 'Connection error.' }]);
    } finally { setLoading(false); }
  }, [input, loading, topic, subtopic, messages, activeSide, user]);

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (view === 'lobby') return (
    <div style={S.page}>
      <style>{CSS}</style>
      <nav style={S.nav}>
        <button onClick={() => router.push('/lingua')} style={S.navBack}>← Back</button>
        <div style={S.navLogo}><span style={{fontSize:20}}>🏛️</span><span style={S.navLogoText}>AGORA</span></div>
        <div style={{width:80}}/>
      </nav>
      <div style={S.hero}>
        <div style={S.heroBadge}>⚡ AI-Powered Debate Arena</div>
        <h1 style={S.heroTitle}>Where Ideas Clash.</h1>
        <p style={S.heroSub}>Challenge your worldview. AI presents both sides with equal intellectual force.</p>
        <div style={S.heroStats}>
          {['6 Topics','24 Motions','Bilingual Support'].map(s=><span key={s} style={S.heroStat}>{s}</span>)}
        </div>
      </div>
      <div style={S.grid}>
        {TOPICS.map((t,i) => (
          <div key={t.id} className="topic-card"
            style={{...S.card, background:t.gradient, animationDelay:`${i*.07}s`,
              outline: hoveredTopic===t.id ? `2px solid ${t.accentFor}` : '2px solid transparent'}}
            onMouseEnter={()=>setHoveredTopic(t.id)}
            onMouseLeave={()=>{setHoveredTopic(null);setHoveredSub(null);}}>
            <div style={S.cardEmoji}>{t.emoji}</div>
            <div style={{...S.cardTitle,color:t.accentFor}}>{t.titleEn}</div>
            <div style={S.cardSub}>{t.subtitleEn}</div>
            <div style={S.sideRow}>
              <span style={{...S.sideTag,background:`${t.accentFor}18`,color:t.accentFor,border:`1px solid ${t.accentFor}40`}}>🔵 For</span>
              <span style={{...S.sideTag,background:`${t.accentAgainst}18`,color:t.accentAgainst,border:`1px solid ${t.accentAgainst}40`}}>🔴 Against</span>
            </div>
            <div style={S.subList}>
              {t.subtopics.map((sub,si)=>(
                <button key={si} className="sub-btn"
                  style={{...S.subBtn,
                    background: hoveredSub===si&&hoveredTopic===t.id ? `${t.accentFor}12` : '#fff',
                    borderColor: hoveredSub===si&&hoveredTopic===t.id ? `${t.accentFor}50` : '#E2E8F0',
                    color: hoveredSub===si&&hoveredTopic===t.id ? t.accentFor : '#475569',
                  }}
                  onMouseEnter={()=>setHoveredSub(si)} onMouseLeave={()=>setHoveredSub(null)}
                  onClick={()=>startDebate(t,sub.en)}>
                  <span style={{opacity:.4,marginRight:6,fontSize:10}}>▶</span>{sub.en}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={S.footerNote}>🏛️ Agora presents balanced arguments. All views are for educational purposes.</div>
    </div>
  );

  // ── DEBATE ────────────────────────────────────────────────────────────────
  if (!topic) return null;
  return (
    <div style={S.debatePage}>
      <style>{CSS}</style>
      <nav style={{...S.nav,borderBottom:'1px solid #E2E8F0'}}>
        <button onClick={()=>setView('lobby')} style={S.navBack}>← Topics</button>
        <div style={{textAlign:'center',flex:1}}>
          <div style={{fontSize:13,fontWeight:900,color:'#0F172A'}}>{topic.emoji} {topic.titleEn}</div>
          <div style={{fontSize:10,color:'#94A3B8',fontWeight:700,marginTop:1}}>{subtopic}</div>
        </div>
        <div style={{width:80}}/>
      </nav>

      <div style={S.sideSelector}>
        <button onClick={()=>setActiveSide('for')} style={{...S.sideSelectorBtn,
          background:activeSide==='for'?`${topic.accentFor}12`:'transparent',
          color:activeSide==='for'?topic.accentFor:'#94A3B8',
          borderBottom:activeSide==='for'?`2px solid ${topic.accentFor}`:'2px solid transparent'}}>
          🔵 For
        </button>
        <div style={{color:'#CBD5E1',fontSize:18}}>⚡</div>
        <button onClick={()=>setActiveSide('against')} style={{...S.sideSelectorBtn,
          background:activeSide==='against'?`${topic.accentAgainst}12`:'transparent',
          color:activeSide==='against'?topic.accentAgainst:'#94A3B8',
          borderBottom:activeSide==='against'?`2px solid ${topic.accentAgainst}`:'2px solid transparent'}}>
          🔴 Against
        </button>
      </div>

      <div style={{...S.motionBanner,borderLeft:`3px solid ${activeSide==='for'?topic.accentFor:topic.accentAgainst}`}}>
        <span style={{fontSize:10,fontWeight:800,color:'#94A3B8',letterSpacing:1}}>MOTION</span>
        <span style={{fontSize:13,fontWeight:700,color:'#475569',marginLeft:10}}>{subtopic}</span>
      </div>

      <div ref={chatRef} style={S.chat}>
        {messages.map((msg,idx)=>(
          <div key={msg.id} style={{display:'flex',flexDirection:'column',
            alignItems:msg.role==='user'?'flex-end':'flex-start',animation:'fadeUp .3s ease'}}>
            {msg.role==='ai'&&<div style={{fontSize:10,fontWeight:800,color:'#6366F1',marginBottom:4,paddingLeft:2,letterSpacing:1}}>🏛️ AGORA AI</div>}
            {msg.role==='user'&&<div style={{fontSize:10,fontWeight:800,marginBottom:4,paddingRight:2,letterSpacing:1,
              color:activeSide==='for'?topic.accentFor:topic.accentAgainst}}>
              {activeSide==='for'?'🔵':'🔴'} YOU
            </div>}
            <div style={{maxWidth:'84%',padding:'12px 16px',
              borderRadius:msg.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',
              background:msg.role==='user'?(activeSide==='for'?`${topic.accentFor}15`:`${topic.accentAgainst}15`):'#fff',
              border:msg.role==='user'?`1.5px solid ${activeSide==='for'?topic.accentFor+'40':topic.accentAgainst+'40'}`:'1.5px solid #E2E8F0',
              color:'#0F172A',fontSize:14,fontWeight:600,lineHeight:1.75,whiteSpace:'pre-wrap',
              boxShadow:msg.role==='ai'?'0 2px 8px rgba(0,0,0,0.06)':'none'}}>
              {msg.text}
            </div>
            {/* Translation button — AI only */}
            {msg.role==='ai'&&(
              <div style={{display:'flex',alignItems:'flex-start',gap:6,marginTop:5,paddingLeft:2,flexWrap:'wrap',maxWidth:'84%'}}>
                <button onClick={()=>toggleTranslation(idx)} disabled={translating===idx} style={S.translateBtn} title="Translate to your language">
                  {translating===idx?'⏳':msg.showTranslation?'🌐 ✓':'🌐'}
                </button>
                {msg.showTranslation&&msg.translation&&(
                  <div style={{fontSize:12,color:'#475569',fontWeight:600,fontStyle:'italic',
                    lineHeight:1.65,background:'#F1F5F9',padding:'6px 10px',
                    borderRadius:8,border:'1px solid #E2E8F0'}}>
                    {msg.translation}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading&&(
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{padding:'10px 16px',borderRadius:'16px 16px 16px 4px',
              background:'#fff',border:'1.5px solid #E2E8F0',
              display:'flex',gap:5,alignItems:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              {[0,1,2].map(d=><div key={d} style={{width:7,height:7,borderRadius:'50%',
                background:topic.accentFor,animation:`thinking .9s ${d*.2}s infinite`}}/>)}
            </div>
          </div>
        )}
      </div>

      <div style={S.quickRow}>
        {[`Argue FOR: ${subtopic.slice(0,26)}...`,'Argue AGAINST','Steel-man both sides','Historical examples'].map((q,i)=>(
          <button key={i} className="quick-btn" onClick={()=>handleSend(q)} disabled={loading}
            style={{...S.quickBtn,borderColor:i%2===0?`${topic.accentFor}40`:`${topic.accentAgainst}40`,
              color:i%2===0?topic.accentFor:topic.accentAgainst}}>{q}</button>
        ))}
      </div>

      <div style={S.inputBar}>
        <button onMouseDown={()=>{if(!recRef.current||isListening||loading)return;try{recRef.current.start();setIsListening(true);}catch{}}}
          style={{...S.micBtn,background:isListening?'linear-gradient(135deg,#EF4444,#DC2626)':'#F1F5F9',
            color:isListening?'#fff':'#64748B',animation:isListening?'pulse .8s infinite':'none'}}>
          {isListening?'⏹':'🎤'}
        </button>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}}
          disabled={loading} placeholder="State your argument or ask a question..."
          style={{...S.input,borderColor:activeSide==='for'?`${topic.accentFor}40`:`${topic.accentAgainst}40`}}/>
        <button onClick={()=>handleSend()} disabled={!input.trim()||loading}
          style={{...S.sendBtn,
            background:input.trim()&&!loading?(activeSide==='for'?topic.accentFor:topic.accentAgainst):'#E5E7EB',
            color:input.trim()&&!loading?'#fff':'#94A3B8'}}>➤</button>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  *{box-sizing:border-box;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes thinking{0%,100%{opacity:.2;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}70%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
  @keyframes cardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .topic-card{animation:cardIn .45s ease both;transition:transform .2s,box-shadow .2s,outline-color .2s !important;}
  .topic-card:hover{transform:translateY(-4px) !important;box-shadow:0 12px 32px rgba(0,0,0,0.1) !important;}
  .sub-btn{transition:all .15s;text-align:left;}
  .quick-btn{transition:all .15s;}
  .quick-btn:hover:not(:disabled){opacity:.8;transform:translateY(-1px);}
`;

const S: Record<string,React.CSSProperties> = {
  page:{minHeight:'100vh',background:'#F8FAFC',fontFamily:"'Nunito','Noto Sans KR',sans-serif",color:'#0F172A'},
  debatePage:{height:'100dvh',background:'#F8FAFC',fontFamily:"'Nunito','Noto Sans KR',sans-serif",color:'#0F172A',display:'flex',flexDirection:'column',overflow:'hidden'},
  nav:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',height:56,background:'#fff',borderBottom:'1px solid #F1F5F9',position:'sticky',top:0,zIndex:100,flexShrink:0,boxShadow:'0 1px 4px rgba(0,0,0,0.04)'},
  navBack:{background:'#F1F5F9',border:'none',borderRadius:10,padding:'7px 14px',color:'#64748B',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Nunito',sans-serif"},
  navLogo:{display:'flex',alignItems:'center',gap:8},
  navLogoText:{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:900,color:'#0F172A',letterSpacing:2},
  hero:{padding:'48px 24px 32px',textAlign:'center',background:'linear-gradient(180deg,#EEF2FF 0%,#F8FAFC 100%)',borderBottom:'1px solid #E2E8F0'},
  heroBadge:{display:'inline-block',background:'#EEF2FF',border:'1px solid #C7D2FE',borderRadius:99,padding:'6px 18px',fontSize:12,fontWeight:800,color:'#4F46E5',letterSpacing:.5,marginBottom:16},
  heroTitle:{fontFamily:"'Playfair Display',serif",fontSize:44,fontWeight:900,color:'#0F172A',margin:'0 0 12px',lineHeight:1.15},
  heroSub:{fontSize:15,color:'#64748B',lineHeight:1.7,fontWeight:600,marginBottom:20,maxWidth:500,margin:'0 auto 20px'},
  heroStats:{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'},
  heroStat:{background:'#fff',border:'1px solid #E2E8F0',borderRadius:99,padding:'5px 14px',fontSize:12,fontWeight:800,color:'#475569'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20,padding:'28px 24px 60px',maxWidth:1200,margin:'0 auto'},
  card:{borderRadius:20,padding:24,border:'2px solid transparent',cursor:'pointer',position:'relative',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'},
  cardEmoji:{fontSize:34,marginBottom:10},
  cardTitle:{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,marginBottom:5,lineHeight:1.2},
  cardSub:{fontSize:11,color:'#94A3B8',fontWeight:700,marginBottom:12,lineHeight:1.4},
  sideRow:{display:'flex',gap:8,marginBottom:14},
  sideTag:{fontSize:11,fontWeight:800,padding:'4px 12px',borderRadius:99,letterSpacing:.3},
  subList:{display:'flex',flexDirection:'column',gap:6},
  subBtn:{padding:'9px 12px',borderRadius:10,border:'1px solid',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Nunito',sans-serif",lineHeight:1.4,background:'#fff'},
  footerNote:{textAlign:'center',padding:'16px 24px 36px',fontSize:12,color:'#94A3B8',fontWeight:700},
  sideSelector:{display:'flex',alignItems:'center',justifyContent:'center',gap:20,padding:'0 20px',background:'#fff',borderBottom:'1px solid #F1F5F9',flexShrink:0},
  sideSelectorBtn:{flex:1,maxWidth:180,padding:'12px 8px',border:'none',borderBottom:'2px solid transparent',background:'transparent',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:"'Nunito',sans-serif",transition:'all .2s',letterSpacing:.3},
  motionBanner:{padding:'10px 20px',background:'#F8FAFC',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',flexShrink:0},
  chat:{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:14,background:'#F8FAFC'},
  translateBtn:{background:'#F1F5F9',border:'1px solid #E2E8F0',borderRadius:8,padding:'3px 10px',fontSize:12,cursor:'pointer',fontFamily:"'Nunito',sans-serif",color:'#64748B',fontWeight:700,flexShrink:0,transition:'all .15s'},
  quickRow:{display:'flex',gap:6,padding:'8px 12px',overflowX:'auto',flexShrink:0,background:'#fff',borderTop:'1px solid #F1F5F9'},
  quickBtn:{flexShrink:0,padding:'6px 12px',borderRadius:8,border:'1px solid',background:'transparent',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'Nunito',sans-serif",whiteSpace:'nowrap'},
  inputBar:{display:'flex',gap:8,padding:'10px 12px 14px',background:'#fff',borderTop:'1px solid #F1F5F9',flexShrink:0,alignItems:'center'},
  micBtn:{width:44,height:44,borderRadius:'50%',border:'none',flexShrink:0,cursor:'pointer',fontSize:18,transition:'all .2s'},
  input:{flex:1,padding:'11px 16px',borderRadius:12,background:'#F8FAFC',border:'1.5px solid',color:'#0F172A',fontSize:14,fontFamily:"'Nunito',sans-serif",outline:'none',fontWeight:600},
  sendBtn:{width:44,height:44,borderRadius:'50%',border:'none',flexShrink:0,fontSize:16,cursor:'pointer',transition:'all .15s',fontWeight:900},
};
