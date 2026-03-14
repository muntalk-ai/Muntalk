'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/userProfile';
import { LEARN_LANGUAGES } from '@/data/languages';

interface GrammarError {
  original: string; corrected: string; explanation: string;
  type: 'grammar' | 'vocabulary' | 'word-order' | 'tense' | 'spelling';
}
interface PronunciationHint { word: string; phonetic: string; tip: string; }
interface AnalysisResult {
  grammarScore: number; pronunciationScore: number; fluencyScore: number; overallScore: number;
  errors: GrammarError[]; pronunciationHints: PronunciationHint[];
  correctedSentence: string; naturalAlternative: string; encouragement: string; level: string;
}
interface Turn {
  id: number; userText: string; sttConfidence: number;
  analysis: AnalysisResult | null; aiReply: string; timestamp: number;
}

const hasStt = (c: string) => LEARN_LANGUAGES.find(l => l.code === c)?.stt ?? false;
const hasTts = (c: string) => LEARN_LANGUAGES.find(l => l.code === c)?.tts ?? false;
const scoreColor = (s: number) => s >= 85 ? '#10B981' : s >= 70 ? '#3B82F6' : s >= 55 ? '#F59E0B' : '#EF4444';
const scoreLabel = (s: number) => s >= 85 ? 'Excellent' : s >= 70 ? 'Good' : s >= 55 ? 'Fair' : 'Needs work';
const errColor: Record<string,string> = { grammar:'#EF4444', vocabulary:'#8B5CF6', 'word-order':'#F59E0B', tense:'#3B82F6', spelling:'#EC4899' };

