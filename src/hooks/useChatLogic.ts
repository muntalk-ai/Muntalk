'use client';
import { useState, useRef } from 'react';
import { getSystemPrompt } from '../lib/prompts';

export function useChatLogic(level: string, topic: string, role: string, mainLang: string, mainLangName: string, subLangName: string, tutor: any) {
  const [aiData, setAiData] = useState<any>({ reply: "", translation: "", correction: "", reason: "" });
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  
  // ✅ 핵심: 미리 생성된 오디오 객체를 사용합니다.
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const askGemini = async (prompt: string) => {
    if (!prompt) return;
    setIsThinking(true);
    const isStart = prompt === "START_ROLEPLAY";
    
    // ✅ [배포 환경 필수] 1. 클릭과 동시에 비어있는 소리를 한 번 틀어 권한을 얻습니다.
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.play().catch(() => {}); 

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

      // 2. TTS 실행
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
        // ✅ [배포 환경 필수] 3. 이미 권한이 뚫린 audioRef에 소리 데이터만 주입
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

  return { aiData, analysisHistory, isThinking, isTalking, askGemini };
}