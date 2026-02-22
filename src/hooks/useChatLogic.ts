'use client';
import { useState, useRef } from 'react';
import { getSystemPrompt } from '../lib/prompts';

export function useChatLogic(level, topic, role, mainLangN, subLanN, tutor) {
  const [aiData, setAiData] = useState<any>({ reply: "", translation: "", correction: "", reason: "" });
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const askGemini = async (prompt: string) => {
    if (!prompt) return;
    setIsThinking(true);
    const isStart = prompt === "START_ROLEPLAY";
    const cacheBuster = new Date().getTime();
    
    // 아이폰 대응: 비디오 깨우기
    document.querySelectorAll('video').forEach(v => { v.muted = true; v.play().catch(() => {}); });

    /**
     * ✅ 수정 포인트 1: 인자 순서와 이름 통일
     * prompts.ts 정의: (level, topic, role, mainLang, subLang)
     */
    const systemPrompt = getSystemPrompt(
      level,      // 1. 레벨
      topic,      // 2. 주제
      role,       // 3. 역할
      mainLangN,  // 4. 학습 언어 (받아온 이름 그대로 사용)
      subLanN     // 5. 번역 언어 (받아온 이름 그대로 사용)
    );

    // 로그 확인용 (브라우저 F12 콘솔에서 확인 가능)
    console.log("전송되는 언어 정보:", { mainLangN, subLanN });

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}&t=${cacheBuster}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Input: ${prompt}` }] }] 
        })
      });
      
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      
      // JSON 추출 (정규식 사용)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid JSON response");
      
      const result = JSON.parse(jsonMatch[0]);
      
      setAiData(result);
      if (!isStart) {
        setAnalysisHistory(prev => [...prev, { 
          user: prompt, 
          better: result.correction, 
          reason: result.reason 
        }]);
      }

      // TTS 실행 (mainLangN 변수 사용 확인)
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: result.reply, 
          lang: tutor.langCode, // tutor 객체에 맞는 언어 코드 확인 필요
          gender: tutor.gender 
        })
      });
      
      const ttsData = await ttsRes.json();
      if (ttsData.audioContent) {
        if (audioRef.current) { audioRef.current.pause(); }
        const audio = new Audio(`data:audio/mp3;base64,${ttsData.audioContent}`);
        audioRef.current = audio;
        setIsTalking(true);
        audio.onended = () => setIsTalking(false);
        await audio.play().catch(() => setIsTalking(false));
      }
    } catch (e) {
      console.error("Gemini 호출 중 에러 발생:", e);
    } finally {
      setIsThinking(false);
    }
  };

  return { aiData, analysisHistory, isThinking, isTalking, askGemini };
}