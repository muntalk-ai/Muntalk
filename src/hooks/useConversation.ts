'use client';
import { useEffect, useRef } from 'react';
import { useTimer } from './useTimer';
import { useSpeechToText } from './useSpeechToText';
import { useChatLogic } from './useChatLogic';

// 인자에 topic(주제)을 추가하여 전달받도록 수정했습니다.
export function useConversation(level: string, topic: string, role: string, mainLang: string, mainLangName: string, subLangName: string, tutor: any) {
  const { timeLeft, isAdmin } = useTimer();

  // ✅ useChatLogic의 정의에 맞게 6개의 인자를 순서대로 전달합니다.
  const { aiData, analysisHistory, isThinking, isTalking, askGemini } = useChatLogic(
    level, 
    topic, 
    role, 
    mainLangName, // mainLangN 자리
    subLangName,  // subLanN 자리
    tutor
  );

  const { isListening, startListening, stopListening } = useSpeechToText(mainLang, askGemini);
  const hasGreetingPlayed = useRef(false);

  useEffect(() => {
    if (!hasGreetingPlayed.current) {
      askGemini("START_ROLEPLAY");
      hasGreetingPlayed.current = true;
    }
  }, []);

  const handleSpeak = () => {
    // 아이폰/안드로이드 비디오 저소음 재생 허용
    document.querySelectorAll('video').forEach(v => { v.muted = true; v.play().catch(() => {}); });
    isListening ? stopListening() : startListening();
  };

  return { isTalking, isListening, isThinking, timeLeft, isAdmin, aiData, analysisHistory, handleSpeak };
}