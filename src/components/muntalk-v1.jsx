import { useState, useEffect, useRef, useCallback } from "react";

/* ── 52 LANGUAGES ── */
const LANGUAGES = [
  { code:"en",    name:"English",       flag:"🇺🇸", region:"Europe & Americas" },
  { code:"es",    name:"Spanish",       flag:"🇪🇸", region:"Europe & Americas" },
  { code:"fr",    name:"French",        flag:"🇫🇷", region:"Europe & Americas" },
  { code:"de",    name:"German",        flag:"🇩🇪", region:"Europe & Americas" },
  { code:"it",    name:"Italian",       flag:"🇮🇹", region:"Europe & Americas" },
  { code:"pt",    name:"Portuguese",    flag:"🇧🇷", region:"Europe & Americas" },
  { code:"nl",    name:"Dutch",         flag:"🇳🇱", region:"Europe & Americas" },
  { code:"pl",    name:"Polish",        flag:"🇵🇱", region:"Europe & Americas" },
  { code:"ru",    name:"Russian",       flag:"🇷🇺", region:"Europe & Americas" },
  { code:"sv",    name:"Swedish",       flag:"🇸🇪", region:"Europe & Americas" },
  { code:"no",    name:"Norwegian",     flag:"🇳🇴", region:"Europe & Americas" },
  { code:"da",    name:"Danish",        flag:"🇩🇰", region:"Europe & Americas" },
  { code:"fi",    name:"Finnish",       flag:"🇫🇮", region:"Europe & Americas" },
  { code:"cs",    name:"Czech",         flag:"🇨🇿", region:"Europe & Americas" },
  { code:"ro",    name:"Romanian",      flag:"🇷🇴", region:"Europe & Americas" },
  { code:"hu",    name:"Hungarian",     flag:"🇭🇺", region:"Europe & Americas" },
  { code:"uk",    name:"Ukrainian",     flag:"🇺🇦", region:"Europe & Americas" },
  { code:"el",    name:"Greek",         flag:"🇬🇷", region:"Europe & Americas" },
  { code:"ja",    name:"Japanese",      flag:"🇯🇵", region:"Asia" },
  { code:"zh",    name:"Chinese (S)",   flag:"🇨🇳", region:"Asia" },
  { code:"zh-TW", name:"Chinese (T)",   flag:"🇹🇼", region:"Asia" },
  { code:"ko",    name:"Korean",        flag:"🇰🇷", region:"Asia" },
  { code:"vi",    name:"Vietnamese",    flag:"🇻🇳", region:"Asia" },
  { code:"th",    name:"Thai",          flag:"🇹🇭", region:"Asia" },
  { code:"id",    name:"Indonesian",    flag:"🇮🇩", region:"Asia" },
  { code:"ms",    name:"Malay",         flag:"🇲🇾", region:"Asia" },
  { code:"tl",    name:"Filipino",      flag:"🇵🇭", region:"Asia" },
  { code:"hi",    name:"Hindi",         flag:"🇮🇳", region:"Asia" },
  { code:"bn",    name:"Bengali",       flag:"🇧🇩", region:"Asia" },
  { code:"ur",    name:"Urdu",          flag:"🇵🇰", region:"Asia" },
  { code:"ta",    name:"Tamil",         flag:"🇱🇰", region:"Asia" },
  { code:"te",    name:"Telugu",        flag:"🇮🇳", region:"Asia" },
  { code:"mr",    name:"Marathi",       flag:"🇮🇳", region:"Asia" },
  { code:"ar",    name:"Arabic",        flag:"🇸🇦", region:"Middle East & Africa" },
  { code:"fa",    name:"Persian",       flag:"🇮🇷", region:"Middle East & Africa" },
  { code:"tr",    name:"Turkish",       flag:"🇹🇷", region:"Middle East & Africa" },
  { code:"he",    name:"Hebrew",        flag:"🇮🇱", region:"Middle East & Africa" },
  { code:"sw",    name:"Swahili",       flag:"🇰🇪", region:"Middle East & Africa" },
  { code:"am",    name:"Amharic",       flag:"🇪🇹", region:"Middle East & Africa" },
  { code:"yo",    name:"Yoruba",        flag:"🇳🇬", region:"Middle East & Africa" },
  { code:"ig",    name:"Igbo",          flag:"🇳🇬", region:"Middle East & Africa" },
  { code:"ha",    name:"Hausa",         flag:"🇳🇬", region:"Middle East & Africa" },
  { code:"zu",    name:"Zulu",          flag:"🇿🇦", region:"Middle East & Africa" },
  { code:"ca",    name:"Catalan",       flag:"🏴", region:"Other" },
  { code:"eu",    name:"Basque",        flag:"🏴", region:"Other" },
  { code:"cy",    name:"Welsh",         flag:"🏴󠁧󠁢󠁷󠁬󠁳󠁿", region:"Other" },
  { code:"gl",    name:"Galician",      flag:"🇪🇸", region:"Other" },
  { code:"is",    name:"Icelandic",     flag:"🇮🇸", region:"Other" },
  { code:"lt",    name:"Lithuanian",    flag:"🇱🇹", region:"Other" },
  { code:"lv",    name:"Latvian",       flag:"🇱🇻", region:"Other" },
  { code:"et",    name:"Estonian",      flag:"🇪🇪", region:"Other" },
  { code:"sk",    name:"Slovak",        flag:"🇸🇰", region:"Other" },
  { code:"sl",    name:"Slovenian",     flag:"🇸🇮", region:"Other" },
];

const REGIONS = ["All", "Europe & Americas", "Asia", "Middle East & Africa", "Other"];

/* ── TUTOR TEMPLATES ── */
const TUTOR_TEMPLATES = [
  { name:"Emma",     origin:"New York 🇺🇸",   lang:"en",    personality:"Warm & endlessly patient",      specialty:"Everyday conversation & pronunciation", emoji:"👩‍🦰", color:"#E3F2FD", accent:"#1976D2" },
  { name:"Yuki",     origin:"Tokyo 🇯🇵",       lang:"ja",    personality:"Upbeat & playfully humorous",   specialty:"Anime, gaming & pop culture Japanese",  emoji:"👩‍🦱", color:"#FCE4EC", accent:"#C2185B" },
  { name:"Chen Wei", origin:"Shanghai 🇨🇳",    lang:"zh",    personality:"Structured & crystal-clear",    specialty:"HSK prep & business Chinese",            emoji:"🧑",    color:"#FFF8E1", accent:"#F57F17" },
  { name:"Sofia",    origin:"Madrid 🇪🇸",      lang:"es",    personality:"Passionate & expressive",       specialty:"Travel Spanish & Latin culture",         emoji:"👩‍🦳", color:"#E8F5E9", accent:"#388E3C" },
  { name:"Pierre",   origin:"Paris 🇫🇷",       lang:"fr",    personality:"Romantic & culturally rich",    specialty:"French culture, food & travel",          emoji:"🧑‍🦱", color:"#EDE7F6", accent:"#5E35B1" },
  { name:"Aisha",    origin:"Dubai 🇦🇪",       lang:"ar",    personality:"Kind & methodically clear",     specialty:"MSA & everyday Arabic",                 emoji:"👩",    color:"#FBE9E7", accent:"#BF360C" },
  { name:"Priya",    origin:"Mumbai 🇮🇳",      lang:"hi",    personality:"Bright & constantly encouraging",specialty:"Bollywood Hindi & travel phrases",      emoji:"👩‍🦲", color:"#F3E5F5", accent:"#7B1FA2" },
  { name:"Mei Lin",  origin:"Taipei 🇹🇼",      lang:"zh-TW", personality:"Gentle & meticulous",           specialty:"Traditional characters & Taiwanese culture",emoji:"👧", color:"#FFEBEE", accent:"#C62828" },
  { name:"Nguyen",   origin:"Hanoi 🇻🇳",       lang:"vi",    personality:"Cheerful & full of energy",     specialty:"Tones mastery & street food vocab",      emoji:"🧑‍🦱", color:"#E0F2F1", accent:"#00695C" },
  { name:"Alex",     origin:"São Paulo 🇧🇷",   lang:"pt",    personality:"Friendly & high-energy",        specialty:"Brazilian Portuguese & slang",           emoji:"🧑‍🦰", color:"#E8F5E9", accent:"#2E7D32" },
];

