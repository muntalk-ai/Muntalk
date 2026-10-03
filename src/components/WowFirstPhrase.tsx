'use client';
// WowFirstPhrase — 랜딩 게스트용 "30초 첫 문장 말하기" 와우 체험
// 가입 장벽 없이: 언어 선택 → 튜터 TTS 듣기 → STT 따라 말하기 → 폭죽 + CTA
// 비로그인 전용. localStorage에 흔적을 남기지 않음.
import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import { FIRST_PHRASES, FirstPhrase } from '@/data/first-phrase';
import { getTutorForLang, getTutorById } from '@/data/tutors';

type Step = 'pick' | 'try' | 'listening' | 'done';

const FONT = "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";
const ACCENT = '#6366F1';

export default function WowFirstPhrase() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('pick');
  const [fp, setFp] = useState<FirstPhrase | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ttsError, setTtsError] = useState(false);
  const [heard, setHeard] = useState('');
  const [sttError, setSttError] = useState('');
  const [sttSupported, setSttSupported] = useState(true);
  const [listenedOnce, setListenedOnce] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<any>(null);
  const handledRef = useRef(false);

  const tutor = useMemo(() => {
    if (!fp) return getTutorForLang('en-US');
    // ar-XA는 LANG_TUTOR_MAP에 없어 TUTORS[0]으로 떨어지므로 중동 튜터로 고정
    if (fp.code === 'ar-XA') return getTutorById('t09');
    return getTutorForLang(fp.code);
  }, [fp]);

  // 폭죽 조각 (마운트 시 1회 생성)
  const confetti = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      duration: 2.2 + Math.random() * 2.2,
      color: ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#38BDF8', '#FB7185'][i % 6],
      size: 6 + Math.random() * 8,
      round: Math.random() > 0.5,
    })),
    []
  );

  // 언마운트 시 오디오·STT 정리 + STT 지원 여부 사전 감지
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSttSupported(false);
    return () => {
      try { audioRef.current?.pause(); } catch { /* noop */ }
      try { recRef.current?.abort(); } catch { /* noop */ }
    };
  }, []);

  const stopAudio = () => {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch { /* noop */ } audioRef.current = null; }
    setPlaying(false);
  };

  const playPhrase = async () => {
    if (!fp || playing) return;
    stopAudio();
    setTtsError(false);
    setPlaying(true);
    try {
      const res = await apiFetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fp.phrase, lang: fp.code, gender: tutor.gender, speed: 0.8 }),
        timeoutMs: 15000,
      });
      const data = await res.json();
      if (!data?.audioContent) { setPlaying(false); setTtsError(true); return; }
      const audio = new Audio(`data:${data.mimeType || 'audio/mp3'};base64,${data.audioContent}`);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
      setListenedOnce(true);
    } catch {
      setPlaying(false);
      setTtsError(true);
    }
  };

  const pickLanguage = (p: FirstPhrase) => {
    stopAudio();
    try { recRef.current?.abort(); } catch { /* noop */ }
    setFp(p);
    setHeard('');
    setSttError('');
    setTtsError(false);
    setListenedOnce(false);
    setStep('try');
    // 사용자 제스처 직후라 자동재생 시도 (막히면 🔊 버튼으로)
    setTimeout(() => playPhraseRef.current(), 350);
  };
  const playPhraseRef = useRef(playPhrase);
  playPhraseRef.current = playPhrase;

  const backToPick = () => {
    stopAudio();
    try { recRef.current?.abort(); } catch { /* noop */ }
    setStep('pick');
  };

  const startListening = () => {
    if (!fp) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSttSupported(false); return; }
    stopAudio();
    setSttError('');
    handledRef.current = false;
    const rec = new SR();
    rec.lang = fp.sttLang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    const finish = (ok: boolean, transcript?: string, errMsg?: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      try { rec.stop(); } catch { /* noop */ }
      recRef.current = null;
      if (ok && transcript) {
        setHeard(transcript);
        setStep('done');
      } else {
        if (errMsg) setSttError(errMsg);
        setStep('try');
      }
    };
    rec.onresult = (e: any) => {
      const t: string | undefined = e.results?.[0]?.[0]?.transcript?.trim();
      finish(true, t || undefined, t ? undefined : "Didn't catch that. Try again!");
    };
    rec.onerror = (e: any) => {
      const code = e?.error;
      finish(false, undefined,
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone blocked — allow mic access and try again.'
          : code === 'no-speech'
            ? "Didn't hear anything. Try again!"
            : 'Speech hiccup. Try again!');
    };
    rec.onend = () => {
      // onresult/onerror 없이 끝나면 (무음 종료) try로 복귀
      if (!handledRef.current) {
        handledRef.current = true;
        recRef.current = null;
        setStep('try');
      }
    };
    recRef.current = rec;
    setStep('listening');
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setStep('try');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '26px 24px 0', width: '100%', fontFamily: FONT }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wowpop { 0%{transform:scale(0.7);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes wowfall { 0%{transform:translateY(-10vh) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0.6} }
        @keyframes wowpulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes wowxp { 0%{opacity:0;transform:translateY(10px) scale(0.8)} 30%{opacity:1;transform:translateY(0) scale(1.1)} 70%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:translateY(-30px)} }
      `}} />

      <div style={{ background: '#fff', borderRadius: 24, padding: '32px 28px',
        boxShadow: '0 8px 32px rgba(99,102,241,0.10)', border: '2px solid #EEF2FF',
        position: 'relative', overflow: 'hidden' }}>
        {/* 폭죽 */}
        {step === 'done' && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, overflow: 'hidden' }}>
            {confetti.map((c, i) => (
              <div key={i} style={{ position: 'absolute', top: '-4vh', left: `${c.left}%`,
                width: c.size, height: c.size * (c.round ? 1 : 0.5),
                background: c.color, borderRadius: c.round ? '50%' : 2,
                animation: `wowfall ${c.duration}s ease-in ${c.delay}s forwards` }} />
            ))}
          </div>
        )}

        {step === 'pick' && (
          <div style={{ textAlign: 'center', animation: 'wowpop .35s ease' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>
              🗣️ Try it now — no signup
            </div>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginBottom: 20 }}>
              Pick a language. Hear it. Say it. 30 seconds.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {FIRST_PHRASES.map(p => (
                <button key={p.code} onClick={() => pickLanguage(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8,
                    border: '2px solid #E2E8F0', borderRadius: 99,
                    background: '#fff', padding: '10px 18px',
                    fontSize: 15, fontWeight: 800, color: '#0F172A',
                    cursor: 'pointer', fontFamily: FONT,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: 20 }}>{p.flag}</span> {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {(step === 'try' || step === 'listening') && fp && (
          <div style={{ animation: 'wowpop .35s ease' }}>
            <button onClick={backToPick}
              style={{ background: 'none', border: 'none', color: '#94A3B8',
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                marginBottom: 12, fontFamily: FONT }}>
              ← Choose another language
            </button>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* 튜터 비디오 */}
              <div style={{ position: 'relative', width: 96, height: 96, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                border: `3px solid ${playing || step === 'listening' ? ACCENT : '#E0E7FF'}`,
                boxShadow: playing || step === 'listening' ? `0 0 0 5px ${ACCENT}20` : 'none',
                transition: 'all .3s' }}>
                <video preload="metadata" poster={tutor.thumbnail} src={tutor.videoIdle}
                  autoPlay loop muted playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center 20%',
                    opacity: playing ? 0 : 1, transition: 'opacity .25s' }} />
                <video preload="metadata" poster={tutor.thumbnail} src={tutor.videoTalk}
                  autoPlay loop muted playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center 20%',
                    opacity: playing ? 1 : 0, transition: 'opacity .25s' }} />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8',
                  letterSpacing: 1, marginBottom: 6 }}>
                  {fp.flag} YOUR FIRST {fp.label.toUpperCase()} PHRASE
                </div>
                <div dir="auto" style={{ fontSize: 30, fontWeight: 900, color: '#0F172A',
                  marginBottom: 4, lineHeight: 1.3 }}>{fp.phrase}</div>
                <div style={{ fontSize: 14, color: '#94A3B8', fontWeight: 700,
                  fontStyle: 'italic', marginBottom: 2 }}>{fp.romanized}</div>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600,
                  marginBottom: 18 }}>= {fp.meaning}</div>

                {step === 'try' ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={playPhrase}
                      style={{ border: 'none', borderRadius: 99, cursor: 'pointer',
                        padding: '13px 26px', fontSize: 15, fontWeight: 800, color: '#fff',
                        background: `linear-gradient(135deg, ${ACCENT}, #818CF8)`,
                        boxShadow: `0 6px 20px ${ACCENT}40`, fontFamily: FONT,
                        animation: !listenedOnce ? 'wowpulse 1.6s infinite' : 'none' }}>
                      {playing ? '🔊 Playing…' : '🔊 Listen'}
                    </button>
                    {sttSupported ? (
                      <button onClick={startListening}
                        style={{ border: `2px solid ${ACCENT}`, borderRadius: 99, cursor: 'pointer',
                          padding: '12px 26px', fontSize: 15, fontWeight: 800, color: ACCENT,
                          background: '#fff', fontFamily: FONT }}>
                        🎤 Say it
                      </button>
                    ) : (
                      <button onClick={() => { setHeard(''); setStep('done'); }}
                        style={{ border: `2px solid ${ACCENT}`, borderRadius: 99, cursor: 'pointer',
                          padding: '12px 26px', fontSize: 15, fontWeight: 800, color: ACCENT,
                          background: '#fff', fontFamily: FONT }}>
                        🎉 I said it!
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%',
                      border: '4px solid #E0E7FF', borderTopColor: '#EF4444',
                      animation: 'wowspin .8s linear infinite' }} />
                    <style dangerouslySetInnerHTML={{ __html: '@keyframes wowspin{to{transform:rotate(360deg)}}' }} />
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                      Listening… say <em>{fp.phrase}</em>
                    </div>
                  </div>
                )}

                {ttsError && (
                  <div style={{ fontSize: 13, color: '#EF4444', fontWeight: 700, marginTop: 10 }}>
                    Couldn't play audio. Tap 🔊 to retry.
                  </div>
                )}
                {sttError && (
                  <div style={{ fontSize: 13, color: '#EF4444', fontWeight: 700, marginTop: 10 }}>
                    {sttError}
                  </div>
                )}
                {!sttSupported && (
                  <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginTop: 10 }}>
                    Mic not supported here — listen, repeat out loud, then tap "I said it!"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'done' && fp && (
          <div style={{ textAlign: 'center', animation: 'wowpop .4s ease', position: 'relative', zIndex: 21 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>
              You just spoke {fp.label}!
            </div>
            {heard && (
              <div style={{ fontSize: 14, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>
                We heard: "{heard}"
              </div>
            )}
            <div style={{ display: 'inline-block', fontSize: 18, fontWeight: 900, color: '#10B981',
              background: '#DCFCE7', borderRadius: 99, padding: '8px 22px',
              marginBottom: 20, animation: 'wowxp 2.2s ease forwards' }}>
              +10 XP ⭐
            </div>
            <div>
              <button onClick={() => router.push('/signup')}
                style={{ border: 'none', borderRadius: 99, cursor: 'pointer',
                  padding: '15px 40px', fontSize: 16, fontWeight: 800, color: '#fff',
                  background: `linear-gradient(135deg, ${ACCENT}, #818CF8)`,
                  boxShadow: `0 6px 24px ${ACCENT}50`, fontFamily: FONT }}>
                Create free account to keep learning →
              </button>
            </div>
            <button onClick={backToPick}
              style={{ background: 'none', border: 'none', color: '#94A3B8',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                marginTop: 14, fontFamily: FONT }}>
              Try another language
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
