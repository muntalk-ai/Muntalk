'use client';
import { useEffect, useRef } from 'react';
import { useTimer } from './useTimer';
import { useSpeechToText } from './useSpeechToText';
import { useChatLogic } from './useChatLogic';

export function useConversation(
  level: string, 
  topic: string, 
  role: string, 
  mainLang: string, 
  mainLangName: string, 
  subLangName: string, 
  tutor: any
) {
  const { timeLeft, isAdmin } = useTimer();

  /**
   * ✅ 수정 포인트: 인자 순서를 useChatLogic의 정의(7개)와 완벽히 맞췄습니다.
   * 4번째 자리인 'mainLang'이 누락되어 음성이 안 나왔던 것입니다.
   */
  const { aiData, analysisHistory, isThinking, isTalking, askGemini } = useChatLogic(
    level,        // 1
    topic,        // 2
    role,         // 3
    mainLang,     // 4. (추가) TTS용 언어 코드 ('en-US' 등)
    mainLangName, // 5. 프롬프트용 언어 이름 ('English' 등)
    subLangName,  // 6. 자막용 언어 이름 ('Korean' 등)
    tutor         // 7. 튜터 객체
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