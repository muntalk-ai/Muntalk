'use client';
import { useState, useRef, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getSystemPrompt } from '../lib/prompts';

// 분리한 컴포넌트 임포트
import TutorVideo from './TutorVideo';
import SubtitleArea from './SubtitleArea';
import ReportModal from './ReportModal';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
const ADMIN_EMAIL = "muntalkofficial@gmail.com";

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
  { id: 'hmn-CN', name: 'Hmong' }, { id: 'ro-MD', name: 'Moldovan' }, { id: 'yue-HK', name: 'Cantonese' }
];

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
      else { setTimeLeft(user ? 420 : 180); }
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
      askGemini("START_ROLEPLAY");
      hasGreetingPlayed.current = true;
    }
  }, []);

  const askGemini = async (prompt: string) => {
    if (!prompt) return;
    setIsThinking(true);
    const isStart = prompt === "START_ROLEPLAY";
    const cacheBuster = new Date().getTime();
    
    const videos = document.querySelectorAll('video');
    videos.forEach(v => { v.muted = true; v.play().catch(() => {}); });

    const systemPrompt = getSystemPrompt(selectedLevel, selectedRole, selectedRole, mainLangName!, subLangName!);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}&t=${cacheBuster}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\nUser Input: " + prompt }] }]
        })
      });
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(rawText.match(/\{[\s\S]*\}/)[0]);
      setAiData(result);
      if (!isStart) {
        setAnalysisHistory(prev => [...prev, { user: prompt, better: result.correction, reason: result.reason }]);
      }
      speakResponse(result.reply);
    } catch (e) { 
      console.error("Gemini Error:", e); 
    } finally { 
      setIsThinking(false); 
    }
  };

  const speakResponse = async (text: string) => {
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      const videos = document.querySelectorAll('video');
      videos.forEach(v => { v.muted = true; v.play().catch(() => {}); });
      setIsTalking(true); 
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: mainLang, gender: selectedTutor.gender })
      });
      const data = await response.json();
      if (data.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        audio.onended = () => setIsTalking(false);
        await audio.play().catch(() => { setIsTalking(false); });
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsTalking(false);
    }
  };

  const handleSpeak = () => {
    const videos = document.querySelectorAll('video');
    videos.forEach(v => { v.muted = true; v.play().catch(() => {}); });
    recognitionRef.current.lang = mainLang;
    isListening ? recognitionRef.current.stop() : recognitionRef.current.start();
  };

  // ✅ 174번 줄 근처에서 닫혀있던 중괄호를 제거하고, 여기서 return을 시작합니다.
  return (
    <div style={styles.container}>
      {/* 1. 상단 바 */}
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

      {/* 2. 비디오 컴포넌트 */}
      <TutorVideo tutorId={selectedTutor.id} isTalking={isTalking} />

      {/* 3. 하단 영역 */}
      <div style={styles.talkArea}>
        <SubtitleArea reply={aiData.reply} translation={aiData.translation} isThinking={isThinking} />

        <div style={styles.btnGroup}>
          <button 
            onClick={handleSpeak} 
            style={{...styles.ctrlBtn, backgroundColor: isListening ? '#ff4b4b' : '#58CC02'}}
          >
            {isListening ? "Stop" : "Speak"}
          </button>
          <button onClick={() => setShowReport(true)} style={styles.backBtn}>
            Finish
          </button>
        </div>
      </div>

      {/* 4. 리포트 모달 */}
      {showReport && (
        <ReportModal history={analysisHistory} onBack={onBack} />
      )}
    </div>
  );
}

const styles: any = {
  container: { height: '100dvh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  langSelectorBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333', zIndex: 100 },
  roleInfo: { display: 'flex', flexDirection: 'column' },
  timerLabel: { color: '#fff', fontSize: '13px', fontWeight: 'bold' },
  levelLabel: { color: '#58CC02', fontSize: '10px' },
  selectorItem: { position: 'relative' },
  langBtn: { backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: '5px', padding: '4px 10px', fontSize: '11px' },
  dropdown: { position: 'absolute', top: '35px', right: 0, backgroundColor: '#fff', borderRadius: '8px', width: '120px', maxHeight: '200px', overflowY: 'auto', zIndex: 101 },
  dropItem: { padding: '10px', color: '#333', fontSize: '12px', borderBottom: '1px solid #eee' },
  talkArea: { flex: 1, backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', padding: '15px' },
  btnGroup: { display: 'flex', gap: '15px', justifyContent: 'center', paddingBottom: '10px' },
  ctrlBtn: { width: '130px', padding: '14px', borderRadius: '30px', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  backBtn: { width: '130px', padding: '14px', borderRadius: '30px', backgroundColor: '#ff4b4b', color: '#fff', border: 'none', cursor: 'pointer' },
};