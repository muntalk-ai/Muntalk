'use client';
import { useState, useRef, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
const ADMIN_EMAIL = "muntalkofficial@gmail.com";

// ✅ 50개 언어 리스트 유지
const SUB_LANGS = [
  { id: 'ko-KR', name: 'Korean' }, { id: 'en-US', name: 'English' }, { id: 'ja-JP', name: 'Japanese' },
  { id: 'zh-CN', name: 'Chinese' }, { id: 'es-ES', name: 'Spanish' }, { id: 'fr-FR', name: 'French' },
  { id: 'de-DE', name: 'German' }, { id: 'it-IT', name: 'Italian' }, { id: 'pt-BR', name: 'Portuguese' },
  { id: 'ru-RU', name: 'Russian' }, { id: 'vi-VN', name: 'Vietnamese' }, { id: 'th-TH', name: 'Thai' },
  { id: 'id-ID', name: 'Indonesian' }, { id: 'hi-IN', name: 'Hindi' }, { id: 'ar-SA', name: 'Arabic' },
  { id: 'tr-TR', name: 'Turkish' }, { id: 'nl-NL', name: 'Dutch' }, { id: 'pl-PL', name: 'Polish' },
  { id: 'sv-SE', name: 'Swedish' }, { id: 'da-DK', name: 'Danish' }, { id: 'fi-FI', name: 'Finnish' },
  { id: 'no-NO', name: 'Norwegian' }, { id: 'cs-CZ', name: 'Czech' }, { id: 'el-GR', name: 'Greek' },
  { id: 'hu-HU', name: 'Hungarian' }, { id: 'ro-RO', name: 'Romanian' }, { id: 'uk-UA', name: 'Ukrainian' },
  { id: 'he-IL', name: 'Hebrew' }, { id: 'ms-MY', name: 'Malay' }, { id: 'tl-PH', name: 'Tagalog' },
  { id: 'my-MM', name: 'Burmese' }, { id: 'km-KH', name: 'Khmer' }, { id: 'mn-MN', name: 'Mongolian' },
  { id: 'ne-NP', name: 'Nepali' }, { id: 'tg-TJ', name: 'Tajik' }, { id: 'ky-KG', name: 'Kyrgyz' },
  { id: 'hmn-CN', name: 'Hmong' }, { id: 'ro-MD', name: 'Moldovan' }, { id: 'yue-HK', name: 'Cantonese' },
  { id: 'bn-BD', name: 'Bengali' }, { id: 'pa-IN', name: 'Punjabi' }, { id: 'jv-ID', name: 'Javanese' },
  { id: 'te-IN', name: 'Telugu' }, { id: 'mr-IN', name: 'Marathi' }, { id: 'ta-IN', name: 'Tamil' },
  { id: 'ur-PK', name: 'Urdu' }, { id: 'gu-IN', name: 'Gujarati' }, { id: 'kn-IN', name: 'Kannada' },
  { id: 'ml-IN', name: 'Malayalam' }, { id: 'sk-SK', name: 'Slovak' }
].sort((a, b) => a.name.localeCompare(b.name));

// ✅ 50강좌 더미 데이터 (주요 품사)
const LECTURE_LIST = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `Lesson ${i + 1}: ${['Go', 'Eat', 'Beautiful', 'Quickly', 'Run', 'Happy', 'Very', 'Speak'][i % 8]}`
}));

