// lib/audioUnlock.ts — TTS 오디오 제스처 언록 (QA M-11)
// 폰 브라우저는 유저 제스처(탭)가 끝난 뒤의 audio.play()를 NotAllowedError로
// 막는다. speakText는 /api/tts fetch를 기다린 뒤에야 play()를 호출하므로,
// 탭의 transient activation이 만료된 뒤가 된다. 대책: 제스처 콜스택 안에서
// (첫 await 전에) 동기적으로 Audio 엘리먼트를 만들고 무음 WAV를 play()해
// 엘리먼트를 "언록"한 뒤, fetch가 끝나면 같은 엘리먼트에 src만 갈아 끼운다.

/** 무음 WAV (8000 Hz 8-bit mono, 데이터 0바이트) data URI — 들리는 소리 없음. */
export const SILENT_WAV_DATA_URL =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

/**
 * 제스처 안에서 동기적으로 호출할 것. 무음 오디오를 만들어 play()를 시도하고
 * 엘리먼트를 반환한다. play() 거절(제스처 밖 호출 등)은 무시한다 — 나중에
 * 실제 src로 play()를 다시 시도한다.
 */
export function createUnlockedAudio(): HTMLAudioElement {
  const audio = new Audio(SILENT_WAV_DATA_URL);
  try {
    const p = audio.play();
    if (p) p.catch(() => { /* 언록 실패 — 나중에 실제 재생 시 다시 시도 */ });
  } catch {
    /* ignore */
  }
  return audio;
}

/** 기기 내장 음성(speechSynthesis)이 일시정지 상태면 제스처 안에서 재개한다. */
export function resumeDeviceSpeech(): void {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  } catch {
    /* ignore */
  }
}
