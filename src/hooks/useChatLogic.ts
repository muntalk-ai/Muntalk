'use client';
import { useState, useRef } from 'react';
import { getSystemPrompt } from '../lib/prompts';

export function useChatLogic(level: string, role: string, mainLang: string, mainLangName: string, subLangName: string, tutor: any) {
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

    const systemPrompt = getSystemPrompt(level, role, role, mainLangName, subLangName);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}&t=${cacheBuster}`, {
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

      // TTS 실행
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: result.reply, lang: mainLang, gender: tutor.gender })
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
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  return { aiData, analysisHistory, isThinking, isTalking, askGemini };
}