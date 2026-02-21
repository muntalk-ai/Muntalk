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
  const [aiData, setAiData] = useState<any>({ reply: "", translation: "", correction: "", reason: "" });
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
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
    const systemPrompt = getSystemPrompt(selectedLevel, selectedRole, selectedRole, mainLangName!, subLangName!);
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
      {/* 1. 상단 정보 바 */}
      <Header isAdmin={isAdmin} timeLeft={timeLeft} role={selectedRole} level={selectedLevel} ... />

      {/* 2. 비디오 컴포넌트 */}
      <TutorVideo tutorId={selectedTutor.id} isTalking={isTalking} />

      <div style={styles.talkArea}>
        {/* 3. 자막 컴포넌트 */}
        <SubtitleArea reply={aiData.reply} translation={aiData.translation} isThinking={isThinking} />

        {/* 4. 하단 버튼 그룹 */}
        <div style={styles.btnGroup}>
          <button onClick={handleSpeak} style={...}> {isListening ? "Stop" : "Speak"} </button>
          <button onClick={() => setShowReport(true)} style={styles.backBtn}> Finish </button>
        </div>
      </div>

      {/* 5. 리포트 모달 컴포넌트 */}
      {showReport && <ReportModal history={analysisHistory} onBack={onBack} />}
    </div>
  );
}