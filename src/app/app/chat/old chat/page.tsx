"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function ChatPage() {
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hello! I am your teacher. Click the mic and say something!' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false); // 마이크 상태
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🔊 TTS: AI의 대답을 영어로 읽어주는 함수
  const speak = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // 영어 설정
      window.speechSynthesis.speak(utterance);
    }
  };

  // 🎤 STT: 내 목소리를 텍스트로 바꾸는 함수
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("이 브라우저는 음성 인식을 지원하지 않습니다.");

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const handleSend = async (manualInput?: string) => {
    const textToSend = manualInput || input;
    if (!textToSend.trim() || loading) return;

    // 1. 내 메시지 추가
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    // 2. AI가 생각 중이라는 메시지 임시 추가
    setMessages(prev => [...prev, { role: 'ai', text: '...' }]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error("API Key가 설정되지 않았습니다. .env.local 파일을 확인하세요.");
}
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a friendly English teacher. Respond to "${textToSend}" in 1-2 simple sentences and correct any grammar mistakes.`
            }]
          }]
        })
      });

      try {
      // ... (기존 fetch 코드)
      
      const data = await response.json();
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop(); // '...' 제거

        if (!response.ok) {
          const errorMsg = "The teacher is taking a break. Let's try in a moment!";
          speak(errorMsg); // 🔊 에러 메시지도 목소리로 읽어줍니다.
          return [...newMsgs, { role: 'ai', text: errorMsg }];
        }
        
        const aiText = data.candidates[0].content.parts[0].text;
        speak(aiText); // 🔊 정상 답변 음성 출력
        return [...newMsgs, { role: 'ai', text: aiText }];
      });

    } catch (error) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        const failMsg = "Check your connection, please!";
        speak(failMsg);
        return [...newMsgs, { role: 'ai', text: failMsg }];
      });
    }

    } catch (error) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        return [...newMsgs, { role: 'ai', text: "Connection error. Check your internet!" }];
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-md mx-auto border-x shadow-2xl text-black">
      {/* 상단 헤더 부분 */}
      <header className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col">
          <Link href="/" className="font-black text-blue-600 text-xl italic tracking-tighter">MUNTALK</Link>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">AI Teacher Online</span>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors"
        >
          RESET
        </button>
      </header>

      {/* 메시지창 부분: 이 블록을 통째로 교체하세요 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-sm ${
              m.text === '...' ? 'animate-bounce bg-slate-200' : 
              m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-800'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* 입력창 및 마이크 부분 */}
      <div className="p-4 bg-white border-t space-y-2">
        <div className="flex gap-2">
          <button 
            onClick={startListening}
            className={`flex-none w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            🎤
          </button>
          <input 
            className="flex-1 p-3 bg-slate-100 rounded-xl outline-none focus:ring-2 ring-blue-500 text-black" 
            placeholder={isListening ? "Listening..." : "Type or speak..."} 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
          />
          <button onClick={() => handleSend()} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md">전송</button>
        </div>
      </div>
    </div>
  );
}