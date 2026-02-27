'use client';
import { useState, useRef, useEffect } from 'react';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;

// 1. 커리큘럼 데이터 구성 (파트당 50개)
const PARTS = [
  { id: 'V1', name: '동사 Part 1', words: ['Go', 'Eat', 'Drink', 'Sleep', 'Buy', 'Sell', 'Work', 'Study', 'Play', 'Read'] },
  { id: 'ADJ', name: '형용사', words: ['Happy', 'Sad', 'Big', 'Small', 'Hot', 'Cold', 'Beautiful', 'Fast', 'Slow', 'Good'] },
  { id: 'ADV', name: '부사', words: ['Always', 'Never', 'Fast', 'Slowly', 'Quietly', 'Early', 'Late', 'Often', 'Hard', 'Very'] },
  { id: 'V2', name: '동사 Part 2', words: ['Understand', 'Believe', 'Remember', 'Forget', 'Think', 'Wait', 'Finish', 'Begin', 'Try', 'Help'] }
];

const SUBJECTS = ['He', 'She', 'It', 'They', 'We', 'The Teacher', 'My Friend', 'The Cat', 'The Doctor', 'I'];

const LECTURES = PARTS.flatMap((part, pIdx) => 
  Array.from({ length: 50 }, (_, i) => ({
    id: `${part.id}-${i + 1}`,
    partName: part.name,
    targetWord: part.words[i % part.words.length],
    subject: SUBJECTS[i % SUBJECTS.length],
    title: `${part.name} ${i + 1}강`
  }))
);

const SUB_LANGS = [
  { id: 'ko-KR', name: 'Korean' }, { id: 'en-US', name: 'English' }, { id: 'ja-JP', name: 'Japanese' },
  { id: 'zh-CN', name: 'Chinese' }, { id: 'es-ES', name: 'Spanish' }, { id: 'fr-FR', name: 'French' }
  // ... 나머지 50개 언어 유지
];

