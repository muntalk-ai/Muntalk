'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/userProfile';
import { getTutorById } from '@/data/tutors';
import { getSubscription, isAdminEmail } from '@/lib/subscription';
import PaywallModal from '@/components/PaywallModal';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import {
  STUDIO_GENRES, buildCreatorPrompt, COPYRIGHT_DECLARATION,
  type StudioType, type LangMode, type ProjectPhase, type StudioProject,
} from '@/lib/dreamStudio';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMsg {
  role: 'user'|'ai';
  text: string;
  extractedContent?: string;  // content between |||CONTENT_START||| markers
}

// ── Lang helpers ──────────────────────────────────────────────────────────────

const LANG_NAMES: Record<string,string> = {
  'en-US':'English','en-GB':'English','ja-JP':'Japanese','ko-KR':'Korean',
  'zh-CN':'Chinese','fr-FR':'French','de-DE':'German','es-ES':'Spanish',
  'it-IT':'Italian','pt-BR':'Portuguese','ru-RU':'Russian','ar-XA':'Arabic',
  'hi-IN':'Hindi','vi-VN':'Vietnamese','th-TH':'Thai','id-ID':'Indonesian',
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DreamStudioPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // User settings
  const [langId,     setLangId]     = useState('en-US');
  const [subLang,    setSubLang]    = useState('en-US');
  const [tutorId,    setTutorId]    = useState('t01');
  const [userName,   setUserName]   = useState('Creator');

  // Studio state
  const [view,       setView]       = useState<'gallery'|'studio'>('gallery');
  const [selGenre,   setSelGenre]   = useState<typeof STUDIO_GENRES[0]|null>(null);
  const [projects,   setProjects]   = useState<StudioProject[]>([]);
  const [activeProj, setActiveProj] = useState<StudioProject|null>(null);

  // Session
  const [messages,   setMessages]   = useState<ChatMsg[]>([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [langMode,   setLangMode]   = useState<LangMode>('mixed');
  const [phase,      setPhase]      = useState<ProjectPhase>('idea');
  const [docContent, setDocContent] = useState('');
  const [outline,    setOutline]    = useState('');
  const [showDoc,    setShowDoc]    = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening,setIsListening]= useState(false);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState('');
  const [planId,     setPlanId]     = useState<string>('free');
  const [isAdmin,    setIsAdmin]    = useState(false);
  const [showPaywall,setShowPaywall]= useState(false);

  const chatRef    = useRef<HTMLDivElement>(null);
  const audioRef   = useRef<HTMLAudioElement|null>(null);
  const recRef     = useRef<any>(null);

  const targetLang = LANG_NAMES[langId]  || 'English';
  const nativeLang = LANG_NAMES[subLang] || 'English';
  const sameLanguage = langId === subLang || (langId.startsWith('en') && subLang.startsWith('en'));
  const isPremiumUser = isAdmin || planId !== 'free';
  const tutor = getTutorById(tutorId);

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
        if (p?.displayName) setUserName(p.displayName);
      });
      getSubscription(user.uid).then(sub => setPlanId(sub.planId));
      setIsAdmin(isAdminEmail(user.email));
      loadProjects();
    }
  }, [user]); // eslint-disable-line

  useEffect(() => {
    chatRef.current?.scrollTo({ top:chatRef.current.scrollHeight, behavior:'smooth' });
  }, [messages, loading]);

  // STT
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = langMode === 'native' ? subLang : langId;
    rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => sendMessage(e.results[0][0].transcript);
    rec.onerror  = () => setIsListening(false);
    rec.onend    = () => setIsListening(false);
    recRef.current = rec;
  }, [langId, subLang, langMode]); // eslint-disable-line

  // TTS
  const speak = useCallback(async (text: string) => {
    const clean = text.replace(/\|\|\|[A-Z_]+\|\|\|[\s\S]*?\|\|\|[A-Z_]+\|\|\|/g,'')
                      .replace(/[\u{1F000}-\u{1FFFF}]/gu,'').slice(0,300).trim();
    if (!clean) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsSpeaking(true);
    try {
      const spkLang = langMode === 'native' ? subLang : langId;
      const res = await fetch('/api/tts', { method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text:clean, lang:spkLang, gender:tutor.gender, level:'b1' }) });
      const data = await res.json();
      if (!data.audioContent) { setIsSpeaking(false); return; }
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); audioRef.current = null; };
      audio.play().catch(()=>setIsSpeaking(false));
    } catch { setIsSpeaking(false); }
  }, [langId, subLang, langMode, tutor.gender]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(''),3000); };

  // Load projects
  const loadProjects = async () => {
    if (!user) return;
    try {
      const q = query(collection(db,'dream_projects'), where('uid','==',user.uid), orderBy('updatedAt','desc'));
      const snap = await getDocs(q);
      setProjects(snap.docs.map(d=>d.data() as StudioProject));
    } catch(e) { console.warn('loadProjects:', e); }
  };

  // Save project
  const saveProject = useCallback(async (proj: StudioProject) => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = { ...proj, updatedAt: new Date().toISOString(),
        wordCount: proj.content.split(/\s+/).filter(Boolean).length };
      await setDoc(doc(db,'dream_projects',proj.id), updated);
      setActiveProj(updated);
      setProjects(prev => prev.map(p=>p.id===updated.id?updated:p));
      showToast('✅ Saved');
    } catch(e) { showToast('⚠️ Save failed'); }
    setSaving(false);
  }, [user]);

  // Start new project
  const startNewProject = useCallback(async (genre: typeof STUDIO_GENRES[0], title: string) => {
    if (!user) { router.push('/signup'); return; }
    if (!isPremiumUser) { setShowPaywall(true); return; }
    const proj: StudioProject = {
      id: `proj_${Date.now()}`, uid: user.uid,
      type: genre.id, title, content: '', outline: '',
      phase: 'idea', langMode, targetLang: langId, nativeLang: subLang,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      wordCount: 0,
    };
    setActiveProj(proj);
    setDocContent('');
    setOutline('');
    setMessages([]);
    setPhase('idea');
    setSelGenre(genre);
    setView('studio');

    // AI opening — introduce project and ask first question
    setLoading(true);
    try {
      const openingPrompt = `You are ${tutor.name}, a world-class creative collaborator.
A creator named ${userName} is starting a new ${genre.title} project called "${title}".
${langMode === 'native' ? `They prefer to work in ${nativeLang}.` : langMode === 'target' ? `They want to work in ${targetLang} to practise the language.` : `They can work in either ${targetLang} or ${nativeLang} — follow their lead.`}

Open with genuine excitement about this specific project. Ask ONE sharp, specific question to understand their creative vision — something that will actually shape what you make together. 
Do NOT be generic. React to the actual title "${title}". 2-3 sentences.
Respond in ${langMode === 'native' ? nativeLang : targetLang}.`;

      const res = await fetch('/api/gemini', { method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid:user.uid, temperature:0.9, prompt:openingPrompt }) });
      const data = await res.json();
      const aiText = data.text?.trim() || `Let\'s build "${title}" together. Tell me your vision.`;
      setMessages([{ role:'ai', text:aiText }]);
      speak(aiText);
    } catch {
      setMessages([{ role:'ai', text:`Let's create "${title}" together. What's the core idea you've been carrying around?` }]);
    }
    setLoading(false);
  }, [user, tutor.name, userName, langMode, langId, subLang, targetLang, nativeLang, router, speak]);

  // Send message
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading || !selGenre || !activeProj) return;
    setInput('');

    const newMsg: ChatMsg = { role:'user', text:msg };
    setMessages(prev=>[...prev, newMsg]);
    setLoading(true);

    try {
      const prompt = buildCreatorPrompt({
        genre: selGenre,
        phase,
        langMode,
        targetLang,
        nativeLang,
        tutorName: tutor.name,
        projectTitle: activeProj.title,
        existingContent: docContent,
        userMessage: msg,
        outline,
      });

      const res = await fetch('/api/gemini', { method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid:user?.uid??null, temperature:0.85, prompt }) });
      const data = await res.json();
      const raw = data.text?.trim() || 'Tell me more about what you\'re imagining.';

      // Extract content blocks
      const contentMatch = raw.match(/\|\|\|CONTENT_START\|\|\|([\s\S]*?)\|\|\|CONTENT_END\|\|\|/);
      const extractedContent = contentMatch ? contentMatch[1].trim() : '';
      const chatText = raw.replace(/\|\|\|CONTENT_START\|\|\|[\s\S]*?\|\|\|CONTENT_END\|\|\|/,'').trim();

      const aiMsg: ChatMsg = { role:'ai', text:chatText, extractedContent };
      setMessages(prev=>[...prev, aiMsg]);

      // Append extracted content to document
      if (extractedContent) {
        const newDoc = docContent
          ? docContent + '\n\n' + extractedContent
          : extractedContent;
        setDocContent(newDoc);
        const updated = { ...activeProj, content:newDoc,
          wordCount: newDoc.split(/\s+/).filter(Boolean).length };
        setActiveProj(updated);
        // Auto-save every content addition
        if (user) saveProject(updated);
      }

      speak(chatText);
    } catch(e) {
      setMessages(prev=>[...prev, { role:'ai', text:'Something went wrong — try again?' }]);
    }
    setLoading(false);
  }, [input, loading, selGenre, activeProj, phase, langMode, targetLang, nativeLang,
      tutor.name, docContent, outline, user, speak, saveProject]); // eslint-disable-line

  // Download project
  const downloadProject = () => {
    if (!activeProj) return;
    const date = new Date().toLocaleDateString('en-GB');
    const copyright = COPYRIGHT_DECLARATION(activeProj.title, userName, date);
    const fullDoc = `${activeProj.title}\n${'='.repeat(activeProj.title.length)}\n\n${docContent}\n\n${copyright}`;
    const blob = new Blob([fullDoc], { type:'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProj.title.replace(/\s+/g,'_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Downloaded — this work is yours.');
  };

  // ── RENDER: Gallery ──────────────────────────────────────────────────────────

  // ── Auth & Premium gate ─────────────────────────────────────────────────────
  // Not logged in → redirect to signup
  if (!user && !authLoading) {
    return (
      <div style={{ minHeight:'100vh', background:'#08080F',
        fontFamily:"'Nunito',sans-serif", color:'#F1F5F9',
        display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ textAlign:'center', maxWidth:380 }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🌟</div>
          <div style={{ fontSize:22, fontWeight:900, marginBottom:8 }}>Dream Studio</div>
          <div style={{ fontSize:14, color:'#64748B', fontWeight:600, marginBottom:28, lineHeight:1.6 }}>
            Create your novel, screenplay, lyrics, or poetry with an AI collaborator. Sign in to begin.
          </div>
          <button onClick={() => router.push('/login')}
            style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff',
              fontWeight:800, fontSize:16, fontFamily:"'Nunito',sans-serif", marginBottom:10 }}>
            Sign In
          </button>
          <button onClick={() => router.push('/signup')}
            style={{ width:'100%', padding:'14px', borderRadius:14,
              border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer',
              background:'transparent', color:'#94A3B8',
              fontWeight:700, fontSize:14, fontFamily:"'Nunito',sans-serif" }}>
            Create Free Account
          </button>
        </div>
      </div>
    );
  }

  // Logged in but not premium → show upgrade page
  if (user && !isPremiumUser) {
    return (
      <div style={{ minHeight:'100vh', background:'#08080F',
        fontFamily:"'Nunito',sans-serif", color:'#F1F5F9',
        display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ textAlign:'center', maxWidth:420 }}>
          <div style={{ fontSize:56, marginBottom:16 }}>👑</div>
          <div style={{ fontSize:22, fontWeight:900, marginBottom:8 }}>Premium Feature</div>
          <div style={{ fontSize:14, color:'#64748B', fontWeight:600, marginBottom:8, lineHeight:1.6 }}>
            Dream Studio is available for Premium members.
          </div>
          <div style={{ fontSize:13, color:'#475569', fontWeight:600, marginBottom:28, lineHeight:1.7 }}>
            ✍️ Write novels, screenplays, lyrics & poetry<br/>
            🤝 AI creative collaborator<br/>
            🌐 Work in any language<br/>
            © 100% your copyright
          </div>
          <button onClick={() => router.push('/pricing')}
            style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#fbbf24,#f59e0b)', color:'#000',
              fontWeight:900, fontSize:16, fontFamily:"'Nunito',sans-serif", marginBottom:10 }}>
            Upgrade to Premium →
          </button>
          <button onClick={() => router.back()}
            style={{ width:'100%', padding:'12px', borderRadius:14,
              border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer',
              background:'transparent', color:'#64748B',
              fontWeight:700, fontSize:14, fontFamily:"'Nunito',sans-serif" }}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (view === 'gallery') return (
    <div style={{ minHeight:'100vh', background:'#08080F',
      fontFamily:"'Nunito',sans-serif", color:'#F1F5F9' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        .genre-card{transition:transform .2s,box-shadow .25s;cursor:pointer;}
        .genre-card:hover{transform:translateY(-6px);}
        .proj-card{transition:all .15s;cursor:pointer;}
        .proj-card:hover{transform:translateY(-2px);}
      `}}/>

      {/* HEADER */}
      <div style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => router.back()}
          style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:10, padding:'8px 16px', color:'#64748B', fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>← Back</button>
        <div>
          <div style={{ fontSize:20, fontWeight:900 }}>🌟 Dream Studio</div>
          <div style={{ fontSize:11, color:'#475569', fontWeight:600 }}>
            Your creative workspace · Everything you make is yours
          </div>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'8px 20px 80px' }}>

        {/* PaywallModal */}
        {showPaywall && (
          <PaywallModal
            reason="general"
            onClose={() => setShowPaywall(false)}
          />
        )}

        {/* Premium notice for free users */}
        {!isPremiumUser && (
          <div style={{ marginBottom:20, padding:'14px 20px', borderRadius:16,
            background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))',
            border:'1px solid rgba(99,102,241,0.3)',
            display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:28 }}>👑</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#6366F1', marginBottom:2 }}>
                Premium Feature
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>
                Dream Studio is available for Premium members. Upgrade to start creating your novel, screenplay, lyrics, or poetry.
              </div>
            </div>
            <button onClick={() => router.push('/pricing')}
              style={{ padding:'8px 18px', borderRadius:12, border:'none', cursor:'pointer',
                background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color:'#fff', fontWeight:800, fontSize:12,
                fontFamily:"'Nunito',sans-serif", flexShrink:0 }}>
              Upgrade →
            </button>
          </div>
        )}

        {/* Copyright banner */}
        <div style={{ marginBottom:28, padding:'14px 20px', borderRadius:16,
          background:'linear-gradient(135deg,rgba(251,191,36,0.12),rgba(239,68,68,0.08))',
          border:'1px solid rgba(251,191,36,0.25)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:24 }}>©</div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:'#fbbf24', marginBottom:2 }}>
              100% Your Copyright
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>
              Everything created here belongs entirely to you. MunTalk AI is your collaborator, not your author. Download anytime with a copyright declaration included.
            </div>
          </div>
        </div>

        {/* Language mode selector */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#475569', letterSpacing:1,
            marginBottom:10 }}>WORKING LANGUAGE</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {([
              { id:'target' as LangMode, label:`🌐 ${targetLang}`, sub:'Study language while creating', color:'#6366F1' },
              { id:'native' as LangMode, label:`🏠 ${nativeLang}`, sub:'Work in your native language', color:'#10B981' },
              { id:'mixed'  as LangMode, label:'Switch freely', sub:'Best of both', color:'#F59E0B' },
            ]).filter(o => !sameLanguage || o.id !== 'native').map(opt => (
              <button key={opt.id} onClick={() => setLangMode(opt.id)}
                style={{ padding:'10px 18px', borderRadius:14, border:'none', cursor:'pointer',
                  fontFamily:"'Nunito',sans-serif",
                  background: langMode===opt.id ? opt.color : 'rgba(255,255,255,0.06)',
                  outline: langMode===opt.id ? `2px solid ${opt.color}50` : 'none',
                  color: langMode===opt.id ? '#fff' : '#64748B',
                  boxShadow: langMode===opt.id ? `0 4px 14px ${opt.color}40` : 'none',
                  transition:'all .15s' }}>
                <div style={{ fontSize:13, fontWeight:800 }}>{opt.label}</div>
                <div style={{ fontSize:10, fontWeight:600, opacity:.8 }}>{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Existing projects */}
        {projects.length > 0 && (
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#475569', letterSpacing:1,
              marginBottom:12 }}>YOUR PROJECTS</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {projects.slice(0,5).map(p => {
                const g = STUDIO_GENRES.find(g=>g.id===p.type);
                return (
                  <div key={p.id} className="proj-card"
                    onClick={() => {
                      setActiveProj(p); setSelGenre(g||null);
                      setDocContent(p.content); setOutline(p.outline);
                      setPhase(p.phase); setLangMode(p.langMode);
                      setMessages([]);
                      setView('studio');
                    }}
                    style={{ background:'rgba(255,255,255,0.04)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:14, padding:'14px 18px',
                      display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontSize:24 }}>{g?.emoji || '📝'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:'#F1F5F9' }}>{p.title}</div>
                      <div style={{ fontSize:11, color:'#475569', fontWeight:600 }}>
                        {g?.title} · {p.wordCount} words · {p.phase}
                        · {new Date(p.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:'#6366F1', fontWeight:700 }}>Continue →</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Genre grid */}
        <div style={{ fontSize:11, fontWeight:800, color:'#475569', letterSpacing:1,
          marginBottom:14 }}>START A NEW PROJECT</div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {STUDIO_GENRES.map((genre,i) => (
            <GenreCard key={genre.id} genre={genre} index={i}
              locked={!isPremiumUser}
              onSelect={(title) => isPremiumUser ? startNewProject(genre, title) : setShowPaywall(true)} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── RENDER: Studio ───────────────────────────────────────────────────────────

  const phaseInfo = selGenre?.phases.find(p=>p.id===phase) || selGenre?.phases[0];

  return (
    <div style={{ height:'100dvh', background:'#F8FAFC', fontFamily:"'Nunito',sans-serif",
      display:'flex', flexDirection:'column', overflow:'hidden', color:'#0F172A' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes thinking{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}70%{box-shadow:0 0 0 10px rgba(239,68,68,0)}}
        @keyframes glow{0%,100%{opacity:.5}50%{opacity:1}}
      `}}/>

      {/* TOP BAR */}
      <div style={{ background:'#fff', borderBottom:'1px solid #F1F5F9', flexShrink:0,
        boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        {/* Row 1: nav */}
        <div style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setView('gallery')}
            style={{ background:'#F1F5F9', border:'none', borderRadius:10,
              padding:'7px 12px', color:'#64748B', fontSize:12, fontWeight:700,
              cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>← Projects</button>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>{selGenre?.emoji}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:900, color:'#0F172A' }}>{activeProj?.title}</div>
              <div style={{ fontSize:10, color:'#94A3B8', fontWeight:700 }}>
                {selGenre?.title} · {activeProj?.wordCount||0} words
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setShowDoc(d=>!d)}
              style={{ padding:'6px 12px', borderRadius:10, border:'none', cursor:'pointer',
                background: showDoc?'#EEF2FF':'#F1F5F9',
                color: showDoc?'#6366F1':'#64748B',
                fontSize:12, fontWeight:700, fontFamily:"'Nunito',sans-serif" }}>
              {showDoc ? '💬 Chat' : '📄 Doc'}
            </button>
            <button onClick={downloadProject}
              style={{ padding:'6px 12px', borderRadius:10, border:'none', cursor:'pointer',
                background:'#F1F5F9', color:'#064E3B', fontSize:12, fontWeight:700,
                fontFamily:"'Nunito',sans-serif" }}>
              📥 Download
            </button>
          </div>
        </div>

        {/* Row 2: phase + lang mode */}
        <div style={{ padding:'0 14px 10px', display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
          {selGenre?.phases.map(p => (
            <button key={p.id} onClick={() => setPhase(p.id)}
              style={{ padding:'4px 12px', borderRadius:99, border:'none', cursor:'pointer',
                fontFamily:"'Nunito',sans-serif", fontSize:11, fontWeight:800,
                background: phase===p.id ? (selGenre.accent) : '#F1F5F9',
                color: phase===p.id ? '#fff' : '#64748B',
                transition:'all .15s' }}>
              {p.label}
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
            {([['target','🌐',targetLang],['native','🏠',nativeLang],['mixed','🔄','Mixed']] as const)
              .filter(([id]) => !sameLanguage || id !== 'native')
              .map(([id, icon, label]) => (
              <button key={id} onClick={() => setLangMode(id as LangMode)}
                style={{ padding:'3px 10px', borderRadius:99, border:'none', cursor:'pointer',
                  fontFamily:"'Nunito',sans-serif", fontSize:10, fontWeight:800,
                  background: langMode===id ? '#0F172A' : '#F1F5F9',
                  color: langMode===id ? '#fff' : '#64748B' }}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN AREA: chat or document */}
      {showDoc ? (
        <div style={{ flex:1, overflowY:'auto', padding:'20px', background:'#F8FAFC' }}>
          <div style={{ maxWidth:680, margin:'0 auto', background:'#fff', borderRadius:16,
            border:'1.5px solid #F1F5F9', padding:'32px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:22, fontWeight:900, color:'#0F172A', marginBottom:6 }}>
              {activeProj?.title}
            </div>
            <div style={{ fontSize:11, color:'#94A3B8', fontWeight:600, marginBottom:24,
              paddingBottom:16, borderBottom:'1px solid #F1F5F9' }}>
              {selGenre?.title} · {activeProj?.wordCount||0} words · © {userName}
            </div>
            {docContent ? (
              <div style={{ fontSize:15, lineHeight:1.8, color:'#1E293B', whiteSpace:'pre-wrap',
                fontFamily:"Georgia, serif" }}>
                {docContent}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#94A3B8', fontWeight:600 }}>
                Your work will appear here as you create it
              </div>
            )}
          </div>
        </div>
      ) : (
        <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'14px',
          display:'flex', flexDirection:'column', gap:10 }}>

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} style={{ display:'flex', flexDirection:'column',
                alignItems:isUser?'flex-end':'flex-start',
                animation:'fadeUp .3s ease' }}>
                {!isUser && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <img src={tutor.thumbnail} alt={tutor.name}
                      style={{ width:22, height:22, borderRadius:'50%', objectFit:'cover',
                        objectPosition:'center 20%' }}/>
                    <span style={{ fontSize:10, fontWeight:700, color:'#94A3B8' }}>{tutor.name}</span>
                  </div>
                )}
                <div style={{ maxWidth:'82%', padding:'11px 16px',
                  borderRadius:isUser?'18px 18px 4px 18px':'18px 18px 18px 4px',
                  background: isUser ? (selGenre?.accent||'#6366F1') : '#fff',
                  border: isUser ? 'none' : '1.5px solid #F1F5F9',
                  boxShadow: isUser ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                  color: isUser ? '#fff' : '#0F172A',
                  fontSize:14, fontWeight:600, lineHeight:1.65 }}>
                  {msg.text}
                </div>
                {msg.extractedContent && (
                  <div style={{ marginTop:6, maxWidth:'82%', padding:'12px 16px',
                    borderRadius:12, background:'#F0FDF4', border:'1.5px solid #A7F3D0',
                    fontSize:13, color:'#065F46', lineHeight:1.7, fontFamily:"Georgia,serif",
                    whiteSpace:'pre-wrap' }}>
                    <div style={{ fontSize:9, fontWeight:800, color:'#059669',
                      letterSpacing:1, marginBottom:6 }}>ADDED TO YOUR DOCUMENT</div>
                    {msg.extractedContent.slice(0, 300)}{msg.extractedContent.length > 300 ? '...' : ''}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
              <img src={tutor.thumbnail} alt=""
                style={{ width:22, height:22, borderRadius:'50%', objectFit:'cover',
                  objectPosition:'center 20%' }}/>
              <div style={{ padding:'10px 14px', borderRadius:'18px 18px 18px 4px',
                background:'#fff', border:'1.5px solid #F1F5F9',
                display:'flex', gap:4, alignItems:'center' }}>
                {[0,1,2].map(d=>(
                  <div key={d} style={{ width:7, height:7, borderRadius:'50%',
                    background: selGenre?.accent||'#6366F1',
                    animation:`thinking .9s ${d*.2}s infinite` }}/>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)',
          background:'#0F172A', color:'#fff', padding:'10px 20px', borderRadius:12,
          fontSize:13, fontWeight:700, zIndex:999 }}>{toast}</div>
      )}

      {/* INPUT */}
      <div style={{ padding:'10px 12px 14px', background:'#fff',
        borderTop:'1px solid #F1F5F9', flexShrink:0 }}>
        <div style={{ marginBottom:6, fontSize:10, color:'#94A3B8', fontWeight:700 }}>
          {phaseInfo?.desc} · speaking in {langMode==='native'?nativeLang:langMode==='target'?targetLang:'mixed mode'}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <button
            onMouseDown={() => { if(!recRef.current||isListening||loading) return; try{recRef.current.start();setIsListening(true);}catch{} }}
            onTouchStart={() => { if(!recRef.current||isListening||loading) return; try{recRef.current.start();setIsListening(true);}catch{} }}
            style={{ width:44, height:44, borderRadius:'50%', border:'none', flexShrink:0,
              background:isListening?'linear-gradient(135deg,#EF4444,#DC2626)':'#F1F5F9',
              color:isListening?'#fff':'#64748B', fontSize:18, cursor:'pointer',
              animation:isListening?'pulse .8s infinite':'none' }}>
            {isListening?'⏹':'🎤'}
          </button>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} }}
            placeholder={`Describe your vision, ask for a scene, request feedback... (${langMode==='native'?nativeLang:langMode==='target'?targetLang:'any language'})`}
            rows={2}
            disabled={loading}
            style={{ flex:1, padding:'10px 14px', borderRadius:12,
              background:'#F8FAFC', border:'1.5px solid #E5E7EB',
              color:'#0F172A', fontSize:13, fontFamily:"'Nunito',sans-serif",
              outline:'none', fontWeight:600, resize:'none',
              opacity:loading?0.5:1 }}/>
          <button onClick={()=>sendMessage()} disabled={!input.trim()||loading}
            style={{ width:44, height:44, borderRadius:'50%', border:'none', flexShrink:0,
              background:input.trim()&&!loading?(selGenre?.accent||'#6366F1'):'#E5E7EB',
              color:input.trim()&&!loading?'#fff':'#94A3B8', fontSize:18,
              cursor:input.trim()?'pointer':'default', transition:'all .15s' }}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ── Genre Card Component ──────────────────────────────────────────────────────

function GenreCard({ genre, index, onSelect, locked = false }: {
  genre: typeof STUDIO_GENRES[0];
  index: number;
  onSelect: (title: string) => void;
  locked?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [hovIdx, setHovIdx] = useState<number|null>(null);

  return (
    <div className="genre-card"
      style={{ borderRadius:20, overflow:'hidden',
        animation:`fadeUp .35s ease ${index*.07}s both`,
        boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
      <div style={{ background:genre.gradient, padding:'22px 20px 16px', position:'relative' }}
        onClick={() => setExpanded(e=>!e)}>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)' }}/>
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ fontSize:34, animation:'float 3s ease-in-out infinite' }}>{genre.emoji}</div>
            {locked && (
              <div style={{ width:28, height:28, borderRadius:'50%',
                background:'rgba(0,0,0,0.5)', display:'flex',
                alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                🔒
              </div>
            )}
          </div>
          <div style={{ fontSize:17, fontWeight:900, color:'#fff', marginBottom:3 }}>{genre.title}</div>
          <div style={{ fontSize:11, color:genre.accent, fontWeight:700, marginBottom:6 }}>{genre.tagline}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', fontWeight:600, lineHeight:1.5 }}>
            {genre.description}
          </div>
        </div>
      </div>

      {/* Expand for project start */}
      {expanded && (
        <div style={{ background:'rgba(255,255,255,0.04)', padding:'14px 16px',
          borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:10, fontWeight:800, color:'#475569',
            letterSpacing:1, marginBottom:8 }}>EXAMPLES</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
            {genre.examples.map((ex,i) => (
              <button key={i}
                onMouseEnter={()=>setHovIdx(i)}
                onMouseLeave={()=>setHovIdx(null)}
                onClick={() => setTitleInput(ex)}
                style={{ padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer',
                  background: hovIdx===i ? `${genre.accent}20` : 'rgba(255,255,255,0.06)',
                  color: hovIdx===i ? genre.accent : '#94A3B8',
                  fontSize:11, fontWeight:700, textAlign:'left',
                  fontFamily:"'Nunito',sans-serif", transition:'all .12s' }}>
                {ex}
              </button>
            ))}
          </div>
          <input value={titleInput} onChange={e=>setTitleInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&titleInput.trim()) onSelect(titleInput.trim()); }}
            placeholder="Or type your own idea..."
            style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'none',
              background:'rgba(255,255,255,0.08)', color:'#F1F5F9', fontSize:13,
              fontFamily:"'Nunito',sans-serif", outline:'none', fontWeight:600,
              marginBottom:10, boxSizing:'border-box' }}/>
          <button onClick={() => titleInput.trim() && onSelect(titleInput.trim())}
            disabled={!titleInput.trim()}
            style={{ width:'100%', padding:'12px', borderRadius:12, border:'none',
              background: titleInput.trim() ? `linear-gradient(135deg,${genre.accent},${genre.accent}99)` : '#333',
              color:'#fff', fontWeight:800, fontSize:14, cursor:titleInput.trim()?'pointer':'default',
              fontFamily:"'Nunito',sans-serif",
              boxShadow: titleInput.trim() ? `0 4px 16px ${genre.accent}40` : 'none' }}>
            Start Creating →
          </button>
        </div>
      )}
    </div>
  );
}