export default function Conversation({ selectedLangId, selectedTutor, selectedLevel, selectedRole, onBack }: any) {
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  const mainLang = selectedLangId || 'en-US'; 
  const [subLang, setSubLang] = useState('ko-KR'); 
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(LECTURE_LIST[0]);

  const [aiData, setAiData] = useState<any>({ reply: "", translation: "", correction: "", reason: "" });
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]); 
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasGreetingPlayed = useRef(false);

  const mainLangName = SUB_LANGS.find(l => l.id === mainLang)?.name;
  const subLangName = SUB_LANGS.find(l => l.id === subLang)?.name;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email === ADMIN_EMAIL) { setIsAdmin(true); setTimeLeft(9999); }
      else { setTimeLeft(user ? 300 : 180); }
    });
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : prev));
    }, 1000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (e: any) => askGemini(e.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    if (!hasGreetingPlayed.current) {
      askGemini(`START_LECTURE: ${currentLecture.title}`);
      hasGreetingPlayed.current = true;
    }
  }, [subLang]);

  const askGemini = async (prompt: string) => {
    setIsThinking(true);
    try {
      const systemPrompt = `
  # ROLE: Professional Language Tutor (Curriculum Mode)
  # LEVEL: ${selectedLevel}
  # CURRICULUM: Action Verbs 1, Essential Adjectives, Common Adverbs, Action Verbs 2.
  # INSTRUCTION:
  1. If Input contains "START_LECTURE", focus on the specified word.
  2. AI Response: Speak the word, then read 10 sentences slowly in ${mainLangName}.
  3. Translation & Reason: MUST be in ${subLangName}.
  # OUTPUT FORMAT (JSON ONLY):
  {
    "reply": "[Word] 1. sentence... 2. sentence...",
    "translation": "[단어뜻] 1. 번역... (In ${subLangName})",
    "correction": "Encouragement",
    "reason": "Tip in ${subLangName}"
  }`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\nUser Input: " + prompt }] }] })
      });
      
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(rawText.match(/\{[\s\S]*\}/)[0]);
      
      setAiData(result);
      if (!prompt.startsWith("SYSTEM:")) {
        speakResponse(result.reply);
      }
    } catch (e) { console.error(e); } finally { setIsThinking(false); }
  };

  const speakResponse = async (text: string) => {
    try {
      if (audioRef.current) { audioRef.current.pause(); }
      setIsTalking(true);
      const response = await fetch('/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: mainLang, gender: selectedTutor.gender })
      });
      const data = await response.json();
      if (data.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        audio.onended = () => setIsTalking(false);
        await audio.play();
      }
    } catch (e) { setIsTalking(false); }
  };

  return (
    <div style={styles.container}>
      {/* 🟢 왼쪽: 50강좌 드롭다운 목록 추가 */}
      <div style={styles.sidebar}>
        <h3 style={styles.sideTitle}>Curriculum</h3>
        <select 
          style={styles.lectureDropdown} 
          value={currentLecture.id} 
          onChange={(e) => {
            const lecture = LECTURE_LIST.find(l => l.id === Number(e.target.value));
            if (lecture) {
              setCurrentLecture(lecture);
              askGemini(`START_LECTURE: ${lecture.title}`);
            }
          }}
        >
          {LECTURE_LIST.map(l => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
        <div style={styles.lectureList}>
            {LECTURE_LIST.map(l => (
                <div 
                  key={l.id} 
                  style={{...styles.lectureItem, color: currentLecture.id === l.id ? '#58CC02' : '#888'}}
                  onClick={() => {
                    setCurrentLecture(l);
                    askGemini(`START_LECTURE: ${l.title}`);
                  }}
                >
                    {l.id}. {l.title.split(': ')[1]}
                </div>
            ))}
        </div>
      </div>

      {/* 오른쪽: 메인 콘텐츠 영역 */}
      <div style={styles.mainContent}>
        <div style={styles.langSelectorBar}>
          <div style={styles.roleInfo}>
            <span style={styles.timerLabel}>{isAdmin ? "Admin" : `Time: ${Math.floor(timeLeft! / 60)}:${String(timeLeft! % 60).padStart(2, '0')}`}</span>
            <span style={styles.levelLabel}>{selectedRole} | {selectedLevel}</span>
          </div>
          <div style={styles.selectorItem}>
            <button onClick={() => setShowSubMenu(!showSubMenu)} style={styles.langBtn}>Subtitle: {subLangName} ▼</button>
            {showSubMenu && (
              <div style={styles.dropdown}>
                {SUB_LANGS.map(l => (
                  <div key={l.id} onClick={() => {setSubLang(l.id); setShowSubMenu(false);}} style={styles.dropItem}>{l.name}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.videoArea}>
          <video key={isTalking ? 't' : 'i'} src={isTalking ? `/videos/${selectedTutor.id}_talk.mp4` : `/videos/${selectedTutor.id}_idle.mp4`} autoPlay loop muted playsInline style={styles.videoFit} />
        </div>

        <div style={styles.talkArea}>
          <div style={styles.subtitleSection}>
            <div style={styles.targetText}>{isThinking ? "..." : aiData.reply}</div>
            <div style={styles.subText}>{aiData.translation}</div>
          </div>
          <div style={styles.btnGroup}>
            <button onClick={() => { recognitionRef.current.lang = mainLang; isListening ? recognitionRef.current.stop() : recognitionRef.current.start(); }} 
              style={{...styles.ctrlBtn, backgroundColor: isListening ? '#ff4b4b' : '#58CC02'}}>
              {isListening ? "Stop" : "Speak"}
            </button>
            <button onClick={() => setShowReport(true)} style={styles.backBtn}>Finish</button>
          </div>
        </div>
      </div>

      {showReport && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#333'}}>Learning Report</h2>
            <button onClick={onBack} style={styles.closeBtn}>Exit Class</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  container: { height: '100dvh', backgroundColor: '#000', display: 'flex', overflow: 'hidden' },
  sidebar: { width: '220px', backgroundColor: '#1a1a1a', borderRight: '1px solid #333', padding: '20px', display: 'flex', flexDirection: 'column' },
  sideTitle: { color: '#fff', fontSize: '16px', marginBottom: '15px' },
  lectureDropdown: { width: '100%', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: '8px', marginBottom: '20px' },
  lectureList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  lectureItem: { fontSize: '13px', cursor: 'pointer', transition: '0.2s' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column' },
  langSelectorBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' },
  roleInfo: { display: 'flex', flexDirection: 'column' },
  timerLabel: { color: '#fff', fontSize: '13px', fontWeight: 'bold' },
  levelLabel: { color: '#58CC02', fontSize: '10px' },
  selectorItem: { position: 'relative' },
  langBtn: { backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: '5px', padding: '4px 10px', fontSize: '11px' },
  dropdown: { position: 'absolute', top: '35px', right: 0, backgroundColor: '#fff', borderRadius: '8px', width: '120px', maxHeight: '200px', overflowY: 'auto', zIndex: 101 },
  dropItem: { padding: '10px', color: '#333', fontSize: '12px', borderBottom: '1px solid #eee', cursor: 'pointer' },
  videoArea: { height: '65dvh', position: 'relative' },
  videoFit: { width: '100%', height: '100%', objectFit: 'contain' },
  talkArea: { height: '35dvh', backgroundColor: '#1a1a1a', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '15px 20px', display: 'flex', flexDirection: 'column' },
  subtitleSection: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: '20px', padding: '15px', marginBottom: '10px', border: '1px solid #444', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  targetText: { color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' },
  subText: { color: '#58CC02', fontSize: '14px' },
  btnGroup: { display: 'flex', gap: '10px', justifyContent: 'center' },
  ctrlBtn: { width: '120px', padding: '12px', borderRadius: '25px', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  backBtn: { width: '120px', padding: '12px', borderRadius: '25px', backgroundColor: '#ff4b4b', color: '#fff', border: 'none', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', width: '90%', maxWidth: '450px', borderRadius: '25px', padding: '20px' },
  closeBtn: { width: '100%', padding: '15px', backgroundColor: '#58CC02', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }
};