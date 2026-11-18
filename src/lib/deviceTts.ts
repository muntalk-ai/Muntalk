// Device TTS fallback (Web Speech API) for languages without a Google Cloud
// TTS voice — e.g. Burmese (my-MM): Google has no my-MM voice (verified
// 2026-09-26), so /api/tts can't serve it. Most Android devices ship a
// system TTS engine with these voices; desktop browsers often don't.
// Always resolves onEnd() so lesson/roleplay flow never hangs.

import { cleanTtsText } from './stripEmojis';

let cachedVoices: SpeechSynthesisVoice[] | null = null;

// QA S-1: 최신 speak 요청만 실제로 발화한다. speakWithDeviceTts는
// 음성 로딩(최대 1.2초)과 cancel 후 100ms 대기를 await하는데, 그 사이에
// 새 탭이 들어오면 오래된 호출의 s.speak()이 뒤늦게 실행돼 묵은 음성이
// 큐에 쌓였다. 세대 카운터로 가려내고, 진입 즉시 s.cancel()로 큐를 비운다.
let speakGeneration = 0;

function synth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  try {
    return 'speechSynthesis' in window ? window.speechSynthesis : null;
  } catch {
    return null;
  }
}

function loadVoices(s: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  if (cachedVoices && cachedVoices.length) return Promise.resolve(cachedVoices);
  const current = s.getVoices();
  if (current.length) {
    cachedVoices = current;
    return Promise.resolve(current);
  }
  // Voices often load async on first call — wait for voiceschanged (with cap).
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cachedVoices = s.getVoices();
      resolve(cachedVoices);
    };
    const timer = setTimeout(finish, 1200);
    try {
      s.onvoiceschanged = () => {
        clearTimeout(timer);
        finish();
      };
    } catch {
      clearTimeout(timer);
      finish();
    }
  });
}

function matchVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  const prefix = lang.slice(0, 2).toLowerCase();
  for (const v of voices) {
    const vl = (v.lang || '').replace('_', '-').toLowerCase();
    if (vl.startsWith(prefix)) return v;
  }
  return null;
}

/** Synchronous best-guess: is device speech even available? (voice unknown) */
export function deviceTtsAvailable(): boolean {
  return synth() !== null;
}

/**
 * Does the device actually have a voice matching `lang` (BCP-47, e.g. 'my-MM')?
 * Used to decide whether "Tap to hear" should be offered at all.
 */
export async function deviceHasVoiceFor(lang: string): Promise<boolean> {
  const s = synth();
  if (!s) return false;
  const voices = await loadVoices(s);
  return matchVoice(voices, lang) !== null;
}

/**
 * Speak text with a device voice matching `lang` (BCP-47, e.g. 'my-MM').
 * Returns true if a matching voice was found and speech started.
 * Never throws; calls onEnd exactly once — except when superseded by a
 * newer speakWithDeviceTts call (QA S-1), in which case it returns false
 * without speaking or calling onEnd: the newer call owns the utterance.
 * `onNoVoice`, when given, is called with the device's available voice
 * langs if no voice matched (for remote diagnostics).
 */
export async function speakWithDeviceTts(
  text: string,
  lang: string,
  onEnd?: () => void,
  onNoVoice?: (availableLangs: string[]) => void,
): Promise<boolean> {
  const finish = () => {
    try {
      onEnd?.();
    } catch {
      /* noop */
    }
  };
  // QA S-1: 이 호출의 세대. await 중에 새 호출이 들어오면 이 호출은
  // 발화하지 않고 조용히 물러난다 (onEnd도 호출하지 않음 — 새 호출의
  // onEnd가 발화 종료를 알린다. 호출한 쪽의 isCurrent 가드와 같은 규칙).
  const myGen = ++speakGeneration;
  const isCurrent = () => speakGeneration === myGen;
  try {
    const s = synth();
    const clean = cleanTtsText(text || '').trim();
    if (!s || !clean) {
      finish();
      return false;
    }
    // 진입 즉시 큐를 비운다 — 이전 발화가 재생 중이든 대기 중이든 새 탭이 이긴다.
    // (기존에는 음성 로딩 await 뒤에야 cancel()해서, 그 사이 묵은 음성이 남았다.)
    try { s.cancel(); } catch { /* ignore */ }
    const voices = await loadVoices(s);
    if (!isCurrent()) return false; // 그 사이 새 speak()이 시작됨 — 발화 안 함
    const voice = matchVoice(voices, lang);
    if (!voice) {
      try {
        onNoVoice?.([...new Set(voices.map(v => v.lang || '?'))]);
      } catch {
        /* noop */
      }
      finish();
      return false; // no device voice for this language — stay silent
    }
    // Chrome on Android can swallow speak() issued immediately after cancel()
    await new Promise(r => setTimeout(r, 100));
    if (!isCurrent()) return false; // 대기 중에 새 speak()이 시작됨 — 발화 안 함
    const utter = new SpeechSynthesisUtterance(clean);
    utter.voice = voice;
    utter.lang = voice.lang;
    utter.rate = 0.92;
    utter.onend = finish;
    utter.onerror = finish;
    s.speak(utter);
    return true;
  } catch {
    finish();
    return false;
  }
}
