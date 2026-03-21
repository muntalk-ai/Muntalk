'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getTutorById } from '@/data/tutors';
import { LEARN_LANGUAGES } from '@/data/languages';
import {
  EVERYDAY_SCENARIOS, WORLD_SCENARIOS, getNativeDesc,
  type NpcCharacter, type StoryBeat,
} from '@/data/roleplay';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  from: 'user'|'npc'|'narrator'|'choice';
  npcId?: string;
  npcName?: string;
  text: string;
  nativeText?: string;   // live subtitle in learner's native lang
  score?: number;
  tip?: string;
  ts: number;
}

interface ActiveChoice {
  beat: StoryBeat;
  chosen: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LANG_NAMES: Record<string,string> = {
  'en-US':'English','en-GB':'English','ja-JP':'Japanese','ko-KR':'Korean',
  'zh-CN':'Chinese (Simplified)','zh-TW':'Chinese (Traditional)','zh-HK':'Cantonese',
  'fr-FR':'French','de-DE':'German','es-ES':'Spanish','es-MX':'Spanish (Mexico)',
  'it-IT':'Italian','pt-BR':'Portuguese','pt-PT':'Portuguese',
  'ru-RU':'Russian','ar-XA':'Arabic','ar-SA':'Arabic','hi-IN':'Hindi',
  'vi-VN':'Vietnamese','th-TH':'Thai','id-ID':'Indonesian','ms-MY':'Malay',
  'nl-NL':'Dutch','pl-PL':'Polish','tr-TR':'Turkish','sv-SE':'Swedish',
  'da-DK':'Danish','no-NO':'Norwegian','fi-FI':'Finnish','cs-CZ':'Czech',
  'sk-SK':'Slovak','hu-HU':'Hungarian','ro-RO':'Romanian','el-GR':'Greek',
  'uk-UA':'Ukrainian','bg-BG':'Bulgarian','hr-HR':'Croatian','sr-RS':'Serbian',
  'he-IL':'Hebrew','fa-IR':'Persian','ur-PK':'Urdu','bn-BD':'Bengali',
  'ta-IN':'Tamil','te-IN':'Telugu','ml-IN':'Malayalam','kn-IN':'Kannada',
  'gu-IN':'Gujarati','mr-IN':'Marathi','pa-IN':'Punjabi',
  'sw-KE':'Swahili','af-ZA':'Afrikaans','tl-PH':'Filipino',
  'my-MM':'Burmese','km-KH':'Khmer','mn-MN':'Mongolian',
  'tg-TJ':'Tajik','ky-KG':'Kyrgyz',
};

const NATIVE_NAMES: Record<string,string> = {
  'ko-KR':'Korean','ja-JP':'Japanese','zh-CN':'Chinese','zh-TW':'Chinese',
  'fr-FR':'French','de-DE':'German','es-ES':'Spanish','pt-BR':'Portuguese',
  'ru-RU':'Russian','ar-XA':'Arabic','hi-IN':'Hindi','vi-VN':'Vietnamese',
  'id-ID':'Indonesian','tr-TR':'Turkish','it-IT':'Italian',
  'nl-NL':'Dutch','pl-PL':'Polish','sv-SE':'Swedish','uk-UA':'Ukrainian',
};

const scoreColor = (s: number) => s>=80?'#10B981':s>=65?'#F59E0B':'#EF4444';
const hasTts = (c: string) => LEARN_LANGUAGES.find(l=>l.code===c)?.tts ?? false;
const stripEmoji = (t: string) =>
  t.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu,'').replace(/\s{2,}/g,' ').trim();

// ── Component ─────────────────────────────────────────────────────────────────