export default function VideoLecturePage() {
  // 상태 관리
  const [nativeLang, setNativeLang] = useState('ko-KR');
  const [targetLang, setTargetLang] = useState('en-US');
  const [currentLec, setCurrentLec] = useState(LECTURES[0]);
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [aiData, setAiData] = useState({ reply: "강의 시작 버튼을 눌러주세요.", translation: "" });
  const [showMenu, setShowMenu] = useState(false);

  // 참조 관리
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopSignal = useRef(false);
  const videoIdleRef = useRef<HTMLVideoElement | null>(null);
  const videoTalkRef = useRef<HTMLVideoElement | null>(null);

  // 초기화: 오디오 및 STT
  useEffect(() => {
    audioRef.current = new Audio();
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onresult = (e: any) => {
        stopAll();
        askGemini(e.results[0][0].transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [targetLang]);

  const stopAll = () => {
    stopSignal.current = true;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    setIsTalking(false);
  };

  const getSystemPrompt = () => `
    Identity: Compact Tutor. NO EMOJIS. NO GREETINGS.
    Topic: "${currentLec.targetWord}" (Part: ${currentLec.partName}).
    Constraint: 
    1. Use ONLY subject "${currentLec.subject}" for ALL 10 examples.
    2. Start directly with core explanation in ${nativeLang}.
    3. List 10 simple sentences in ${targetLang}.
    4. End with: "Any questions?" in ${targetLang}.
    Format: JSON { "reply": "Full lecture text", "translation": "Summary in ${nativeLang}" }
  `;

  const askGemini = async (userText: string) => {
    stopAll();
    setIsThinking(true);
    stopSignal.current = false;
    const isStart = userText === "START_LECTURE";

    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: getSystemPrompt() + (isStart ? "\nStart now." : "\nUser question: " + userText) }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });
      const data = await resp.json();
      const result = JSON.parse(data.candidates[0].content.parts[0].text);
      setAiData(result);
      await speakResponse(result.reply);
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  const speakResponse = async (text: string) => {
    setIsTalking(true);
    try {
      const resp = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: targetLang, ssmlGender: 'FEMALE' },
          audioConfig: { audioEncoding: 'MP3' }
        })
      });
      const data = await resp.json();
      if (audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${data.audioContent}`;
        audioRef.current.onended = () => setIsTalking(false);
        await audioRef.current.play();
      }
    } catch (e) {
      setIsTalking(false);
    }
  };

  const toggleMic = () => {
    if (isListening) recognitionRef.current?.stop();
    else {
      recognitionRef.current.lang = targetLang;
      recognitionRef.current.start();
    }
  };

  return (
    <div style={styles.container}>
      {/* 1. 상단 제어 바 */}
      <div style={styles.topBar}>
        <button onClick={() => setShowMenu(!showMenu)} style={styles.menuBtn}>
          {currentLec.title} ▼
        </button>
        <div style={styles.langPair}>
          <select value={nativeLang} onChange={e => setNativeLang(e.target.value)} style={styles.select}>
            {SUB_LANGS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={targetLang} onChange={e => setTargetLang(e.target.value)} style={styles.select}>
            {SUB_LANGS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>

      {/* 2. 동영상 영역 (Idle/Talk 교체) */}
      <div style={styles.videoArea}>
        <video ref={videoIdleRef} src="/videos/tutor_idle.mp4" autoPlay loop muted playsInline 
          style={{ ...styles.video, opacity: isTalking ? 0 : 1 }} />
        <video ref={videoTalkRef} src="/videos/tutor_talk.mp4" autoPlay loop muted playsInline 
          style={{ ...styles.video, opacity: isTalking ? 1 : 0 }} />
        
        {/* 자막 오버레이 */}
        <div style={styles.subtitleOverlay}>
          <p style={styles.mainSubtitle}>{isThinking ? "Thinking..." : aiData.reply}</p>
          <p style={styles.subSubtitle}>{aiData.translation}</p>
        </div>
      </div>

      {/* 3. 하단 컨트롤러 */}
      <div style={styles.bottomArea}>
        <button onClick={() => askGemini("START_LECTURE")} style={styles.startBtn} disabled={isTalking}>
          강의 시작 (Core Only)
        </button>
        <button 
          onPointerDown={toggleMic} 
          style={{ ...styles.micBtn, backgroundColor: isListening ? '#ff4b4b' : '#58CC02' }}
        >
          {isListening ? "Listening..." : "Push to Talk"}
        </button>
      </div>

      {/* 4. 강좌 선택 사이드 메뉴 */}
      {showMenu && (
        <div style={styles.sideMenu}>
          <div style={styles.menuHeader}>
            <h3>Curriculum</h3>
            <button onClick={() => setShowMenu(false)}>Close</button>
          </div>
          <div style={styles.menuList}>
            {LECTURES.map(lec => (
              <div key={lec.id} onClick={() => { setCurrentLec(lec); setShowMenu(false); stopAll(); }} 
                style={{ ...styles.menuItem, backgroundColor: currentLec.id === lec.id ? '#eee' : 'transparent' }}>
                {lec.title} <small>({lec.subject})</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  container: { position: 'relative', width: '100%', height: '100dvh', backgroundColor: '#000', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  topBar: { position: 'absolute', top: 0, width: '100%', zIndex: 100, display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' },
  menuBtn: { padding: '8px 15px', borderRadius: '20px', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' },
  langPair: { display: 'flex', gap: '5px' },
  select: { padding: '5px', borderRadius: '5px', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '12px' },
  videoArea: { flex: 1, position: 'relative' },
  video: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' },
  subtitleOverlay: { position: 'absolute', bottom: '120px', width: '100%', padding: '20px', textAlign: 'center', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' },
  mainSubtitle: { color: '#fff', fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' },
  subSubtitle: { color: '#ccc', fontSize: '14px', margin: 0 },
  bottomArea: { height: '100px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '15px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', zIndex: 10 },
  startBtn: { flex: 1, height: '50px', borderRadius: '12px', border: 'none', backgroundColor: '#333', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  micBtn: { flex: 2, height: '50px', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },
  sideMenu: { position: 'absolute', top: 0, left: 0, width: '80%', height: '100%', backgroundColor: '#fff', zIndex: 200, padding: '20px', display: 'flex', flexDirection: 'column' },
  menuHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  menuList: { flex: 1, overflowY: 'auto' },
  menuItem: { padding: '12px', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: '14px' }
};