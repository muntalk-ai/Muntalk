'use client';
import { useState, useRef, useEffect } from 'react';

export function useSpeechToText(mainLang: string, onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (e: any) => onResult(e.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [onResult]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = mainLang;
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  return { isListening, startListening, stopListening };
}