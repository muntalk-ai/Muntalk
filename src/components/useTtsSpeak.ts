'use client';

import { useRef, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { speakWithDeviceTts } from '@/lib/deviceTts';
import { LEARN_LANGUAGES } from '@/data/languages';

// LessonPlayer의 speakText와 동일한 패턴을 재사용하는 경량 TTS 훅.
// 서버 TTS 미지원 언어는 기기 내장 음성으로 폴백, 둘 다 없으면 onError 콜백.
export function useTtsSpeak(langId: string) {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    try { audioRef.current?.pause(); } catch { /* ignore */ }
    audioRef.current = null;
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    setSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, onError?: () => void) => {
    const clean = text.replace(/[\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F900}-\u{1F9FF}]/gu, '').replace(/\s{2,}/g, ' ').trim();
    if (!clean) return;
    const supported = LEARN_LANGUAGES.find(l => l.code === langId)?.tts ?? false;
    stop();
    setSpeaking(true);
    if (!supported) {
      const ok = await speakWithDeviceTts(clean, langId, () => setSpeaking(false));
      if (!ok) { setSpeaking(false); onError?.(); }
      return;
    }
    try {
      const res = await apiFetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, lang: langId }),
      });
      if (!res.ok) throw new Error('tts failed');
      const data = await res.json();
      if (!data.audioContent) throw new Error('no audio');
      const audio = new Audio(`data:${data.mimeType || 'audio/mp3'};base64,${data.audioContent}`);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); audioRef.current = null; };
      audio.onerror = () => { setSpeaking(false); audioRef.current = null; onError?.(); };
      await audio.play();
    } catch {
      setSpeaking(false);
      onError?.();
    }
  }, [langId, stop]);

  return { speak, stop, speaking };
}
