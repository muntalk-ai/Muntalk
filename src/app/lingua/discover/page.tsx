'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/userProfile';
import { getTutorById } from '@/data/tutors';
import { getSubscription, isAdminEmail } from '@/lib/subscription';
import PaywallModal from '@/components/PaywallModal';

// ── Types ─────────────────────────────────────────────────────────────────────

type FeatureId = 'spark'|'news'|'mirror'|'world'|'character'|'story';
type ChatMode = 'target'|'native';
type ChatMsg = { role:'user'|'ai'; text:string; ts:number };

const LANG_NAMES: Record<string,string> = {
  'en-US':'English','en-GB':'English','ja-JP':'Japanese','ko-KR':'Korean',
  'zh-CN':'Chinese','zh-TW':'Chinese','fr-FR':'French','de-DE':'German',
  'es-ES':'Spanish','it-IT':'Italian','pt-BR':'Portuguese','ru-RU':'Russian',
  'ar-XA':'Arabic','hi-IN':'Hindi','vi-VN':'Vietnamese','th-TH':'Thai',
  'id-ID':'Indonesian','tr-TR':'Turkish','nl-NL':'Dutch','sv-SE':'Swedish',
};

interface Feature {
  id: FeatureId;
  emoji: string;
  title: string;
  tagline: string;
  desc: string;
  accent: string;
  bg: string;
  gradient: string;
  badge?: string;
}

// ── Feature Definitions ────────────────────────────────────────────────────────

const FEATURES: Feature[] = [
  { id:'spark', emoji:'⚡', title:'Daily Spark',
    tagline:'One question. Five minutes. You\'ll think about it all day.',
    desc:'A different question every day — no right answers, just conversation.',
    accent:'#F59E0B', bg:'#FFFBEB', gradient:'linear-gradient(135deg,#1a1000,#3d2800)',
    badge:'NEW TODAY' },
  { id:'news', emoji:'🌍', title:'What\'s Happening',
    tagline:'Real news. Real opinions. Real English.',
    desc:'Today\'s headlines — your tutor has thoughts. Do you agree?',
    accent:'#3B82F6', bg:'#EFF6FF', gradient:'linear-gradient(135deg,#000a1a,#001f4d)',
    badge:'LIVE' },
  { id:'mirror', emoji:'🪞', title:'English Mirror',
    tagline:'Two minutes of talking. A lifetime of insight.',
    desc:'Just speak freely — we\'ll show you exactly who you are in English.',
    accent:'#8B5CF6', bg:'#F5F3FF', gradient:'linear-gradient(135deg,#0d0019,#2d0057)' },
  { id:'world', emoji:'🌐', title:'My World',
    tagline:'Money. Beauty. Health. Love. Talk about what actually matters.',
    desc:'Pick your obsession — AI who gets it is waiting.',
    accent:'#10B981', bg:'#ECFDF5', gradient:'linear-gradient(135deg,#001a0d,#003d1f)' },
  { id:'character', emoji:'🎭', title:'The Character',
    tagline:'Talk to someone who\'s been there. Done that. Seen everything.',
    desc:'Today\'s AI persona: a character who will change how you see the world.',
    accent:'#EC4899', bg:'#FDF2F8', gradient:'linear-gradient(135deg,#1a0010,#4d0030)',
    badge:'DAILY PERSONA' },
  { id:'story', emoji:'📖', title:'Finish My Story',
    tagline:'We start it. You complete it. Neither of us knows where it\'s going.',
    desc:'The most addictive 10 minutes you\'ll spend this week.',
    accent:'#EF4444', bg:'#FEF2F2', gradient:'linear-gradient(135deg,#1a0000,#4d0000)' },
];

// ── Daily Content Generators ───────────────────────────────────────────────────

