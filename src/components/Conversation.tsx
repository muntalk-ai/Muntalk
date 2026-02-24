'use client';
import { useState, useRef, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [showReport, setShowReport] = useState(false); // 리포트 팝업 상태 추가
  
  const mainLang = selectedLangId || 'en-US'; 
  const [subLang, setSubLang] = useState('ko-KR'); 
  const [showSubMenu, setShowSubMenu] = useState(false);

  const [aiData, setAiData] = useState<any>({ reply: "", translation: "", correction: "", reason: "" });
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]); 
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoIdleRef = useRef<HTMLVideoElement | null>(null);
  const videoTalkRef = useRef<HTMLVideoElement | null>(null);
  const isAudioUnlocked = useRef(false);
  const hasGreetingPlayed = useRef(false);

  // 1. 초기화 및 Safari/iOS 최적화
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const handleDeviceChange = () => {
      if (videoIdleRef.current) videoIdleRef.current.play().catch(() => {});
      if (videoTalkRef.current) videoTalkRef.current.play().catch(() => {});
    };
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    const enableVideo = () => {
      videoIdleRef.current?.play().catch(() => {});
      videoTalkRef.current?.play().catch(() => {});
    };
    window.addEventListener('touchstart', enableVideo, { once: true });
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      window.removeEventListener('touchstart', enableVideo);
    };
  }, []);

  // 2. 오디오 잠금 해제
  const unlockAudio = async () => {
    if (isAudioUnlocked.current) return;
    if (audioRef.current) {
      audioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A";
      try {
        await audioRef.current.play();
        isAudioUnlocked.current = true;
        if ((navigator as any).audioSession) {
          (navigator as any).audioSession.type = 'play-and-record';
        }
      } catch (err) {
        console.error("Audio unlock failed:", err);
      }
    }
  };

  const mainLangName = SUB_LANGS.find(l => l.id === mainLang)?.name || "English";
  const subLangName = SUB_LANGS.find(l => l.id === subLang)?.name || "Korean";

  // 3. 타이머 및 관리자 설정
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email === ADMIN_EMAIL) { setIsAdmin(true); setTimeLeft(9999); }
      else { setTimeLeft(user ? 300 : 180); }
    });
    const timer = setInterval(() => setTimeLeft((p) => (p && p > 0 ? p - 1 : p)), 1000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, []);

  // 4. STT 설정 및 초기 인사
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (e: any) => askGemini(e.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
    if (!hasGreetingPlayed.current) {
      askGemini("START_ROLEPLAY");
      hasGreetingPlayed.current = true;
    } else {
      askGemini("SYSTEM: Update translation language to " + subLangName);
    }
  }, [subLang]);

  // 5. Gemini API 호출
  const askGemini = async (prompt: string) => {
    setIsThinking(true);
    const isStart = prompt === "START_ROLEPLAY";
    const isLangUpdate = prompt.startsWith("SYSTEM:");
    try {
      const systemPrompt = `
        STRICT OPERATING INSTRUCTIONS:
        1. Role: ${selectedRole}. Level: ${selectedLevel}.
        2. AI Main Response (reply): MUST be in ${mainLangName}.
        3. Translation & Reason Language: MUST be in ${subLangName}.
        4. OUTPUT FORMAT: JSON ONLY { 
           "reply": "AI response in ${mainLangName}", 
           "translation": "Translation in ${subLangName}", 
           "correction": "Corrected user sentence", 
           "reason": "Why corrected (in ${subLangName})" 
        }
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: `### SYSTEM DIRECTIVE: ${systemPrompt}\n\nUser Input: ${prompt}` }] }],
          generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
      });
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(rawText.match(/\{[\s\S]*\}/)[0]);
      setAiData(result);
      if (!isLangUpdate) {
        if (!isStart) setAnalysisHistory(prev => [...prev, { user: prompt, better: result.correction, reason: result.reason }]);
        speakResponse(result.reply);
      }
    } catch (e) { console.error("Gemini Error:", e); } finally { setIsThinking(false); }
  };

  // 6. TTS 재생
  const speakResponse = async (text: string) => {
    try {
      setIsTalking(true);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: mainLang, gender: selectedTutor.gender })
      });
      const data = await response.json();
      if (data.audioContent && audioRef.current) {
        const audio = audioRef.current;
        audio.src = `data:audio/mp3;base64,${data.audioContent}`;
        audio.onended = () => setIsTalking(false);
        await audio.play();
      }
    } catch (error) { setIsTalking(false); }
  };

  // 7. 마이크 제어
  const toggleMic = async () => {
    await unlockAudio();
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = mainLang;
      try { recognitionRef.current.start(); } catch (e) { console.error(e); }
    }
  };

  // 8. 종료 처리 (리포트 보여주기)
  const handleFinish = () => {
    setShowReport(true); // 바로 나가지 않고 리포트를 띄웁니다.
  };

  return (
    <div style={styles.container}>
      <div style={styles.langSelectorBar}>
        <div style={styles.roleInfo}>
          <span style={styles.timerLabel}>
            {isAdmin ? "Admin" : `Time: ${timeLeft !== null ? Math.floor(timeLeft / 60) + ":" + String(timeLeft % 60).padStart(2, '0') : "0:00"}`}
          </span>
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
        <video ref={videoIdleRef} src={`/videos/${selectedTutor.id}_idle.mp4`} autoPlay loop muted playsInline style={{ ...styles.videoFit, zIndex: 1, opacity: isTalking ? 0 : 1 }} />
        <video ref={videoTalkRef} src={`/videos/${selectedTutor.id}_talk.mp4`} autoPlay loop muted playsInline style={{ ...styles.videoFit, zIndex: 2, opacity: isTalking ? 1 : 0 }} />
      </div>

      <div style={styles.talkArea}>
        <div style={styles.subtitleSection}>
          <div style={styles.targetText}>{isThinking ? "..." : aiData.reply}</div>
          <div style={styles.subText}>{aiData.translation}</div>
        </div>
        <div style={styles.btnGroup}>
          <button 
            onPointerDown={async (e) => { e.preventDefault(); e.stopPropagation(); await toggleMic(); }} 
            style={{ ...styles.ctrlBtn, backgroundColor: isListening ? '#ff4b4b' : '#58CC02' }}
          >
            {isListening ? "Stop" : "Speak"}
          </button>
          
          <button 
            onClick={handleFinish}
            style={styles.backBtn}
          >
            Finish
          </button>
        </div>
      </div>

      {/* --- 통합된 러닝 리포트 팝업 --- */}
      {showReport && (
        <div style={styles.reportOverlay}>
          <div style={styles.reportBox}>
            <h2 style={styles.reportTitle}>Learning Report</h2>
            <div style={styles.reportScroll}>
              {analysisHistory.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>No conversation data yet.</p>
              ) : (
                analysisHistory.map((item, i) => (
                  <div key={i} style={styles.reportItem}>
                    <p style={styles.userTxt}>🗨️ Your: {item.user}</p>
                    <p style={styles.betterTxt}>✅ Better: {item.better}</p>
                    <p style={styles.reasonTxt}>💡 {item.reason}</p>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => onBack()} style={styles.reportCloseBtn}>Exit Conversation</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  container: { position: 'relative', width: '100%', height: '100dvh', backgroundColor: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  langSelectorBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), transparent)' },
  roleInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  timerLabel: { fontSize: '14px', fontWeight: 'bold', color: '#58CC02' },
  levelLabel: { fontSize: '12px', color: '#666' },
  selectorItem: { position: 'relative' },
  langBtn: { padding: '8px 14px', borderRadius: '20px', border: '2px solid #e5e5e5', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' },
  dropdown: { position: 'absolute', top: '40px', right: 0, width: '140px', maxHeight: '250px', overflowY: 'auto', backgroundColor: '#fff', border: '2px solid #e5e5e5', borderRadius: '12px', zIndex: 110, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
  dropItem: { padding: '10px 15px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #f1f1f1' },
  videoArea: { flex: 1, position: 'relative', backgroundColor: '#000' },
  videoFit: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' },
  talkArea: { padding: '20px', paddingBottom: '40px', background: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', marginTop: '-24px', zIndex: 10, boxShadow: '0 -5px 20px rgba(0,0,0,0.05)' },
  subtitleSection: { minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', marginBottom: '20px', padding: '0 10px' },
  targetText: { fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '8px', lineHeight: '1.3' },
  subText: { fontSize: '15px', color: '#888', lineHeight: '1.2' },
  btnGroup: { display: 'flex', gap: '12px', alignItems: 'center' },
  ctrlBtn: { flex: 2, height: '56px', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.2)', transition: 'all 0.1s' },
  backBtn: { flex: 1, height: '56px', borderRadius: '16px', border: '2px solid #e5e5e5', color: '#afafaf', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#fff', cursor: 'pointer' },

  // 리포트 팝업 스타일
  reportOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
  reportBox: { backgroundColor: '#fff', width: '100%', maxWidth: '450px', maxHeight: '80vh', borderRadius: '28px', padding: '25px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  reportTitle: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center', color: '#333' },
  reportScroll: { flex: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' },
  reportItem: { marginBottom: '18px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '16px' },
  userTxt: { fontSize: '14px', color: '#666', marginBottom: '5px' },
  betterTxt: { fontSize: '16px', fontWeight: 'bold', color: '#58CC02', marginBottom: '5px' },
  reasonTxt: { fontSize: '13px', color: '#888', lineHeight: '1.4' },
  reportCloseBtn: { height: '56px', borderRadius: '16px', backgroundColor: '#58CC02', color: '#fff', fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }
};