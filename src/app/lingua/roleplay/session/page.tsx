'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getTutorById } from '@/data/tutors';
import { LEARN_LANGUAGES } from '@/data/languages';
import { EVERYDAY_SCENARIOS, WORLD_SCENARIOS } from '@/data/roleplay';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  from: 'user' | 'npc' | 'system';
  npcName?: string;
  npcTutorId?: string;
  text: string;
  nativeText?: string;  // translation in learner's native lang
  score?: number;
  tip?: string;
  ts: number;
}

interface NpcDef {
  name: string;
  role: string;
  personality: string;
  tutorId: string;
  voiceGender: 'male' | 'female';
}

interface SessionResult {
  avgScore: number;
  turns: number;
  strongPoints: string[];
  improvements: string[];
  overallFeedback: string;
}

// ── Lang helpers ───────────────────────────────────────────────────────────────

const LANG_NAMES: Record<string, string> = {
  'en-US':'English','en-GB':'English','ja-JP':'Japanese','ko-KR':'Korean',
  'zh-CN':'Chinese (Simplified)','zh-TW':'Chinese (Traditional)',
  'fr-FR':'French','de-DE':'German','es-ES':'Spanish','es-MX':'Spanish',
  'it-IT':'Italian','pt-BR':'Portuguese','ru-RU':'Russian','ar-XA':'Arabic',
  'hi-IN':'Hindi','vi-VN':'Vietnamese','th-TH':'Thai','id-ID':'Indonesian',
  'nl-NL':'Dutch','pl-PL':'Polish','tr-TR':'Turkish','sv-SE':'Swedish',
};

const NATIVE_NAMES: Record<string, string> = {
  'ko-KR':'Korean','en-US':'English','ja-JP':'Japanese','zh-CN':'Chinese',
  'fr-FR':'French','de-DE':'German','es-ES':'Spanish','pt-BR':'Portuguese',
  'ru-RU':'Russian',
};

const hasTts = (code: string) =>
  LEARN_LANGUAGES.find(l => l.code === code)?.tts ?? false;

const stripEmoji = (t: string) =>
  t.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '')
   .replace(/\s{2,}/g, ' ').trim();

const scoreColor = (s: number) =>
  s >= 80 ? '#10B981' : s >= 65 ? '#F59E0B' : '#EF4444';

// difficulty labels (English only)

// ── Main ──────────────────────────────────────────────────────────────────────

