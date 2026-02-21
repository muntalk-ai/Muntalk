'use client';
import { useState, useRef, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
// 🚀 여기에 추가하시면 됩니다!
import { getSystemPrompt } from '../lib/prompts';
// ✅ 하드코딩된 키를 지우고 환경변수에서 가져오도록 변경
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasGreetingPlayed = useRef(false);

  const mainLangName = SUB_LANGS.find(l => l.id === mainLang)?.name;
  const subLangName = SUB_LANGS.find(l => l.id === subLang)?.name;
 

  // 1. 유저 인증 및 타이머 설정
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

  // 2. 음성 인식 및 첫 대화 시작 (자막 언어 변경 시에도 반응)
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
      // 자막 언어 변경 시 AI에게 지시 사항 업데이트
      askGemini("SYSTEM: Update translation language to " + subLangName);
    }
  }, [subLang]); // subLang이 바뀔 때마다 실행

 const askGemini = async (prompt: string) => {
    setIsThinking(true);
    const isStart = prompt === "START_ROLEPLAY";
    const isLangUpdate = prompt.startsWith("SYSTEM:");

    // 🚀 [아이폰 핵심] 서버 호출 전에 비디오/오디오 권한 사용 중임을 브라우저에 알림
    // 이 코드가 fetch보다 먼저 실행되어야 아이폰이 잠기지 않습니다.
    const videos = document.querySelectorAll('video');
    videos.forEach(v => {
      v.muted = true;
      v.play().catch(() => {}); 
    });
    if (audioRef.current) audioRef.current.play().catch(() => {});

    // 🛠️ lib/prompts.ts에서 정리된 지시사항 가져오기
    const systemPrompt = getSystemPrompt(selectedLevel, selectedRole, mainLangName!, subLangName!);

    try {
      // 🚀 이제 서버와 통신합니다. (위에서 play를 눌러놔서 권한이 유지됨)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
    // 1. 기존 오디오 완전 초기화
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    // 🚀 [아이폰 핵심] fetch(서버통신) 하러 가기 직전에 비디오를 미리 깨워둡니다.
    // 이렇게 해야 AI 답변이 늦게와도 아이폰이 '재생 권한'을 회수하지 않습니다.
    const videos = document.querySelectorAll('video');
    videos.forEach(v => {
      v.muted = true;
      v.play().catch(() => {}); 
    });

    // 서버에 물어보기 전에 미리 "말하는 상태"로 비디오 전환 예약
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
      
      // 🚀 아이폰은 여기서도 거부할 수 있으므로 한 번 더 play()
      await audio.play().catch(() => {
        // 만약 소리가 안나면 수동 클릭이라도 유도해야함 (비디오는 일단 돌려둠)
        setIsTalking(false);
      });
    }
  } catch (error) {
    console.error("TTS Error:", error);
    setIsTalking(false);
  }
};

  return (
    <div style={styles.container}>
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
  {/* 1. Idle 비디오 */}
 {/* 1. Idle 비디오 */}
<video 
  src={`/videos/${selectedTutor.id}_idle.mp4`} 
  autoPlay loop muted playsInline 
  webkit-playsinline="true" // 👈 iOS Safari 구형 대응
  preload="auto"
  style={{
    ...styles.videoFit,
    position: 'absolute',
    top: 0, left: 0,
    zIndex: 1,
    opacity: isTalking ? 0 : 1,
    pointerEvents: 'none' // 👈 비디오가 클릭을 방해하지 못하게
  }} 
/>

{/* 2. Talking 비디오 */}
<video 
  src={`/videos/${selectedTutor.id}_talk.mp4`} 
  autoPlay loop muted playsInline 
  webkit-playsinline="true" // 👈 iOS 필수
  preload="auto"
  style={{
    ...styles.videoFit,
    position: 'absolute',
    top: 0, left: 0,
    zIndex: 2,
    opacity: isTalking ? 1 : 0,
    pointerEvents: 'none' // 👈 iOS에서 탭 가로채기 방지
  }}
  />
</div>

      <div style={styles.talkArea}>
        {/* 자막 영역: 내용이 많아지면 여기서만 스크롤이 생깁니다 */}
        <div style={styles.subtitleSection}>
          <div style={styles.targetText}>{isThinking ? "..." : aiData.reply}</div>
          <div style={styles.subText}>{aiData.translation}</div>
          {/* 자동 스크롤을 위한 위치 표시 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 버튼 영역: 자막 내용과 상관없이 항상 하단에 고정됩니다 */}
        {/* 버튼 영역: btnGroup으로 감싸서 두 버튼이 나란히 나오게 합니다 */}
        <div style={styles.btnGroup}>
          <button 
            onClick={() => { 
              // 🚀 아이폰 잠금 해제 핵심 로직
              const videos = document.querySelectorAll('video');
              videos.forEach(v => {
                v.muted = true;
                v.play().catch(() => {}); 
              });

              if (audioRef.current) {
                audioRef.current.play().catch(() => {});
              }

              // 그 다음에 음성 인식 시작
              recognitionRef.current.lang = mainLang;
              isListening ? recognitionRef.current.stop() : recognitionRef.current.start(); 
            }} 
            style={{...styles.ctrlBtn, backgroundColor: isListening ? '#ff4b4b' : '#58CC02'}}
          >
            {isListening ? "Stop" : "Speak"}
          </button>

          {/* 👈 Finish 버튼이 꼭 있어야 리포트를 볼 수 있습니다! */}
          <button onClick={() => setShowReport(true)} style={styles.backBtn}>
            Finish
          </button>
        </div>
      </div>
      {showReport && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#333'}}>Learning Report</h2>
            <div style={styles.reportList}>
              {analysisHistory.length === 0 ? <p style={{textAlign: 'center', color: '#888'}}>No conversations recorded.</p> : 
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
  videoArea: { 
    height: '60dvh', // ✅ 정확한 높이를 지정
    width: '100%',
    position: 'relative', 
    backgroundColor: '#000',
    overflow: 'hidden' 
  },
  videoFit: { 
    width: '100%', 
    height: '100%', 
    objectFit: 'contain'
    // 💡 여기서 position: 'absolute'는 위 JSX 코드 안에서 직접 주는 게 더 확실합니다.
  },
  talkArea: { 
    flex: 1, // ✅ 남은 공간을 채우도록 설정
    backgroundColor: '#1a1a1a', 
    display: 'flex', 
    flexDirection: 'column'
  },
  subtitleSection: { 
    flex: 1, 
    backgroundColor: '#2a2a2a', 
    borderRadius: '20px', 
    padding: '15px', 
    marginBottom: '15px', // 버튼과의 간격
    border: '1px solid #444', 
    textAlign: 'center', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center',
    overflowY: 'auto', // 👈 핵심: 내용이 많으면 자막 영역 안에서만 스크롤 발생
    minHeight: '0'     // 👈 flex 박스 안에서 스크롤이 작동하게 만드는 팁
  },
  targetText: { color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' },
  subText: { color: '#58CC02', fontSize: '14px' },
  btnGroup: { 
    display: 'flex', 
    gap: '10px', 
    justifyContent: 'center',
    paddingBottom: '10px' // 바닥에 너무 붙지 않게 여백
  },
  ctrlBtn: { width: '120px', padding: '12px', borderRadius: '25px', color: '#fff', fontWeight: 'bold', border: 'none' },
  backBtn: { width: '120px', padding: '12px', borderRadius: '25px', backgroundColor: '#ff4b4b', color: '#fff', border: 'none' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', width: '90%', maxWidth: '450px', borderRadius: '25px', padding: '20px' },
  reportList: { maxHeight: '60dvh', overflowY: 'auto', margin: '15px 0' },
  reportCard: { backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #eee' },
  reasonBox: { fontSize: '12px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '5px', marginTop: '5px' },
  closeBtn: { width: '100%', padding: '15px', backgroundColor: '#58CC02', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold' }
};