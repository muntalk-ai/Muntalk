'use client';
import { useState, useRef, useEffect } from 'react';

// ... (SUB_LANGS, LECTURE_LIST 상단 동일)
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

const LECTURE_LIST = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `Lesson ${i + 1}: ${['Go', 'Eat', 'Beautiful', 'Quickly', 'Run', 'Happy', 'Very', 'Speak'][i % 8]}`
}));

export default function ConversationBasic({ selectedLangId, selectedTutor, onBack }: any) {
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [subLang, setSubLang] = useState('ko-KR');
  const [currentLecture, setCurrentLecture] = useState(LECTURE_LIST[0]);
  
  // 🌟 초기 데이터 상태 수정 (reply와 translations 포함)
  const [aiData, setAiData] = useState<any>({ reply: "Select a lesson!", translations: {} });
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mainLang = selectedLangId || 'en-US'; 

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (e: any) => askGemini(e.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const askGemini = async (userText: string) => {
    if (isThinking) return;
    setIsThinking(true);
    try {
      const word = userText.includes(':') ? userText.split(': ')[1].trim() : userText.trim();
      const safeWord = word.replace(/\s+/g, '-').replace(/\.+$/, '');
      const filePath = `/data/${mainLang}/${safeWord}.json`;
      
      console.log("📂 요청 파일:", filePath);
      const response = await fetch(filePath);
      
      if (!response.ok) throw new Error("File not found");

      const result = await response.json();
      const dataToSet = Array.isArray(result) ? result[0] : result;
      
      if (!dataToSet || !dataToSet.reply) {
        throw new Error("Invalid data structure in JSON");
      }
      
      setAiData(dataToSet);
      speakResponse(dataToSet.reply, mainLang);
    } catch (e) { 
      console.error("데이터 로딩 실패:", e);
      setAiData({ reply: "Lesson ready soon!", translations: {} });
    } finally { setIsThinking(false); }
  };

  const speakResponse = async (text: string, lang: string) => {
    if (!text) return;
    setIsTalking(true);
    console.log(`🔊 TTS 요청 시작: ${text} | 언어: ${lang}`); 
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          lang, 
          gender: selectedTutor?.gender || 'female' 
        })
      });
      
      if (!response.ok) throw new Error(`TTS API Error: ${response.status}`);
      
      const data = await response.json();
      
      if (data.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        audio.onended = () => setIsTalking(false);
        audio.play().catch(e => console.error("🔊 오디오 재생 실패:", e));
      } else {
        console.error("🔊 오디오 데이터가 비어있음");
        setIsTalking(false);
      }
    } catch (e) {
      console.error("🔊 TTS 전체 과정 실패:", e);
      setIsTalking(false);
    }
  };

  // 🌟 🌟 🌟 🌟 🌟 핵심 수정: subLang에 따른 자막 표시 🌟 🌟 🌟 🌟 🌟
  const currentSubtitle = aiData.translations?.[subLang] || "No translation available";

  return (
    <div style={styles.container}>
      {/* 사이드바 */}
      <div style={styles.sidebar}>
        <h3 style={styles.sideTitle}>BASIC</h3>
        
        {/* 자막 언어 선택 드롭다운 */}
        <div style={{ marginBottom: '25px', padding: '0 10px' }}>
          <label style={{ fontSize: '0.7rem', color: '#58CC02', display: 'block', marginBottom: '8px' }}>SUBTITLE</label>
          <select value={subLang} onChange={(e) => setSubLang(e.target.value)} style={styles.selectBox}>
            {SUB_LANGS.map(lang => (
              <option key={lang.id} value={lang.id} style={{backgroundColor: '#111'}}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.lectureList}>
          {LECTURE_LIST.map(l => (
            <div key={l.id} 
                 style={{
                   ...styles.lectureItem, 
                   backgroundColor: currentLecture.id === l.id ? '#58CC0220' : 'transparent',
                   color: currentLecture.id === l.id ? '#58CC02' : '#888',
                   fontWeight: currentLecture.id === l.id ? 'bold' : 'normal',
                   borderLeft: currentLecture.id === l.id ? '3px solid #58CC02' : '3px solid transparent'
                 }}
                 onClick={() => { setCurrentLecture(l); askGemini(l.title); }}>
              {l.title.split(': ')[1]}
            </div>
          ))}
        </div>
      </div>

      {/* 메인 화면 */}
      <div style={styles.mainContent}>
        <div style={styles.videoArea}>
          <video 
            key={isTalking ? 't' : 'i'} 
            src={isTalking ? `/videos/${selectedTutor?.id || 'tutor1'}_talk.mp4` : `/videos/${selectedTutor?.id || 'tutor1'}_idle.mp4`} 
            autoPlay loop muted playsInline style={styles.videoFit} 
          />
        </div>

        <div style={styles.talkArea}>
          <div style={styles.subtitleSection}>
            <div style={styles.targetText}>{isThinking ? "Loading..." : aiData.reply}</div>
            
            {/* 🌟 수정: 동적 자막 표시 */}
            <div style={styles.subText}>{currentSubtitle}</div>
          </div>
          
          <div style={styles.btnGroup}>
            <button onClick={() => isListening ? recognitionRef.current.stop() : recognitionRef.current.start()} 
                    style={{...styles.ctrlBtn, backgroundColor: isListening ? '#ff4b4b' : '#58CC02'}}>
              {isListening ? "Listening..." : "Push to Speak"}
            </button>
            <button onClick={onBack} style={styles.backBtn}>Exit</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 스타일 객체
const styles: any = {
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#0a0a0a', color: 'white', overflow: 'hidden' },
  sidebar: { width: '220px', backgroundColor: '#111', padding: '40px 10px', overflowY: 'auto', borderRight: '1px solid #222' },
  sideTitle: { fontSize: '0.8rem', letterSpacing: '3px', marginBottom: '30px', color: '#58CC02', textAlign: 'center', opacity: 0.6 },
  selectBox: {
    width: '100%', padding: '10px', backgroundColor: '#1a1a1a', color: '#eee', border: '1px solid #333', borderRadius: '8px',
    fontSize: '0.85rem', outline: 'none', cursor: 'pointer', appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2358CC02%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px top 50%', backgroundSize: '10px auto',
  },
  lectureList: { display: 'flex', flexDirection: 'column', gap: '2px' },
  lectureItem: { padding: '12px 20px', cursor: 'pointer', fontSize: '0.9rem', transition: '0.2s' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%' },
  videoArea: { height: '40%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', backgroundColor: '#000', paddingBottom: '20px' },
  videoFit: { height: '80%', borderRadius: '15px', border: '1px solid #333' },
  talkArea: { height: '60%', padding: '20px 40px', backgroundColor: '#0a0a0a', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: '40px' },
  subtitleSection: { marginBottom: '40px', minHeight: '120px' },
  targetText: { fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '15px', lineHeight: '1.3', color: '#fff' },
  subText: { fontSize: '1.3rem', color: '#666' },
  btnGroup: { display: 'flex', gap: '15px', justifyContent: 'center', marginTop: 'auto', marginBottom: '40px' },
  ctrlBtn: { padding: '15px 40px', borderRadius: '40px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
  backBtn: { padding: '15px 40px', borderRadius: '40px', border: '1px solid #333', backgroundColor: 'transparent', color: '#444', cursor: 'pointer' }
};