'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CURRICULUM } from '@/data/curriculum';

// ── Types ─────────────────────────────────────────────────────────────────────

type GameId = 'snap' | 'match' | 'vanish' | 'blitz';
type Difficulty = 'a1'|'a2'|'b1'|'b2'|'c1'|'c2';

interface WordCard {
  word: string;
  meaning: string;
  example: string;
  level: string;
}

// ── Pull vocab from curriculum ────────────────────────────────────────────────

function getVocabByLevel(level: Difficulty, count = 20): WordCard[] {
  const lvl = CURRICULUM.find(l => l.id === level);
  if (!lvl) return [];
  const all = lvl.steps.flatMap(s =>
    s.lessons.flatMap(l =>
      l.vocab.map(v => ({ word: v.word, meaning: v.meaning, example: v.example, level }))
    )
  );
  return shuffle(all).slice(0, count);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Game definitions ──────────────────────────────────────────────────────────

const GAMES = [
  { id: 'snap'   as GameId, emoji:'🃏', title:'Meaning Snap',    sub:'Know it ✅ or not ❌', color:'#6366F1', bg:'#EEF2FF' },
  { id: 'match'  as GameId, emoji:'🧩', title:'Word Match',      sub:'Match words to meanings', color:'#059669', bg:'#ECFDF5' },
  { id: 'vanish' as GameId, emoji:'💨', title:'Vanishing Words', sub:'Click before time runs out!', color:'#DC2626', bg:'#FEF2F2' },
  { id: 'blitz'  as GameId, emoji:'⚡', title:'True/False Blitz',sub:'As many as possible in 10s', color:'#D97706', bg:'#FFFBEB' },
];

const LEVELS: { id: Difficulty; label: string; color: string }[] = [
  { id:'a1', label:'A1', color:'#059669' },
  { id:'a2', label:'A2', color:'#0891B2' },
  { id:'b1', label:'B1', color:'#6366F1' },
  { id:'b2', label:'B2', color:'#7C3AED' },
  { id:'c1', label:'C1', color:'#1D4ED8' },
  { id:'c2', label:'C2', color:'#0F172A' },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function WordGamesPage() {
  const router = useRouter();
  const [activeGame, setActiveGame] = useState<GameId>('snap');
  const [difficulty, setDifficulty] = useState<Difficulty>('a1');
  const [playing,    setPlaying]    = useState(false);
  const [xpGained,   setXpGained]   = useState(0);

  const addXP = (pts: number) => {
    setXpGained(prev => prev + pts);
    const stored = parseInt(localStorage.getItem('mt_xp') || '0', 10);
    localStorage.setItem('mt_xp', String(stored + pts));
  };

  const game = GAMES.find(g => g.id === activeGame)!;
  const lvl  = LEVELS.find(l => l.id === difficulty)!;

  // ── HUB ──────────────────────────────────────────────────────────────────

  if (!playing) return (
    <div style={S.page}>
      <style>{CSS}</style>

      <nav style={S.nav}>
        <button onClick={() => router.push('/lingua')} style={S.navBack}>← Home</button>
        <div style={S.navCenter}><span style={{ fontSize:20 }}>🎮</span><span style={S.navTitle}>Word Games</span></div>
        <div style={{ fontSize:13, fontWeight:800, color:'#6366F1' }}>+{xpGained} XP</div>
      </nav>

      {/* Game Tabs */}
      <div style={S.gameTabs}>
        {GAMES.map(g => (
          <button key={g.id} onClick={() => setActiveGame(g.id)}
            style={{ ...S.gameTab,
              background: activeGame===g.id ? g.color : '#F1F5F9',
              color: activeGame===g.id ? '#fff' : '#64748B',
              boxShadow: activeGame===g.id ? `0 4px 14px ${g.color}40` : 'none',
            }}>
            <div style={{ fontSize:22, marginBottom:3 }}>{g.emoji}</div>
            <div style={{ fontSize:11, fontWeight:900 }}>{g.title}</div>
            <div style={{ fontSize:9, fontWeight:600, opacity:.8 }}>{g.sub}</div>
          </button>
        ))}
      </div>

      {/* Game Card */}
      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ ...S.gameCard, borderTop:`4px solid ${game.color}` }}>
          <div style={{ fontSize:44, textAlign:'center', marginBottom:10 }}>{game.emoji}</div>
          <div style={{ fontSize:22, fontWeight:900, textAlign:'center', color:'#0F172A', marginBottom:6 }}>{game.title}</div>
          <div style={{ fontSize:14, color:'#64748B', fontWeight:600, textAlign:'center', marginBottom:20 }}>{game.sub}</div>

          {/* How to play */}
          <div style={S.howTo}>
            <div style={{ fontSize:11, fontWeight:800, color:'#94A3B8', letterSpacing:1, marginBottom:8 }}>HOW TO PLAY</div>
            {activeGame==='snap' && <HowTo items={['A word and its meaning are shown','✅ if you know it, ❌ if you don\'t','Unknown words are saved for review']}/>}
            {activeGame==='match' && <HowTo items={['Word and meaning cards are shuffled','Click to match each pair','Find all pairs to finish!']}/>}
            {activeGame==='vanish' && <HowTo items={['A timer counts down','Click the correct meaning from 4 choices','Faster answers = bonus XP!']}/>}
            {activeGame==='blitz' && <HowTo items={['A word and meaning are shown','Correct = ✅ True, Wrong = ❌ False','Answer as many as possible in 10 seconds!']}/>}
          </div>

          {/* Level selector */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#94A3B8', letterSpacing:1, marginBottom:10 }}>Select Level</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {LEVELS.map(l => (
                <button key={l.id} onClick={() => setDifficulty(l.id)}
                  style={{ padding:'7px 16px', borderRadius:99, border:`2px solid ${difficulty===l.id?l.color:'#E2E8F0'}`,
                    background: difficulty===l.id ? l.color : '#fff', color: difficulty===l.id ? '#fff' : '#64748B',
                    fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif",
                    transition:'all .15s' }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setPlaying(true)}
            style={{ ...S.startBtn, background:`linear-gradient(135deg,${game.color},${game.color}cc)`,
              boxShadow:`0 8px 24px ${game.color}40` }}>
            {game.emoji} Start — {lvl.label}
          </button>
        </div>

        {/* Recent scores hint */}
        <div style={{ textAlign:'center', marginTop:16, fontSize:12, color:'#94A3B8', fontWeight:600 }}>
          💡 XP earned here counts toward your learning progress
        </div>
      </div>
    </div>
  );

  // ── GAME SCREEN ───────────────────────────────────────────────────────────

  const commonProps = { difficulty, onBack:()=>setPlaying(false), addXP, gameColor:game.color };

  return (
    <div style={S.page}>
      <style>{CSS}</style>
      {activeGame==='snap'   && <SnapGame   {...commonProps}/>}
      {activeGame==='match'  && <MatchGame  {...commonProps}/>}
      {activeGame==='vanish' && <VanishGame {...commonProps}/>}
      {activeGame==='blitz'  && <BlitzGame  {...commonProps}/>}
    </div>
  );
}

// ── HOW TO component ──────────────────────────────────────────────────────────

function HowTo({ items }: { items: string[] }) {
  return (
    <ul style={{ margin:'0 0 16px', padding:0, listStyle:'none' }}>
      {items.map((item,i) => (
        <li key={i} style={{ display:'flex', gap:8, alignItems:'flex-start',
          fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }}>
          <span style={{ color:'#6366F1', fontWeight:900, flexShrink:0 }}>{i+1}.</span>{item}
        </li>
      ))}
    </ul>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GAME 1: Meaning Snap — Know it ✅ or not ❌
// ════════════════════════════════════════════════════════════════════════════

function SnapGame({ difficulty, onBack, addXP, gameColor }:
  { difficulty:Difficulty; onBack:()=>void; addXP:(n:number)=>void; gameColor:string }) {

  const [cards]       = useState(() => getVocabByLevel(difficulty, 16));
  const [idx,setIdx]  = useState(0);
  const [known,setKnown] = useState(0);
  const [unknown,setUnknown] = useState(0);
  const [done,setDone]= useState(false);
  const [anim,setAnim]= useState<'right'|'left'|null>(null);

  const answer = (knows: boolean) => {
    setAnim(knows ? 'right' : 'left');
    if (knows) { setKnown(k=>k+1); addXP(5); }
    else setUnknown(u=>u+1);
    setTimeout(() => {
      setAnim(null);
      if (idx+1 >= cards.length) setDone(true);
      else setIdx(i=>i+1);
    }, 300);
  };

  if (done) return <GameResult score={known} total={cards.length} xp={known*5} color={gameColor} onBack={onBack} onRetry={()=>{ setIdx(0);setKnown(0);setUnknown(0);setDone(false); }}/>;

  const card = cards[idx];
  const progress = ((idx)/cards.length)*100;

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#F8FAFC' }}>
      <GameNav title="Meaning Snap" onBack={onBack} color={gameColor}
        right={`${idx+1}/${cards.length}`}/>
      <div style={{ height:4, background:'#E2E8F0', flexShrink:0 }}>
        <div style={{ height:'100%', background:gameColor, width:`${progress}%`, transition:'width .3s ease' }}/>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'24px 20px', gap:24 }}>
        <div style={{ fontSize:12, fontWeight:800, color:'#94A3B8', letterSpacing:1 }}>
          ✅ {known} Known  ·  ❌ {unknown} Still learning
        </div>
        <div className={`snap-card ${anim==='right'?'snap-right':anim==='left'?'snap-left':''}`}
          style={{ ...S.snapCard, borderTop:`4px solid ${gameColor}` }}>
          <div style={{ fontSize:28, fontWeight:900, color:'#0F172A', textAlign:'center', marginBottom:12,
            fontFamily:"Georgia,serif", lineHeight:1.3 }}>
            {card.word}
          </div>
          <div style={{ fontSize:15, color:'#475569', fontWeight:700, textAlign:'center',
            marginBottom:16, lineHeight:1.6 }}>
            {card.meaning}
          </div>
          <div style={{ fontSize:12, color:'#94A3B8', fontWeight:600, textAlign:'center',
            fontStyle:'italic', lineHeight:1.5, padding:'0 8px' }}>
            "{card.example}"
          </div>
        </div>
        <div style={{ display:'flex', gap:16, width:'100%', maxWidth:340 }}>
          <button onClick={() => answer(false)}
            style={{ ...S.snapBtn, background:'#FEF2F2', border:'2px solid #FECACA', color:'#DC2626' }}>
            ❌<br/><span style={{ fontSize:11 }}>Don't know</span>
          </button>
          <button onClick={() => answer(true)}
            style={{ ...S.snapBtn, background:'#ECFDF5', border:'2px solid #A7F3D0', color:'#059669' }}>
            ✅<br/><span style={{ fontSize:11 }}>Got it!</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GAME 2: Word Match — Find matching pairs
// ════════════════════════════════════════════════════════════════════════════

function MatchGame({ difficulty, onBack, addXP, gameColor }:
  { difficulty:Difficulty; onBack:()=>void; addXP:(n:number)=>void; gameColor:string }) {

  const [pairs] = useState(() => getVocabByLevel(difficulty, 6));
  const [cards, setCards] = useState<{ id:string; text:string; type:'word'|'meaning'; matched:boolean; pairIdx:number }[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const wordCards = pairs.map((p,i) => ({ id:`w${i}`, text:p.word, type:'word' as const, matched:false, pairIdx:i }));
    const meaningCards = pairs.map((p,i) => ({ id:`m${i}`, text:p.meaning, type:'meaning' as const, matched:false, pairIdx:i }));
    setCards(shuffle([...wordCards, ...meaningCards]));
  }, []);

  const handleSelect = (id: string) => {
    const card = cards.find(c=>c.id===id);
    if (!card || card.matched || wrong.includes(id)) return;

    if (!selected) { setSelected(id); return; }
    if (selected === id) { setSelected(null); return; }

    const selCard = cards.find(c=>c.id===selected)!;
    setAttempts(a=>a+1);

    if (selCard.pairIdx === card.pairIdx && selCard.type !== card.type) {
      // Match!
      setCards(prev => prev.map(c => c.pairIdx===card.pairIdx ? {...c,matched:true} : c));
      setScore(s=>s+1);
      addXP(10);
      setSelected(null);
      if (score+1 >= pairs.length) setTimeout(()=>setDone(true), 400);
    } else {
      // Wrong
      setWrong([selected, id]);
      setTimeout(() => { setWrong([]); setSelected(null); }, 700);
    }
  };

  if (done) return <GameResult score={score} total={pairs.length} xp={score*10} color={gameColor}
    subtitle={`${attempts} attempts`} onBack={onBack} onRetry={()=>{ setScore(0);setAttempts(0);setDone(false);setSelected(null);
      const wc = pairs.map((p,i)=>({id:`w${i}`,text:p.word,type:'word' as const,matched:false,pairIdx:i}));
      const mc = pairs.map((p,i)=>({id:`m${i}`,text:p.meaning,type:'meaning' as const,matched:false,pairIdx:i}));
      setCards(shuffle([...wc,...mc])); }}/>;

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#F8FAFC' }}>
      <GameNav title="Word Match" onBack={onBack} color={gameColor} right={`${score}/${pairs.length} matched`}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'20px 16px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#94A3B8', marginBottom:16 }}>
          Click to match each word with its meaning
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:480 }}>
          {cards.map(card => {
            const isSelected = selected===card.id;
            const isWrong    = wrong.includes(card.id);
            let bg = '#fff', border = '#E2E8F0', color = '#0F172A';
            if (card.matched)  { bg='#ECFDF5'; border='#10B981'; color='#065F46'; }
            else if (isWrong)  { bg='#FEF2F2'; border='#EF4444'; color='#7F1D1D'; }
            else if (isSelected){ bg=`${gameColor}15`; border=gameColor; color=gameColor; }
            return (
              <button key={card.id} onClick={() => handleSelect(card.id)}
                disabled={card.matched}
                style={{ padding:'14px 10px', borderRadius:14, border:`2px solid ${border}`,
                  background:bg, color, fontSize:13, fontWeight:700, cursor:card.matched?'default':'pointer',
                  fontFamily:"'Nunito',sans-serif", textAlign:'center', lineHeight:1.4,
                  transition:'all .15s', minHeight:64,
                  boxShadow: isSelected?`0 4px 14px ${gameColor}30`:'none',
                  animation: card.matched?'matchPop .3s ease':'none' }}>
                {card.matched ? '✓' : card.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GAME 3: Vanishing Words — Timer + 4 choices
// ════════════════════════════════════════════════════════════════════════════

function VanishGame({ difficulty, onBack, addXP, gameColor }:
  { difficulty:Difficulty; onBack:()=>void; addXP:(n:number)=>void; gameColor:string }) {

  const [vocab]      = useState(() => getVocabByLevel(difficulty, 12));
  const [idx,setIdx] = useState(0);
  const [timer,setTimer]   = useState(10);
  const [selected, setSelected] = useState<number|null>(null);
  const [answered, setAnswered] = useState(false);
  const [score,setScore]   = useState(0);
  const [done,setDone]     = useState(false);
  const [options,setOptions] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  const buildOptions = useCallback((currentIdx: number) => {
    if (currentIdx >= vocab.length) return;
    const correct = vocab[currentIdx].meaning;
    const others  = shuffle(vocab.filter((_,i)=>i!==currentIdx)).slice(0,3).map(v=>v.meaning);
    setOptions(shuffle([correct, ...others]));
  }, [vocab]);

  useEffect(() => { buildOptions(0); }, [buildOptions]);

  useEffect(() => {
    if (answered || done) return;
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(-1); // time out = wrong
          return 0;
        }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [idx, answered]); // eslint-disable-line

  const handleAnswer = (optIdx: number) => {
    if (answered) return;
    clearInterval(timerRef.current!);
    setSelected(optIdx);
    setAnswered(true);
    const correct = optIdx >= 0 && options[optIdx] === vocab[idx].meaning;
    if (correct) {
      setScore(s=>s+1);
      const bonus = timer >= 7 ? 15 : timer >= 4 ? 10 : 5;
      addXP(bonus);
    }
    setTimeout(() => {
      if (idx+1 >= vocab.length) { setDone(true); return; }
      setIdx(i=>i+1);
      setTimer(10);
      setSelected(null);
      setAnswered(false);
      buildOptions(idx+1);
    }, 1000);
  };

  if (done) return <GameResult score={score} total={vocab.length} xp={score*10} color={gameColor}
    onBack={onBack} onRetry={()=>{ setIdx(0);setScore(0);setDone(false);setTimer(10);setSelected(null);setAnswered(false);buildOptions(0); }}/>;

  const timerPct = (timer/10)*100;
  const timerColor = timer>6?'#10B981':timer>3?'#F59E0B':'#EF4444';
  const word = vocab[idx];

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#F8FAFC' }}>
      <GameNav title="Vanishing Words" onBack={onBack} color={gameColor} right={`${score}/${vocab.length}`}/>

      {/* Timer bar */}
      <div style={{ height:6, background:'#E2E8F0', flexShrink:0 }}>
        <div style={{ height:'100%', background:timerColor, width:`${timerPct}%`,
          transition:'width 1s linear', borderRadius:99 }}/>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'16px 20px', gap:20 }}>

        {/* Timer display */}
        <div style={{ fontSize:32, fontWeight:900, color:timerColor, fontVariantNumeric:'tabular-nums' }}>
          {timer}
        </div>

        {/* Word card */}
        <div style={{ ...S.vanishCard, borderTop:`4px solid ${gameColor}` }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#94A3B8', letterSpacing:1, marginBottom:8 }}>
            {idx+1} / {vocab.length}
          </div>
          <div style={{ fontSize:26, fontWeight:900, color:'#0F172A', textAlign:'center',
            fontFamily:"Georgia,serif", lineHeight:1.3 }}>
            {word.word}
          </div>
        </div>

        {/* Options */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:440 }}>
          {options.map((opt,oi) => {
            const isCorrect = opt === word.meaning;
            const isSelected = selected===oi;
            let bg='#fff', border='#E2E8F0', color='#475569';
            if (answered) {
              if (isCorrect)          { bg='#ECFDF5'; border='#10B981'; color='#065F46'; }
              else if (isSelected)    { bg='#FEF2F2'; border='#EF4444'; color='#7F1D1D'; }
            } else if (isSelected)    { bg=`${gameColor}15`; border=gameColor; color=gameColor; }
            return (
              <button key={oi} onClick={() => handleAnswer(oi)} disabled={answered}
                style={{ padding:'14px 12px', borderRadius:14, border:`2px solid ${border}`,
                  background:bg, color, fontSize:13, fontWeight:700, cursor:answered?'default':'pointer',
                  fontFamily:"'Nunito',sans-serif", textAlign:'center', lineHeight:1.4, transition:'all .15s',
                  minHeight:56 }}>
                {answered && isCorrect ? '✅ ' : answered && isSelected && !isCorrect ? '❌ ' : ''}{opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GAME 4: True/False Blitz — 10s time attack
// ════════════════════════════════════════════════════════════════════════════

function BlitzGame({ difficulty, onBack, addXP, gameColor }:
  { difficulty:Difficulty; onBack:()=>void; addXP:(n:number)=>void; gameColor:string }) {

  const [vocab]      = useState(() => getVocabByLevel(difficulty, 20));
  const [idx,setIdx] = useState(0);
  const [timer,setTimer]   = useState(10);
  const [score,setScore]   = useState(0);
  const [wrong,setWrong]   = useState(0);
  const [combo,setCombo]   = useState(0);
  const [maxCombo,setMaxCombo] = useState(0);
  const [done,setDone]     = useState(false);
  const [flash,setFlash]   = useState<'correct'|'wrong'|null>(null);
  const [showMeaning, setShowMeaning] = useState(true); // true=correct, false=fake
  const [fakeMeaning, setFakeMeaning] = useState('');
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  const nextCard = useCallback((currentIdx: number) => {
    if (currentIdx >= vocab.length) { setDone(true); return; }
    const isReal = Math.random() > 0.4; // 60% real, 40% fake
    setShowMeaning(isReal);
    if (!isReal) {
      const fake = vocab[Math.floor(Math.random()*vocab.length)];
      setFakeMeaning(fake.meaning);
    }
    setTimer(10);
  }, [vocab]);

  useEffect(() => { nextCard(0); }, [nextCard]);

  useEffect(() => {
    if (done) return;
    clearInterval(timerRef.current!);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // time out = wrong
          setWrong(w=>w+1); setCombo(0);
          setFlash('wrong');
          setTimeout(() => { setFlash(null); setIdx(i=>{ nextCard(i+1); return i+1; }); }, 400);
          return 0;
        }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [idx, done]); // eslint-disable-line

  const answer = (saysTrue: boolean) => {
    clearInterval(timerRef.current!);
    const correct = saysTrue === showMeaning;
    if (correct) {
      const newCombo = combo+1;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      const pts = newCombo>=3 ? 15 : newCombo>=2 ? 10 : 5;
      setScore(s=>s+1); addXP(pts);
      setFlash('correct');
    } else {
      setCombo(0); setWrong(w=>w+1);
      setFlash('wrong');
    }
    setTimeout(() => {
      setFlash(null);
      setIdx(i=>{ nextCard(i+1); return i+1; });
    }, 400);
  };

  if (done) return <GameResult score={score} total={idx} xp={score*7} color={gameColor}
    subtitle={`Best combo: ${maxCombo} 🔥`}
    onBack={onBack} onRetry={()=>{ setIdx(0);setScore(0);setWrong(0);setCombo(0);setMaxCombo(0);setDone(false);nextCard(0); }}/>;

  const word = vocab[Math.min(idx, vocab.length-1)];
  const displayMeaning = showMeaning ? word?.meaning : fakeMeaning;
  const timerColor = timer>6?'#10B981':timer>3?'#F59E0B':'#EF4444';

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#F8FAFC',
      transition:'background .2s',
      ...(flash==='correct'?{ background:'#ECFDF5' }:flash==='wrong'?{ background:'#FEF2F2' }:{}) }}>
      <GameNav title="True/False Blitz" onBack={onBack} color={gameColor}
        right={<span>✅{score} ❌{wrong} {combo>=2?`🔥×${combo}`:''}</span>}/>

      <div style={{ height:5, background:'#E2E8F0', flexShrink:0 }}>
        <div style={{ height:'100%', background:timerColor, width:`${(timer/10)*100}%`,
          transition:'width 1s linear' }}/>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'24px 20px', gap:24 }}>

        {combo >= 2 && (
          <div style={{ fontSize:16, fontWeight:900, color:'#F59E0B', animation:'comboPop .3s ease' }}>
            🔥 {combo} COMBO!
          </div>
        )}

        <div style={{ width:'100%', maxWidth:400 }}>
          <div style={{ ...S.blitzCard, borderTop:`4px solid ${gameColor}` }}>
            <div style={{ fontSize:24, fontWeight:900, color:'#0F172A', textAlign:'center',
              fontFamily:"Georgia,serif", marginBottom:12 }}>
              {word?.word}
            </div>
            <div style={{ height:1, background:'#F1F5F9', margin:'0 0 12px' }}/>
            <div style={{ fontSize:16, color:'#475569', fontWeight:700, textAlign:'center', lineHeight:1.5 }}>
              {displayMeaning}
            </div>
          </div>
        </div>

        <div style={{ fontSize:32, fontWeight:900, color:timerColor }}>{timer}</div>

        <div style={{ display:'flex', gap:16, width:'100%', maxWidth:380 }}>
          <button onClick={() => answer(false)}
            style={{ flex:1, padding:'18px 10px', borderRadius:16,
              background:'#FEF2F2', border:'2px solid #FECACA',
              color:'#DC2626', fontSize:16, fontWeight:900, cursor:'pointer',
              fontFamily:"'Nunito',sans-serif", transition:'all .1s' }}>
            ❌ False
          </button>
          <button onClick={() => answer(true)}
            style={{ flex:1, padding:'18px 10px', borderRadius:16,
              background:'#ECFDF5', border:'2px solid #A7F3D0',
              color:'#059669', fontSize:16, fontWeight:900, cursor:'pointer',
              fontFamily:"'Nunito',sans-serif", transition:'all .1s' }}>
            ✅ True
          </button>
        </div>

        <div style={{ fontSize:12, color:'#94A3B8', fontWeight:600, textAlign:'center' }}>
          3 in a row → Bonus XP 🎯
        </div>
      </div>
    </div>
  );
}

// ── Game Result Screen ────────────────────────────────────────────────────────

function GameResult({ score, total, xp, color, subtitle, onBack, onRetry }:
  { score:number; total:number; xp:number; color:string; subtitle?:string;
    onBack:()=>void; onRetry:()=>void }) {

  const pct = Math.round((score/total)*100);
  const emoji = pct===100?'🏆':pct>=80?'🎯':pct>=60?'💪':'📚';

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', background:'#F8FAFC', padding:'24px 20px' }}>
      <div style={{ textAlign:'center', maxWidth:360, width:'100%' }}>
        <div style={{ fontSize:64, marginBottom:12, animation:'resultPop .5s ease' }}>{emoji}</div>
        <div style={{ fontSize:28, fontWeight:900, color:'#0F172A', marginBottom:4 }}>
          {pct===100?'Perfect!':pct>=80?'Excellent!':pct>=60?'Well done!':'Keep practising!'}
        </div>
        <div style={{ fontSize:44, fontWeight:900, color, marginBottom:4 }}>
          {score}<span style={{ fontSize:20, color:'#94A3B8' }}>/{total}</span>
        </div>
        <div style={{ fontSize:14, color:'#64748B', fontWeight:700, marginBottom:4 }}>
          {Math.round((score/total)*100)}% accuracy
        </div>
        {subtitle && <div style={{ fontSize:13, color:'#94A3B8', fontWeight:700, marginBottom:4 }}>{subtitle}</div>}
        <div style={{ display:'inline-block', background:`${color}15`, border:`1.5px solid ${color}40`,
          borderRadius:99, padding:'6px 20px', fontSize:14, fontWeight:900, color, marginBottom:28 }}>
          +{xp} XP earned!
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onRetry}
            style={{ flex:1, padding:'14px', borderRadius:14, border:'1.5px solid #E2E8F0',
              background:'#fff', color:'#475569', fontSize:14, fontWeight:800,
              cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
            🔄 Play Again
          </button>
          <button onClick={onBack}
            style={{ flex:1, padding:'14px', borderRadius:14, border:'none',
              background:`linear-gradient(135deg,${color},${color}cc)`,
              color:'#fff', fontSize:14, fontWeight:800,
              cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
            More Games →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Game Nav ──────────────────────────────────────────────────────────────────

function GameNav({ title, onBack, color, right }:
  { title:string; onBack:()=>void; color:string; right:React.ReactNode }) {
  return (
    <nav style={{ display:'flex', alignItems:'center', padding:'0 16px', height:52,
      background:'#fff', borderBottom:'1px solid #F1F5F9', flexShrink:0,
      boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
      <button onClick={onBack} style={{ background:'#F1F5F9', border:'none', borderRadius:10,
        padding:'7px 12px', color:'#64748B', fontSize:12, fontWeight:700,
        cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>← Exit</button>
      <div style={{ flex:1, textAlign:'center', fontSize:14, fontWeight:900, color:'#0F172A' }}>{title}</div>
      <div style={{ fontSize:12, fontWeight:800, color }}>{right}</div>
    </nav>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes snap-right { 0%{transform:translateX(0);opacity:1} 100%{transform:translateX(60px);opacity:0} }
  @keyframes snap-left  { 0%{transform:translateX(0);opacity:1} 100%{transform:translateX(-60px);opacity:0} }
  @keyframes matchPop   { 0%{transform:scale(1)} 50%{transform:scale(1.05)} 100%{transform:scale(1)} }
  @keyframes resultPop  { 0%{transform:scale(0.5);opacity:0} 80%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
  @keyframes comboPop   { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
  .snap-right { animation: snap-right .3s ease forwards !important; }
  .snap-left  { animation: snap-left  .3s ease forwards !important; }
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

  // Hub
  gameTabs: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0,
    background:'#fff', borderBottom:'1px solid #F1F5F9' },
  gameTab: { padding:'12px 6px', border:'none', cursor:'pointer', fontFamily:"'Nunito',sans-serif",
    transition:'all .18s', textAlign:'center' },
  gameCard: { background:'#fff', borderRadius:20, padding:'24px 20px',
    boxShadow:'0 4px 20px rgba(0,0,0,0.08)', border:'1px solid #F1F5F9' },
  howTo: { background:'#F8FAFC', borderRadius:12, padding:'14px 16px', marginBottom:16 },
  startBtn: { width:'100%', padding:'16px', borderRadius:14, border:'none',
    color:'#fff', fontSize:16, fontWeight:900, cursor:'pointer',
    fontFamily:"'Nunito',sans-serif", letterSpacing:.3 },

  // Snap game
  snapCard: { width:'100%', maxWidth:340, background:'#fff', borderRadius:20,
    padding:'28px 24px', boxShadow:'0 6px 24px rgba(0,0,0,0.1)', border:'1px solid #F1F5F9' },
  snapBtn: { flex:1, padding:'20px 10px', borderRadius:16, cursor:'pointer',
    fontSize:28, fontWeight:900, fontFamily:"'Nunito',sans-serif",
    display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all .1s' },

  // Vanish game
  vanishCard: { width:'100%', maxWidth:400, background:'#fff', borderRadius:20,
    padding:'24px 20px', boxShadow:'0 4px 16px rgba(0,0,0,0.08)', border:'1px solid #F1F5F9', textAlign:'center' },

  // Blitz game
  blitzCard: { background:'#fff', borderRadius:20, padding:'24px 20px',
    boxShadow:'0 4px 16px rgba(0,0,0,0.08)', border:'1px solid #F1F5F9' },
};