function SessionContent() {
  const sp      = useSearchParams();
  const router  = useRouter();
  const { user } = useAuth();

  const type       = sp.get('type') || 'everyday';
  const scenarioId = sp.get('scenarioId') || '';
  const langId     = sp.get('lang') || 'en-US';
  const subLang    = sp.get('subLang') || 'ko-KR';
  const difficulty = sp.get('difficulty') || 'B1';

  const targetLang = LANG_NAMES[langId] || 'English';
  const nativeLang = NATIVE_NAMES[subLang] || 'English';
  const showNative = subLang !== 'en-US' && subLang !== 'en-GB';

  // Resolve scenario
  const everyday = EVERYDAY_SCENARIOS.find(s => s.id === scenarioId);
  const world    = WORLD_SCENARIOS.find(s => s.id === scenarioId);
  const scenario = everyday || world;

  const npcs: NpcDef[] = world
    ? world.npcs
    : everyday
      ? [{ name: 'Alex', role: everyday.userRole.split(' ').slice(2).join(' ') || 'Staff',
           personality: 'Professional, helpful, friendly', tutorId: everyday.tutorId,
           voiceGender: everyday.voiceGender }]
      : [];

  // For everyday: single NPC plays the other role (hotel clerk, waiter, etc.)
  const everydayNpcRole = everyday
    ? everyday.situation.split('.')[0].split('. ')[0]
    : '';

  const accentColor = (everyday?.accentColor || world?.accentColor) || '#6366F1';

  // ── State ─────────────────────────────────────────────────────────────────

  const [phase,        setPhase]        = useState<'playing' | 'result'>('playing');
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [input,        setInput]        = useState('');
  const [isThinking,   setIsThinking]   = useState(false);
  const [isListening,  setIsListening]  = useState(false);
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [speakingId,   setSpeakingId]   = useState<string | null>(null);
  const [turnCount,    setTurnCount]    = useState(0);
  const [sessionXP,    setSessionXP]    = useState(0);
  const [xpPop,        setXpPop]        = useState<string | null>(null);
  const [result,       setResult]       = useState<SessionResult | null>(null);
  const [npcIdx,       setNpcIdx]       = useState(0);
  const startedRef    = useRef(false);
  const [generatingOpener, setGeneratingOpener] = useState(true);

  const chatRef    = useRef<HTMLDivElement>(null);
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const recRef     = useRef<any>(null);
  const historyRef = useRef<{ role: 'user'|'assistant'; content: string }[]>([]);
  const msgId      = useRef(0);
  const pendingRef = useRef({ text: '', gender: 'female' as 'male'|'female', npcId: '' });

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  // STT
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = langId; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => handleUserTurn(e.results[0][0].transcript);
    rec.onerror  = () => setIsListening(false);
    rec.onend    = () => setIsListening(false);
    recRef.current = rec;
  }, [langId]); // eslint-disable-line

  // TTS
  const speak = useCallback(async (text: string, gender: 'male'|'female', npcId: string) => {
    const clean = stripEmoji(text);
    if (!hasTts(langId) || !clean) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeakingId(npcId); setIsSpeaking(true);
    return new Promise<void>(resolve => {
      fetch('/api/tts', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text:clean, lang:langId, gender, level:'b1' })
      }).then(r=>r.json()).then(data => {
        if (!data.audioContent) { setIsSpeaking(false); setSpeakingId(null); resolve(); return; }
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); setSpeakingId(null); audioRef.current=null; resolve(); };
        audio.onerror = () => { setIsSpeaking(false); setSpeakingId(null); audioRef.current=null; resolve(); };
        audio.play().catch(() => { setIsSpeaking(false); setSpeakingId(null); resolve(); });
      }).catch(() => { setIsSpeaking(false); setSpeakingId(null); resolve(); });
    });
  }, [langId]);

  const popXP = (pts: number) => {
    setSessionXP(x=>x+pts);
    setXpPop(`+${pts} XP`);
    setTimeout(() => setXpPop(null), 1500);
  };

  const addMsg = (m: Omit<Message,'id'|'ts'>): Message => {
    const full: Message = {...m, id:++msgId.current, ts:Date.now()};
    setMessages(prev=>[...prev, full]);
    return full;
  };

  // Build system prompt
  const buildSystemPrompt = useCallback((npc: NpcDef) => {
    let basePrompt = '';
    if (everyday) {
      basePrompt = `You are playing the staff/other person in this situation: ${everyday.situation}.
The learner plays: ${everyday.userRole}.
Your role: be the other person in this scenario (clerk, waiter, doctor, etc.) — friendly and realistic.
Keep the conversation focused on the everyday situation.`;
    } else if (world) {
      basePrompt = world.systemPrompt
        .replace('{targetLang}', targetLang)
        .replace('{difficulty}', difficulty);
    }

    return `${basePrompt}

CHARACTER: You are ${npc.name} — ${npc.role}.
PERSONALITY: ${npc.personality}

LANGUAGE RULES (CRITICAL):
- ALWAYS speak in ${targetLang}. Never switch to another language.
- Match vocabulary to ${difficulty} level
- 2-3 sentences maximum per reply
- No emojis (text-to-speech will read them aloud)
- If the learner makes a grammar error, naturally model the correct form in your reply without explicitly correcting them

CONVERSATION SO FAR:
${historyRef.current.map(m=>`${m.role==='user'?'Learner':npc.name}: ${m.content}`).join('\n')}

After your in-character reply, add on a NEW LINE:
|||FB|||{"score":<0-100>,"tip":"<one tip in ${nativeLang}, max 12 words>"}|||END|||

Reply as ${npc.name} in ${targetLang} now:`;
  }, [everyday, world, targetLang, nativeLang, difficulty]);

  // Start — useRef guard prevents double-fire in React StrictMode
  useEffect(() => {
    if (startedRef.current) return;
    if (!scenario || npcs.length === 0) return;
    startedRef.current = true;
    const firstNpc = npcs[0];
    const openingPrompt = everyday
      ? `You are the staff in this situation: ${everyday.situation}.
Start the roleplay naturally. Greet the learner and begin the scenario.
Speak ONLY in ${targetLang} at ${difficulty} level. 1-2 sentences. No emojis.`
      : world
      ? `${world.systemPrompt.replace('{targetLang}', targetLang).replace('{difficulty}', difficulty)}
You are ${firstNpc.name}. Start the scene with a compelling opening line.
Speak ONLY in ${targetLang}. 1-2 sentences. No emojis. No score block yet.`
      : '';

    fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ uid:user?.uid??null, temperature:0.85, prompt:openingPrompt })
    }).then(r=>r.json()).then(data => {
      const text = data.text?.trim() || 'Hello! How can I help you?';
      addMsg({ from:'npc', npcName:firstNpc.name, npcTutorId:firstNpc.tutorId, text });
      historyRef.current = [{ role:'assistant', content:text }];
      setGeneratingOpener(false);
      speak(text, firstNpc.voiceGender, firstNpc.tutorId);
    }).catch(() => setGeneratingOpener(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // User turn
  const handleUserTurn = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;
    if (audioRef.current) audioRef.current.pause();
    setInput('');
    addMsg({ from:'user', text });
    historyRef.current = [...historyRef.current, { role:'user', content:text }];
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);
    popXP(10);

    const npc = npcs[npcIdx % npcs.length];
    setNpcIdx(i=>i+1);
    pendingRef.current = { text:'', gender:npc.voiceGender, npcId:npc.tutorId };
    setIsThinking(true);

    try {
      const res = await fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid:user?.uid??null, temperature:0.8, prompt:buildSystemPrompt(npc) })
      });
      const data = await res.json();
      const full = data.text?.trim() || '';
      const fbMatch = full.match(/\|\|\|FB\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
      const npcText = full.replace(/\|\|\|FB\|\|\|[\s\S]*?\|\|\|END\|\|\|/,'').trim();
      let fb: {score?:number;tip?:string} = {};
      if (fbMatch) { try { fb = JSON.parse(fbMatch[1]); } catch {} }
      pendingRef.current.text = npcText;

      if (fb.score !== undefined) {
        setMessages(prev => {
          const copy = [...prev];
          for (let i=copy.length-1;i>=0;i--) {
            if (copy[i].from==='user' && copy[i].score===undefined) {
              copy[i] = {...copy[i], score:fb.score, tip:fb.tip}; break;
            }
          }
          return copy;
        });
        if (fb.score >= 80) popXP(5);
      }

      addMsg({ from:'npc', npcName:npc.name, npcTutorId:npc.tutorId, text:npcText });
      historyRef.current = [...historyRef.current, { role:'assistant', content:npcText }];
      if (newTurn >= 10) setTimeout(endSession, 1500);
    } catch(e) { console.error(e); }
    finally { setIsThinking(false); }

    if (pendingRef.current.text) speak(pendingRef.current.text, pendingRef.current.gender, pendingRef.current.npcId);
  }, [isThinking, npcIdx, npcs, turnCount, buildSystemPrompt, speak, user]); // eslint-disable-line

  // End
  const endSession = useCallback(async () => {
    setPhase('result');
    const scores = messages.filter(m=>m.score!==undefined).map(m=>m.score!);
    const avg = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 70;
    try {
      const res = await fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid:user?.uid??null, temperature:0.4,
          prompt:`Analyse this conversation. Reply in ${nativeLang}. Return ONLY JSON:
{"strongPoints":["s1","s2"],"improvements":["i1","i2"],"overallFeedback":"2-3 sentences"}
Conversation:
${historyRef.current.map(m=>`${m.role==='user'?'Learner':'NPC'}: ${m.content}`).join('\n')}` })
      });
      const data = await res.json();
      const parsed = JSON.parse(data.text?.replace(/\`\`\`json\s*/gi,'').replace(/\`\`\`\s*/g,'').trim()||'{}');
      setResult({ avgScore:avg, turns:turnCount, ...parsed });
      popXP(avg>=80?80:avg>=60?50:30);
    } catch {
      setResult({ avgScore:avg, turns:turnCount,
        strongPoints:['Scene completed!'], improvements:['Keep practising!'],
        overallFeedback:'Great effort! Consistent practice builds real fluency.' });
    }
  }, [messages, turnCount, nativeLang, user]); // eslint-disable-line

  const startListening = () => {
    if (!recRef.current || isListening || isThinking) return;
    if (audioRef.current) audioRef.current.pause();
    try { recRef.current.start(); setIsListening(true); } catch {}
  };

  if (!scenario) return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',display:'flex',alignItems:'center',
      justifyContent:'center',fontFamily:"'Nunito',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:12}}>😕</div>
        <div style={{fontWeight:700,marginBottom:16,color:'#0F172A'}}>Scenario not found</div>
        <button onClick={()=>router.push('/lingua/roleplay')}
          style={{padding:'12px 24px',borderRadius:12,border:'none',background:'#6366F1',
            color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
          Back to Roleplay
        </button>
      </div>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:"'Nunito',sans-serif",
      display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{maxWidth:520,width:'100%'}}>
        {!result ? (
          <div style={{textAlign:'center',color:'#94A3B8'}}>
            <div style={{fontSize:40,marginBottom:12}}>🤖</div>
            <div style={{fontWeight:700}}>{'Analysing...'}</div>
          </div>
        ) : (
          <>
            <div style={{textAlign:'center',marginBottom:24}}>
              <div style={{fontSize:52,marginBottom:8}}>
                {result.avgScore>=80?'🏆':result.avgScore>=65?'🎯':'💪'}
              </div>
              <div style={{fontSize:24,fontWeight:900,color:'#0F172A',marginBottom:4}}>
                {'Scene Complete!'}
              </div>
              <div style={{fontSize:42,fontWeight:900,color:accentColor}}>{result.avgScore}</div>
              <div style={{fontSize:12,color:'#94A3B8',fontWeight:700}}>
                {result.turns} {'turns'} · +{sessionXP} XP
              </div>
            </div>

            {/* Tutor thumbnails */}
            <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:20}}>
              {npcs.map((npc,i) => {
                const t = getTutorById(npc.tutorId);
                return (
                  <div key={i} style={{textAlign:'center'}}>
                    <img src={t.thumbnail} alt={npc.name}
                      style={{width:44,height:44,borderRadius:'50%',objectFit:'cover',
                        objectPosition:'center 20%',border:`2px solid ${accentColor}`}} />
                    <div style={{fontSize:10,color:'#94A3B8',fontWeight:700,marginTop:3}}>{npc.name}</div>
                  </div>
                );
              })}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div style={{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:14,padding:16}}>
                <div style={{fontSize:10,fontWeight:800,color:'#059669',marginBottom:8,letterSpacing:1}}>
                  {'✅ STRENGTHS'}
                </div>
                {result.strongPoints?.map((p,i)=>(
                  <div key={i} style={{fontSize:12,color:'#065F46',lineHeight:1.6,
                    marginBottom:4,paddingLeft:8,borderLeft:'2px solid #10B981'}}>{p}</div>
                ))}
              </div>
              <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:14,padding:16}}>
                <div style={{fontSize:10,fontWeight:800,color:'#D97706',marginBottom:8,letterSpacing:1}}>
                  {'📈 TO IMPROVE'}
                </div>
                {result.improvements?.map((p,i)=>(
                  <div key={i} style={{fontSize:12,color:'#92400E',lineHeight:1.6,
                    marginBottom:4,paddingLeft:8,borderLeft:'2px solid #F59E0B'}}>{p}</div>
                ))}
              </div>
            </div>

            <div style={{background:'#EEF2FF',border:'1px solid #C7D2FE',borderRadius:14,
              padding:16,marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:800,color:'#6366F1',marginBottom:6,letterSpacing:1}}>
                {'💬 OVERALL'}
              </div>
              <div style={{fontSize:13,color:'#3730A3',lineHeight:1.7,fontWeight:600}}>
                {result.overallFeedback}
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <button
                onClick={()=>{setPhase('playing');setMessages([]);setTurnCount(0);
                  historyRef.current=[];startedRef.current=false;setGeneratingOpener(true);}}
                style={{padding:'13px',borderRadius:13,border:'1.5px solid #E5E7EB',
                  background:'#fff',color:'#475569',fontWeight:700,fontSize:14,
                  cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
                {'Replay'}
              </button>
              <button onClick={()=>router.push('/lingua/roleplay')}
                style={{padding:'13px',borderRadius:13,border:'none',
                  background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,
                  color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',
                  fontFamily:"'Nunito',sans-serif"}}>
                {'More Worlds →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── PLAYING ───────────────────────────────────────────────────────────────────
  return (
    <div style={{height:'100dvh',background:'#F8FAFC',fontFamily:"'Nunito',sans-serif",
      display:'flex',flexDirection:'column',overflow:'hidden',color:'#0F172A'}}>
      <style dangerouslySetInnerHTML={{__html:`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes xpPop{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-36px)}}
        @keyframes thinking{0%,100%{opacity:.2;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}70%{box-shadow:0 0 0 10px rgba(239,68,68,0)}}
        @keyframes glow{0%,100%{opacity:.5}50%{opacity:1}}
      `}}/>

      {/* TOP BAR */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',
        background:'#fff',borderBottom:'1px solid #F1F5F9',flexShrink:0}}>
        <button onClick={endSession}
          style={{background:'#F1F5F9',border:'none',borderRadius:10,padding:'7px 12px',
            color:'#64748B',fontSize:12,fontWeight:700,cursor:'pointer',
            fontFamily:"'Nunito',sans-serif"}}>
          {'✕ End'}
        </button>
        <div style={{flex:1,textAlign:'center'}}>
          <div style={{fontSize:14,fontWeight:900}}>
            {(everyday?.emoji || world?.emoji)} {everyday?.title || world?.title}
          </div>
          <div style={{fontSize:10,color:'#94A3B8',fontWeight:700}}>
            {showNative ? `Turn ${turnCount}/10 · ${difficulty}` : `Turn ${turnCount}/10 · ${difficulty}`}
          </div>
        </div>
        <div style={{fontSize:12,fontWeight:800,color:accentColor}}>+{sessionXP} XP</div>
      </div>

      {/* Progress */}
      <div style={{height:3,background:'#F1F5F9',flexShrink:0}}>
        <div style={{height:'100%',width:`${(turnCount/10)*100}%`,
          background:accentColor,transition:'width .5s ease'}}/>
      </div>

      {/* TUTOR VIDEOS — 3:4 portrait ratio, proper crop */}
      <div style={{display:'flex',flexShrink:0,borderBottom:'1px solid #F1F5F9',background:'#1a1a1a'}}>
        {npcs.map((npc) => {
          const t = getTutorById(npc.tutorId);
          const isActive = speakingId === npc.tutorId;
          // 1 NPC: wider panel, 2 NPCs: side by side
          const vidH = npcs.length === 1 ? 200 : 160;
          const vidW = npcs.length === 1 ? 150 : undefined;
          return (
            <div key={npc.tutorId} style={{
              position:'relative', height:vidH,
              width: vidW, flex: vidW ? 'none' : 1,
              overflow:'hidden',
              outline:isActive?`3px solid ${accentColor}`:'none',
              transition:'outline .2s',
              background:'#111' }}>
              <video key={isActive?'talk':'idle'}
                src={isActive?t.videoTalk:t.videoIdle}
                autoPlay loop muted playsInline
                style={{
                  width:'100%', height:'100%',
                  objectFit:'cover',
                  objectPosition:'center top',
                  display:'block',
                  filter:isActive?'brightness(1.1)':'brightness(0.75)',
                  transition:'filter .3s'
                }}/>
              <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'14px 10px 6px',
                background:'linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 100%)'}}>
                <div style={{fontSize:11,fontWeight:800,color:isActive?accentColor:'#94A3B8'}}>{npc.name}</div>
                <div style={{fontSize:9,color:'#64748B',fontWeight:600}}>{npc.role}</div>
              </div>
              {isActive&&(
                <div style={{position:'absolute',top:6,right:6,display:'flex',gap:2}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:3,background:accentColor,borderRadius:2,
                      height:6+i*3,animation:`glow .5s ${i*.15}s infinite`}}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CHAT */}
      <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'14px',
        display:'flex',flexDirection:'column',gap:12}}>

        {generatingOpener&&(
          <div style={{textAlign:'center',padding:'16px',color:'#94A3B8'}}>
            <div style={{display:'flex',justifyContent:'center',gap:5,alignItems:'center'}}>
              {[0,1,2].map(d=>(
                <div key={d} style={{width:7,height:7,borderRadius:'50%',background:accentColor,
                  animation:`thinking .9s ${d*.2}s infinite`}}/>
              ))}
              <span style={{fontSize:12,fontWeight:700,marginLeft:8}}>
                {'Setting the scene...'}
              </span>
            </div>
          </div>
        )}

        {messages.map(msg=>{
          if (msg.from==='system') return null;
          const isUser = msg.from==='user';
          const npc = npcs.find(n=>n.tutorId===msg.npcTutorId);
          const t = npc ? getTutorById(npc.tutorId) : null;
          return (
            <div key={msg.id} style={{display:'flex',flexDirection:'column',
              alignItems:isUser?'flex-end':'flex-start',animation:'fadeUp .3s ease'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,
                flexDirection:isUser?'row-reverse':'row'}}>
                {!isUser&&t&&(
                  <img src={t.thumbnail} alt={npc?.name}
                    style={{width:22,height:22,borderRadius:'50%',objectFit:'cover',
                      objectPosition:'center 20%'}}/>
                )}
                <div style={{fontSize:10,fontWeight:700,color:'#94A3B8'}}>
                  {isUser?'You':msg.npcName}
                </div>
              </div>
              <div style={{maxWidth:'82%'}}>
                <div style={{padding:'11px 15px',
                  borderRadius:isUser?'16px 16px 4px 16px':'16px 16px 16px 4px',
                  background:isUser?accentColor:'#fff',
                  border:isUser?'none':'1.5px solid #F1F5F9',
                  boxShadow:isUser?'none':'0 2px 8px rgba(0,0,0,0.05)',
                  color:isUser?'#fff':'#0F172A',fontSize:15,fontWeight:600,lineHeight:1.65}}>
                  {msg.text}
                </div>
                {/* Native subtitle for NPC messages */}
                {!isUser && showNative && msg.nativeText && (
                  <div style={{fontSize:11,color:'#94A3B8',fontWeight:600,
                    marginTop:3,paddingLeft:4,fontStyle:'italic'}}>
                    {msg.nativeText}
                  </div>
                )}
              </div>
              {msg.score!==undefined&&(
                <div style={{marginTop:4,display:'flex',alignItems:'center',gap:6,
                  padding:'3px 10px',borderRadius:8,
                  background:`${scoreColor(msg.score)}12`,
                  border:`1px solid ${scoreColor(msg.score)}30`}}>
                  <span style={{fontSize:12,fontWeight:900,color:scoreColor(msg.score)}}>{msg.score}</span>
                  {msg.tip&&<span style={{fontSize:10,color:'#64748B',fontWeight:600}}>{msg.tip}</span>}
                </div>
              )}
            </div>
          );
        })}

        {isThinking&&(
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {npcs[npcIdx%npcs.length]&&(()=>{
              const t=getTutorById(npcs[npcIdx%npcs.length].tutorId);
              return <img src={t.thumbnail} alt="" style={{width:22,height:22,borderRadius:'50%',objectFit:'cover',objectPosition:'center 20%'}}/>;
            })()}
            <div style={{padding:'10px 14px',borderRadius:'14px 14px 14px 4px',
              background:'#fff',border:'1.5px solid #F1F5F9',
              display:'flex',gap:4,alignItems:'center'}}>
              {[0,1,2].map(d=>(
                <div key={d} style={{width:7,height:7,borderRadius:'50%',background:accentColor,
                  animation:`thinking .9s ${d*.2}s infinite`}}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {xpPop&&(
        <div style={{position:'fixed',bottom:86,right:16,fontSize:15,fontWeight:900,
          color:accentColor,animation:'xpPop .8s ease forwards',pointerEvents:'none',zIndex:999}}>
          {xpPop}
        </div>
      )}

      {/* INPUT */}
      <div style={{padding:'10px 12px 12px',background:'#fff',
        borderTop:'1px solid #F1F5F9',flexShrink:0}}>
        <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
          <button onMouseDown={startListening} onTouchStart={startListening}
            disabled={isThinking||isSpeaking||generatingOpener}
            style={{width:46,height:46,borderRadius:'50%',border:'none',flexShrink:0,cursor:'pointer',
              background:isListening?'linear-gradient(135deg,#EF4444,#DC2626)':'#F1F5F9',
              color:isListening?'#fff':'#64748B',fontSize:20,
              animation:isListening?'pulse .8s infinite':'none',
              opacity:isThinking||isSpeaking||generatingOpener?0.35:1}}>
            {isListening?'⏹':'🎤'}
          </button>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleUserTurn(input);}}}
            placeholder={'Reply in character...'}
            disabled={isThinking||generatingOpener}
            style={{flex:1,padding:'12px 16px',borderRadius:14,
              background:'#F8FAFC',border:'1.5px solid #E5E7EB',color:'#0F172A',
              fontSize:14,fontFamily:"'Nunito',sans-serif",outline:'none',fontWeight:600,
              opacity:isThinking||generatingOpener?0.5:1}}/>
          <button onClick={()=>handleUserTurn(input)}
            disabled={!input.trim()||isThinking||generatingOpener}
            style={{width:46,height:46,borderRadius:'50%',border:'none',flexShrink:0,
              background:input.trim()&&!isThinking?accentColor:'#E5E7EB',
              color:input.trim()&&!isThinking?'#fff':'#94A3B8',fontSize:18,
              cursor:input.trim()?'pointer':'default',transition:'all .15s'}}>
            ➤
          </button>
        </div>
        {turnCount>=4&&(
          <button onClick={endSession}
            style={{width:'100%',marginTop:8,padding:'9px',borderRadius:11,
              border:`1px solid ${accentColor}40`,background:`${accentColor}10`,
              color:accentColor,fontWeight:700,fontSize:12,cursor:'pointer',
              fontFamily:"'Nunito',sans-serif"}}>
            {'End & get feedback →'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#F8FAFC'}}/>}>
      <SessionContent />
    </Suspense>
  );
}
