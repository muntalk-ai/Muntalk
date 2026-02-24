'use client';
import { useState, useRef, useEffect } from 'react';

// 환경 변수에서 키 로드
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;

// 주요 50개 언어 지원 리스트
const SUPPORTED_LANGS = [
  { id: 'ko-KR', name: 'Korean' }, { id: 'en-US', name: 'English' }, { id: 'ja-JP', name: 'Japanese' },
  { id: 'zh-CN', name: 'Chinese' }, { id: 'es-ES', name: 'Spanish' }, { id: 'fr-FR', name: 'French' },
  { id: 'de-DE', name: 'German' }, { id: 'it-IT', name: 'Italian' }, { id: 'pt-BR', name: 'Portuguese' },
  { id: 'ru-RU', name: 'Russian' }, { id: 'vi-VN', name: 'Vietnamese' }, { id: 'th-TH', name: 'Thai' },
  { id: 'id-ID', name: 'Indonesian' }, { id: 'tr-TR', name: 'Turkish' }, { id: 'ar-XA', name: 'Arabic' },
  { id: 'hi-IN', name: 'Hindi' }, { id: 'nl-NL', name: 'Dutch' }, { id: 'pl-PL', name: 'Polish' }
].sort((a, b) => a.name.localeCompare(b.name));

export default function UltimateTutorPage() {
  const [nativeLang, setNativeLang] = useState('ko-KR'); 
  const [targetLang, setTargetLang] = useState('en-US'); 
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  
  const recognitionRef = useRef<any>(null);

  // 1. 음성 인식(STT) 설정
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        askGemini(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, [targetLang, nativeLang]);

  const getLangName = (id: string) => SUPPORTED_LANGS.find(l => l.id === id)?.name || "English";

  // 2. Gemini 대화 (JSON 세그먼트 방식)
  const askGemini = async (userText: string) => {
    const isFirst = userText === "START";
    const systemPrompt = `
      Identity: Professional Bilingual Tutor. Native in ${getLangName(nativeLang)}.
      Goal: Teach ${getLangName(targetLang)} through natural conversation.
      
      ### RULES:
      1. Respond ONLY in a JSON array named "segments".
      2. "lang" must be "${nativeLang.split('-')[0]}" (for native explanation) or "${targetLang.split('-')[0]}" (for practice phrases).
      3. First, explain briefly in ${getLangName(nativeLang)}.
      4. Then, provide 1-2 useful phrases in ${getLangName(targetLang)}.
      5. Always end with a simple question in ${getLangName(targetLang)} to encourage the student to speak.
      
      OUTPUT FORMAT: JSON ONLY { "segments": [{ "lang": "...", "text": "..." }] }
    `;

    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...chatHistory.flatMap(h => [
              { role: "user", parts: [{ text: h.user || "수업 시작" }] },
              { role: "model", parts: [{ text: JSON.stringify({ segments: h.segments }) }] }
            ]).filter(c => c.parts[0].text !== ""),
            { role: "user", parts: [{ text: isFirst ? "수업을 시작해주세요." : userText }] }
          ],
          generationConfig: { response_mime_type: "application/json", temperature: 0.7 }
        })
      });

      const data = await resp.json();
      const result = JSON.parse(data.candidates[0].content.parts[0].text);
      
      setChatHistory(prev => [...prev, { user: isFirst ? "" : userText, segments: result.segments }]);
      playSegments(result.segments);
    } catch (e) {
      console.error("Gemini Error:", e);
    }
  };

  // 3. 하이브리드 TTS 재생 (자국어 1.3배속 / 학습어 1.0배속)
  const playSegments = async (segments: any[]) => {
    setIsTalking(true);
    for (const segment of segments) {
      const isTarget = segment.lang.startsWith(targetLang.split('-')[0]);
      const currentLangCode = isTarget ? targetLang : nativeLang;
      
      // ✅ 사장님 커스텀: 설명(Native)은 1.3배속, 연습(Target)은 1.0배속
      const speakingRate = isTarget ? 1.0 : 1.1;

      try {
        const resp = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: segment.text },
            voice: { languageCode: currentLangCode, ssmlGender: 'FEMALE' },
            audioConfig: { audioEncoding: 'MP3', speakingRate: speakingRate }
          })
        });
        const data = await resp.json();
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        
        await new Promise((res) => {
          audio.onended = res;
          audio.play();
        });
      } catch (e) {
        console.error("TTS Error:", e);
      }
    }
    setIsTalking(false);
  };

  // 4. 음성 인식 시작 (다국어 힌트 적용)
  const startListening = () => {
    if (recognitionRef.current) {
      // 학습 언어를 우선 인식 언어로 설정
      recognitionRef.current.lang = targetLang; 
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', color: '#1a73e8' }}>AI Pro Tutor</h1>
      
      <div style={configBoxStyle}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Native (1.3x speed)</label>
          <select value={nativeLang} onChange={e => setNativeLang(e.target.value)} style={selectStyle}>
            {SUPPORTED_LANGS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Target (1.0x speed)</label>
          <select value={targetLang} onChange={e => setTargetLang(e.target.value)} style={selectStyle}>
            {SUPPORTED_LANGS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <button onClick={() => askGemini("START")} style={startBtnStyle} disabled={isTalking}>Start Class</button>
      </div>

      <div style={chatBoxStyle}>
        {chatHistory.length === 0 && <p style={emptyStateStyle}>학습 언어를 선택하고 Start Class를 누르세요.</p>}
        {chatHistory.map((chat, i) => (
          <div key={i} style={{ marginBottom: '20px' }}>
            {chat.user && <div style={userBubbleStyle}>🎤 {chat.user}</div>}
            <div style={aiBubbleStyle}>
              {chat.segments.map((s: any, j: number) => (
                <p key={j} style={{ margin: '5px 0', color: s.lang === targetLang.split('-')[0] ? '#1a73e8' : '#333', fontWeight: s.lang === targetLang.split('-')[0] ? 'bold' : 'normal' }}>
                  {s.text}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={startListening} 
        disabled={isTalking || isListening}
        style={{ ...talkBtnStyle, backgroundColor: isListening ? '#ea4335' : '#34a853' }}
      >
        {isListening ? "Listening..." : "🎤 Push to Talk (Answer in " + getLangName(targetLang) + ")"}
      </button>
    </div>
  );
}

// --- Styles ---
const containerStyle = { padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh' };
const configBoxStyle = { display: 'flex', gap: '15px', marginBottom: '25px', padding: '20px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const labelStyle = { display: 'block', fontSize: '12px', color: '#70757a', marginBottom: '8px', fontWeight: 'bold' };
const selectStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #dadce0', fontSize: '15px' };
const startBtnStyle = { alignSelf: 'flex-end', padding: '10px 20px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const chatBoxStyle = { height: '500px', overflowY: 'auto' as 'auto', padding: '15px', marginBottom: '20px', backgroundColor: '#fff', borderRadius: '15px', border: '1px solid #dadce0' };
const emptyStateStyle = { textAlign: 'center' as 'center', color: '#999', marginTop: '150px' };
const aiBubbleStyle = { padding: '15px', backgroundColor: '#f1f3f4', borderRadius: '15px 15px 15px 0', maxWidth: '85%', marginBottom: '10px', lineHeight: '1.5' };
const userBubbleStyle = { textAlign: 'right' as 'right', padding: '10px', color: '#34a853', fontWeight: 'bold', fontSize: '16px' };
const talkBtnStyle = { width: '100%', padding: '20px', borderRadius: '15px', border: 'none', color: '#fff', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', transition: 'all 0.2s' };