function SessionContent() {
  const sp     = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const type       = sp.get('type') || 'everyday';
  const scenarioId = sp.get('scenarioId') || '';
  const langId     = sp.get('lang') || 'en-US';
  const subLang    = sp.get('subLang') || 'en-US';
  const difficulty = sp.get('difficulty') || 'B1';

  const targetLang = LANG_NAMES[langId] || 'English';
  const nativeLang = NATIVE_NAMES[subLang] || 'English';
  const showNative = subLang !== 'en-US' && subLang !== 'en-GB';

  const everyday = EVERYDAY_SCENARIOS.find(s => s.id === scenarioId);
  const world    = WORLD_SCENARIOS.find(s => s.id === scenarioId);
  const scenario = everyday || world;

  const npcs: NpcCharacter[] = world
    ? world.npcs
    : everyday
      ? [{ id:'clerk', name:'Alex', role:'Staff / other person',
           personality:'Friendly, professional, stays in character', tutorId:everyday.tutorId,
           voiceGender:everyday.voiceGender }]
      : [];

  const accentColor = everyday?.accentColor || world?.accentColor || '#6366F1';
  const storyBeats  = world?.storyBeats || [];

  // ── State ──────────────────────────────────────────────────────────────────

  const [phase,        setPhase]        = useState<'playing'|'result'>('playing');
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [input,        setInput]        = useState('');
  const [isThinking,   setIsThinking]   = useState(false);
  const [isListening,  setIsListening]  = useState(false);
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [speakingId,   setSpeakingId]   = useState<string|null>(null);
  const [turnCount,    setTurnCount]    = useState(0);
  const [sessionXP,    setSessionXP]    = useState(0);
  const [xpPop,        setXpPop]        = useState<string|null>(null);
  const [result,       setResult]       = useState<any>(null);
  const [activeChoice, setActiveChoice] = useState<ActiveChoice|null>(null);
  const [choiceSteer,  setChoiceSteer]  = useState('');
  const [translating,  setTranslating]  = useState(false);
  const [openingDone,  setOpeningDone]  = useState(false);
  const [npcRotation,  setNpcRotation]  = useState(0);

  const chatRef    = useRef<HTMLDivElement>(null);
  const audioRef   = useRef<HTMLAudioElement|null>(null);
  const recRef     = useRef<any>(null);
  const historyRef = useRef<{role:'user'|'assistant';npcId:string;content:string}[]>([]);
  const msgId      = useRef(0);
  const startedRef = useRef(false);
  const pendingRef = useRef({text:'',gender:'female' as 'male'|'female',npcId:''});

  useEffect(() => {
    chatRef.current?.scrollTo({ top:chatRef.current.scrollHeight, behavior:'smooth' });
  }, [messages, isThinking, activeChoice]);

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

  // Live subtitle translation
  const translateToNative = useCallback(async (text: string): Promise<string> => {
    if (!showNative || !text.trim()) return '';
    try {
      const res = await fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid:user?.uid??null, temperature:0.1,
          prompt:`Translate this text to ${nativeLang}. Return ONLY the translation, nothing else:\n"${text}"` })
      });
      const data = await res.json();
      return data.text?.trim().replace(/^"|"$/g,'') || '';
    } catch { return ''; }
  }, [showNative, nativeLang, user]);

  const popXP = (pts: number) => {
    setSessionXP(x=>x+pts);
    setXpPop(`+${pts} XP`);
    setTimeout(()=>setXpPop(null),1500);
  };

  const addMsg = (m: Omit<Message,'id'|'ts'>): Message => {
    const full: Message = {...m, id:++msgId.current, ts:Date.now()};
    setMessages(prev=>[...prev, full]);
    return full;
  };

  // Build NPC system prompt
  const buildNpcPrompt = useCallback((npc: NpcCharacter, replyingToOthers = false) => {
    const history = historyRef.current
      .map(m=>`${m.npcId==='user'?'Learner':m.npcId}: ${m.content}`).join('\n');
    const basePrompt = world
      ? world.systemPrompt.replace('{targetLang}',targetLang).replace('{difficulty}',difficulty)
          .replace('{nativeLang}',nativeLang).replace('{choice}',choiceSteer||'')
      : `You are ${npc.name}, the ${npc.role} in this situation: ${everyday?.situation}. Be helpful and realistic.`;
    const otherNpcs = npcs.filter(n=>n.id!==npc.id);

    return `${basePrompt}

YOUR CHARACTER: Your name is ${npc.name}. Role: ${npc.role}. Personality: ${npc.personality}.
${otherNpcs.length>0?`OTHER CHARACTERS PRESENT: ${otherNpcs.map(n=>`${n.name} (${n.role})`).join(', ')}`:''}
${replyingToOthers?'You can react to what other characters said, not just the learner.':''}

CONVERSATION SO FAR:
${history}

CRITICAL RULES:
- Speak ONLY in ${targetLang}. Never use another language.
- Match ${difficulty} level vocabulary.
- 2-3 sentences maximum.
- No emojis (text-to-speech).
- Your name is ${npc.name} — use it if introducing yourself.
- Silently model correct English in your replies. Never mention grammar errors.

After your reply, on a NEW LINE add:
|||FB|||{"score":<0-100>,"tip":"<one helpful tip in ${nativeLang}, max 12 words>"}|||END|||

Reply as ${npc.name} in ${targetLang}:`;
  }, [world, everyday, targetLang, difficulty, nativeLang, choiceSteer, npcs]); // eslint-disable-line

  // Opening
  useEffect(() => {
    if (startedRef.current || !scenario || npcs.length===0) return;
    startedRef.current = true;

    const firstNpc = npcs.find(n=>n.speakFirst) || npcs[0];
    const openPrompt = everyday
      ? `Your name is ${firstNpc.name}. You are ${firstNpc.role} in: ${everyday.situation}. Greet the learner naturally and begin. Speak ONLY in ${targetLang} at ${difficulty} level. 1-2 sentences. No emojis.`
      : world
      ? `${world.systemPrompt.replace('{targetLang}',targetLang).replace('{difficulty}',difficulty).replace('{nativeLang}',nativeLang).replace('{choice}','')}\nYour name is ${firstNpc.name}. Open the scene with a vivid, compelling first line. Speak ONLY in ${targetLang}. 1-2 sentences. No emojis. No score block.`
      : '';

    fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ uid:user?.uid??null, temperature:0.9, prompt:openPrompt })
    }).then(r=>r.json()).then(async data => {
      const text = data.text?.trim() || 'Hello! Welcome.';
      const nativeText = await translateToNative(text);
      addMsg({ from:'npc', npcId:firstNpc.id, npcName:firstNpc.name, text, nativeText });
      historyRef.current = [{ role:'assistant', npcId:firstNpc.id, content:text }];
      setOpeningDone(true);
      speak(text, firstNpc.voiceGender, firstNpc.tutorId);  // use tutorId not npc.id
    }).catch(() => setOpeningDone(true));
  }, [scenario]); // eslint-disable-line

  // Check story beats
  const checkStoryBeats = useCallback((turn: number) => {
    if (!storyBeats.length || activeChoice) return;
    const beat = storyBeats.find(b => b.atTurn === turn);
    if (beat) setActiveChoice({ beat, chosen:false });
  }, [storyBeats, activeChoice]);

  const handleChoiceSelect = (choice: typeof storyBeats[0]['choices'][0]) => {
    setChoiceSteer(choice.steersPrompt);
    setActiveChoice(prev => prev ? {...prev, chosen:true} : null);
    addMsg({ from:'choice', text:`▶ ${choice.label}` });
  };

  // User turn — with real multi-NPC parallel response
  const handleUserTurn = useCallback(async (text: string) => {
    if (!text.trim() || isThinking || !scenario) return;
    if (audioRef.current) audioRef.current.pause();

    setInput('');
    addMsg({ from:'user', text });
    historyRef.current = [...historyRef.current, { role:'user', npcId:'user', content:text }];
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);
    popXP(10);

    setIsThinking(true);
    pendingRef.current = { text:'', gender:'female', npcId:'' };

    try {
      // Decide which NPCs respond this turn
      // Solo: always the one NPC
      // Multi: primary NPC always responds; secondary NPC responds every 2 turns
      const primaryIdx = npcRotation % npcs.length;
      const primaryNpc = npcs[primaryIdx];
      setNpcRotation(r=>r+1);

      const shouldSecondaryRespond = npcs.length > 1 && newTurn % 2 === 0;
      const secondaryNpc = shouldSecondaryRespond
        ? npcs.find(n=>n.id!==primaryNpc.id)
        : null;

      // Parallel API calls for multi-NPC
      const requests = [
        fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ uid:user?.uid??null, temperature:0.85,
            prompt: buildNpcPrompt(primaryNpc) }) }),
        ...(secondaryNpc ? [
          fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ uid:user?.uid??null, temperature:0.85,
              prompt: buildNpcPrompt(secondaryNpc, true) }) })
        ] : []),
      ];

      const responses = await Promise.all(requests);
      const jsons = await Promise.all(responses.map(r=>r.json()));

      // Process primary NPC response
      const parseNpcResponse = (raw: string) => {
        const fbMatch = raw.match(/\|\|\|FB\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
        const npcText = raw.replace(/\|\|\|FB\|\|\|[\s\S]*?\|\|\|END\|\|\|/,'').trim();
        let fb: {score?:number;tip?:string} = {};
        if (fbMatch) { try { fb = JSON.parse(fbMatch[1]); } catch {} }
        return { npcText, fb };
      };

      const { npcText:primaryText, fb:primaryFb } = parseNpcResponse(jsons[0].text?.trim()||'');
      pendingRef.current = { text:primaryText, gender:primaryNpc.voiceGender, npcId:primaryNpc.tutorId };

      // Update user message with feedback score
      if (primaryFb.score !== undefined) {
        setMessages(prev => {
          const copy = [...prev];
          for (let i=copy.length-1;i>=0;i--) {
            if (copy[i].from==='user' && copy[i].score===undefined) {
              copy[i] = {...copy[i], score:primaryFb.score, tip:primaryFb.tip}; break;
            }
          }
          return copy;
        });
        if ((primaryFb.score||0)>=80) popXP(5);
      }

      // Add primary NPC message with live subtitle
      const primaryNativeText = await translateToNative(primaryText);
      addMsg({ from:'npc', npcId:primaryNpc.tutorId, npcName:primaryNpc.name,
        text:primaryText, nativeText:primaryNativeText });
      historyRef.current = [...historyRef.current,
        { role:'assistant', npcId:primaryNpc.tutorId, content:primaryText }];
      // Start speaking primary NPC immediately
      speak(primaryText, primaryNpc.voiceGender, primaryNpc.tutorId);

      // Secondary NPC response (slight delay for natural feel)
      if (secondaryNpc && jsons[1]) {
        const { npcText:secondaryText } = parseNpcResponse(jsons[1].text?.trim()||'');
        if (secondaryText) {
          await new Promise(r=>setTimeout(r,800)); // brief pause before secondary speaks
          const secondaryNativeText = await translateToNative(secondaryText);
          addMsg({ from:'npc', npcId:secondaryNpc.tutorId, npcName:secondaryNpc.name,
            text:secondaryText, nativeText:secondaryNativeText });
          historyRef.current = [...historyRef.current,
            { role:'assistant', npcId:secondaryNpc.tutorId, content:secondaryText }];
        }
      }

      // Check story beats
      checkStoryBeats(newTurn);
      if (newTurn >= 10) setTimeout(endSession, 1500);

    } catch(e) { console.error(e); }
    finally { setIsThinking(false); }

    // speak is called inline above; pendingRef used as fallback only
  }, [isThinking, turnCount, npcs, npcRotation, buildNpcPrompt, translateToNative, speak, scenario, checkStoryBeats, user]); // eslint-disable-line

  const endSession = useCallback(async () => {
    setPhase('result');
    const userMsgs = messages.filter(m => m.from === 'user');
    const scores   = messages.filter(m => m.score !== undefined).map(m => m.score!);
    const avg      = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;

    // No user responses → skip AI analysis entirely
    if (userMsgs.length === 0) {
      setResult({ avgScore: 0, turns: 0,
        strongPoints: [], improvements: [],
        overallFeedback: '__NO_RESPONSE__' });
      return;
    }

    try {
      const res = await fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid:user?.uid??null, temperature:0.4,
          prompt:`Analyse this language learning conversation. Reply in ${nativeLang}. Return ONLY JSON:\n{"strongPoints":["s1","s2"],"improvements":["i1","i2"],"overallFeedback":"2-3 sentences in ${nativeLang}"}\nConversation:\n${historyRef.current.map(m=>(m.npcId==='user'?'Learner':'NPC')+': '+m.content).join('\n')}` })      });
      const data = await res.json();
      const parsed = JSON.parse(data.text?.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim()||'{}');
      setResult({ avgScore: avg||70, turns: turnCount, ...parsed });
      popXP(avg>=80?80:avg>=60?50:30);
    } catch {
      setResult({ avgScore: avg||70, turns: turnCount,
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
// ── RESULT ────────────────────────────────────────────────────────────────
  if (phase === 'result') return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');` }} />
      <div style={{ maxWidth: 520, width: '100%' }}>
        {!result ? (
          <div style={{ textAlign: 'center', color: '#94A3B8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
            <div style={{ fontWeight: 700 }}>Analysing your performance...</div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {result.overallFeedback === '__NO_RESPONSE__' ? (
                <>
                  <div style={{ fontSize: 52, marginBottom: 8 }}>💤</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>No response recorded</div>
                  <div style={{ fontSize: 14, color: '#64748B', fontWeight: 600, lineHeight: 1.6 }}>
                    You ended the session without speaking.<br />Try again and practice with the AI tutor!
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 52, marginBottom: 8 }}>{result.avgScore >= 80 ? '🏆' : result.avgScore >= 65 ? '🎯' : '💪'}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>Scene Complete!</div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: accentColor }}>{result.avgScore}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700 }}>{result.turns} turns · +{sessionXP} XP</div>
                </>
              )}
            </div>

            {/* ✅ 여기에 있던 잘못 닫힌 </div>를 제거하고 조건을 하나로 묶었습니다 */}
            {result.overallFeedback !== '__NO_RESPONSE__' && result.strongPoints?.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                  {npcs.map((npc, i) => {
                    const t = getTutorById(npc.tutorId);
                    return (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <img src={t.thumbnail} alt={npc.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 20%', border: `2px solid ${accentColor}` }} />
                        <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, marginTop: 3 }}>{npc.name}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#059669', marginBottom: 8, letterSpacing: 1 }}>STRENGTHS</div>
                    {result.strongPoints?.map((p: string, i: number) => (
                      <div key={i} style={{ fontSize: 12, color: '#065F46', lineHeight: 1.6, marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #10B981' }}>{p}</div>
                    ))}
                  </div>
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#D97706', marginBottom: 8, letterSpacing: 1 }}>TO IMPROVE</div>
                    {result.improvements?.map((p: string, i: number) => (
                      <div key={i} style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6, marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #F59E0B' }}>{p}</div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#6366F1', marginBottom: 6, letterSpacing: 1 }}>OVERALL</div>
                  <div style={{ fontSize: 13, color: '#3730A3', lineHeight: 1.7, fontWeight: 600 }}>{result.overallFeedback}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button onClick={() => { setPhase('playing'); setMessages([]); setTurnCount(0); historyRef.current = []; startedRef.current = false; setOpeningDone(false); setActiveChoice(null); setChoiceSteer(''); }}
                    style={{ padding: '13px', borderRadius: 13, border: '1.5px solid #E5E7EB', background: '#fff', color: '#475569', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                    Replay
                  </button>
                  <button onClick={() => router.push('/lingua/roleplay')}
                    style={{ padding: '13px', borderRadius: 13, border: 'none', background: `linear-gradient(135deg,${accentColor},${accentColor}cc)`, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                    More Worlds →
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
  // ── PLAYING ───────────────────────────────────────────────────────────────
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
        @keyframes choiceIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}}/>

      {/* TOP BAR */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',
        background:'#fff',borderBottom:'1px solid #F1F5F9',flexShrink:0,
        boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
        <button onClick={()=>{if(audioRef.current){audioRef.current.pause();audioRef.current=null;}endSession();}}
          style={{background:'#F1F5F9',border:'none',borderRadius:10,padding:'7px 12px',
            color:'#64748B',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
          ✕ End
        </button>
        <div style={{flex:1,textAlign:'center'}}>
          <div style={{fontSize:14,fontWeight:900}}>
            {(everyday?.emoji||world?.emoji)} {everyday?.title||world?.title}
          </div>
          <div style={{fontSize:10,color:'#94A3B8',fontWeight:700}}>
            Turn {turnCount}/10 · {difficulty}
            {showNative ? ' · Subtitles ON' : ''}
          </div>
        </div>
        <div style={{fontSize:12,fontWeight:800,color:accentColor}}>+{sessionXP} XP</div>
      </div>

      {/* Progress */}
      <div style={{height:3,background:'#F1F5F9',flexShrink:0}}>
        <div style={{height:'100%',width:`${(turnCount/10)*100}%`,
          background:accentColor,transition:'width .5s ease'}}/>
      </div>

      {/* TUTOR VIDEOS — opacity swap idle↔talk, full width */}
      <div style={{display:'flex',flexShrink:0,background:'#0a0a0a',
        borderBottom:`2px solid ${accentColor}30`}}>
        {npcs.map((npc,ni) => {
          const t = getTutorById(npc.tutorId);
          const isActive = speakingId === npc.tutorId;
          const vidH = npcs.length === 1 ? 220 : 170;
          return (
            <div key={npc.id} style={{
              display:'flex',alignItems:'center',justifyContent:'center',
              padding:'12px 8px',
              borderLeft:ni>0?`1px solid ${accentColor}30`:'none',
              background:'#0a0a0a', flex:1, minWidth:0}}>
              <div style={{position:'relative',
                width: npcs.length===1 ? 120 : 90,
                height: npcs.length===1 ? 120 : 90,
                borderRadius:'50%', overflow:'hidden', flexShrink:0,
                border:`3px solid ${isActive ? accentColor : '#333'}`,
                boxShadow: isActive ? `0 0 0 4px ${accentColor}30` : 'none',
                transition:'border-color .3s, box-shadow .3s'}}>
              {/* IDLE — visible when not speaking */}
              <video src={t.videoIdle} autoPlay loop muted playsInline style={{
                position:'absolute',inset:0,width:'100%',height:'100%',
                objectFit:'cover',objectPosition:'center top',display:'block',
                opacity:isActive?0:1,filter:'brightness(0.72)',transition:'opacity .25s'}}/>
              {/* TALK — visible when speaking */}
              <video src={t.videoTalk} autoPlay loop muted playsInline style={{
                position:'absolute',inset:0,width:'100%',height:'100%',
                objectFit:'cover',objectPosition:'center top',display:'block',
                opacity:isActive?1:0,filter:'brightness(1.08)',transition:'opacity .25s'}}/>
              {/* Gradient + name */}
              <div style={{position:'absolute',bottom:0,left:0,right:0,
                padding:'20px 10px 8px',pointerEvents:'none',
                background:'linear-gradient(to top,rgba(0,0,0,0.88),transparent)'}}>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  {isActive&&[0,1,2].map(i=>(
                    <div key={i} style={{width:3,borderRadius:2,background:accentColor,
                      height:4+i*3,animation:`glow .5s ${i*.15}s infinite`}}/>
                  ))}
                  <span style={{fontSize:12,fontWeight:800,color:isActive?accentColor:'#94A3B8'}}>{npc.name}</span>
                  <span style={{fontSize:9,color:'#475569'}}>· {npc.role}</span>
                </div>
              </div>
              {isActive&&<div style={{position:'absolute',inset:0,outline:`3px solid ${accentColor}`,pointerEvents:'none'}}/>}
            </div>
          );
        })}
      </div>

            {/* CHAT */}
      <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'14px',
        display:'flex',flexDirection:'column',gap:10}}>

        {!openingDone && (
          <div style={{textAlign:'center',padding:'20px',color:'#94A3B8'}}>
            <div style={{display:'flex',justifyContent:'center',gap:5,alignItems:'center'}}>
              {[0,1,2].map(d=>(
                <div key={d} style={{width:7,height:7,borderRadius:'50%',background:accentColor,
                  animation:`thinking .9s ${d*.2}s infinite`}}/>
              ))}
              <span style={{fontSize:12,fontWeight:700,marginLeft:8}}>Setting the scene...</span>
            </div>
          </div>
        )}

        {messages.map(msg => {
          if (msg.from==='choice') return (
            <div key={msg.id} style={{textAlign:'center',animation:'fadeUp .3s ease'}}>
              <span style={{display:'inline-block',padding:'4px 14px',borderRadius:99,fontSize:12,
                fontWeight:800,background:`${accentColor}15`,color:accentColor,
                border:`1px solid ${accentColor}30`}}>{msg.text}</span>
            </div>
          );

          const isUser = msg.from==='user';
          const npc = npcs.find(n=>n.id===msg.npcId);
          const t = npc ? getTutorById(npc.tutorId) : null;

          return (
            <div key={msg.id} style={{display:'flex',flexDirection:'column',
              alignItems:isUser?'flex-end':'flex-start',animation:'fadeUp .3s ease'}}>
              {/* Name + avatar */}
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3,
                flexDirection:isUser?'row-reverse':'row'}}>
                {!isUser && t && (
                  <img src={t.thumbnail} alt={npc?.name}
                    style={{width:20,height:20,borderRadius:'50%',objectFit:'cover',objectPosition:'center 20%'}}/>
                )}
                <div style={{fontSize:10,fontWeight:700,color:'#94A3B8'}}>
                  {isUser?'You':msg.npcName}
                </div>
              </div>

              {/* Bubble */}
              <div style={{maxWidth:'82%',padding:'11px 15px',
                borderRadius:isUser?'16px 16px 4px 16px':'16px 16px 16px 4px',
                background:isUser?accentColor:'#fff',
                border:isUser?'none':'1.5px solid #F1F5F9',
                boxShadow:isUser?'none':'0 2px 6px rgba(0,0,0,0.05)',
                color:isUser?'#fff':'#0F172A',fontSize:15,fontWeight:600,lineHeight:1.65}}>
                {msg.text}
              </div>

              {/* Native subtitle */}
              {!isUser && showNative && msg.nativeText && (
                <div style={{fontSize:11,color:'#64748B',fontWeight:600,
                  marginTop:2,paddingLeft:4,fontStyle:'italic',maxWidth:'82%',lineHeight:1.4}}>
                  {msg.nativeText}
                </div>
              )}

              {/* Score badge */}
              {isUser && msg.score!==undefined && (
                <div style={{marginTop:4,display:'flex',alignItems:'center',gap:6,
                  padding:'3px 10px',borderRadius:8,
                  background:`${scoreColor(msg.score)}12`,
                  border:`1px solid ${scoreColor(msg.score)}30`}}>
                  <span style={{fontSize:12,fontWeight:900,color:scoreColor(msg.score)}}>{msg.score}</span>
                  {msg.tip && <span style={{fontSize:10,color:'#64748B',fontWeight:600}}>{msg.tip}</span>}
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking indicator */}
        {isThinking && (
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {npcs[npcRotation%npcs.length] && (() => {
              const t = getTutorById(npcs[npcRotation%npcs.length].tutorId);
              return <img src={t.thumbnail} alt="" style={{width:20,height:20,borderRadius:'50%',objectFit:'cover',objectPosition:'center 20%'}}/>;
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

        {/* Story choice */}
        {activeChoice && !activeChoice.chosen && (
          <div style={{background:'#fff',border:`1.5px solid ${accentColor}40`,borderRadius:16,
            padding:16,animation:'choiceIn .4s ease',boxShadow:`0 4px 20px ${accentColor}20`}}>
            <div style={{fontSize:12,fontWeight:800,color:accentColor,marginBottom:10,letterSpacing:.5}}>
              🔀 {activeChoice.beat.prompt}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {activeChoice.beat.choices.map(c => (
                <button key={c.id} onClick={()=>handleChoiceSelect(c)}
                  style={{padding:'10px 14px',borderRadius:12,border:`1.5px solid ${accentColor}30`,
                    background:`${accentColor}08`,color:accentColor,fontWeight:700,fontSize:13,
                    cursor:'pointer',textAlign:'left',fontFamily:"'Nunito',sans-serif",
                    transition:'all .15s'}}
                  onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.background=`${accentColor}18`; }}
                  onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.background=`${accentColor}08`; }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* XP pop */}
      {xpPop && (
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
            disabled={isThinking||isSpeaking||!openingDone}
            style={{width:46,height:46,borderRadius:'50%',border:'none',flexShrink:0,cursor:'pointer',
              background:isListening?'linear-gradient(135deg,#EF4444,#DC2626)':'#F1F5F9',
              color:isListening?'#fff':'#64748B',fontSize:20,
              animation:isListening?'pulse .8s infinite':'none',
              opacity:isThinking||isSpeaking||!openingDone?0.35:1}}>
            {isListening?'⏹':'🎤'}
          </button>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleUserTurn(input);}}}
            placeholder={`Reply in ${targetLang}...`}
            disabled={isThinking||!openingDone}
            style={{flex:1,padding:'12px 16px',borderRadius:14,background:'#F8FAFC',
              border:'1.5px solid #E5E7EB',color:'#0F172A',fontSize:14,
              fontFamily:"'Nunito',sans-serif",outline:'none',fontWeight:600,
              opacity:isThinking||!openingDone?0.5:1}}/>
          <button onClick={()=>handleUserTurn(input)} disabled={!input.trim()||isThinking||!openingDone}
            style={{width:46,height:46,borderRadius:'50%',border:'none',flexShrink:0,
              background:input.trim()&&!isThinking?accentColor:'#E5E7EB',
              color:input.trim()&&!isThinking?'#fff':'#94A3B8',fontSize:18,
              cursor:input.trim()?'pointer':'default',transition:'all .15s'}}>➤</button>
        </div>
        {turnCount>=4 && (
          <button onClick={endSession}
            style={{width:'100%',marginTop:8,padding:'9px',borderRadius:11,
              border:`1px solid ${accentColor}30`,background:`${accentColor}10`,
              color:accentColor,fontWeight:700,fontSize:12,cursor:'pointer',
              fontFamily:"'Nunito',sans-serif"}}>
            End scene & get feedback →
          </button>
        )}
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#F8FAFC'}}/>}>
      <SessionContent/>
    </Suspense>
  );
}