function getTutor(langCode) {
  return TUTOR_TEMPLATES.find(t => t.lang === langCode) || {
    name:"Sam", origin:"Global 🌍", lang:langCode,
    personality:"Encouraging & zero-pressure",
    specialty:"Beginner conversation & survival phrases",
    emoji:"🧑‍🏫", color:"#E3F2FD", accent:"#1565C0"
  };
}

const ROAD_MAP = [
  { id:1, icon:"👋", title:"Greetings & Introductions",    xp:50 },
  { id:2, icon:"🔢", title:"Numbers & Dates",              xp:60 },
  { id:3, icon:"🍜", title:"Ordering Food",                xp:70 },
  { id:4, icon:"🗺️", title:"Asking for Directions",       xp:80 },
  { id:5, icon:"🛍️", title:"Shopping & Prices",           xp:90 },
  { id:6, icon:"💬", title:"Expressing Feelings & Opinions",xp:100 },
  { id:7, icon:"📞", title:"Phone Calls & Making Plans",   xp:110 },
  { id:8, icon:"🏥", title:"Emergencies & Health",         xp:120 },
];

/* ══════════════════════════════════════════════════════ */
export default function MunTalkLearn() {
  const [screen, setScreen]               = useState("home");
  const [selectedLang, setSelectedLang]   = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [isTyping, setIsTyping]           = useState(false);
  const [isTalking, setIsTalking]         = useState(false);
  const [xp, setXp]                       = useState(340);
  const [streak]                          = useState(7);
  const [completedLessons]               = useState(new Set([1,2]));
  const [regionFilter, setRegionFilter]   = useState("All");
  const [langSearch, setLangSearch]       = useState("");
  const [tutorFilter, setTutorFilter]     = useState("All");
  const [dailyGoal]                       = useState(20);
  const [todayMinutes]                    = useState(14);
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const startChat = useCallback((lang, tutor) => {
    const t = tutor || getTutor(lang.code);
    setSelectedLang(lang);
    setSelectedTutor(t);
    setMessages([{
      role:"tutor",
      text:`Hey there! I'm ${t.name} ${t.emoji}\n\nI'm so excited to start learning ${lang.name} ${lang.flag} with you! I specialize in ${t.specialty}.\n\nNo worries if you're a total beginner — we'll start super simple and build up together. Ready? 😊`
    }]);
    setScreen("chat");
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = { role:"user", text:input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsTyping(true);
    setIsTalking(false);

    try {
      const apiHistory = history.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text
      }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are ${selectedTutor.name}, a warm AI language tutor specializing in ${selectedLang.name} for absolute beginners.
Origin: ${selectedTutor.origin}. Personality: ${selectedTutor.personality}. Specialty: ${selectedTutor.specialty}.

STRICT RULES:
- Respond entirely in English, but weave in ${selectedLang.name} words/phrases the learner can practice
- Keep responses SHORT: 2–4 sentences max, end with ONE small actionable prompt
- Use emojis generously 🎉⭐✨ — be warm, fun, zero pressure
- Correct mistakes gently: praise first, then show the fix: "Great try! The correct form is..."
- Introduce max 1–2 new ${selectedLang.name} words per reply with pronunciation tips
- NEVER use complex grammar jargon — keep everything practical and confidence-building`,
          messages: apiHistory
        })
      });
      const data  = await res.json();
      const reply = data.content?.map(b => b.text||"").join("") || "Something went wrong — please try again! 🙏";
      setIsTyping(false);
      setIsTalking(true);
      setMessages(prev => [...prev, { role:"tutor", text:reply }]);
      setXp(prev => prev + 10);
      setTimeout(() => setIsTalking(false), 3500);
    } catch {
      setIsTyping(false);
      setMessages(prev => [...prev, { role:"tutor", text:"Connection hiccup — please try again! 🙏" }]);
    }
  };

  const filteredLangs = LANGUAGES.filter(l => {
    const matchRegion = regionFilter === "All" || l.region === regionFilter;
    const matchSearch = l.name.toLowerCase().includes(langSearch.toLowerCase()) || l.flag.includes(langSearch);
    return matchRegion && matchSearch;
  });

  const tutor   = selectedTutor;
  const langObj = selectedLang;

  return (
    <div style={{ fontFamily:"'Nunito','Noto Sans KR',sans-serif", background:"#FAFBFF", minHeight:"100vh", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --sky:#38BDF8;--sun:#FCD34D;--mint:#34D399;--coral:#FB7185;
          --ink:#0F172A;--muted:#64748B;--bg:#FAFBFF;
          --shadow:0 2px 16px rgba(15,23,42,.07);
        }
        body{background:var(--bg);}
        .page{animation:pageIn .32s cubic-bezier(.4,0,.2,1);}
        @keyframes pageIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .card{background:#fff;border-radius:20px;box-shadow:var(--shadow);}
        .hovercard{transition:transform .18s,box-shadow .18s;cursor:pointer;}
        .hovercard:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(15,23,42,.13);}
        .pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;}
        .btn-primary{background:linear-gradient(135deg,#38BDF8,#818CF8);color:#fff;border:none;border-radius:14px;padding:13px 26px;font-weight:800;font-size:14px;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 4px 14px rgba(56,189,248,.35);}
        .btn-primary:hover{transform:scale(1.03);box-shadow:0 6px 20px rgba(56,189,248,.45);}
        .btn-ghost{background:transparent;border:2px solid #E2E8F0;border-radius:12px;padding:8px 16px;font-weight:700;font-size:13px;cursor:pointer;color:var(--muted);transition:all .15s;}
        .btn-ghost:hover{border-color:#38BDF8;color:#38BDF8;background:#F0FBFF;}
        .btn-ghost.active{background:#EFF6FF;border-color:#818CF8;color:#818CF8;}
        .lang-chip{cursor:pointer;transition:all .18s;border:2px solid transparent;border-radius:18px;}
        .lang-chip:hover{transform:translateY(-3px);border-color:#38BDF8;box-shadow:0 6px 18px rgba(56,189,248,.22);}
        .bubble{animation:bubIn .25s cubic-bezier(.4,0,.2,1);}
        @keyframes bubIn{from{opacity:0;transform:scale(.95) translateY(6px)}to{opacity:1;transform:none}}
        .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#CBD5E1;animation:dotBlink 1.4s infinite;}
        .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
        @keyframes dotBlink{0%,60%,100%{opacity:.2}30%{opacity:1}}
        .talking-ring{position:absolute;inset:-5px;border-radius:50%;border:3px solid var(--sky);animation:ringPulse 1s ease-in-out infinite;}
        @keyframes ringPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.08)}}
        .xp-bar-fill{transition:width 1.2s cubic-bezier(.4,0,.2,1);}
        .nav-tab{padding:8px 16px;border-radius:10px;border:none;background:transparent;font-weight:700;font-size:13px;cursor:pointer;color:var(--muted);transition:all .15s;}
        .nav-tab.active{background:#EFF6FF;color:#38BDF8;}
        .nav-tab:hover:not(.active){color:#38BDF8;}
        .input-field{border:2px solid #E2E8F0;border-radius:14px;padding:12px 14px;font-size:14px;font-family:inherit;background:#F8FAFF;transition:border .15s;outline:none;width:100%;}
        .input-field:focus{border-color:#38BDF8;background:#fff;}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:4px}
        .weekly-bar{transition:height .8s cubic-bezier(.4,0,.2,1);}
        .lesson-row{transition:background .12s;}
        .lesson-row.clickable{cursor:pointer;}
        .lesson-row.clickable:hover{background:#F0F9FF!important;}
        .region-row{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;}
        .region-row::-webkit-scrollbar{display:none;}
        .search-wrap{position:relative;flex:1;min-width:200px;}
        .search-wrap span{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:15px;}
        .search-input{border:2px solid #E2E8F0;border-radius:12px;padding:10px 14px 10px 38px;font-size:13px;font-family:inherit;background:#F8FAFF;outline:none;width:100%;transition:border .15s;}
        .search-input:focus{border-color:#38BDF8;background:#fff;}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ background:"#fff", borderBottom:"1px solid #F1F5F9", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", position:"sticky", top:0, zIndex:200 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={() => setScreen("home")}>
          <div style={{ width:36, height:36, background:"linear-gradient(135deg,#38BDF8,#818CF8)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🌍</div>
          <span style={{ fontWeight:900, fontSize:19, color:"#0F172A", letterSpacing:"-0.5px" }}>MunTalk</span>
          <span style={{ background:"#EFF6FF", color:"#38BDF8", fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>BETA</span>
        </div>
        <div style={{ display:"flex", gap:2 }}>
          {[["home","🏠 Home"],["pick","🌐 Languages"],["alltutors","👩‍🏫 Tutors"],["dash","📊 Dashboard"]].map(([s,l]) => (
            <button key={s} className={`nav-tab${screen===s?" active":""}`} onClick={() => setScreen(s)}>{l}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, background:"#FFF7ED", padding:"6px 12px", borderRadius:20 }}>
            <span>🔥</span><span style={{ fontWeight:800, color:"#EA580C", fontSize:13 }}>{streak} days</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5, background:"#EFF6FF", padding:"6px 12px", borderRadius:20 }}>
            <span>⭐</span><span style={{ fontWeight:800, color:"#2563EB", fontSize:13 }}>{xp} XP</span>
          </div>
        </div>
      </nav>

      {/* ══ HOME ══ */}
      {screen==="home" && (
        <div className="page" style={{ maxWidth:960, margin:"0 auto", padding:"44px 24px" }}>

          {/* Hero */}
          <div style={{ background:"linear-gradient(135deg,#38BDF8 0%,#818CF8 55%,#FB7185 100%)", borderRadius:28, padding:"52px 44px", color:"#fff", marginBottom:40, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-40, right:-40, width:260, height:260, background:"rgba(255,255,255,.07)", borderRadius:"50%" }} />
            <div style={{ position:"absolute", bottom:-60, right:110, width:200, height:200, background:"rgba(255,255,255,.05)", borderRadius:"50%" }} />
            <div style={{ position:"relative", maxWidth:560 }}>
              {/* Hero badge */}
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18 }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.18)", borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:800, letterSpacing:.8, backdropFilter:"blur(6px)" }}>
                  🌐 52 Languages
                </div>
                <div onClick={() => setScreen("alltutors")} style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(255,255,255,.95)", borderRadius:20, padding:"5px 16px", fontSize:12, fontWeight:900, color:"#7C3AED", cursor:"pointer", boxShadow:"0 4px 16px rgba(0,0,0,.15)", transition:"transform .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                  <span style={{ fontSize:15 }}>👩‍🏫</span>
                  <span>Meet <strong>+150</strong> AI Tutors</span>
                  <span style={{ background:"#7C3AED", color:"#fff", borderRadius:12, padding:"1px 8px", fontSize:10 }}>NEW</span>
                </div>
              </div>
              <h1 style={{ fontSize:40, fontWeight:900, lineHeight:1.2, marginBottom:14 }}>
                Every language in the world<br/>starts with one conversation.
              </h1>
              <p style={{ opacity:.9, fontSize:15, lineHeight:1.75, marginBottom:32 }}>
                No judgment. No pressure. Your pace, your rules.<br/>
                Our AI tutors get total beginners talking in under 10 minutes.
              </p>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <button onClick={() => setScreen("pick")} style={{ background:"#fff", color:"#2563EB", border:"none", borderRadius:14, padding:"13px 26px", fontWeight:900, fontSize:14, cursor:"pointer", boxShadow:"0 4px 14px rgba(0,0,0,.15)" }}>
                  🌐 Choose a Language
                </button>
                <button onClick={() => setScreen("alltutors")} style={{ background:"rgba(255,255,255,.18)", color:"#fff", border:"2px solid rgba(255,255,255,.5)", borderRadius:14, padding:"13px 24px", fontWeight:800, fontSize:14, cursor:"pointer" }}>
                  👩‍🏫 Browse All Tutors
                </button>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:40 }}>
            {[
              ["150+","AI Tutors","🤖","#EFF6FF","#2563EB"],
              ["52","Languages","🌍","#F0FDF4","#16A34A"],
              ["Beginner","Focused Curriculum","📚","#FFF7ED","#EA580C"],
            ].map(([v,l,e,bg,ac]) => (
              <div key={l} className="card" style={{ padding:"22px 16px", textAlign:"center", background:bg }}>
                <div style={{ fontSize:26, marginBottom:4 }}>{e}</div>
                <div style={{ fontSize:22, fontWeight:900, color:"#0F172A" }}>{v}</div>
                <div style={{ fontSize:12, color:ac, fontWeight:700, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Popular languages */}
          <h2 style={{ fontSize:20, fontWeight:900, color:"#0F172A", marginBottom:16 }}>🔥 Popular Languages</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(130px,1fr))", gap:12, marginBottom:40 }}>
            {LANGUAGES.slice(0,12).map(l => {
              const t = getTutor(l.code);
              return (
                <div key={l.code} className="card lang-chip hovercard" onClick={() => startChat(l)} style={{ padding:"18px 12px", textAlign:"center", background:t.color }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>{l.flag}</div>
                  <div style={{ fontWeight:800, fontSize:13, color:"#0F172A" }}>{l.name}</div>
                  <div style={{ fontSize:10, color:t.accent, fontWeight:700, marginTop:2 }}>Tutor available</div>
                </div>
              );
            })}
          </div>

          {/* ── Meet +150 AI Tutors Banner ── */}
          <div style={{ marginBottom:40 }}>
            {/* Section header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20 }}>
              <div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#7C3AED,#EC4899)", borderRadius:20, padding:"5px 14px", marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:"#fff", letterSpacing:.5 }}>👩‍🏫 MEET YOUR TUTORS</span>
                </div>
                <h2 style={{ fontSize:28, fontWeight:900, color:"#0F172A", lineHeight:1.2, marginBottom:6 }}>
                  <span style={{ background:"linear-gradient(135deg,#38BDF8,#818CF8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>+150 AI Tutors</span>
                  <span style={{ color:"#0F172A" }}> ready for you</span>
                </h2>
                <p style={{ fontSize:13, color:"#64748B", maxWidth:420 }}>Every tutor has a unique personality, origin, and teaching style — all built for beginners. Find your perfect match.</p>
              </div>
              <button onClick={() => setScreen("alltutors")} style={{ background:"linear-gradient(135deg,#7C3AED,#EC4899)", color:"#fff", border:"none", borderRadius:14, padding:"12px 22px", fontWeight:800, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", boxShadow:"0 4px 14px rgba(124,58,237,.3)" }}>
                Browse All Tutors →
              </button>
            </div>

            {/* Scrolling avatar strip */}
            <style>{`
              @keyframes scrollTutors{from{transform:translateX(0)}to{transform:translateX(-50%)}}
              .tutor-strip{display:flex;gap:14px;animation:scrollTutors 28s linear infinite;}
              .tutor-strip:hover{animation-play-state:paused;}
              .tutor-avatar{flex-shrink:0;width:160px;border-radius:18px;padding:16px 14px;text-align:center;cursor:pointer;transition:transform .18s,box-shadow .18s;}
              .tutor-avatar:hover{transform:translateY(-4px) scale(1.03);box-shadow:0 10px 28px rgba(15,23,42,.14);}
            `}</style>
            <div style={{ overflow:"hidden", borderRadius:20, marginBottom:20, position:"relative" }}>
              <div style={{ position:"absolute", left:0, top:0, bottom:0, width:48, background:"linear-gradient(90deg,#FAFBFF,transparent)", zIndex:2, pointerEvents:"none" }} />
              <div style={{ position:"absolute", right:0, top:0, bottom:0, width:48, background:"linear-gradient(270deg,#FAFBFF,transparent)", zIndex:2, pointerEvents:"none" }} />
              <div style={{ padding:"8px 0" }}>
                <div className="tutor-strip">
                  {[...TUTOR_TEMPLATES, ...TUTOR_TEMPLATES].map((t, idx) => {
                    const lang = LANGUAGES.find(l=>l.code===t.lang) || { flag:"🌍", name:"Global" };
                    return (
                      <div key={t.name+idx} className="tutor-avatar card" onClick={() => { setSelectedLang(LANGUAGES.find(l=>l.code===t.lang)||LANGUAGES[0]); setSelectedTutor(t); setMessages([{role:"tutor",text:`Hey! I'm ${t.name} ${t.emoji} — let's practice ${lang.name} together! 😊`}]); setScreen("chat"); }} style={{ background:t.color }}>
                        <div style={{ fontSize:36, marginBottom:6 }}>{t.emoji}</div>
                        <div style={{ fontWeight:900, fontSize:14, color:"#0F172A" }}>{t.name}</div>
                        <div style={{ fontSize:10, color:"#64748B", marginBottom:6 }}>{t.origin}</div>
                        <span style={{ background:t.accent, color:"#fff", borderRadius:10, padding:"2px 8px", fontSize:10, fontWeight:800 }}>{lang.flag} {lang.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Static grid preview */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14 }}>
              {TUTOR_TEMPLATES.slice(0,4).map((t) => {
                const lang = LANGUAGES.find(l=>l.code===t.lang) || { flag:"🌍", name:"Global" };
                return (
                  <div key={t.name} className="card hovercard" onClick={() => { setSelectedLang(lang); setSelectedTutor(t); setMessages([{role:"tutor",text:`Hey! I'm ${t.name} ${t.emoji} — ready to practice ${lang.name} with you! Let's go! 😊`}]); setScreen("chat"); }} style={{ padding:"20px 16px", textAlign:"center", background:t.color }}>
                    <div style={{ fontSize:34, marginBottom:8 }}>{t.emoji}</div>
                    <div style={{ fontWeight:900, fontSize:15, color:"#0F172A", marginBottom:2 }}>{t.name}</div>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:6 }}>{t.origin}</div>
                    <span className="pill" style={{ background:t.accent+"18", color:t.accent, display:"inline-flex", marginBottom:6 }}>{lang.flag} {lang.name}</span>
                    <div style={{ fontSize:11, color:"#475569", lineHeight:1.5 }}>{t.specialty}</div>
                  </div>
                );
              })}
              {/* "See all" card */}
              <div className="card hovercard" onClick={() => setScreen("alltutors")} style={{ padding:"20px 16px", textAlign:"center", background:"linear-gradient(135deg,#EFF6FF,#F5F3FF)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:"2px dashed #818CF855" }}>
                <div style={{ fontSize:34, marginBottom:8 }}>➕</div>
                <div style={{ fontWeight:900, fontSize:15, color:"#7C3AED", marginBottom:4 }}>+140 more</div>
                <div style={{ fontSize:11, color:"#94A3B8", marginBottom:10 }}>tutors waiting for you</div>
                <span className="pill" style={{ background:"linear-gradient(135deg,#7C3AED,#EC4899)", color:"#fff" }}>Browse All →</span>
              </div>
            </div>
          </div>

          {/* Why MunTalk */}
          <h2 style={{ fontSize:20, fontWeight:900, color:"#0F172A", marginBottom:16 }}>💡 Why MunTalk?</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {[
              ["😌","Zero Judgment","Mistakes are part of learning! Our AI never criticizes — only encourages.","#FFF7ED","#EA580C"],
              ["🎯","Built for Beginners","Every lesson is crafted for absolute beginners — step-by-step, no overwhelm.","#F0FDF4","#16A34A"],
              ["⚡","Start in Seconds","No sign-up needed. Pick a language, meet your tutor, and start talking.","#EFF6FF","#2563EB"],
            ].map(([e,t,d,bg,ac]) => (
              <div key={t} className="card" style={{ padding:"24px 20px", background:bg }}>
                <div style={{ fontSize:32, marginBottom:10 }}>{e}</div>
                <div style={{ fontWeight:800, fontSize:15, marginBottom:8, color:"#0F172A" }}>{t}</div>
                <div style={{ fontSize:13, color:"#475569", lineHeight:1.65 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ ALL TUTORS BROWSE ══ */}
      {screen==="alltutors" && (
        <div className="page" style={{ maxWidth:1020, margin:"0 auto", padding:"36px 24px" }}>
          <div style={{ marginBottom:28 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#38BDF8,#818CF8)", borderRadius:20, padding:"6px 16px", marginBottom:14 }}>
              <span style={{ fontSize:13, fontWeight:800, color:"#fff", letterSpacing:.5 }}>👩‍🏫 MEET YOUR TUTORS</span>
            </div>
            <h2 style={{ fontSize:30, fontWeight:900, color:"#0F172A", marginBottom:8 }}>
              +150 AI Tutors,<br/>
              <span style={{ background:"linear-gradient(135deg,#38BDF8,#818CF8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>one perfect match for you.</span>
            </h2>
            <p style={{ color:"#64748B", fontSize:15, maxWidth:540 }}>
              Each tutor has a unique personality, origin, and teaching style — all crafted for beginners. Click any tutor to start a conversation instantly.
            </p>
          </div>

          {/* Specialty filter */}
          <div className="region-row" style={{ marginBottom:28 }}>
            {["All","Conversation","Business","Culture & Travel","Pop Culture","Beginner Specialist"].map(f => (
              <button key={f} className={`btn-ghost${tutorFilter===f?" active":""}`} onClick={() => setTutorFilter(f)} style={{ whiteSpace:"nowrap" }}>{f}</button>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:18 }}>
            {TUTOR_TEMPLATES.map((t) => {
              const lang = LANGUAGES.find(l=>l.code===t.lang) || { flag:"🌍", name:"Global", code:"en" };
              return (
                <div key={t.name} className="card hovercard" style={{ overflow:"hidden" }}>
                  {/* Card top banner */}
                  <div style={{ background:`linear-gradient(135deg,${t.accent}22,${t.accent}08)`, padding:"24px 20px 16px", textAlign:"center", borderBottom:`1px solid ${t.accent}18` }}>
                    <div style={{ fontSize:48, marginBottom:6 }}>{t.emoji}</div>
                    <div style={{ fontWeight:900, fontSize:18, color:"#0F172A" }}>{t.name}</div>
                    <div style={{ fontSize:12, color:"#64748B", marginBottom:8 }}>{t.origin}</div>
                    <span className="pill" style={{ background:t.accent, color:"#fff" }}>{lang.flag} {lang.name}</span>
                  </div>
                  {/* Card body */}
                  <div style={{ padding:"16px 20px" }}>
                    <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
                      <span className="pill" style={{ background:t.color, color:t.accent }}>⭐ {(4.7+Math.random()*0.3).toFixed(1)}</span>
                      <span className="pill" style={{ background:"#F8FAFF", color:"#64748B" }}>🎓 Beginner-friendly</span>
                    </div>
                    <div style={{ fontSize:13, color:"#475569", marginBottom:4 }}>
                      <strong style={{ color:t.accent }}>Specialty</strong><br/>{t.specialty}
                    </div>
                    <div style={{ fontSize:13, color:"#475569", marginBottom:14, marginTop:8 }}>
                      <strong style={{ color:t.accent }}>Style</strong><br/>{t.personality}
                    </div>
                    <button onClick={() => { setSelectedLang(lang); setSelectedTutor(t); setMessages([{role:"tutor",text:`Hey! I'm ${t.name} ${t.emoji} from ${t.origin}!\n\nI can't wait to help you with ${lang.name}. I specialize in ${t.specialty} and my style is ${t.personality.toLowerCase()}.\n\nLet's kick things off — can you say hello in ${lang.name}? Give it a try! 😊`}]); setScreen("chat"); }} style={{ width:"100%", background:`linear-gradient(135deg,${t.accent},${t.accent}cc)`, color:"#fff", border:"none", borderRadius:12, padding:"12px", fontWeight:800, fontSize:14, cursor:"pointer" }}>
                      Chat with {t.name} →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Placeholder cards for the remaining 140+ tutors */}
          <div style={{ marginTop:28, background:"linear-gradient(135deg,#EFF6FF,#F5F3FF)", borderRadius:20, padding:"32px", textAlign:"center", border:"2px dashed #818CF833" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🤖</div>
            <div style={{ fontWeight:900, fontSize:18, color:"#0F172A", marginBottom:6 }}>140+ more tutors coming soon</div>
            <p style={{ color:"#64748B", fontSize:14, marginBottom:20, maxWidth:400, margin:"0 auto 20px" }}>
              We're onboarding new AI tutors every week — covering every accent, dialect, and learning style imaginable.
            </p>
            <button className="btn-primary" onClick={() => setScreen("pick")}>
              🌐 Browse by Language Instead
            </button>
          </div>
        </div>
      )}

      {/* ══ LANGUAGE PICKER ══ */}
      {screen==="pick" && (
        <div className="page" style={{ maxWidth:1020, margin:"0 auto", padding:"36px 24px" }}>
          <h2 style={{ fontSize:26, fontWeight:900, color:"#0F172A", marginBottom:6 }}>🌐 What do you want to learn?</h2>
          <p style={{ color:"#64748B", fontSize:14, marginBottom:24 }}>52 languages — pick one and your AI tutor is ready instantly.</p>

          <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", flexWrap:"wrap" }}>
            <div className="search-wrap">
              <span>🔍</span>
              <input className="search-input" placeholder="Search a language..." value={langSearch} onChange={e => setLangSearch(e.target.value)} />
            </div>
            <div className="region-row">
              {REGIONS.map(r => (
                <button key={r} className={`btn-ghost${regionFilter===r?" active":""}`} onClick={() => setRegionFilter(r)} style={{ whiteSpace:"nowrap" }}>{r}</button>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(148px,1fr))", gap:12 }}>
            {filteredLangs.map(l => {
              const t = getTutor(l.code);
              return (
                <div key={l.code} className="card lang-chip hovercard" onClick={() => { setSelectedLang(l); setScreen("tutors"); }} style={{ padding:"18px 14px", textAlign:"center", background:t.color }}>
                  <div style={{ fontSize:30, marginBottom:8 }}>{l.flag}</div>
                  <div style={{ fontWeight:800, fontSize:13, color:"#0F172A", marginBottom:2 }}>{l.name}</div>
                  <div style={{ fontSize:10, color:t.accent, fontWeight:700 }}>{t.specialty.split("&")[0].trim()}</div>
                  <div style={{ marginTop:8 }}>
                    <span className="pill" style={{ background:t.accent+"18", color:t.accent }}>Pick tutor →</span>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredLangs.length===0 && (
            <div style={{ textAlign:"center", padding:"60px 0", color:"#94A3B8", fontSize:15 }}>
              No results found 😅 Try a different search term!
            </div>
          )}
        </div>
      )}

      {/* ══ TUTOR SELECT ══ */}
      {screen==="tutors" && selectedLang && (() => {
        const mainTutor   = getTutor(selectedLang.code);
        const otherTutors = TUTOR_TEMPLATES.filter(t => t.lang !== selectedLang.code).slice(0,5).map(t => ({ ...t, specialty:"Multilingual beginner specialist" }));
        const allTutors   = [mainTutor, ...otherTutors];
        const specs       = ["All", ...new Set(allTutors.map(t => t.specialty.split("&")[0].trim()))];
        const filtered    = tutorFilter==="All" ? allTutors : allTutors.filter(t => t.specialty.includes(tutorFilter));

        return (
          <div className="page" style={{ maxWidth:980, margin:"0 auto", padding:"36px 24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <button className="btn-ghost" onClick={() => setScreen("pick")}>← Back</button>
              <span style={{ fontSize:26 }}>{selectedLang.flag}</span>
              <h2 style={{ fontSize:22, fontWeight:900, color:"#0F172A" }}>Choose your {selectedLang.name} tutor</h2>
            </div>

            <div className="region-row" style={{ marginBottom:24 }}>
              {specs.map(s => (
                <button key={s} className={`btn-ghost${tutorFilter===s?" active":""}`} onClick={() => setTutorFilter(s)} style={{ whiteSpace:"nowrap" }}>{s}</button>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
              {filtered.map((t,i) => (
                <div key={t.name+i} className="card hovercard" onClick={() => startChat(selectedLang, t)} style={{ padding:24 }}>
                  {i===0 && <div style={{ marginBottom:10 }}><span className="pill" style={{ background:"#FEF3C7", color:"#D97706" }}>⭐ Recommended</span></div>}
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                    <div style={{ width:58, height:58, background:t.color, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, border:`3px solid ${t.accent}`, flexShrink:0 }}>
                      {t.emoji}
                    </div>
                    <div>
                      <div style={{ fontWeight:900, fontSize:17, color:"#0F172A" }}>{t.name}</div>
                      <div style={{ fontSize:12, color:"#64748B" }}>{t.origin}</div>
                      <span className="pill" style={{ background:t.color, color:t.accent, marginTop:3 }}>{selectedLang.flag} {selectedLang.name}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:"#475569", lineHeight:1.65, marginBottom:14 }}>
                    <strong style={{ color:t.accent }}>Specialty:</strong> {t.specialty}<br/>
                    <strong style={{ color:t.accent }}>Style:</strong> {t.personality}
                  </div>
                  <button style={{ width:"100%", background:`linear-gradient(135deg,${t.accent},${t.accent}cc)`, color:"#fff", border:"none", borderRadius:12, padding:"12px", fontWeight:800, fontSize:14, cursor:"pointer" }}>
                    Start with {t.name} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ══ CHAT ══ */}
      {screen==="chat" && tutor && langObj && (
        <div className="page" style={{ maxWidth:760, margin:"0 auto", padding:"20px 16px", display:"flex", flexDirection:"column", height:"calc(100vh - 62px)" }}>

          {/* Chat header */}
          <div className="card" style={{ padding:"14px 20px", marginBottom:14, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
            <button className="btn-ghost" onClick={() => setScreen("tutors")} style={{ padding:"6px 12px", fontSize:12 }}>← Tutors</button>
            <div style={{ position:"relative" }}>
              <div style={{ width:46, height:46, background:tutor.color, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, border:`2.5px solid ${tutor.accent}` }}>
                {tutor.emoji}
              </div>
              {isTalking && <div className="talking-ring" style={{ borderColor:tutor.accent }} />}
              <div style={{ width:11, height:11, background:"#22C55E", borderRadius:"50%", position:"absolute", bottom:1, right:1, border:"2px solid #fff" }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:15, color:"#0F172A" }}>{tutor.name} <span style={{ fontSize:12, color:"#94A3B8" }}>{tutor.origin}</span></div>
              <div style={{ fontSize:12, fontWeight:700, color:tutor.accent }}>{langObj.flag} {langObj.name} · {tutor.specialty}</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <span className="pill" style={{ background:"#FEF3C7", color:"#D97706" }}>⭐ {xp} XP</span>
              <button className="btn-ghost" onClick={() => setScreen("dash")} style={{ fontSize:12, padding:"5px 10px" }}>📊 Progress</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", paddingBottom:8 }}>
            <div style={{ background:tutor.color, border:`1px solid ${tutor.accent}33`, borderRadius:14, padding:"10px 16px", marginBottom:16, textAlign:"center", fontSize:13, color:"#475569" }}>
              📚 <strong style={{ color:tutor.accent }}>{tutor.specialty}</strong> · Beginner-focused · +10 XP per message
            </div>

            {messages.map((m,i) => (
              <div key={i} className="bubble" style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:10 }}>
                {m.role!=="user" && (
                  <div style={{ width:34, height:34, background:tutor.color, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, marginRight:8, flexShrink:0, border:`2px solid ${tutor.accent}` }}>
                    {tutor.emoji}
                  </div>
                )}
                <div style={{ maxWidth:"76%", background:m.role==="user"?`linear-gradient(135deg,${tutor.accent},${tutor.accent}bb)`:"#fff", color:m.role==="user"?"#fff":"#1E293B", padding:"12px 16px", borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", fontSize:14, lineHeight:1.65, boxShadow:"0 2px 8px rgba(0,0,0,.07)", whiteSpace:"pre-wrap" }}>
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div style={{ width:34, height:34, background:tutor.color, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, border:`2px solid ${tutor.accent}` }}>{tutor.emoji}</div>
                <div style={{ background:"#fff", padding:"12px 18px", borderRadius:"18px 18px 18px 4px", boxShadow:"0 2px 8px rgba(0,0,0,.07)", display:"flex", gap:5 }}>
                  <span className="dot"/><span className="dot"/><span className="dot"/>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="card" style={{ padding:"12px 14px", marginTop:8, display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
            <input ref={inputRef} className="input-field" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()} placeholder={`Reply to ${tutor.name} or ask a question...`} style={{ flex:1 }} />
            <button onClick={sendMessage} disabled={!input.trim()||isTyping} style={{ width:46, height:46, background:input.trim()&&!isTyping?`linear-gradient(135deg,${tutor.accent},${tutor.accent}bb)`:"#E2E8F0", color:input.trim()&&!isTyping?"#fff":"#94A3B8", border:"none", borderRadius:13, fontSize:18, cursor:input.trim()&&!isTyping?"pointer":"default", flexShrink:0, transition:"all .15s", display:"flex", alignItems:"center", justifyContent:"center" }}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ══ DASHBOARD ══ */}
      {screen==="dash" && (() => {
        /* ── CEFR level map ── */
        const CEFR_LEVELS = [
          { id:"a1-1", cefr:"A1", sub:1, label:"A1 · Step 1", persona:"🌱 First Timer",    color:"#ECFDF5", accent:"#059669", xpMin:0,    xpMax:100,  lessons:["Greetings & introductions","Numbers 1–10","Colors & basic nouns"],           badge:"🌱", cert:false },
          { id:"a1-2", cefr:"A1", sub:2, label:"A1 · Step 2", persona:"🗺️ Tourist",        color:"#EFF6FF", accent:"#2563EB", xpMin:100,  xpMax:250,  lessons:["Ordering food & drinks","Asking for directions","Telling the time"],           badge:"🗺️", cert:false },
          { id:"a1-3", cefr:"A1", sub:3, label:"A1 · Step 3", persona:"☕ Café Regular",   color:"#FFF7ED", accent:"#EA580C", xpMin:250,  xpMax:500,  lessons:["Shopping & prices","Describing your routine","Weather & seasons"],              badge:"☕", cert:false },
          { id:"a1-4", cefr:"A1", sub:4, label:"A1 · Step 4", persona:"🏡 Neighborhood Pro",color:"#F5F3FF",accent:"#7C3AED", xpMin:500,  xpMax:800,  lessons:["Talking about family","Likes & dislikes","Making simple plans"],              badge:"🏡", cert:true  },
          { id:"a2",   cefr:"A2", sub:0, label:"A2",           persona:"🏙️ Local Explorer", color:"#FFFBEB", accent:"#D97706", xpMin:800,  xpMax:1400, lessons:["Transport & travel","Health & body","Past events & stories","Phone calls"],    badge:"🏙️", cert:true  },
          { id:"b1",   cefr:"B1", sub:0, label:"B1",           persona:"💼 City Dweller",   color:"#FDF2F8", accent:"#DB2777", xpMin:1400, xpMax:2400, lessons:["Work & career","Opinions & debates","News & media","Relationships"],           badge:"💼", cert:true  },
          { id:"b2",   cefr:"B2", sub:0, label:"B2",           persona:"🎓 Independent",    color:"#F0FDF4", accent:"#16A34A", xpMin:2400, xpMax:4000, lessons:["Abstract topics","Formal writing","Negotiations","Cultural nuance"],           badge:"🎓", cert:true  },
          { id:"c1",   cefr:"C1", sub:0, label:"C1",           persona:"🚀 Advanced",       color:"#FFF1F2", accent:"#E11D48", xpMin:4000, xpMax:6500, lessons:["Idiomatic speech","Academic language","Humor & sarcasm","Spontaneous debate"],  badge:"🚀", cert:true  },
          { id:"c2",   cefr:"C2", sub:0, label:"C2",           persona:"👑 Near-Native",    color:"#FEFCE8", accent:"#CA8A04", xpMin:6500, xpMax:9999, lessons:["Mastery of all registers","Literature & poetry","Full fluency"],               badge:"👑", cert:true  },
        ];

        const currentLevel = CEFR_LEVELS.find(l => xp >= l.xpMin && xp < l.xpMax) || CEFR_LEVELS[0];
        const levelProgress = ((xp - currentLevel.xpMin) / (currentLevel.xpMax - currentLevel.xpMin)) * 100;

        const BADGES = [
          { id:"first-word",  emoji:"🗣️",  name:"First Word",     desc:"Sent your first message",      earned:true  },
          { id:"streak-3",    emoji:"🔥",  name:"3-Day Streak",   desc:"Practiced 3 days in a row",    earned:true  },
          { id:"a1-1-done",   emoji:"🌱",  name:"First Timer",    desc:"Completed A1 Step 1",          earned:true  },
          { id:"a1-2-done",   emoji:"🗺️",  name:"Tourist",        desc:"Completed A1 Step 2",          earned:true  },
          { id:"a1-3-done",   emoji:"☕",  name:"Café Regular",   desc:"Completed A1 Step 3",          earned:false },
          { id:"streak-7",    emoji:"⚡",  name:"7-Day Streak",   desc:"7 days in a row",              earned:false },
          { id:"multi-lang",  emoji:"🌍",  name:"Polyglot",       desc:"Learn 3+ languages",           earned:false },
          { id:"speed",       emoji:"🏎️",  name:"Fast Learner",   desc:"100 XP in a single day",       earned:false },
          { id:"social",      emoji:"🤝",  name:"Conversationalist",desc:"50 AI conversations",        earned:false },
          { id:"a2-done",     emoji:"🏙️",  name:"Local Explorer", desc:"Completed A2",                 earned:false },
          { id:"b1-done",     emoji:"💼",  name:"City Dweller",   desc:"Completed B1",                 earned:false },
          { id:"c2-done",     emoji:"👑",  name:"Near-Native",    desc:"Completed C2",                 earned:false },
        ];

        const LEADERBOARD = [
          { rank:1,  name:"Sarah K.",    flag:"🇺🇸", lang:"Japanese",   xp:4820, streak:42, avatar:"👩‍🦰" },
          { rank:2,  name:"Tomás R.",    flag:"🇧🇷", lang:"English",    xp:4410, streak:38, avatar:"🧑‍🦱" },
          { rank:3,  name:"Mei L.",      flag:"🇹🇼", lang:"Spanish",    xp:3990, streak:31, avatar:"👧"   },
          { rank:4,  name:"You",         flag:"🇰🇷", lang:"English",    xp,      streak,    avatar:"⭐",   isYou:true },
          { rank:5,  name:"Priya S.",    flag:"🇮🇳", lang:"French",     xp:290,  streak:5,  avatar:"👩‍🦲" },
          { rank:6,  name:"Alex M.",     flag:"🇩🇪", lang:"Korean",     xp:210,  streak:3,  avatar:"🧑‍🦰" },
          { rank:7,  name:"Yuki T.",     flag:"🇯🇵", lang:"English",    xp:180,  streak:2,  avatar:"👩‍🦱" },
        ];

        const [dashTab, setDashTab] = useState("progress"); // progress | levels | badges | certs | leaderboard

        return (
          <div className="page" style={{ maxWidth:900, margin:"0 auto", padding:"36px 24px" }}>

            {/* Header */}
            <div style={{ marginBottom:28 }}>
              <h2 style={{ fontSize:26, fontWeight:900, color:"#0F172A", marginBottom:4 }}>📊 Your Learning Dashboard</h2>
              <p style={{ color:"#64748B", fontSize:14 }}>Consistency is your superpower. Keep it up! 🚀</p>
            </div>

            {/* Current level hero card */}
            <div style={{ background:`linear-gradient(135deg,${currentLevel.accent},${currentLevel.accent}cc)`, borderRadius:24, padding:"28px 32px", color:"#fff", marginBottom:24, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-30, right:-30, width:180, height:180, background:"rgba(255,255,255,.08)", borderRadius:"50%" }} />
              <div style={{ position:"relative", display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:56, lineHeight:1 }}>{currentLevel.badge}</div>
                  <div style={{ fontWeight:900, fontSize:22, marginTop:4 }}>{currentLevel.label}</div>
                  <div style={{ opacity:.85, fontSize:13, marginTop:2 }}>{currentLevel.persona}</div>
                </div>
                <div style={{ flex:1, minWidth:220 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontWeight:700, fontSize:14, opacity:.9 }}>Progress to {CEFR_LEVELS[Math.min(CEFR_LEVELS.indexOf(currentLevel)+1, CEFR_LEVELS.length-1)].label}</span>
                    <span style={{ fontWeight:900, fontSize:14 }}>{xp} / {currentLevel.xpMax} XP</span>
                  </div>
                  <div style={{ height:14, background:"rgba(255,255,255,.25)", borderRadius:10, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${levelProgress.toFixed(1)}%`, background:"rgba(255,255,255,.9)", borderRadius:10, transition:"width 1.2s cubic-bezier(.4,0,.2,1)" }} />
                  </div>
                  <div style={{ fontSize:12, opacity:.8, marginTop:6 }}>{currentLevel.xpMax - xp} XP to unlock {CEFR_LEVELS[Math.min(CEFR_LEVELS.indexOf(currentLevel)+1, CEFR_LEVELS.length-1)].persona}</div>
                  <div style={{ display:"flex", gap:10, marginTop:14, flexWrap:"wrap" }}>
                    {[["🔥",streak+" day streak"],["💬","47 convos"],["🌐","3 languages"]].map(([e,t])=>(
                      <div key={t} style={{ background:"rgba(255,255,255,.2)", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:700 }}>{e} {t}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Tabs */}
            <div style={{ display:"flex", gap:6, marginBottom:24, overflowX:"auto", paddingBottom:2 }}>
              {[["progress","📈 Progress"],["levels","🎯 CEFR Levels"],["badges","🏅 Badges"],["certs","📜 Certificates"],["leaderboard","🏆 Leaderboard"]].map(([t,l])=>(
                <button key={t} onClick={()=>setDashTab(t)} style={{ padding:"9px 18px", borderRadius:12, border:"none", fontWeight:800, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", background:dashTab===t?currentLevel.accent:"#F1F5F9", color:dashTab===t?"#fff":"#64748B", transition:"all .15s" }}>{l}</button>
              ))}
            </div>

            {/* ── Tab: Progress ── */}
            {dashTab==="progress" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
                  {[["🔥",streak+" days","Streak","#FFF7ED","#EA580C"],["⭐",xp+" XP","Total XP","#EFF6FF","#2563EB"],["💬","47","Conversations","#F0FDF4","#16A34A"],["🌐","3","Languages","#FDF4FF","#9333EA"]].map(([e,v,l,bg,ac])=>(
                    <div key={l} className="card" style={{ padding:20, textAlign:"center", background:bg }}>
                      <div style={{ fontSize:24, marginBottom:4 }}>{e}</div>
                      <div style={{ fontSize:20, fontWeight:900, color:"#0F172A" }}>{v}</div>
                      <div style={{ fontSize:11, color:ac, fontWeight:700, marginTop:2 }}>{l}</div>
                    </div>
                  ))}
                </div>
                {/* Daily goal */}
                <div className="card" style={{ padding:24, marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div><div style={{ fontWeight:800, fontSize:15 }}>Daily Goal 🎯</div><div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>{dailyGoal} min/day target</div></div>
                    <span style={{ fontWeight:900, color:currentLevel.accent, fontSize:16 }}>{todayMinutes} / {dailyGoal} min</span>
                  </div>
                  <div style={{ height:12, background:"#F1F5F9", borderRadius:10, overflow:"hidden" }}>
                    <div className="xp-bar-fill" style={{ height:"100%", width:`${Math.min((todayMinutes/dailyGoal)*100,100)}%`, background:`linear-gradient(90deg,${currentLevel.accent},${currentLevel.accent}99)`, borderRadius:10 }} />
                  </div>
                  <div style={{ fontSize:12, color:"#94A3B8", marginTop:6 }}>{todayMinutes>=dailyGoal?"🎉 Goal complete for today!":`${dailyGoal-todayMinutes} more minutes to hit today's goal!`}</div>
                </div>
                {/* Weekly chart */}
                <div className="card" style={{ padding:24 }}>
                  <div style={{ fontWeight:800, fontSize:15, color:"#0F172A", marginBottom:20 }}>📅 This Week</div>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-end", height:100 }}>
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>{
                      const mins=[30,0,45,20,60,14,0][i];
                      return (
                        <div key={d} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                          <div style={{ fontSize:10, color:"#94A3B8", fontWeight:700 }}>{mins>0?mins+"m":""}</div>
                          <div style={{ width:"100%", display:"flex", alignItems:"flex-end", height:76 }}>
                            <div className="weekly-bar" style={{ width:"100%", height:`${mins>0?Math.max((mins/60)*76,8):4}px`, background:mins>0?`linear-gradient(180deg,${currentLevel.accent},${currentLevel.accent}88)`:"#F1F5F9", borderRadius:"6px 6px 0 0" }} />
                          </div>
                          <div style={{ fontSize:11, color:"#64748B", fontWeight:700 }}>{d}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: CEFR Levels ── */}
            {dashTab==="levels" && (
              <div>
                <div style={{ background:"#F8FAFC", borderRadius:16, padding:"14px 18px", marginBottom:20, fontSize:13, color:"#475569", lineHeight:1.6 }}>
                  <strong>How it works:</strong> MunTalk follows the international <strong>CEFR standard</strong> (A1→C2). A1 is split into 4 beginner-friendly steps so you feel progress fast. Each level unlocks new tutors, badges, and a certificate. 🎓
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {CEFR_LEVELS.map((lvl, idx) => {
                    const isCurrentLvl = lvl.id === currentLevel.id;
                    const isDone = xp >= lvl.xpMax;
                    const isLocked = xp < lvl.xpMin;
                    return (
                      <div key={lvl.id} style={{ borderRadius:18, overflow:"hidden", border:isCurrentLvl?`2px solid ${lvl.accent}`:"2px solid transparent", boxShadow:isCurrentLvl?`0 0 0 4px ${lvl.accent}18`:"none", background:"#fff", transition:"all .2s" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px", background:isDone?lvl.color:isCurrentLvl?lvl.color:"#fff" }}>
                          {/* Badge circle */}
                          <div style={{ width:52, height:52, borderRadius:"50%", background:isLocked?"#F1F5F9":lvl.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, border:`3px solid ${isLocked?"#E2E8F0":lvl.accent}`, flexShrink:0, filter:isLocked?"grayscale(1) opacity(.4)":"none" }}>
                            {isDone?"✅":lvl.badge}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                              <span style={{ fontWeight:900, fontSize:15, color:isLocked?"#94A3B8":"#0F172A" }}>{lvl.label}</span>
                              {isCurrentLvl && <span style={{ background:lvl.accent, color:"#fff", borderRadius:10, padding:"2px 9px", fontSize:11, fontWeight:800 }}>YOU ARE HERE</span>}
                              {isDone && <span style={{ background:"#DCFCE7", color:"#16A34A", borderRadius:10, padding:"2px 9px", fontSize:11, fontWeight:800 }}>✓ COMPLETED</span>}
                              {isLocked && <span style={{ background:"#F1F5F9", color:"#94A3B8", borderRadius:10, padding:"2px 9px", fontSize:11, fontWeight:700 }}>🔒 LOCKED</span>}
                              {lvl.cert && !isLocked && <span style={{ background:"#FEF3C7", color:"#D97706", borderRadius:10, padding:"2px 9px", fontSize:11, fontWeight:800 }}>📜 Certificate</span>}
                            </div>
                            <div style={{ fontSize:12, color:isLocked?"#CBD5E1":lvl.accent, fontWeight:700, marginBottom:4 }}>{lvl.persona}</div>
                            <div style={{ fontSize:12, color:"#94A3B8" }}>{lvl.xpMin} – {lvl.xpMax} XP · {lvl.lessons.length} lessons</div>
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            {isCurrentLvl && (
                              <div style={{ fontSize:12, color:lvl.accent, fontWeight:800, marginBottom:4 }}>{levelProgress.toFixed(0)}%</div>
                            )}
                            <button onClick={()=>startChat(LANGUAGES[0])} disabled={isLocked} style={{ background:isLocked?"#F1F5F9":`linear-gradient(135deg,${lvl.accent},${lvl.accent}cc)`, color:isLocked?"#CBD5E1":"#fff", border:"none", borderRadius:10, padding:"8px 16px", fontWeight:800, fontSize:12, cursor:isLocked?"not-allowed":"pointer" }}>
                              {isDone?"Review":"Practice →"}
                            </button>
                          </div>
                        </div>
                        {/* Lessons list */}
                        {(isCurrentLvl || isDone) && (
                          <div style={{ borderTop:`1px solid ${lvl.accent}22`, padding:"12px 20px", display:"flex", gap:8, flexWrap:"wrap", background:lvl.color }}>
                            {lvl.lessons.map((ls, li) => (
                              <span key={ls} style={{ background:isDone?"#DCFCE7":li===0||li===1?"#DCFCE7":"#F1F5F9", color:isDone?"#16A34A":li===0||li===1?"#16A34A":"#64748B", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:700 }}>
                                {isDone?"✓":li<2?"✓":"○"} {ls}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Tab: Badges ── */}
            {dashTab==="badges" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div>
                    <div style={{ fontWeight:900, fontSize:18, color:"#0F172A" }}>🏅 Your Badge Collection</div>
                    <div style={{ fontSize:13, color:"#64748B", marginTop:2 }}>{BADGES.filter(b=>b.earned).length} / {BADGES.length} earned</div>
                  </div>
                  <div style={{ background:"#EFF6FF", borderRadius:12, padding:"8px 16px" }}>
                    <span style={{ fontWeight:800, color:"#2563EB", fontSize:14 }}>{BADGES.filter(b=>b.earned).length} 🏅</span>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14 }}>
                  {BADGES.map(b => (
                    <div key={b.id} className="card" style={{ padding:"20px 14px", textAlign:"center", background:b.earned?"#fff":"#F8FAFC", filter:b.earned?"none":"grayscale(1) opacity(.5)", position:"relative" }}>
                      {b.earned && <div style={{ position:"absolute", top:10, right:10, width:10, height:10, background:"#22C55E", borderRadius:"50%", boxShadow:"0 0 0 3px #DCFCE7" }} />}
                      <div style={{ fontSize:40, marginBottom:8 }}>{b.emoji}</div>
                      <div style={{ fontWeight:800, fontSize:13, color:"#0F172A", marginBottom:4 }}>{b.name}</div>
                      <div style={{ fontSize:11, color:"#64748B", lineHeight:1.4 }}>{b.desc}</div>
                      {b.earned && <div style={{ marginTop:8 }}><span style={{ background:"#DCFCE7", color:"#16A34A", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:800 }}>Earned ✓</span></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tab: Certificates ── */}
            {dashTab==="certs" && (
              <div>
                <div style={{ fontWeight:900, fontSize:18, color:"#0F172A", marginBottom:6 }}>📜 CEFR Certificates</div>
                <p style={{ fontSize:13, color:"#64748B", marginBottom:24 }}>Complete each level to earn an official MunTalk certificate. Share it on LinkedIn, attach it to your CV, or just keep it as a souvenir! 🎓</p>
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {CEFR_LEVELS.filter(l=>l.cert).map(lvl => {
                    const earned = xp >= lvl.xpMax;
                    const inProgress = xp >= lvl.xpMin && xp < lvl.xpMax;
                    return (
                      <div key={lvl.id} className="card" style={{ overflow:"hidden", display:"flex", alignItems:"stretch" }}>
                        {/* Cert left stripe */}
                        <div style={{ width:8, background:earned?lvl.accent:inProgress?`linear-gradient(180deg,${lvl.accent},#E2E8F0)`:"#E2E8F0", flexShrink:0 }} />
                        <div style={{ flex:1, padding:"20px 24px", display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
                          <div style={{ width:64, height:64, borderRadius:16, background:earned?lvl.color:"#F8FAFC", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, border:`2px solid ${earned?lvl.accent:"#E2E8F0"}`, flexShrink:0 }}>
                            {earned?"📜":inProgress?"⏳":"🔒"}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:900, fontSize:16, color:earned?"#0F172A":"#94A3B8" }}>MunTalk Certificate — {lvl.label}</div>
                            <div style={{ fontSize:13, color:earned?lvl.accent:"#CBD5E1", fontWeight:700, marginTop:2 }}>{lvl.persona}</div>
                            <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>Issued upon completing {lvl.xpMax} XP · All {lvl.lessons.length} lessons</div>
                            {inProgress && (
                              <div style={{ marginTop:8 }}>
                                <div style={{ height:6, background:"#F1F5F9", borderRadius:10, overflow:"hidden", width:200 }}>
                                  <div style={{ height:"100%", width:`${((xp-lvl.xpMin)/(lvl.xpMax-lvl.xpMin)*100).toFixed(0)}%`, background:`linear-gradient(90deg,${lvl.accent},${lvl.accent}88)`, borderRadius:10 }} />
                                </div>
                                <div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{lvl.xpMax-xp} XP to unlock this certificate</div>
                              </div>
                            )}
                          </div>
                          <button disabled={!earned} style={{ background:earned?`linear-gradient(135deg,${lvl.accent},${lvl.accent}cc)`:"#F1F5F9", color:earned?"#fff":"#CBD5E1", border:"none", borderRadius:12, padding:"10px 20px", fontWeight:800, fontSize:13, cursor:earned?"pointer":"not-allowed", whiteSpace:"nowrap" }}>
                            {earned?"⬇ Download":"Locked 🔒"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Tab: Leaderboard ── */}
            {dashTab==="leaderboard" && (
              <div>
                <div style={{ fontWeight:900, fontSize:18, color:"#0F172A", marginBottom:6 }}>🏆 English Leaderboard</div>
                <p style={{ fontSize:13, color:"#64748B", marginBottom:20 }}>Top learners this month, ranked by XP. Your ranking resets monthly — stay consistent! 💪</p>
                {/* Top 3 podium */}
                <div style={{ display:"flex", gap:12, justifyContent:"center", alignItems:"flex-end", marginBottom:24, height:140 }}>
                  {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((u, pi) => {
                    const heights = [100, 140, 80];
                    const colors  = ["#C0C0C0","#F59E0B","#CD7F32"];
                    const ranks   = [2,1,3];
                    return (
                      <div key={u.rank} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end" }}>
                        <div style={{ fontSize:24, marginBottom:4 }}>{u.avatar}</div>
                        <div style={{ fontWeight:800, fontSize:12, color:"#0F172A", marginBottom:2 }}>{u.name}</div>
                        <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>{u.xp} XP</div>
                        <div style={{ width:"100%", height:heights[pi], background:`linear-gradient(180deg,${colors[pi]},${colors[pi]}88)`, borderRadius:"10px 10px 0 0", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ fontWeight:900, fontSize:22, color:"#fff" }}>#{ranks[pi]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Full table */}
                <div className="card" style={{ overflow:"hidden" }}>
                  {LEADERBOARD.map((u, i) => (
                    <div key={u.rank} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderBottom:i<LEADERBOARD.length-1?"1px solid #F8FAFC":"none", background:u.isYou?"#EFF6FF":"#fff" }}>
                      <div style={{ width:32, height:32, borderRadius:"50%", background:u.rank<=3?"linear-gradient(135deg,#F59E0B,#EF4444)":"#F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, color:u.rank<=3?"#fff":"#64748B", flexShrink:0 }}>
                        {u.rank<=3?["🥇","🥈","🥉"][u.rank-1]:u.rank}
                      </div>
                      <div style={{ fontSize:22 }}>{u.avatar}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:14, color:"#0F172A" }}>{u.name} {u.flag} {u.isYou && <span style={{ background:"#EFF6FF", color:"#2563EB", borderRadius:10, padding:"1px 8px", fontSize:11, fontWeight:800 }}>YOU</span>}</div>
                        <div style={{ fontSize:12, color:"#64748B" }}>Learning {u.lang} · {u.streak} day streak 🔥</div>
                      </div>
                      <div style={{ fontWeight:900, color:"#D97706", fontSize:15 }}>⭐ {u.xp.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign:"center", marginTop:16 }}>
                  <p style={{ fontSize:12, color:"#94A3B8" }}>Rankings update every 24 hours. Keep practicing to climb! 🚀</p>
                </div>
              </div>
            )}

            <div style={{ textAlign:"center", marginTop:28 }}>
              <button className="btn-primary" onClick={()=>startChat(LANGUAGES[0])}>Continue Learning →</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
