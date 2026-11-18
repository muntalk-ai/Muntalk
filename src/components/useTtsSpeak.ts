'use client';

import { useRef, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { speakWithDeviceTts } from '@/lib/deviceTts';
import { createUnlockedAudio, resumeDeviceSpeech } from '@/lib/audioUnlock';
import { LEARN_LANGUAGES } from '@/data/languages';

// ── Session-level audio cache: identical (lang, text) taps (e.g. alphabet
// letter tiles) reuse the data URL instead of hitting /api/tts again.
// Module scope = shared for the whole page session. Failures never cached.
const CLIENT_CACHE_MAX = 200;
const audioCache = new Map<string, string>();
function audioCacheGet(key: string) {
  const hit = audioCache.get(key);
  if (hit !== undefined) { audioCache.delete(key); audioCache.set(key, hit); } // refresh LRU
  return hit;
}
function audioCacheSet(key: string, url: string) {
  if (audioCache.has(key)) audioCache.delete(key);
  else if (audioCache.size >= CLIENT_CACHE_MAX) {
    const oldest = audioCache.keys().next().value;
    if (oldest !== undefined) audioCache.delete(oldest);
  }
  audioCache.set(key, url);
}

// LessonPlayer의 speakText와 동일한 패턴을 재사용하는 경량 TTS 훅.
// 서버 TTS 미지원 언어는 기기 내장 음성으로 폴백, 둘 다 없으면 onError 콜백.
export function useTtsSpeak(langId: string) {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // QA M-11: 오래된 speak() 호출의 뒤늦은 fetch가 새 재생을 덮지 않게 세대 가드.
  const speakSeqRef = useRef(0);

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
    // QA M-11: 제스처 안에서 동기적으로 — 첫 await 전에 오디오 엘리먼트를
    // 만들고 무음으로 play()해 언록한다. /api/tts fetch 뒤의 play()는 폰에서
    // 제스처 만료로 NotAllowedError가 날 수 있다 (원인 미확정 — 폰 확인 필요).
    const mySeq = ++speakSeqRef.current;
    const isCurrent = () => speakSeqRef.current === mySeq;
    stop();
    resumeDeviceSpeech();
    const unlockedAudio = createUnlockedAudio();
    audioRef.current = unlockedAudio;
    setSpeaking(true);
    if (!supported) {
      const ok = await speakWithDeviceTts(clean, langId, () => { if (isCurrent()) setSpeaking(false); });
      if (ok) return;
      if (!isCurrent()) return;
      // QA H-9: 기기에 해당 언어 음성이 없어도(데스크톱의 버마어 등) 서버 TTS로
      // 폴백한다 — /api/tts가 Gemini 경유로 모든 언어를 제공한다. 기기 음성이
      // 있으면 위에서 끝나고, 없으면 아래 서버 분기로 이어진다.
      setSpeaking(true);
    }
    try {
      const key = `${langId}:${clean}`;
      let dataUrl = audioCacheGet(key);
      if (!dataUrl) {
        const res = await apiFetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean, lang: langId }),
        });
        if (!res.ok) throw new Error('tts failed');
        const data = await res.json();
        if (!data.audioContent) throw new Error('no audio');
        dataUrl = `data:${data.mimeType || 'audio/mp3'};base64,${data.audioContent}`;
        audioCacheSet(key, dataUrl);
      }
      if (!isCurrent()) return; // 그 사이 새 speak()이 시작됨
      // 언록해 둔 엘리먼트에 실제 오디오를 끼워 재생한다.
      const audio = unlockedAudio;
      audio.src = dataUrl;
      audio.onended = () => { if (isCurrent()) setSpeaking(false); if (audioRef.current === audio) audioRef.current = null; };
      audio.onerror = () => { if (isCurrent()) { setSpeaking(false); onError?.(); } if (audioRef.current === audio) audioRef.current = null; };
      try {
        await audio.play();
      } catch (playErr) {
        console.warn('[tts] play() failed:', (playErr as Error)?.name, (playErr as Error)?.message);
        throw playErr;
      }
    } catch {
      if (!isCurrent()) return;
      setSpeaking(false);
      onError?.();
    }
  }, [langId, stop]);

  return { speak, stop, speaking };
}
