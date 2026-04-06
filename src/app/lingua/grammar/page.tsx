'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getTutorById } from '@/data/tutors';
import {
  GRAMMAR_CHAPTERS, GRAMMAR_CATEGORIES, LEVEL_ORDER, getLevelInfo,
  getChaptersByLevel, type GrammarLevel, type GrammarChapter,
} from '@/data/grammar';

// ── Native language map ───────────────────────────────────────────────────────

const NATIVE_LANG: Record<string,string> = {
  'ko-KR':'Korean','ja-JP':'Japanese','zh-CN':'Chinese','zh-TW':'Chinese',
  'fr-FR':'French','de-DE':'German','es-ES':'Spanish','pt-BR':'Portuguese',
  'ru-RU':'Russian','ar-XA':'Arabic','hi-IN':'Hindi','vi-VN':'Vietnamese',
  'id-ID':'Indonesian','tr-TR':'Turkish','it-IT':'Italian','en-US':'English',
};

// ── Quiz state ────────────────────────────────────────────────────────────────

interface QuizState {
  current: number;
  selected: number | null;
  answered: boolean;
  score: number;
  done: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GrammarPage() {
  const router  = useRouter();
  const { user } = useAuth();

  const [selLevel,    setSelLevel]    = useState<GrammarLevel>('a1');
  const [selCategory, setSelCategory] = useState<string|null>(null);
  const [selChapter,  setSelChapter]  = useState<GrammarChapter|null>(null);
  const [view,        setView]        = useState<'hub'|'chapter'>('hub');
  const [exampleIdx,  setExampleIdx]  = useState(0);
  const [quiz,        setQuiz]        = useState<QuizState>({ current:0, selected:null, answered:false, score:0, done:false });
  const [tutorId,     setTutorId]     = useState('t01');
  const [nativeLang,  setNativeLang]  = useState('ko-KR');
  const [aiChat,      setAiChat]      = useState<{role:'user'|'ai';text:string}[]>([]);
  const [aiInput,     setAiInput]     = useState('');
  const [aiLoading,   setAiLoading]   = useState(false);
  const [showAI,      setShowAI]      = useState(false);
  const [completedIds,setCompletedIds]= useState<Set<string>>(new Set());

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ti = localStorage.getItem('mt_tutor_id') || 't01';
    const nl = localStorage.getItem('mt_native_lang') || 'ko-KR';
    setTutorId(ti); setNativeLang(nl);
    const done = JSON.parse(localStorage.getItem('mt_grammar_done') || '[]') as string[];
    setCompletedIds(new Set(done));
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior:'smooth' });
  }, [aiChat]);

  const tutor = getTutorById(tutorId);
  const nativeLangName = NATIVE_LANG[nativeLang] || 'Korean';

  const openChapter = (ch: GrammarChapter) => {
    setSelChapter(ch);
    setView('chapter');
    setExampleIdx(0);
    setQuiz({ current:0, selected:null, answered:false, score:0, done:false });
    setAiChat([]);
    setShowAI(false);
  };

  const markComplete = (id: string) => {
    const next = new Set([...completedIds, id]);
    setCompletedIds(next);
    localStorage.setItem('mt_grammar_done', JSON.stringify([...next]));
  };

  const handleQuizAnswer = (idx: number) => {
    if (!selChapter || quiz.answered) return;
    const correct = idx === selChapter.quiz[quiz.current].answer;
    setQuiz(prev => ({ ...prev, selected: idx, answered: true, score: correct ? prev.score + 1 : prev.score }));
  };

  const nextQuiz = () => {
    if (!selChapter) return;
    if (quiz.current + 1 >= selChapter.quiz.length) {
      setQuiz(prev => ({ ...prev, done: true }));
      markComplete(selChapter.id);
    } else {
      setQuiz(prev => ({ ...prev, current: prev.current + 1, selected: null, answered: false }));
    }
  };

  const startAI = useCallback(async () => {
    if (!selChapter) return;
    setShowAI(true);
    setAiLoading(true);
    try {
      const prompt = `You are ${tutor.name}, a warm and expert English grammar tutor.
The student has just studied: "${selChapter.title}" (${selChapter.subtitle}).
Their native language is ${nativeLangName}.

Open with ONE sentence greeting them on finishing the lesson, then give them ONE practical exercise using ${selChapter.title} — make it feel like a real conversation task, not a textbook exercise.
Keep it to 3-4 sentences. Be encouraging and specific.
Respond in English, but you may add a brief ${nativeLangName} translation of the exercise prompt in parentheses.`;

      const res = await fetch('/api/gemini', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid: user?.uid ?? null, temperature: 0.85, prompt }),
      });
      const data = await res.json();
      setAiChat([{ role:'ai', text: data.text?.trim() || 'Great work! Let\'s practise this grammar together.' }]);
    } catch {
      setAiChat([{ role:'ai', text:'Great work completing this lesson! Let\'s practise together.' }]);
    }
    setAiLoading(false);
  }, [selChapter, tutor.name, nativeLangName, user]);

  const sendAI = useCallback(async () => {
    if (!aiInput.trim() || aiLoading || !selChapter) return;
    const userText = aiInput.trim();
    setAiInput('');
    setAiChat(prev => [...prev, { role:'user', text: userText }]);
    setAiLoading(true);

    try {
      const history = aiChat.map(m => `${m.role==='user'?'Student':tutor.name}: ${m.text}`).join('\n');
      const prompt = `You are ${tutor.name}, coaching the student on "${selChapter.title}".
Native language: ${nativeLangName}. 
Give specific grammar feedback — correct any errors gently, explain why, then ask them to try again or try a new related exercise.
2-3 sentences max. Be warm and specific.

Conversation so far:
${history}
Student: ${userText}
${tutor.name}:`;

      const res = await fetch('/api/gemini', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid: user?.uid ?? null, temperature: 0.8, prompt }),
      });
      const data = await res.json();
      setAiChat(prev => [...prev, { role:'ai', text: data.text?.trim() || 'Good try! Let\'s look at this more carefully.' }]);
    } catch {
      setAiChat(prev => [...prev, { role:'ai', text: 'Something went wrong — please try again.' }]);
    }
    setAiLoading(false);
  }, [aiInput, aiLoading, selChapter, aiChat, tutor.name, nativeLangName, user]);

  // ── CHAPTER VIEW ────────────────────────────────────────────────────────────

  if (view === 'chapter' && selChapter) {
    const ch = selChapter;
    const lvInfo = getLevelInfo(ch.level);

    return (
      <div style={S.page}>
        <style>{CSS}</style>

        {/* Nav */}
        <nav style={S.nav}>
          <button onClick={() => setView('hub')} style={S.navBack}>← Back</button>
          <div style={{ textAlign:'center', flex:1 }}>
            <div style={{ fontSize:14, fontWeight:900, color:'#0F172A' }}>
              {ch.emoji} {ch.title}
            </div>
            <div style={{ fontSize:10, color:'#94A3B8', fontWeight:700 }}>{ch.subtitle}</div>
          </div>
          <div style={{ ...S.levelBadge, background:lvInfo.color, color:'#fff' }}>{lvInfo.label}</div>
        </nav>

        <div style={S.chapterBody}>

          {/* Key point banner */}
          <div style={{ ...S.keyPoint, borderLeft:`4px solid ${ch.color}` }}>
            <span style={{ fontSize:16, marginRight:8 }}>💡</span>
            <span style={{ fontSize:14, fontWeight:700, color:'#1E293B', lineHeight:1.6 }}>{ch.keyPoint}</span>
          </div>

          {/* Structure Table */}
          <div style={S.section}>
            <div style={{ ...S.sectionTitle, color:ch.color }}>📊 구조 (Structure)</div>
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {ch.structure.headers.map((h,i) => (
                      <th key={i} style={{ ...S.th, background:ch.color, color:'#fff' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ch.structure.rows.map((row,ri) => (
                    <tr key={ri} style={{ background: row.highlight ? `${ch.color}08` : '#fff' }}>
                      {row.cells.map((cell,ci) => (
                        <td key={ci} style={{
                          ...S.td,
                          fontWeight: ci===0 ? 800 : 600,
                          color: ci===0 ? ch.color : '#0F172A',
                          fontFamily: ci===2 ? "Georgia, serif" : 'inherit',
                        }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Use Cases */}
          <div style={S.section}>
            <div style={{ ...S.sectionTitle, color:ch.color }}>🎯 언제 쓰나요?</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {ch.useCases.map((uc,i) => (
                <div key={i} style={{ ...S.useCase, borderLeft:`3px solid ${uc.color}` }}>
                  <span style={{ ...S.useCaseLabel, background:`${uc.color}15`, color:uc.color }}>{uc.label}</span>
                  <div style={{ marginTop:6 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#0F172A', fontFamily:"Georgia,serif" }}>{uc.example}</div>
                    <div style={{ fontSize:12, color:'#64748B', fontWeight:600, marginTop:2 }}>{uc.translation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Examples Slider */}
          <div style={S.section}>
            <div style={{ ...S.sectionTitle, color:ch.color }}>💬 예문 (Examples)</div>
            <div style={S.exampleCard}>
              <div style={{ fontSize:16, fontWeight:700, color:'#0F172A', lineHeight:1.7, fontFamily:"Georgia,serif", marginBottom:8 }}>
                {ch.examples[exampleIdx].en.split(ch.examples[exampleIdx].highlight || '###').map((part, pi, arr) => (
                  <span key={pi}>
                    {part}
                    {pi < arr.length-1 && (
                      <span style={{ background:`${ch.color}20`, color:ch.color, borderRadius:4, padding:'1px 4px', fontWeight:900 }}>
                        {ch.examples[exampleIdx].highlight}
                      </span>
                    )}
                  </span>
                ))}
              </div>
              <div style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>{ch.examples[exampleIdx].ko}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14 }}>
                <button onClick={() => setExampleIdx(i => Math.max(0,i-1))}
                  disabled={exampleIdx===0}
                  style={{ ...S.exBtn, opacity: exampleIdx===0?0.3:1 }}>← 이전</button>
                <div style={{ display:'flex', gap:6 }}>
                  {ch.examples.map((_,i) => (
                    <div key={i} style={{ width:7, height:7, borderRadius:'50%',
                      background: i===exampleIdx ? ch.color : '#E2E8F0',
                      transition:'background .2s', cursor:'pointer' }}
                      onClick={() => setExampleIdx(i)}/>
                  ))}
                </div>
                <button onClick={() => setExampleIdx(i => Math.min(ch.examples.length-1,i+1))}
                  disabled={exampleIdx===ch.examples.length-1}
                  style={{ ...S.exBtn, opacity: exampleIdx===ch.examples.length-1?0.3:1 }}>다음 →</button>
              </div>
            </div>
          </div>

          {/* Common Mistakes */}
          <div style={S.section}>
            <div style={{ ...S.sectionTitle, color:'#DC2626' }}>⚠️ 자주 하는 실수</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {ch.mistakes.map((m,i) => (
                <div key={i} style={S.mistakeCard}>
                  <div style={{ display:'flex', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={S.wrongTag}>❌ {m.wrong}</span>
                    <span style={S.rightTag}>✅ {m.right}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#64748B', fontWeight:600 }}>💬 {m.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tip */}
          {ch.tip && (
            <div style={S.tipBox}>
              <span style={{ fontSize:18, marginRight:8 }}>🌟</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#92400E', lineHeight:1.6 }}>{ch.tip}</span>
            </div>
          )}

          {/* Quiz */}
          <div style={S.section}>
            <div style={{ ...S.sectionTitle, color:ch.color }}>⚡ 미니 퀴즈</div>

            {quiz.done ? (
              <div style={{ ...S.quizCard, textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>
                  {quiz.score === ch.quiz.length ? '🏆' : quiz.score >= ch.quiz.length/2 ? '🎯' : '💪'}
                </div>
                <div style={{ fontSize:20, fontWeight:900, color:'#0F172A', marginBottom:4 }}>
                  {quiz.score} / {ch.quiz.length} 정답
                </div>
                <div style={{ fontSize:13, color:'#64748B', fontWeight:600, marginBottom:16 }}>
                  {quiz.score === ch.quiz.length ? '완벽해요! 다음 챕터로 가볼까요?' :
                   quiz.score >= ch.quiz.length/2 ? '잘했어요! 틀린 부분을 다시 복습해보세요.' :
                   '조금 더 복습이 필요해요. 처음부터 다시 해볼까요?'}
                </div>
                <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
                  <button onClick={() => setQuiz({ current:0, selected:null, answered:false, score:0, done:false })}
                    style={S.quizRetryBtn}>🔄 다시 풀기</button>
                  {!showAI && (
                    <button onClick={startAI} style={{ ...S.quizRetryBtn, background:ch.color, color:'#fff', border:'none' }}>
                      🤖 AI로 연습하기
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={S.quizCard}>
                <div style={{ fontSize:11, fontWeight:800, color:'#94A3B8', marginBottom:8, letterSpacing:1 }}>
                  문제 {quiz.current+1} / {ch.quiz.length}
                </div>
                <div style={{ fontSize:15, fontWeight:800, color:'#0F172A', marginBottom:16, lineHeight:1.5 }}>
                  {ch.quiz[quiz.current].question}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {ch.quiz[quiz.current].options.map((opt,oi) => {
                    const isSelected = quiz.selected === oi;
                    const isCorrect  = ch.quiz[quiz.current].answer === oi;
                    let bg = '#F8FAFC', border = '#E2E8F0', color = '#475569';
                    if (quiz.answered) {
                      if (isCorrect) { bg='#ECFDF5'; border='#10B981'; color='#065F46'; }
                      else if (isSelected) { bg='#FEF2F2'; border='#EF4444'; color='#7F1D1D'; }
                    } else if (isSelected) {
                      bg=`${ch.color}10`; border=ch.color; color=ch.color;
                    }
                    return (
                      <button key={oi} onClick={() => handleQuizAnswer(oi)}
                        style={{ padding:'12px 16px', borderRadius:12, border:`2px solid ${border}`,
                          background:bg, color, fontSize:14, fontWeight:700, textAlign:'left',
                          cursor: quiz.answered?'default':'pointer', fontFamily:"'Nunito',sans-serif",
                          transition:'all .15s', display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ width:22, height:22, borderRadius:'50%', border:`2px solid ${border}`,
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, flexShrink:0 }}>
                          {quiz.answered && isCorrect ? '✓' : quiz.answered && isSelected && !isCorrect ? '✗' : String.fromCharCode(65+oi)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {quiz.answered && (
                  <div style={{ marginTop:12, padding:'12px 16px', borderRadius:10,
                    background: quiz.selected===ch.quiz[quiz.current].answer ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${quiz.selected===ch.quiz[quiz.current].answer ? '#A7F3D0' : '#FECACA'}` }}>
                    <div style={{ fontSize:13, fontWeight:700,
                      color: quiz.selected===ch.quiz[quiz.current].answer ? '#065F46' : '#7F1D1D' }}>
                      {quiz.selected===ch.quiz[quiz.current].answer ? '✅ 정답!' : '❌ 오답'}
                    </div>
                    <div style={{ fontSize:12, color:'#475569', fontWeight:600, marginTop:4 }}>
                      {ch.quiz[quiz.current].explanation}
                    </div>
                    <button onClick={nextQuiz}
                      style={{ marginTop:10, padding:'8px 20px', borderRadius:10, border:'none',
                        background:ch.color, color:'#fff', fontWeight:800, fontSize:13,
                        cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
                      {quiz.current+1 >= ch.quiz.length ? '결과 보기 →' : '다음 문제 →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Practice */}
          {!showAI && !quiz.done && (
            <div style={{ padding:'0 0 12px' }}>
              <button onClick={startAI}
                style={{ width:'100%', padding:'14px', borderRadius:14, border:'none',
                  background:`linear-gradient(135deg,${ch.color},${ch.color}cc)`,
                  color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer',
                  fontFamily:"'Nunito',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <img src={tutor.thumbnail} alt="" style={{ width:24, height:24, borderRadius:'50%', objectFit:'cover', objectPosition:'center 20%' }}/>
                🤖 {tutor.name}와 AI 연습하기
              </button>
            </div>
          )}

          {showAI && (
            <div style={S.section}>
              <div style={{ ...S.sectionTitle, color:ch.color }}>
                <img src={tutor.thumbnail} alt="" style={{ width:20, height:20, borderRadius:'50%', objectFit:'cover', objectPosition:'center 20%', marginRight:6, verticalAlign:'middle' }}/>
                {tutor.name}와 연습하기
              </div>
              <div ref={chatRef} style={S.aiChat}>
                {aiChat.map((msg,i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column',
                    alignItems: msg.role==='user'?'flex-end':'flex-start' }}>
                    <div style={{
                      maxWidth:'85%', padding:'10px 14px', fontSize:14, fontWeight:600, lineHeight:1.7,
                      borderRadius: msg.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',
                      background: msg.role==='user' ? ch.color : '#fff',
                      color: msg.role==='user' ? '#fff' : '#0F172A',
                      border: msg.role==='user' ? 'none' : '1.5px solid #E2E8F0',
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display:'flex', gap:4, padding:'10px 14px', background:'#fff',
                    border:'1.5px solid #E2E8F0', borderRadius:'16px 16px 16px 4px', width:'fit-content' }}>
                    {[0,1,2].map(d=><div key={d} style={{ width:7, height:7, borderRadius:'50%',
                      background:ch.color, animation:`thinking .9s ${d*.2}s infinite` }}/>)}
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:10 }}>
                <input value={aiInput} onChange={e=>setAiInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') sendAI(); }}
                  disabled={aiLoading}
                  placeholder="문법을 활용한 문장을 써보세요..."
                  style={{ flex:1, padding:'11px 14px', borderRadius:12, border:`1.5px solid ${ch.color}40`,
                    background:'#F8FAFC', color:'#0F172A', fontSize:14, fontFamily:"'Nunito',sans-serif",
                    outline:'none', fontWeight:600 }}/>
                <button onClick={sendAI} disabled={!aiInput.trim()||aiLoading}
                  style={{ width:44, height:44, borderRadius:'50%', border:'none', flexShrink:0,
                    background: aiInput.trim()&&!aiLoading ? ch.color : '#E5E7EB',
                    color: aiInput.trim()&&!aiLoading ? '#fff' : '#94A3B8',
                    fontSize:16, cursor: aiInput.trim()?'pointer':'default', fontWeight:900 }}>➤</button>
              </div>
            </div>
          )}

          <div style={{ height:40 }}/>
        </div>
      </div>
    );
  }

  // ── HUB VIEW ────────────────────────────────────────────────────────────────

  const levelChapters = getChaptersByLevel(selLevel);
  const filtered = selCategory ? levelChapters.filter(c => c.category === selCategory) : levelChapters;
  const lvInfo = getLevelInfo(selLevel);
  const totalDone = levelChapters.filter(c => completedIds.has(c.id)).length;

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Nav */}
      <nav style={S.nav}>
        <button onClick={() => router.push('/lingua')} style={S.navBack}>← 홈</button>
        <div style={S.navCenter}>
          <span style={{ fontSize:20 }}>📖</span>
          <span style={S.navTitle}>Grammar Hub</span>
        </div>
        <div style={{ fontSize:11, fontWeight:800, color:'#64748B' }}>
          {GRAMMAR_CHAPTERS.filter(c=>completedIds.has(c.id)).length}/{GRAMMAR_CHAPTERS.length}
        </div>
      </nav>

      {/* Level Tabs */}
      <div style={S.levelTabs}>
        {LEVEL_ORDER.map(lvl => {
          const info = getLevelInfo(lvl);
          const isActive = selLevel === lvl;
          const done = getChaptersByLevel(lvl).filter(c=>completedIds.has(c.id)).length;
          const total = getChaptersByLevel(lvl).length;
          return (
            <button key={lvl} onClick={() => { setSelLevel(lvl); setSelCategory(null); }}
              style={{ ...S.levelTab,
                background: isActive ? info.color : '#F1F5F9',
                color: isActive ? '#fff' : '#64748B',
                boxShadow: isActive ? `0 4px 14px ${info.color}40` : 'none',
              }}>
              <div style={{ fontSize:14, fontWeight:900 }}>{info.label}</div>
              <div style={{ fontSize:9, fontWeight:700, opacity:.8 }}>{done}/{total}</div>
            </button>
          );
        })}
      </div>

      {/* Level header */}
      <div style={{ ...S.levelHeader, background:`linear-gradient(135deg,${lvInfo.bg},#fff)`, borderBottom:`2px solid ${lvInfo.color}20` }}>
        <div>
          <div style={{ fontSize:18, fontWeight:900, color:lvInfo.color }}>{lvInfo.label} — {lvInfo.desc}</div>
          <div style={{ fontSize:12, color:'#64748B', fontWeight:700, marginTop:2 }}>
            {lvInfo.xpRange} · {totalDone}/{levelChapters.length} 챕터 완료
          </div>
        </div>
        <div style={{ flex:1, maxWidth:200, marginLeft:'auto' }}>
          <div style={{ height:6, background:'#E2E8F0', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:99, background:lvInfo.color,
              width:`${totalDone/levelChapters.length*100}%`, transition:'width .5s ease' }}/>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div style={S.catRow}>
        <button onClick={() => setSelCategory(null)}
          style={{ ...S.catBtn, background: !selCategory?'#0F172A':'#F1F5F9',
            color: !selCategory?'#fff':'#64748B' }}>전체</button>
        {GRAMMAR_CATEGORIES.filter(cat => levelChapters.some(c=>c.category===cat.id)).map(cat => (
          <button key={cat.id} onClick={() => setSelCategory(selCategory===cat.id?null:cat.id)}
            style={{ ...S.catBtn,
              background: selCategory===cat.id ? cat.color : '#F1F5F9',
              color: selCategory===cat.id ? '#fff' : '#64748B' }}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Chapter cards */}
      <div style={S.chapGrid}>
        {filtered.map((ch, i) => {
          const isDone = completedIds.has(ch.id);
          return (
            <div key={ch.id} className="chap-card"
              onClick={() => openChapter(ch)}
              style={{ ...S.chapCard,
                background: isDone ? `${ch.color}08` : '#fff',
                border: isDone ? `2px solid ${ch.color}40` : '2px solid #F1F5F9',
                animationDelay:`${i*.05}s`,
              }}>
              {isDone && (
                <div style={{ position:'absolute', top:12, right:12, background:ch.color,
                  color:'#fff', borderRadius:99, fontSize:10, fontWeight:800, padding:'2px 8px' }}>
                  ✓ 완료
                </div>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:`${ch.color}15`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                  {ch.emoji}
                </div>
                <div>
                  <div style={{ ...S.catChip, background:`${ch.categoryColor}15`, color:ch.categoryColor }}>
                    {GRAMMAR_CATEGORIES.find(c=>c.id===ch.category)?.emoji} {GRAMMAR_CATEGORIES.find(c=>c.id===ch.category)?.label}
                  </div>
                </div>
              </div>
              <div style={{ fontSize:15, fontWeight:900, color:'#0F172A', marginBottom:4, lineHeight:1.3 }}>
                {ch.title}
              </div>
              <div style={{ fontSize:12, color:'#64748B', fontWeight:600, lineHeight:1.5, marginBottom:12 }}>
                {ch.subtitle}
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', gap:6 }}>
                  <span style={S.metaTag}>📊 구조표</span>
                  <span style={S.metaTag}>⚡ {ch.quiz.length}문제</span>
                  <span style={S.metaTag}>🤖 AI연습</span>
                </div>
                <span style={{ fontSize:12, fontWeight:800, color:ch.color }}>학습 →</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0', color:'#94A3B8' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontWeight:700 }}>이 카테고리에 챕터가 없어요</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes thinking { 0%,100%{opacity:.2;transform:scale(.75)} 50%{opacity:1;transform:scale(1)} }
  .chap-card { animation: fadeUp .35s ease both; transition: transform .18s, box-shadow .18s; }
  .chap-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
`;

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: { minHeight:'100vh', background:'#F8FAFC', fontFamily:"'Nunito','Noto Sans KR',sans-serif", color:'#0F172A' },
  nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', height:56,
    background:'#fff', borderBottom:'1px solid #F1F5F9', position:'sticky', top:0, zIndex:100,
    boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  navBack: { background:'#F1F5F9', border:'none', borderRadius:10, padding:'7px 14px',
    color:'#64748B', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" },
  navCenter: { display:'flex', alignItems:'center', gap:6 },
  navTitle: { fontSize:17, fontWeight:900, color:'#0F172A' },
  levelBadge: { borderRadius:99, padding:'4px 12px', fontSize:11, fontWeight:800 },

  // Level tabs
  levelTabs: { display:'flex', gap:8, padding:'14px 16px 10px', overflowX:'auto',
    background:'#fff', borderBottom:'1px solid #F1F5F9' },
  levelTab: { flexShrink:0, padding:'8px 16px', borderRadius:12, border:'none',
    cursor:'pointer', fontFamily:"'Nunito',sans-serif", transition:'all .18s', textAlign:'center' },
  levelHeader: { padding:'14px 16px', display:'flex', alignItems:'center', gap:12 },

  // Category filter
  catRow: { display:'flex', gap:6, padding:'10px 16px', overflowX:'auto',
    background:'#fff', borderBottom:'1px solid #F1F5F9' },
  catBtn: { flexShrink:0, padding:'6px 14px', borderRadius:99, border:'none',
    fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif",
    transition:'all .15s', whiteSpace:'nowrap' },

  // Chapter grid
  chapGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',
    gap:16, padding:'16px', maxWidth:1100, margin:'0 auto' },
  chapCard: { borderRadius:18, padding:18, cursor:'pointer', position:'relative',
    boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'all .18s' },
  catChip: { display:'inline-block', fontSize:10, fontWeight:800, padding:'2px 8px',
    borderRadius:99, letterSpacing:.3 },
  metaTag: { fontSize:10, fontWeight:700, background:'#F1F5F9', color:'#64748B',
    padding:'2px 8px', borderRadius:99 },

  // Chapter detail
  chapterBody: { maxWidth:720, margin:'0 auto', padding:'20px 16px 60px' },
  keyPoint: { background:'#FFFBEB', padding:'14px 16px', borderRadius:12,
    marginBottom:24, display:'flex', alignItems:'flex-start' },
  section: { marginBottom:28 },
  sectionTitle: { fontSize:14, fontWeight:900, marginBottom:12, letterSpacing:.3,
    display:'flex', alignItems:'center', gap:6 },

  // Structure table
  tableWrap: { overflowX:'auto', borderRadius:12, border:'1px solid #E2E8F0',
    boxShadow:'0 2px 8px rgba(0,0,0,0.05)' },
  table: { width:'100%', borderCollapse:'collapse', minWidth:400 },
  th: { padding:'10px 14px', fontSize:12, fontWeight:800, textAlign:'left',
    letterSpacing:.5, whiteSpace:'nowrap' },
  td: { padding:'11px 14px', fontSize:13, lineHeight:1.5,
    borderTop:'1px solid #F1F5F9' },

  // Use cases
  useCase: { background:'#fff', border:'1px solid #F1F5F9', borderRadius:12,
    padding:'12px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  useCaseLabel: { display:'inline-block', fontSize:11, fontWeight:800,
    padding:'3px 10px', borderRadius:99, letterSpacing:.3 },

  // Examples
  exampleCard: { background:'#fff', border:'1.5px solid #E2E8F0', borderRadius:16,
    padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' },
  exBtn: { background:'#F1F5F9', border:'none', borderRadius:10, padding:'7px 14px',
    fontSize:12, fontWeight:700, cursor:'pointer', color:'#64748B',
    fontFamily:"'Nunito',sans-serif" },

  // Mistakes
  mistakeCard: { background:'#FEF2F2', border:'1px solid #FECACA',
    borderRadius:12, padding:'12px 14px' },
  wrongTag: { background:'#FEE2E2', color:'#7F1D1D', fontSize:13, fontWeight:700,
    padding:'4px 10px', borderRadius:8, fontFamily:"Georgia,serif" },
  rightTag: { background:'#DCFCE7', color:'#14532D', fontSize:13, fontWeight:700,
    padding:'4px 10px', borderRadius:8, fontFamily:"Georgia,serif" },

  // Tip
  tipBox: { background:'#FFFBEB', border:'1.5px solid #FDE68A',
    borderRadius:14, padding:'14px 16px', marginBottom:28, display:'flex', alignItems:'flex-start' },

  // Quiz
  quizCard: { background:'#fff', border:'1.5px solid #E2E8F0',
    borderRadius:16, padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' },
  quizRetryBtn: { padding:'10px 20px', borderRadius:12, border:'1.5px solid #E2E8F0',
    background:'#fff', color:'#475569', fontSize:13, fontWeight:700,
    cursor:'pointer', fontFamily:"'Nunito',sans-serif" },

  // AI Chat
  aiChat: { background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:14,
    padding:'14px', height:260, overflowY:'auto',
    display:'flex', flexDirection:'column', gap:10 },
};
