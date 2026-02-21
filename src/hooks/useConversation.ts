'use client';
import { useEffect, useRef } from 'react';
import { useTimer } from './useTimer';
import { useSpeechToText } from './useSpeechToText';
import { useChatLogic } from './useChatLogic';

export function useConversation(level: string, role: string, mainLang: string, mainLangName: string, subLangName: string, tutor: any) {
  const { timeLeft, isAdmin } = useTimer("muntalkofficial@gmail.com");
  const { aiData, analysisHistory, isThinking, isTalking, askGemini } = useChatLogic(level, role, mainLang, mainLangName, subLangName, tutor);
  const { isListening, startListening, stopListening } = useSpeechToText(mainLang, askGemini);
  
  const hasGreetingPlayed = useRef(false);

  useEffect(() => {
    if (!hasGreetingPlayed.current) {
      askGemini("START_ROLEPLAY");
      hasGreetingPlayed.current = true;
    }
  }, []);

  const handleSpeak = () => {
    document.querySelectorAll('video').forEach(v => { v.muted = true; v.play().catch(() => {}); });
    isListening ? stopListening() : startListening();
  };

  return { isTalking, isListening, isThinking, timeLeft, isAdmin, aiData, analysisHistory, handleSpeak };
}