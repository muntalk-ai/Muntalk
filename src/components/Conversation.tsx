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
  const [showReport, setShowReport] = useState(false);
  
  const mainLang = selectedLangId || 'en-US'; 
  const [subLang, setSubLang] = useState('ko-KR'); 
  const [showSubMenu, setShowSubMenu] = useState(false);

  const [aiData, setAiData] = useState<any>({ reply: "", translation: "", correction: "", reason: "" });
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]); 
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasGreetingPlayed = useRef(false);
  // [추가] 아이폰 세션 유지를 위해 오디오 객체를 미리 생성합니다.
  useEffect(() => {
    audioRef.current = new Audio();
  }, []);
  // iOS 오디오 세션 활성화 체크를 위한 Ref
  const isAudioUnlocked = useRef(false);

  const mainLangName = SUB_LANGS.find(l => l.id === mainLang)?.name || "English";
  const subLangName = SUB_LANGS.find(l => l.id === subLang)?.name || "Korean";

  // 1. iOS 사파리용 오디오 잠금 해제 함수
  const unlockAudioSession = () => {
    if (isAudioUnlocked.current) return;
    const unlock = new Audio();
    unlock.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="; // 무음 데이터
    unlock.play().then(() => {
      isAudioUnlocked.current = true;
      console.log("iOS Audio Session Unlocked");
    }).catch(e => console.log("Unlock waiting for interaction", e));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email === ADMIN_EMAIL) { setIsAdmin(true); setTimeLeft(9999); }
      else { setTimeLeft(user ? 300 : 180); }
    });
    const timer = setInterval(() => setTimeLeft((p) => (p && p > 0 ? p - 1 : p)), 1000);
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
    } else {
      askGemini("SYSTEM: Update translation language to " + subLangName);
    }
  }, [subLang]);

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
        4. CRITICAL: Do NOT use Korean for translation or reason unless ${subLangName} is Korean.
        5. IGNORE PREVIOUS CONTEXT regarding language usage. Use ${subLangName} NOW.

        OUTPUT FORMAT (JSON ONLY):
        {
          "reply": "...",
          "translation": "...",
          "correction": "...",
          "reason": "..."
        }
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ 
            parts: [{ text: `### SYSTEM DIRECTIVE: ${systemPrompt}\n\nUser Input: ${prompt}` }] 
          }],
          generationConfig: { 
            response_mime_type: "application/json",
            temperature: 0.1 
          }
        })
      });
      
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(rawText.match(/\{[\s\S]*\}/)[0]);
      
      setAiData(result);

      if (!isLangUpdate) {
        if (!isStart) {
          setAnalysisHistory(prev => [...prev, { user: prompt, better: result.correction, reason: result.reason }]);
        }
        speakResponse(result.reply);
      }
    } catch (e) { 
      console.error("Gemini Error:", e); 
    } finally { 
      setIsThinking(false); 
    }
  };

 const speakResponse = async (text: string) => {
    try {
      setIsTalking(true);
      const response = await fetch('/api/tts', { /* ...기존 내용... */ });
      const data = await response.json();

      if (data.audioContent && audioRef.current) {
        // [수정] 새로운 객체를 만들지 않고 기존 객체의 소스(src)만 바꿉니다.
        audioRef.current.src = `data:audio/mp3;base64,${data.audioContent}`;
        audioRef.current.onended = () => setIsTalking(false);
        await audioRef.current.play();
      }
    } catch (error) {
      setIsTalking(false);
    }
  };
        }
      }
    } catch (error) {
      setIsTalking(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.langSelectorBar}>
        <div style={styles.roleInfo}>
           <span style={styles.timerLabel}>{isAdmin ? "Admin" : `Time: ${timeLeft !== null ? Math.floor(timeLeft / 60) + ":" + String(timeLeft % 60).padStart(2, '0') : "0:00"}`}</span>
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
        {/* iOS 대응: playsInline 필수, webkit-playsinline 추가 */}
        <video 
          key="idle-vid"
          src={`/videos/${selectedTutor.id}_idle.mp4`} 
          autoPlay loop muted playsInline 
          // @ts-ignore
          webkit-playsinline="true" 
          style={{ ...styles.videoFit, zIndex: 1, opacity: isTalking ? 0 : 1 }} 
        />
        <video 
          key="talk-vid"
          src={`/videos/${selectedTutor.id}_talk.mp4`} 
          autoPlay loop muted playsInline 
          // @ts-ignore
          webkit-playsinline="true" 
          style={{ ...styles.videoFit, zIndex: 2, opacity: isTalking ? 1 : 0 }} 
        />
      </div>

      <div style={styles.talkArea}>
        <div style={styles.subtitleSection}>
          <div style={styles.targetText}>{isThinking ? "..." : aiData.reply}</div>
          <div style={styles.subText}>{aiData.translation}</div>
        </div>

        <div style={styles.btnGroup}>
         <button onClick={() => { 
    // [추가] 버튼 누르는 순간 빈 소리를 재생해서 아이폰 오디오를 깨웁니다.
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    if (recognitionRef.current) {
      recognitionRef.current.lang = mainLang; 
      isListening ? recognitionRef.current.stop() : recognitionRef.current.start(); 
    }
}}
            style={{...styles.ctrlBtn, backgroundColor: isListening ? '#ff4b4b' : '#58CC02'}}>
            {isListening ? "Stop" : "Speak"}
          </button>
          <button onClick={() => setShowReport(true)} style={styles.backBtn}>Finish</button>
        </div>
      </div>

      {showReport && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#333'}}>Learning Report</h2>
            <div style={styles.reportList}>
              {analysisHistory.length === 0 ? <p style={{textAlign: 'center', color: '#888'}}>No records yet.</p> : 
                analysisHistory.map((item, i) => (
                <div key={i} style={styles.reportCard}>
                  <div style={{color: '#ff4b4b', fontSize: '13px'}}>❌ {item.user}</div>
                  <div style={{color: '#58CC02', fontWeight: 'bold', margin: '5px 0'}}>✅ {item.better}</div>
                  <div style={styles.reasonBox}>💡 {item.reason}</div>
                </div>
              ))}
            </div>
            <button onClick={onBack} style={styles.closeBtn}>Exit Class</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 스타일 시트는 원본과 동일하게 유지 (수정 없음)
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
  videoArea: { height: '60dvh', width: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' },
  videoFit: { width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0, transition: 'opacity 0.2s linear' },
  talkArea: { flex: 1, backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column' },
  subtitleSection: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: '20px', padding: '15px', marginBottom: '15px', border: '1px solid #444', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto', minHeight: '0' },
  targetText: { color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' },
  subText: { color: '#58CC02', fontSize: '14px' },
  btnGroup: { display: 'flex', gap: '10px', justifyContent: 'center', paddingBottom: '10px' },
  ctrlBtn: { width: '120px', padding: '12px', borderRadius: '25px', color: '#fff', fontWeight: 'bold', border: 'none' },
  backBtn: { width: '120px', padding: '12px', borderRadius: '25px', backgroundColor: '#ff4b4b', color: '#fff', border: 'none' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', width: '90%', maxWidth: '450px', borderRadius: '25px', padding: '20px' },
  reportList: { maxHeight: '60dvh', overflowY: 'auto', margin: '15px 0' },
  reportCard: { backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #eee' },
  reasonBox: { fontSize: '12px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '5px', marginTop: '5px' },
  closeBtn: { width: '100%', padding: '15px', backgroundColor: '#58CC02', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold' }
};