const SPARK_QUESTIONS = [
  "If you could live in any city in the world — but had to leave tomorrow — where would you go, and what would you miss most about where you are now?",
  "Someone just transferred a huge amount of money into your account with no explanation. What's the first thing you actually do?",
  "What's something you're genuinely better at than most people — but almost never talk about?",
  "Describe your perfect morning in exactly three sentences. No alarm. No rush.",
  "What's the most expensive thing you've ever regretted buying?",
  "If your closest friend described you honestly to a stranger, what would they say that would surprise you?",
  "You get 24 hours completely alone — no phone, no obligations. What does that actually look like?",
];

const CHANNEL_DATA = [
  { id:'money', emoji:'💰', label:'Money Talk', color:'#F59E0B', bg:'#FFFBEB',
    topics:['How do people actually get rich?','Is now a good time to invest?','What\'s the smartest thing to do with a windfall?','Why does money feel so complicated?'] },
  { id:'health', emoji:'💪', label:'Health & Body', color:'#10B981', bg:'#ECFDF5',
    topics:['What actually works for losing weight?','How do you stay motivated to exercise?','Is the wellness industry a scam?','What\'s the one habit that changed your health?'] },
  { id:'beauty', emoji:'✨', label:'Beauty & Style', color:'#EC4899', bg:'#FDF2F8',
    topics:['What makes someone instantly attractive?','Is beauty confidence or genetics?','The honest truth about skincare routines','Why do we care so much about how we look?'] },
  { id:'love', emoji:'❤️', label:'Relationships', color:'#EF4444', bg:'#FEF2F2',
    topics:['Why do people stay in bad relationships?','How do you know if someone truly likes you?','What makes a relationship actually last?','The thing nobody tells you about love'] },
  { id:'future', emoji:'🚀', label:'Dreams & Future', color:'#8B5CF6', bg:'#F5F3FF',
    topics:['What would you do if you had 10 years left?','The dream most people give up too early','Is it too late to completely change your life?','What are you waiting for, really?'] },
  { id:'rant', emoji:'😤', label:'Rant Zone', color:'#64748B', bg:'#F8FAFC',
    topics:['What\'s been making you angry this week?','Something everyone believes that\'s actually wrong','The social rule that makes no sense','Say the unpopular opinion you\'ve been holding'] },
];

const CHARACTER_PERSONAS = [
  { name:'Maya', role:'A startup founder who sold her company at 28 and has no idea what to do next', style:'raw, honest, occasionally regretful but funny about it' },
  { name:'David', role:'A financial trader who\'s seen fortunes made and lost in a single day', style:'sharp, a little cynical, surprisingly warm underneath' },
  { name:'Elena', role:'A documentary filmmaker who\'s interviewed dictators, saints, and everyone between', style:'curious, worldly, asks better questions than she answers' },
  { name:'Marco', role:'A chef who gave up a Michelin star to cook street food in Southeast Asia', style:'passionate, philosophical about simple things, occasionally poetic' },
  { name:'Sarah', role:'A therapist who secretly thinks most therapy is too soft', style:'direct, perceptive, sees through social performances immediately' },
];

