'use client';
import { useState, useRef } from 'react';
import { getSystemPrompt } from '../lib/prompts';

export function useChatLogic(level: string, topic: string, role: string, mainLang: string, mainLangName: string, subLangName: string, tutor: any) {
  const [aiData, setAiData] = useState<any>({ reply: "", translation: "", correction: "", reason: "" });
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ✅ [통합 추가] 사용자가 버튼을 누르는 "즉시" 호출하여 브라우저 권한을 따내는 함수
  const unlockMedia = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    // 빈 소리를 즉시 재생하여 "이 사이트는 소리를 써도 됨" 도장을 찍음
    audioRef.current.play().catch(() => {}); 

    // 모든 비디오 태그도 즉시 재생 가능 상태로 만듦
    const videos = document.querySelectorAll('video');
    videos.forEach(v => {
      v.muted = true;
      v.play().catch(() => {});
    });
  };

  const askGemini = async (prompt: string) => {
    if (!prompt) return;
    setIsThinking(true);
    const isStart = prompt === "START_ROLEPLAY";
    
    // 오디오 객체 확보 확인
    if (!audioRef.current) audioRef.current = new Audio();

    const systemPrompt = getSystemPrompt(level, topic, role, mainLangName, subLangName);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\nUser Input: " + prompt }] }] })
      });
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(rawText.match(/\{[\s\S]*\}/)[0]);
      
      setAiData(result);
      if (!isStart) {
        setAnalysisHistory(prev => [...prev, { user: prompt, better: result.correction, reason: result.reason }]);
      }

      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: result.reply, 
          lang: tutor?.langCode || mainLang,
          gender: tutor?.gender || 'female' 
        })
      });
      const ttsData = await ttsRes.json();
      
      if (ttsData.audioContent && audioRef.current) {
        // ✅ 이미 권한이 뚫린 audioRef에 소리만 갈아끼움 (배포 환경 핵심)
        audioRef.current.src = `data:audio/mp3;base64,${ttsData.audioContent}`;
        setIsTalking(true);
        audioRef.current.onended = () => setIsTalking(false);
        await audioRef.current.play();
      }
    } catch (e) {
      console.error("Chat Error:", e);
    } finally {
      setIsThinking(false);
    }
  };

  // ✅ unlockMedia를 함께 반환합니다.
  return { aiData, analysisHistory, isThinking, isTalking, askGemini, unlockMedia };
}