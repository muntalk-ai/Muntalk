'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function LocalTestPage() {
  const [tutor] = useState({
    name: "Clara",
    videoIdle: "/videos/t101_idle.mp4",
    videoTalk: "/videos/t101_talk.mp4"
  });

  const [messages, setMessages] = useState([{ role: 'ai', text: "Hello! I'm Clara. 스피커를 켜고 대화를 시작해봐요!" }]);
  const [input, setInput] = useState("");
  const [isTalking, setIsTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // 브라우저 정책상 처음엔 muted

  const scrollRef = useRef<HTMLDivElement>(null);
  const talkVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // 음성 활성화 함수 (사용자 상호작용 후 호출 가능)
  const enableAudio = () => {
    setIsMuted(false);
    if (talkVideoRef.current) talkVideoRef.current.muted = false;
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    enableAudio(); // 첫 메시지 전송 시 음성 차단 해제
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput("");
    setIsTalking(true);

    try {
      // 실제 API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, tutorName: tutor.name }),
      });
      
      const data = await response.json();
      const aiResponse = data.text || "미안해, 다시 말해줄래?";

      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      
      // 답변 길이에 비례해서 영상 재생 (문자당 약 200ms)
      const playTime = Math.min(Math.max(aiResponse.length * 150, 2000), 8000);
      setTimeout(() => setIsTalking(false), playTime);

    } catch (error) {
      console.error(error);
      setIsTalking(false);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* 1. 영상 섹션: 비율을 45%로 축소하여 가독성 높임 */}
      <div className="relative flex-[4.5] bg-black overflow-hidden shadow-inner">
        <div className="absolute top-6 left-4 z-30 bg-black/60 px-3 py-1.5 rounded-full text-white text-[10px] font-bold border border-white/20">
          ● LIVE SESSION
        </div>
        
        {/* 음성 상태 표시 */}
        <button 
          onClick={enableAudio}
          className="absolute top-6 right-4 z-30 bg-blue-600 p-2 rounded-full text-white text-xs"
        >
          {isMuted ? "🔇 소리 켜기" : "🔊 소리 켜짐"}
        </button>

        <video
          src={tutor.videoIdle}
          autoPlay loop muted playsInline
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${isTalking ? 'opacity-0' : 'opacity-100'}`}
        />
        <video
          ref={talkVideoRef}
          src={tutor.videoTalk}
          autoPlay loop playsInline
          muted={isMuted} // 상태에 따라 음소거 제어
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${isTalking ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      {/* 2. 채팅 섹션: 55%로 확장하여 대화에 집중 */}
      <div className="flex-[5.5] bg-white rounded-t-[30px] z-20 flex flex-col p-5 shadow-2xl -mt-6">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pt-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] ${
                msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* 하단 입력바 */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-full border border-gray-200 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`${tutor.name}에게 말해보세요...`}
            className="flex-1 bg-transparent px-4 py-1.5 outline-none text-sm"
          />
          <button onClick={() => handleSend()} className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform">
            ↑
          </button>
        </div>
      </div>
    </main>
  );
}