// Device TTS fallback (Web Speech API) for languages without a Google Cloud
// TTS voice — e.g. Burmese (my-MM): Google has no my-MM voice (verified
// 2026-09-26), so /api/tts can't serve it. Most Android devices ship a
// system TTS engine with these voices; desktop browsers often don't.
// Always resolves onEnd() so lesson/roleplay flow never hangs.

import { cleanTtsText } from './stripEmojis';

let cachedVoices: SpeechSynthesisVoice[] | null = null;

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
 * Never throws; always calls onEnd exactly once.
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
  try {
    const s = synth();
    const clean = cleanTtsText(text || '').trim();
    if (!s || !clean) {
      finish();
      return false;
    }
    const voices = await loadVoices(s);
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
    s.cancel();
    // Chrome on Android can swallow speak() issued immediately after cancel()
    await new Promise(r => setTimeout(r, 100));
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