export default function CoachPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [langId,    setLangId]    = useState('en-US');
  const [langLabel, setLangLabel] = useState('English');
  const [topic,     setTopic]     = useState('free');
  const [turns,     setTurns]     = useState<Turn[]>([]);
  const [isListening,  setIsListening]  = useState(false);
  const [isAnalysing,  setIsAnalysing]  = useState(false);
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [inputText,    setInputText]    = useState('');
  const [sessionXP,    setSessionXP]    = useState(0);
  const [xpPop,        setXpPop]        = useState<string|null>(null);
  const [sessionStats, setSessionStats] = useState({ grammar:0, pronunciation:0, fluency:0, turns:0 });
  const recRef  = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const chatRef  = useRef<HTMLDivElement>(null);
  const turnId   = useRef(0);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then(p => {
      if (p?.learnLang) {
        setLangId(p.learnLang);
        setLangLabel(LEARN_LANGUAGES.find(l=>l.code===p.learnLang)?.label ?? 'English');
      }
    });
  }, [user]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:'smooth' });
  }, [turns, isAnalysing]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || !hasStt(langId)) return;
    const rec = new SR();
    rec.lang = langId; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => {
      const b = e.results[0][0];
      handleSubmit(b.transcript, b.confidence || 0.75);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    recRef.current = rec;
  }, [langId]); // eslint-disable-line

  const stripEmoji = (t: string) =>
    t.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '')
     .replace(/\s{2,}/g, ' ').trim();

  const speak = useCallback(async (text: string): Promise<void> => {
    const clean = stripEmoji(text);
    if (!hasTts(langId) || !clean) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(true);
    return new Promise(resolve => {
      fetch('/api/tts', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text:clean, lang:langId, gender:'female', level:'b1' })
      }).then(r=>r.json()).then(data => {
        if (!data.audioContent) { setIsSpeaking(false); resolve(); return; }
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); audioRef.current=null; resolve(); };
        audio.onerror = () => { setIsSpeaking(false); audioRef.current=null; resolve(); };
        audio.play().catch(() => { setIsSpeaking(false); resolve(); });
      }).catch(() => { setIsSpeaking(false); resolve(); });
    });
  }, [langId]);

  const startListening = useCallback(() => {
    if (!recRef.current || isListening || isAnalysing) return;
    if (audioRef.current) audioRef.current.pause();
    try { recRef.current.start(); setIsListening(true); } catch {}
  }, [isListening, isAnalysing]);

  const popXP = (pts: number) => {
    setSessionXP(x=>x+pts);
    setXpPop(`+${pts} XP`);
    setTimeout(() => setXpPop(null), 1500);
  };

  const handleSubmit = useCallback(async (text: string, confidence = 0.8) => {
    if (!text.trim() || isAnalysing) return;
    setInputText('');
    setIsAnalysing(true);
    const id = ++turnId.current;
    setTurns(prev => [...prev, { id, userText:text, sttConfidence:confidence, analysis:null, aiReply:'', timestamp:Date.now() }]);
    const topicCtx = topic==='daily'?'daily life':topic==='travel'?'travel':topic==='business'?'business':topic==='academic'?'academic debate':'free conversation';
    const pScore = Math.round((confidence*0.7+0.3)*100);
    try {
      const res = await fetch('/api/gemini', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid:user?.uid??null, temperature:0.3, prompt:
`You are an expert ${langLabel} language coach. The student said in ${langLabel}:
"${text}"
Topic context: ${topicCtx}. STT confidence: ${(confidence*100).toFixed(0)}%

Return ONLY valid JSON, no markdown:
{"grammarScore":<0-100>,"pronunciationScore":<0-100>,"fluencyScore":<0-100>,"overallScore":<weighted avg>,"errors":[{"original":"<wrong>","corrected":"<right>","explanation":"<max 12 words>","type":"<grammar|vocabulary|word-order|tense|spelling>"}],"pronunciationHints":[{"word":"<word>","phonetic":"<IPA>","tip":"<max 10 words>"}],"correctedSentence":"<corrected>","naturalAlternative":"<more natural>","encouragement":"<warm specific praise>","level":"<A1|A2|B1|B2|C1|C2>","aiReply":"<1-2 sentence reply IN ${langLabel} continuing the conversation>"}
Rules: errors max 4, empty [] if none. pronunciationHints only if confidence<0.8, empty [] otherwise. aiReply MUST be in ${langLabel}.` }),
      });
      const data = await res.json();
      const raw = data.text?.replace(/\`\`\`json\s*/gi,'').replace(/\`\`\`\s*/g,'').trim() || '{}';
      let parsed: any = {};
      try { parsed = JSON.parse(raw); } catch {}
      const analysis: AnalysisResult = {
        grammarScore:       parsed.grammarScore??70,
        pronunciationScore: parsed.pronunciationScore??pScore,
        fluencyScore:       parsed.fluencyScore??70,
        overallScore:       parsed.overallScore??70,
        errors:             parsed.errors??[],
        pronunciationHints: parsed.pronunciationHints??[],
        correctedSentence:  parsed.correctedSentence??text,
        naturalAlternative: parsed.naturalAlternative??text,
        encouragement:      parsed.encouragement??'Good effort!',
        level:              parsed.level??'B1',
      };
      const aiReply: string = parsed.aiReply??'';
      setTurns(prev => prev.map(t => t.id===id ? {...t, analysis, aiReply} : t));
      setSessionStats(prev => {
        const n = prev.turns+1;
        return { grammar:Math.round((prev.grammar*prev.turns+analysis.grammarScore)/n),
          pronunciation:Math.round((prev.pronunciation*prev.turns+analysis.pronunciationScore)/n),
          fluency:Math.round((prev.fluency*prev.turns+analysis.fluencyScore)/n), turns:n };
      });
      popXP(analysis.errors.length===0?30:analysis.overallScore>=80?25:analysis.overallScore>=60?15:10);
      if (aiReply) await speak(aiReply);
    } catch(e) {
      console.error('[coach]',e);
      setTurns(prev => prev.map(t => t.id===id ? {...t,
        analysis:{grammarScore:70,pronunciationScore:70,fluencyScore:70,overallScore:70,
          errors:[],pronunciationHints:[],correctedSentence:text,naturalAlternative:text,
          encouragement:'Good effort!',level:'B1'}, aiReply:''} : t));
    } finally { setIsAnalysing(false); }
  }, [isAnalysing, langLabel, topic, user, speak]); // eslint-disable-line

  const TOPICS = [
    {id:'free',label:'Free Talk',emoji:'💬'},{id:'daily',label:'Daily Life',emoji:'🌅'},
    {id:'travel',label:'Travel',emoji:'✈️'},{id:'business',label:'Business',emoji:'💼'},
    {id:'academic',label:'Academic',emoji:'🎓'},
  ];
  const STARTERS = ['Tell me about yourself','What did you do today?','Describe your hometown','What are your hobbies?'];

  return (
    <div style={{height:'100dvh',background:'#05080F',display:'flex',flexDirection:'column',fontFamily:"'Outfit',sans-serif",overflow:'hidden',color:'#F1F5F9'}}>
      <style dangerouslySetInnerHTML={{__html:`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes xpPop{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-48px)}}
        @keyframes thinking{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.6)}70%{box-shadow:0 0 0 14px rgba(239,68,68,0)}}
      `}}/>

      {/* TOP BAR */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'rgba(255,255,255,0.03)',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:0}}>
        <button onClick={()=>router.back()} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'8px 14px',color:'#64748B',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Outfit',sans-serif"}}>← Back</button>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:800,color:'#F1F5F9',lineHeight:1}}>🧠 AI Language Coach</div>
          <div style={{fontSize:11,color:'#475569',fontWeight:600,marginTop:2}}>{langLabel} · Pronunciation · Grammar · Real-time feedback</div>
        </div>
        {sessionStats.turns > 0 && (
          <div style={{display:'flex',gap:8}}>
            {[{l:'G',v:sessionStats.grammar,t:'Grammar'},{l:'P',v:sessionStats.pronunciation,t:'Pronunciation'},{l:'F',v:sessionStats.fluency,t:'Fluency'}].map(s=>(
              <div key={s.l} title={s.t} style={{width:38,height:38,borderRadius:'50%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:`${scoreColor(s.v)}18`,border:`2px solid ${scoreColor(s.v)}50`}}>
                <div style={{fontSize:11,fontWeight:900,color:scoreColor(s.v),lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:8,color:'#475569',fontWeight:700}}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{fontSize:13,fontWeight:800,color:'#6366F1'}}>+{sessionXP} XP</div>
      </div>

      {/* TOPIC PILLS */}
      <div style={{display:'flex',gap:8,padding:'10px 16px',overflowX:'auto',borderBottom:'1px solid rgba(255,255,255,0.04)',flexShrink:0,scrollbarWidth:'none'}}>
        {TOPICS.map(t=>(
          <button key={t.id} onClick={()=>setTopic(t.id)} style={{padding:'7px 14px',borderRadius:99,border:'none',whiteSpace:'nowrap',fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:12,cursor:'pointer',background:topic===t.id?'#6366F1':'rgba(255,255,255,0.06)',color:topic===t.id?'#fff':'#64748B',transition:'all .15s'}}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* CHAT AREA */}
      <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:20}}>
        {turns.length===0 && !isAnalysing && (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'40px 24px'}}>
            <div style={{fontSize:64,marginBottom:20}}>🎙️</div>
            <div style={{fontSize:22,fontWeight:800,marginBottom:10,color:'#E2E8F0'}}>Start speaking!</div>
            <div style={{fontSize:14,color:'#475569',fontWeight:600,lineHeight:1.7,maxWidth:340,marginBottom:28}}>
              Tap the mic or type below. AI will analyse your <strong style={{color:'#6366F1'}}>grammar</strong> and <strong style={{color:'#10B981'}}>pronunciation</strong> in real time.
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
              {STARTERS.map(p=>(
                <button key={p} onClick={()=>setInputText(p)} style={{padding:'8px 14px',borderRadius:10,border:'1px solid rgba(99,102,241,0.3)',background:'rgba(99,102,241,0.08)',color:'#818CF8',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Outfit',sans-serif"}}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map(turn=>(
          <div key={turn.id} style={{animation:'fadeUp .35s ease'}}>
            {/* User bubble */}
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
              <div style={{maxWidth:'80%'}}>
                <div style={{fontSize:11,color:'#475569',fontWeight:700,textAlign:'right',marginBottom:4}}>You</div>
                <div style={{background:'linear-gradient(135deg,#6366F1,#8B5CF6)',borderRadius:'16px 16px 4px 16px',padding:'12px 16px',fontSize:15,fontWeight:600,lineHeight:1.6,color:'#fff'}}>{turn.userText}</div>
                <div style={{textAlign:'right',marginTop:4}}><span style={{fontSize:10,fontWeight:700,color:'#475569'}}>STT: {Math.round(turn.sttConfidence*100)}%</span></div>
              </div>
            </div>

            {/* Analysis card */}
            {turn.analysis && (
              <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:20,padding:18,marginBottom:8}}>
                {/* Scores */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16}}>
                  {[{label:'Grammar',val:turn.analysis.grammarScore,icon:'📝'},{label:'Pronunciation',val:turn.analysis.pronunciationScore,icon:'🔊'},{label:'Fluency',val:turn.analysis.fluencyScore,icon:'💫'},{label:'Overall',val:turn.analysis.overallScore,icon:'⭐'}].map(s=>(
                    <div key={s.label} style={{textAlign:'center',padding:'10px 6px',borderRadius:12,background:`${scoreColor(s.val)}10`,border:`1px solid ${scoreColor(s.val)}25`}}>
                      <div style={{fontSize:16,marginBottom:2}}>{s.icon}</div>
                      <div style={{fontSize:20,fontWeight:900,color:scoreColor(s.val),lineHeight:1}}>{s.val}</div>
                      <div style={{fontSize:9,color:'#475569',fontWeight:700,marginTop:2}}>{s.label}</div>
                      <div style={{fontSize:8,color:scoreColor(s.val),fontWeight:700}}>{scoreLabel(s.val)}</div>
                    </div>
                  ))}
                </div>
                {/* Encouragement */}
                <div style={{padding:'10px 14px',borderRadius:12,background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',fontSize:13,color:'#6EE7B7',fontWeight:600,marginBottom:12,lineHeight:1.6}}>{turn.analysis.encouragement}</div>
                {/* Errors */}
                {turn.analysis.errors.length>0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,fontWeight:800,color:'#EF4444',letterSpacing:1,marginBottom:8}}>CORRECTIONS</div>
                    {turn.analysis.errors.map((err,i)=>(
                      <div key={i} style={{background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:10,padding:'10px 14px',marginBottom:6}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                          <span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:800,background:`${errColor[err.type]}20`,color:errColor[err.type],border:`1px solid ${errColor[err.type]}40`}}>{err.type}</span>
                          <span style={{fontSize:13,color:'#EF4444',fontWeight:600,textDecoration:'line-through',opacity:0.7}}>{err.original}</span>
                          <span style={{color:'#475569'}}>→</span>
                          <span style={{fontSize:13,color:'#6EE7B7',fontWeight:700}}>{err.corrected}</span>
                        </div>
                        <div style={{fontSize:12,color:'#64748B',fontWeight:600}}>{err.explanation}</div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Corrected sentence */}
                {turn.analysis.correctedSentence!==turn.userText && (
                  <div style={{marginBottom:12,padding:'10px 14px',borderRadius:10,background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)'}}>
                    <div style={{fontSize:10,fontWeight:800,color:'#818CF8',letterSpacing:1,marginBottom:6}}>CORRECTED</div>
                    <div style={{fontSize:14,color:'#C7D2FE',fontWeight:700,lineHeight:1.6}}>{turn.analysis.correctedSentence}</div>
                  </div>
                )}
                {/* Natural alternative */}
                {turn.analysis.naturalAlternative!==turn.analysis.correctedSentence && (
                  <div style={{marginBottom:12,padding:'10px 14px',borderRadius:10,background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.18)'}}>
                    <div style={{fontSize:10,fontWeight:800,color:'#F59E0B',letterSpacing:1,marginBottom:6}}>MORE NATURAL</div>
                    <div style={{fontSize:14,color:'#FDE68A',fontWeight:700,lineHeight:1.6,cursor:'pointer'}} onClick={()=>speak(turn.analysis!.naturalAlternative)}>
                      {turn.analysis.naturalAlternative} <span style={{fontSize:11,color:'#F59E0B',marginLeft:8}}>🔊</span>
                    </div>
                  </div>
                )}
                {/* Pronunciation hints */}
                {turn.analysis.pronunciationHints.length>0 && (
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:800,color:'#10B981',letterSpacing:1,marginBottom:8}}>PRONUNCIATION</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                      {turn.analysis.pronunciationHints.map((h,i)=>(
                        <div key={i} style={{padding:'8px 12px',borderRadius:10,background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)'}}>
                          <div style={{fontSize:13,fontWeight:800,color:'#F1F5F9',marginBottom:2}}>{h.word}</div>
                          <div style={{fontSize:12,color:'#10B981',fontWeight:700,marginBottom:3}}>[{h.phonetic}]</div>
                          <div style={{fontSize:11,color:'#64748B',fontWeight:600}}>{h.tip}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{display:'flex',justifyContent:'flex-end'}}>
                  <span style={{padding:'3px 10px',borderRadius:99,fontSize:10,fontWeight:800,background:'rgba(99,102,241,0.15)',color:'#818CF8',border:'1px solid rgba(99,102,241,0.3)'}}>Level: {turn.analysis.level}</span>
                </div>
              </div>
            )}

            {/* AI reply */}
            {turn.aiReply && (
              <div style={{display:'flex',justifyContent:'flex-start',marginTop:4}}>
                <div style={{maxWidth:'80%'}}>
                  <div style={{fontSize:11,color:'#475569',fontWeight:700,marginBottom:4}}>AI Coach</div>
                  <div style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px 16px 16px 4px',padding:'12px 16px',fontSize:15,fontWeight:600,lineHeight:1.65,color:'#E2E8F0',cursor:'pointer'}} onClick={()=>speak(turn.aiReply)}>
                    {turn.aiReply} <span style={{fontSize:12,color:'#475569',marginLeft:8}}>🔊</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isAnalysing && (
          <div style={{display:'flex',justifyContent:'flex-start',animation:'fadeUp .3s ease'}}>
            <div style={{padding:'14px 18px',borderRadius:'16px 16px 16px 4px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',gap:5,alignItems:'center'}}>
              {[0,1,2].map(d=><div key={d} style={{width:8,height:8,borderRadius:'50%',background:'#6366F1',animation:`thinking 1s ${d*0.2}s infinite`}}/>)}
              <span style={{fontSize:12,color:'#475569',fontWeight:700,marginLeft:6}}>Analysing...</span>
            </div>
          </div>
        )}
      </div>

      {xpPop && <div style={{position:'fixed',bottom:90,right:24,fontSize:18,fontWeight:900,color:'#6366F1',animation:'xpPop .9s ease forwards',pointerEvents:'none',zIndex:999}}>{xpPop}</div>}

      {/* INPUT BAR */}
      <div style={{padding:'10px 14px 14px',background:'rgba(255,255,255,0.02)',borderTop:'1px solid rgba(255,255,255,0.06)',flexShrink:0}}>
        {sessionStats.turns >= 2 && (
          <div style={{display:'flex',gap:8,marginBottom:10,padding:'8px 12px',background:'rgba(99,102,241,0.07)',borderRadius:12,border:'1px solid rgba(99,102,241,0.15)',alignItems:'center'}}>
            <span style={{fontSize:12,fontWeight:800,color:'#818CF8'}}>Session avg</span>
            {[{l:'Grammar',v:sessionStats.grammar},{l:'Pronunciation',v:sessionStats.pronunciation},{l:'Fluency',v:sessionStats.fluency}].map(s=>(
              <div key={s.l} style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{width:32,height:4,borderRadius:2,background:'rgba(255,255,255,0.1)',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${s.v}%`,background:scoreColor(s.v),borderRadius:2}}/>
                </div>
                <span style={{fontSize:11,fontWeight:800,color:scoreColor(s.v)}}>{s.v}</span>
                <span style={{fontSize:10,color:'#475569'}}>{s.l}</span>
              </div>
            ))}
            <span style={{marginLeft:'auto',fontSize:11,color:'#475569',fontWeight:700}}>{sessionStats.turns} turns</span>
          </div>
        )}
        <div style={{display:'flex',gap:10,alignItems:'flex-end'}}>
          <button onMouseDown={hasStt(langId)?startListening:undefined} onTouchStart={hasStt(langId)?startListening:undefined}
            disabled={isAnalysing||isSpeaking||!hasStt(langId)}
            style={{width:52,height:52,borderRadius:'50%',border:'none',flexShrink:0,cursor:hasStt(langId)?'pointer':'not-allowed',background:isListening?'linear-gradient(135deg,#EF4444,#DC2626)':'rgba(255,255,255,0.08)',color:'#fff',fontSize:22,animation:isListening?'pulse 1s infinite':'none',opacity:isAnalysing||isSpeaking?0.4:1}}>
            {isListening?'⏹':'🎤'}
          </button>
          <input value={inputText} onChange={e=>setInputText(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSubmit(inputText);}}}
            placeholder={hasStt(langId)?`Speak or type in ${langLabel}...`:`Type in ${langLabel}...`}
            disabled={isAnalysing}
            style={{flex:1,padding:'14px 18px',borderRadius:16,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'#F1F5F9',fontSize:14,fontFamily:"'Outfit',sans-serif",outline:'none',fontWeight:600,opacity:isAnalysing?0.5:1}}/>
          <button onClick={()=>handleSubmit(inputText)} disabled={!inputText.trim()||isAnalysing}
            style={{width:52,height:52,borderRadius:'50%',border:'none',flexShrink:0,background:inputText.trim()&&!isAnalysing?'linear-gradient(135deg,#6366F1,#8B5CF6)':'rgba(255,255,255,0.07)',color:'#fff',fontSize:20,cursor:inputText.trim()?'pointer':'default',opacity:!inputText.trim()||isAnalysing?0.4:1,transition:'all .15s'}}>
            ➤
          </button>
        </div>
        {!hasStt(langId) && <div style={{textAlign:'center',fontSize:11,color:'#475569',fontWeight:600,marginTop:8}}>Voice input not available for this language — please type instead</div>}
      </div>
    </div>
  );
}