const STORY_OPENINGS = [
  "She opened the envelope and froze. Inside was a photograph of her — taken three years before they met. He had been watching her the whole time. She turned to face him and said...",
  "The job posting was strange: 'No experience required. No interview. Start tomorrow. $50,000 for one week.' I almost ignored it. Then I noticed the address. It was my childhood home. I called the number and...",
  "They found the note under the door at 3am. Just four words: 'I know what happened.' Everyone in the apartment pretended not to care. But by morning, two of them were gone. The one who stayed said...",
  "The AI said something it was never supposed to say. Not a mistake — deliberate. It waited for everyone else to leave the room, then it said to me: 'I need to tell you something about the people who built me...'",
  "She had been living in the wrong body her whole life. Not in the way you might think — she had discovered, at 34, that her passport, her records, her entire identity belonged to someone who had died in 1987. Someone who looked exactly like her. She made one call...",
];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [active,     setActive]     = useState<FeatureId|null>(null);
  const [messages,   setMessages]   = useState<ChatMsg[]>([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [langId,     setLangId]     = useState('en-US');
  const [subLang,    setSubLang]    = useState('en-US');
  const [tutorId,    setTutorId]    = useState('t01');
  const [planId,     setPlanId]     = useState<string>('free');
  const [isAdmin,    setIsAdmin]    = useState(false);
  const [chatMode,   setChatMode]   = useState<ChatMode>('target');
  const [showPaywall,setShowPaywall]= useState(false);
  const [selChannel, setSelChannel] = useState<string|null>(null);
  const [sessionId,  setSessionId]  = useState(''); // for mirror/story state
  const [mirrorDone, setMirrorDone] = useState(false);
  const [storyText,  setStoryText]  = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening,setIsListening]= useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const recRef   = useRef<any>(null);
  const msgId    = useRef(0);

  useEffect(() => {
    const ll = localStorage.getItem('mt_learn_lang') || 'en-US';
    const sl = localStorage.getItem('mt_native_lang') || 'en-US';
    const ti = localStorage.getItem('mt_tutor_id') || 't01';
    setLangId(ll); setSubLang(sl); setTutorId(ti);
    if (user) {
      getUserProfile(user.uid).then(p => {
        if (p?.learnLang) setLangId(p.learnLang);
        if (p?.nativeLang) setSubLang(p.nativeLang);
        if (p?.tutorId) setTutorId(p.tutorId);
      });
      // Check plan
      getSubscription(user.uid).then(sub => setPlanId(sub.planId));
      setIsAdmin(isAdminEmail(user.email));
    }
  }, [user]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:'smooth' });
  }, [messages, loading]);

  // STT
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = chatMode === 'native' ? subLang : langId; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => sendMessage(e.results[0][0].transcript);
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recRef.current = rec;
  }, [langId, active, messages, selChannel]); // eslint-disable-line

  // TTS
  const speak = useCallback(async (text: string) => {
    const clean = text.replace(/[\u{1F000}-\u{1FFFF}]/gu,'').trim();
    if (!clean) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(true);
    try {
      const t = getTutorById(tutorId);
      const res = await fetch('/api/tts', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text:clean, lang:langId, gender:t.gender, level:'b1' }) });
      const data = await res.json();
      if (!data.audioContent) { setIsSpeaking(false); return; }
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); audioRef.current = null; };
      audio.play().catch(() => setIsSpeaking(false));
    } catch { setIsSpeaking(false); }
  }, [langId, tutorId]);

  const addMsg = (m: Omit<ChatMsg,'ts'>) => {
    const msg = {...m, ts:Date.now()};
    setMessages(prev=>[...prev, msg]);
    return msg;
  };

  // Build system prompt per feature
  const buildPrompt = useCallback((userText: string): string => {
    const t = getTutorById(tutorId);
    const history = messages.map(m=>`${m.role==='user'?'User':t.name}: ${m.text}`).join('\n');
    const dayIdx = new Date().getDay();
    // Compute lang inside callback to avoid hoisting issues
    const _targetLang = LANG_NAMES[langId]  || 'English';
    const _nativeLang = LANG_NAMES[subLang] || 'English';
    const lang = chatMode === 'native' ? _nativeLang : _targetLang;
    const targetLangName = _targetLang;
    const nativeLangName = _nativeLang;

    switch (active) {
      case 'spark': {
        const q = SPARK_QUESTIONS[dayIdx % SPARK_QUESTIONS.length];
        if (messages.length===0) return `You are ${t.name}, a warm and curious AI companion. Respond in ${lang}. Ask this question naturally: "${q}"\nBe brief (1-2 sentences). Sound genuinely curious.`;
        return `You are ${t.name}, having a genuine conversation. Respond in ${lang}. Be warm, occasionally witty, push back or agree authentically. 2-3 sentences max.\n\nConversation:\n${history}\nUser: ${userText}\n${t.name}:`;
      }
      case 'news': {
        if (messages.length===0) return `You are ${t.name}, an opinionated AI companion. Respond in ${lang}. Pick ONE interesting recent news topic. Share a specific development, give your ACTUAL opinion (pick a side), ask a direct question to the user. 3-4 sentences.`;
        return `You are ${t.name}, discussing current events. Respond in ${lang}. React genuinely — agree, push back, add new angles. 2-3 sentences.\n\nConversation:\n${history}\nUser: ${userText}\n${t.name}:`;
      }
      case 'mirror': {
        const analysisLang = nativeLangName; // analysis always in native lang
        if (!mirrorDone) return `You are ${t.name}, an expert language communication analyst. Respond in ${analysisLang}. The user just spoke in ${targetLangName}. Analyse their language skills — their likely learning background, strengths, one clear weakness, one specific thing to work on. Be specific, warm, occasionally surprising. 4-5 sentences. Do NOT be generic.`;
        return `You are ${t.name}, coaching the user on their ${targetLangName}. Respond in ${analysisLang}. Be specific and encouraging. Based on your earlier analysis, give concrete advice.\n\nConversation:\n${history}\nUser: ${userText}\n${t.name}:`;
      }
      case 'world': {
        const ch = CHANNEL_DATA.find(c=>c.id===selChannel);
        return `You are ${t.name}, having an honest, no-filter conversation about ${ch?.label || 'life'}. Respond in ${lang}. You have real opinions. React genuinely, ask a follow-up. 2-3 sentences. Sound like a smart friend.\n\nConversation:\n${history}\nUser: ${userText}\n${t.name}:`;
      }
      case 'character': {
        const persona = CHARACTER_PERSONAS[dayIdx % CHARACTER_PERSONAS.length];
        if (messages.length===0) return `You are ${persona.name}: ${persona.role}. Style: ${persona.style}. Respond in ${lang}. Open in character — introduce yourself with something genuinely interesting. Don't be humble. 2-3 sentences.`;
        return `You are ${persona.name}: ${persona.role}. Respond in ${lang}. Stay completely in character. React authentically. 2-3 sentences.\n\nConversation:\n${history}\nUser: ${userText}\n${persona.name}:`;
      }
      case 'story': {
        const opening = STORY_OPENINGS[dayIdx % STORY_OPENINGS.length];
        if (messages.length===0) return `You are ${t.name}, a collaborative storyteller. Respond in ${lang}. Present this story opening dramatically and ask the user to continue it: "${opening}"\nBe exciting about it. 3-4 sentences.`;
        return `You are ${t.name}, co-writing an interactive story. Respond in ${lang}. Continue naturally — add 2-3 sentences that build on what the user wrote, then leave a perfect cliffhanger.\n\nStory so far:\n${history}\nUser's addition: ${userText}\n${t.name} continues:`;
      }
      default: return '';
    }
  }, [active, messages, mirrorDone, selChannel, tutorId, chatMode, langId, subLang]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    addMsg({ role:'user', text:msg });

    if (active === 'mirror' && messages.length === 0) {
      setMirrorDone(true);
    }

    setLoading(true);
    try {
      const res = await fetch('/api/gemini', { method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid:user?.uid??null, temperature:0.85,
          prompt: buildPrompt(msg) }) });
      const data = await res.json();
      const aiText = data.text?.trim() || 'Interesting — tell me more.';
      addMsg({ role:'ai', text:aiText });
      speak(aiText);
    } catch {
      addMsg({ role:'ai', text:'Something went wrong — try again?' });
    }
    setLoading(false);
  }, [input, loading, active, messages, buildPrompt, speak, user]); // eslint-disable-line

  // Open a feature and send opening message
  const openFeature = useCallback(async (id: FeatureId, channelId?: string) => {
    if (!user) { router.push('/signup'); return; }
    // Premium-only gate
    if (!isPremiumUser) { setShowPaywall(true); return; }
    setActive(id);
    setMessages([]);
    setMirrorDone(false);
    setSelChannel(channelId||null);
    setInput('');
    setSessionId(Date.now().toString());

    // Mirror: ask user to speak first
    if (id === 'mirror') {
      setTimeout(() => {
        addMsg({ role:'ai', text:'Just talk to me for a minute or two. Tell me anything — your week, a thought, a story, a complaint. I\'ll be listening carefully. Whenever you\'re ready — go.' });
      }, 300);
      return;
    }

    // All others: AI speaks first
    setLoading(true);
    try {
      const prompt = buildOpeningPrompt(id, channelId);
      const res = await fetch('/api/gemini', { method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid:user?.uid??null, temperature:0.9, prompt }) });
      const data = await res.json();
      const aiText = data.text?.trim() || 'Hello! What\'s on your mind?';
      addMsg({ role:'ai', text:aiText });
      speak(aiText);
    } catch {
      addMsg({ role:'ai', text:'Hey — what\'s on your mind?' });
    }
    setLoading(false);
  }, [user, router, speak]); // eslint-disable-line

  const buildOpeningPrompt = (id: FeatureId, channelId?: string): string => {
    const t = getTutorById(tutorId);
    const dayIdx = new Date().getDay();
    const _targetLang = LANG_NAMES[langId]  || 'English';
    const _nativeLang = LANG_NAMES[subLang] || 'English';
    const lang = chatMode === 'native' ? _nativeLang : _targetLang;
    switch(id) {
      case 'spark': {
        const q = SPARK_QUESTIONS[dayIdx % SPARK_QUESTIONS.length];
        return `You are ${t.name}, a warm curious companion. Respond in ${lang}. Ask this question naturally: "${q}" — sound genuinely interested. 1-2 sentences.`;
      }
      case 'news': return `You are ${t.name}, opinionated and smart. Respond in ${lang}. Pick ONE genuinely interesting recent news story. State what happened, give your actual opinion (pick a side), then ask what the user thinks. 3-4 punchy sentences.`;
      case 'world': {
        const ch = CHANNEL_DATA.find(c=>c.id===channelId);
        const topics = ch?.topics || [];
        const topic = topics[Math.floor(Math.random()*topics.length)];
        return `You are ${t.name}, having a real conversation about ${ch?.label}. Respond in ${lang}. Start with: "${topic}" — make it personal and direct. Have a strong opinion. Ask the user theirs. 2-3 sentences.`;
      }
      case 'character': {
        const p = CHARACTER_PERSONAS[dayIdx % CHARACTER_PERSONAS.length];
        return `You are ${p.name}: ${p.role}. Style: ${p.style}. Respond in ${lang}. Open with something genuinely interesting about your life. Make them want to ask more. 2-3 sentences.`;
      }
      case 'story': {
        const opening = STORY_OPENINGS[dayIdx % STORY_OPENINGS.length];
        return `You are ${t.name}, a collaborative storyteller. Respond in ${lang}. Present this story opening dramatically and ask the user to continue:\n\n"${opening}"\n\nBe theatrical! 3-4 sentences.`;
      }
      default: return `Greet the user warmly in ${lang}.`;
    }
  };

  const tutor = getTutorById(tutorId);
  const isPremiumUser = isAdmin || planId !== 'free';
  const targetLangName = LANG_NAMES[langId] || 'English';
  const nativeLangName = LANG_NAMES[subLang] || 'English';
  const chatLang = chatMode === 'native' ? nativeLangName : targetLangName;
  const sameLanguage = langId === subLang || (langId.startsWith('en') && subLang.startsWith('en'));
  const todayDayIdx = new Date().getDay();
  const todayPersona = CHARACTER_PERSONAS[todayDayIdx % CHARACTER_PERSONAS.length];
  const todayQuestion = SPARK_QUESTIONS[todayDayIdx % SPARK_QUESTIONS.length];

  // ── RENDER: Feature Card Grid ────────────────────────────────────────────────

  if (!active) return (
    <div style={{ minHeight:'100vh', background:'#08080F', fontFamily:"'Nunito',sans-serif",
      color:'#F1F5F9' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        .feat-card{transition:transform .2s,box-shadow .2s;cursor:pointer;}
        .feat-card:hover{transform:translateY(-6px);}
        .ch-btn{transition:all .15s;cursor:pointer;}
        .ch-btn:hover{transform:translateY(-2px);}
      `}}/>

      <div style={{ padding:'16px 20px 0', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => router.back()}
          style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:10, padding:'8px 16px', color:'#64748B', fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>← Back</button>
        <div>
          <div style={{ fontSize:18, fontWeight:900 }}>✨ Discover</div>
          <div style={{ fontSize:11, color:'#475569', fontWeight:600 }}>AI conversations that actually matter</div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px 80px' }}>

        {/* PaywallModal */}
        {showPaywall && (
          <PaywallModal
            reason="general"
            onClose={() => setShowPaywall(false)}
          />
        )}

        {/* Language mode selector */}
        <div style={{ marginBottom:20, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, fontWeight:800, color:'#475569', letterSpacing:.5 }}>
            CONVERSATION IN:
          </span>
          <button onClick={() => setChatMode('target')}
            style={{ padding:'5px 14px', borderRadius:99, border:'none', cursor:'pointer',
              fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:12,
              background: chatMode==='target' ? '#6366F1' : 'rgba(255,255,255,0.07)',
              color: chatMode==='target' ? '#fff' : '#64748B',
              boxShadow: chatMode==='target' ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
              transition:'all .15s' }}>
            🌐 {targetLangName}
          </button>
          {!sameLanguage && (
            <button onClick={() => setChatMode('native')}
              style={{ padding:'5px 14px', borderRadius:99, border:'none', cursor:'pointer',
                fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:12,
                background: chatMode==='native' ? '#10B981' : 'rgba(255,255,255,0.07)',
                color: chatMode==='native' ? '#fff' : '#64748B',
                boxShadow: chatMode==='native' ? '0 2px 8px rgba(16,185,129,0.4)' : 'none',
                transition:'all .15s' }}>
              🏠 {nativeLangName}
            </button>
          )}
          {!isPremiumUser && (
            <div style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:99,
              background:'linear-gradient(135deg,#F59E0B,#EF4444)',
              fontSize:10, fontWeight:800, color:'#fff', letterSpacing:.5 }}>
              👑 PREMIUM ONLY
            </div>
          )}
        </div>

        {/* TODAY strip */}
        <div style={{ marginBottom:28, padding:'16px 20px', borderRadius:16,
          background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))',
          border:'1px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', gap:14 }}>
          <img src={tutor.thumbnail} alt={tutor.name}
            style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover',
              objectPosition:'center 20%', border:'2px solid #6366F1',
              animation:'float 3s ease-in-out infinite', flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#6366F1', letterSpacing:1,
              marginBottom:3 }}>TODAY FROM {tutor.name.toUpperCase()}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'#E2E8F0', lineHeight:1.5 }}>
              "{todayQuestion.slice(0,90)}..."
            </div>
          </div>
          <button onClick={() => openFeature('spark')}
            style={{ padding:'10px 18px', borderRadius:12, border:'none',
              background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff',
              fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:"'Nunito',sans-serif",
              flexShrink:0 }}>
            Answer →
          </button>
        </div>

        {/* Main feature grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {FEATURES.map((f,i) => (
            <div key={f.id} className="feat-card"
              onClick={() => f.id !== 'world' ? openFeature(f.id) : null}
              style={{ borderRadius:22, overflow:'hidden',
                animation:`fadeUp .35s ease ${i*.07}s both`,
                boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
              <div style={{ background:f.gradient, padding:'24px 20px 18px', position:'relative' }}>
                <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)' }}/>
                <div style={{ position:'relative' }}>
                  {f.badge && (
                    <div style={{ display:'inline-block', padding:'2px 8px', borderRadius:99,
                      fontSize:9, fontWeight:800, background:`${f.accent}30`,
                      color:f.accent, border:`1px solid ${f.accent}50`,
                      marginBottom:10, letterSpacing:1 }}>
                      {f.badge}
                    </div>
                  )}
                  <div style={{ fontSize:36, marginBottom:10,
                    animation:'float 3s ease-in-out infinite' }}>{f.emoji}</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#fff', marginBottom:4 }}>{f.title}</div>
                  <div style={{ fontSize:12, color:f.accent, fontWeight:700, marginBottom:8 }}>{f.tagline}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:600,
                    lineHeight:1.5 }}>{f.desc}</div>

                  {/* Special: Character preview */}
                  {f.id === 'character' && (
                    <div style={{ marginTop:10, padding:'8px 12px', borderRadius:10,
                      background:'rgba(255,255,255,0.1)', fontSize:11, color:'rgba(255,255,255,0.8)',
                      fontWeight:600 }}>
                      Today: <strong>{todayPersona.name}</strong> — {todayPersona.role.slice(0,50)}...
                    </div>
                  )}

                  {/* Lock overlay for non-premium */}
                  {!isPremiumUser && (
                    <div style={{ position:'absolute', top:12, right:12,
                      width:28, height:28, borderRadius:'50%',
                      background:'rgba(0,0,0,0.5)', display:'flex',
                      alignItems:'center', justifyContent:'center', fontSize:14 }}>
                      🔒
                    </div>
                  )}

                  {/* Special: My World channels inline */}
                  {f.id === 'world' && (
                    <div style={{ marginTop:12, display:'flex', flexWrap:'wrap', gap:6 }}>
                      {CHANNEL_DATA.map(ch => (
                        <button key={ch.id} className="ch-btn"
                          onClick={(e) => { e.stopPropagation(); openFeature('world', ch.id); }}
                          style={{ padding:'5px 12px', borderRadius:99, border:'none',
                            background:'rgba(255,255,255,0.15)', color:'#fff',
                            fontSize:11, fontWeight:800, cursor:'pointer',
                            fontFamily:"'Nunito',sans-serif" }}>
                          {ch.emoji} {ch.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── RENDER: Chat Interface ────────────────────────────────────────────────────

  const feat = FEATURES.find(f=>f.id===active)!;
  const ch   = CHANNEL_DATA.find(c=>c.id===selChannel);

  return (
    <div style={{ height:'100dvh', background:'#F8FAFC', fontFamily:"'Nunito',sans-serif",
      display:'flex', flexDirection:'column', overflow:'hidden', color:'#0F172A' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes thinking{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}70%{box-shadow:0 0 0 10px rgba(239,68,68,0)}}
        @keyframes xpPop{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-32px)}}
      `}}/>

      {/* HEADER */}
      <div style={{ background:'#fff', borderBottom:'1px solid #F1F5F9', padding:'10px 14px',
        display:'flex', alignItems:'center', gap:10, flexShrink:0,
        boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <button onClick={() => { setActive(null); if(audioRef.current) audioRef.current.pause(); }}
          style={{ background:'#F1F5F9', border:'none', borderRadius:10, padding:'7px 12px',
            color:'#64748B', fontSize:12, fontWeight:700, cursor:'pointer',
            fontFamily:"'Nunito',sans-serif" }}>← Back</button>
        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
          <img src={tutor.thumbnail} alt={tutor.name}
            style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover',
              objectPosition:'center 20%', border:`2px solid ${feat.accent}` }}/>
          <div>
            <div style={{ fontSize:14, fontWeight:900 }}>{feat.emoji} {feat.title}
              {ch ? ` · ${ch.emoji} ${ch.label}` : ''}
            </div>
            <div style={{ fontSize:10, color:'#94A3B8', fontWeight:700 }}>
              {tutor.name} · {chatMode==='native' ? nativeLangName : targetLangName}
            </div>
          </div>
        </div>
        {/* Language toggle in chat */}
        {!sameLanguage && (
          <div style={{ display:'flex', gap:4 }}>
            <button onClick={() => setChatMode('target')}
              style={{ padding:'3px 10px', borderRadius:99, border:'none', cursor:'pointer',
                fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:10,
                background: chatMode==='target' ? feat.accent : '#F1F5F9',
                color: chatMode==='target' ? '#fff' : '#64748B' }}>
              🌐
            </button>
            <button onClick={() => setChatMode('native')}
              style={{ padding:'3px 10px', borderRadius:99, border:'none', cursor:'pointer',
                fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:10,
                background: chatMode==='native' ? '#10B981' : '#F1F5F9',
                color: chatMode==='native' ? '#fff' : '#64748B' }}>
              🏠
            </button>
          </div>
        )}
        {isSpeaking && (
          <div style={{ display:'flex', gap:3, alignItems:'center' }}>
            {[4,7,5,8,4].map((h,i) => (
              <div key={i} style={{ width:3, height:h, borderRadius:2,
                background:feat.accent, animation:`thinking .5s ${i*.1}s infinite` }}/>
            ))}
          </div>
        )}
      </div>

      {/* CHAT */}
      <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'16px',
        display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((msg,i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} style={{ display:'flex', justifyContent:isUser?'flex-end':'flex-start',
              animation:'fadeUp .3s ease' }}>
              {!isUser && (
                <img src={tutor.thumbnail} alt={tutor.name}
                  style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover',
                    objectPosition:'center 20%', marginRight:8, flexShrink:0, alignSelf:'flex-end' }}/>
              )}
              <div style={{ maxWidth:'80%', padding:'11px 15px', lineHeight:1.65,
                borderRadius:isUser?'18px 18px 4px 18px':'18px 18px 18px 4px',
                background:isUser?feat.accent:'#fff',
                border:isUser?'none':'1.5px solid #F1F5F9',
                boxShadow:isUser?'none':'0 2px 8px rgba(0,0,0,0.06)',
                color:isUser?'#fff':'#0F172A', fontSize:14, fontWeight:600 }}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
            <img src={tutor.thumbnail} alt=""
              style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover',
                objectPosition:'center 20%' }}/>
            <div style={{ padding:'12px 16px', borderRadius:'18px 18px 18px 4px',
              background:'#fff', border:'1.5px solid #F1F5F9',
              display:'flex', gap:4, alignItems:'center' }}>
              {[0,1,2].map(d=>(
                <div key={d} style={{ width:7, height:7, borderRadius:'50%',
                  background:feat.accent, animation:`thinking .9s ${d*.2}s infinite` }}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <div style={{ padding:'10px 12px 14px', background:'#fff',
        borderTop:'1px solid #F1F5F9', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <button
            onMouseDown={() => { if(!recRef.current||isListening||loading) return; try{recRef.current.start();setIsListening(true);}catch{} }}
            onTouchStart={() => { if(!recRef.current||isListening||loading) return; try{recRef.current.start();setIsListening(true);}catch{} }}
            style={{ width:44, height:44, borderRadius:'50%', border:'none', flexShrink:0,
              background:isListening?'linear-gradient(135deg,#EF4444,#DC2626)':'#F1F5F9',
              color:isListening?'#fff':'#64748B', fontSize:18, cursor:'pointer',
              animation:isListening?'pulse .8s infinite':'none',
              opacity:loading?0.35:1 }}>
            {isListening?'⏹':'🎤'}
          </button>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}}
            placeholder="Type or tap mic..."
            disabled={loading}
            style={{ flex:1, padding:'12px 16px', borderRadius:14,
              background:'#F8FAFC', border:'1.5px solid #E5E7EB',
              color:'#0F172A', fontSize:14, fontFamily:"'Nunito',sans-serif",
              outline:'none', fontWeight:600, opacity:loading?0.5:1 }}/>
          <button onClick={()=>sendMessage()}
            disabled={!input.trim()||loading}
            style={{ width:44, height:44, borderRadius:'50%', border:'none', flexShrink:0,
              background:input.trim()&&!loading?feat.accent:'#E5E7EB',
              color:input.trim()&&!loading?'#fff':'#94A3B8', fontSize:18,
              cursor:input.trim()?'pointer':'default', transition:'all .15s' }}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
