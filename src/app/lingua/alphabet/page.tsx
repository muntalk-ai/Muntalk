'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RtlDir from '@/components/RtlDir';
import { useTtsSpeak } from '@/components/useTtsSpeak';
import {
  LANG_TO_ALPHABET,
  ALPHABET_FONT_STACKS,
  type AlphabetSystem,
  type AlphabetLetter,
} from '@/data/alphabets/types';
import { getAlphabetSystem, getSiblingSystems } from '@/data/alphabets';

const FONT = "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC','Noto Sans Bengali','Noto Sans Tamil','Noto Sans Telugu','Noto Sans Kannada','Noto Sans Malayalam','Noto Sans Gujarati','Noto Sans Gurmukhi','Noto Sans Sinhala','Noto Sans Myanmar','Noto Sans Lao','Noto Sans Khmer','Noto Sans Armenian','Noto Sans Ethiopic','Noto Serif Georgian',sans-serif";

function AlphabetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang') || '';

  const [lang, setLang] = useState(langParam);
  const [systemId, setSystemId] = useState<string | null>(null);
  const [mode, setMode] = useState<'learn' | 'quiz'>('learn');
  const [selected, setSelected] = useState<AlphabetLetter | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [quizChoices, setQuizChoices] = useState<AlphabetLetter[]>([]);
  const [quizPicked, setQuizPicked] = useState<string | null>(null);
  const [quizOrder, setQuizOrder] = useState<AlphabetLetter[]>([]);

  useEffect(() => {
    const l = searchParams.get('lang') || localStorage.getItem('mt_learn_lang') || 'en-US';
    setLang(l);
    setSystemId(LANG_TO_ALPHABET[l] || null);
    setMode('learn');
    setSelected(null);
  }, [searchParams]);

  const system: AlphabetSystem | null = useMemo(
    () => (systemId ? getAlphabetSystem(systemId) : null),
    [systemId]
  );
  const siblings = useMemo(
    () => (systemId ? getSiblingSystems(systemId) : []),
    [systemId]
  );
  const { speak, speaking } = useTtsSpeak(lang);
  const scriptFont = (systemId && ALPHABET_FONT_STACKS[systemId]) || FONT;

  const allLetters: AlphabetLetter[] = useMemo(
    () => (system ? system.groups.flatMap(g => g.letters) : []),
    [system]
  );

  // 퀴즈 순서 셔플
  useEffect(() => {
    if (mode === 'quiz' && allLetters.length > 0) {
      const order = [...allLetters].sort(() => Math.random() - 0.5).slice(0, 20);
      setQuizOrder(order);
      setQuizIdx(0);
      setQuizScore(0);
      setQuizTotal(0);
      setQuizPicked(null);
    }
  }, [mode, systemId]);

  useEffect(() => {
    if (mode !== 'quiz' || quizOrder.length === 0) return;
    const target = quizOrder[quizIdx % quizOrder.length];
    const pool = allLetters.filter(l => l.char !== target.char);
    const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    setQuizChoices([...distractors, target].sort(() => Math.random() - 0.5));
    setQuizPicked(null);
  }, [quizIdx, quizOrder, mode]);

  if (!system) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '24px 20px', maxWidth: 640, margin: '0 auto', fontFamily: FONT }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 15, fontWeight: 800, color: '#6366F1', cursor: 'pointer', fontFamily: FONT, padding: '8px 0' }}>← Back</button>
        <div style={{ marginTop: 40, textAlign: 'center', color: '#64748B' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔤</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>No alphabet guide for this language yet</div>
          <div style={{ fontSize: 13 }}>Alphabet guides are available for languages with non-Latin writing systems.</div>
        </div>
      </div>
    );
  }

  const quizTarget = quizOrder.length > 0 ? quizOrder[quizIdx % quizOrder.length] : null;

  const pickQuiz = (choice: AlphabetLetter) => {
    if (quizPicked || !quizTarget) return;
    setQuizPicked(choice.char);
    setQuizTotal(t => t + 1);
    if (choice.char === quizTarget.char) {
      setQuizScore(s => s + 1);
      speak(quizTarget.char);
    }
  };

  return (
    <RtlDir lang={lang}>
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT }}>
        {/* 헤더 */}
        <div style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', padding: '16px 20px 24px', color: '#fff' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 800, padding: '8px 14px', cursor: 'pointer', fontFamily: FONT, marginBottom: 14 }}>← Back</button>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>🔤 {system.name}</h1>
              <span style={{ fontSize: 20, fontFamily: scriptFont }}>{system.nameNative}</span>
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6, fontWeight: 700 }}>
              {system.languageLabel} · {system.letterCount}{system.direction === 'rtl' ? ' · Right-to-left' : ''}
            </div>
            {/* 자매 문자 체계 탭 (일본어 히라가나/가타카나) */}
            {siblings.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {[system, ...siblings].map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSystemId(s.id); setSelected(null); setMode('learn'); }}
                    style={{
                      background: s.id === system.id ? '#fff' : 'rgba(255,255,255,0.18)',
                      color: s.id === system.id ? '#6366F1' : '#fff',
                      border: 'none', borderRadius: 99, padding: '8px 18px',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT,
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 60px' }}>
          {/* 모드 탭 */}
          <div style={{ display: 'flex', background: '#fff', borderRadius: 14, padding: 4, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {(['learn', 'quiz'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, border: 'none', borderRadius: 10, padding: '10px',
                  background: mode === m ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'transparent',
                  color: mode === m ? '#fff' : '#64748B',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT,
                }}
              >
                {m === 'learn' ? '📖 Learn' : '🎯 Quiz'}
              </button>
            ))}
          </div>

          {mode === 'learn' ? (
            <>
              {/* 개요 */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>About this script</div>
                {system.overview.map((p, i) => (
                  <p key={i} style={{ margin: '0 0 8px', fontSize: 13.5, lineHeight: 1.6, color: '#475569' }}>{p}</p>
                ))}
                {system.notes.length > 0 && (
                  <div style={{ marginTop: 10, background: '#FFFBEB', borderRadius: 10, padding: '10px 12px' }}>
                    {system.notes.map((n, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: '#92400E', fontWeight: 600, marginBottom: 4 }}>💡 {n}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* 선택된 문자 상세 */}
              {selected && (
                <div style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center', border: '2px solid #C7D2FE' }}>
                  <div style={{ fontSize: 64, fontFamily: scriptFont, lineHeight: 1.2, marginBottom: 4 }}>{selected.char}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#4338CA', marginBottom: 2 }}>{selected.roman}</div>
                  {selected.name ? <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, marginBottom: 12 }}>“{selected.name}”</div> : <div style={{ height: 8 }} />}
                  <button
                    onClick={() => speak(selected.char)}
                    disabled={speaking}
                    style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: 99, padding: '10px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, marginBottom: 14, opacity: speaking ? 0.6 : 1 }}
                  >
                    {speaking ? '🔊…' : '🔊 Hear it'}
                  </button>
                  <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: 1, marginBottom: 6 }}>EXAMPLE</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', fontFamily: scriptFont }}>{selected.example}</span>
                        <span style={{ fontSize: 13, color: '#64748B', fontWeight: 700, marginLeft: 8 }}>{selected.exampleRoman}</span>
                        <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{selected.exampleMeaning}</div>
                      </div>
                      <button
                        onClick={() => speak(selected.example)}
                        disabled={speaking}
                        style={{ background: '#EEF2FF', border: 'none', borderRadius: 10, padding: '8px 12px', fontSize: 16, cursor: 'pointer', opacity: speaking ? 0.6 : 1 }}
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 문자 그리드 */}
              {system.groups.map((group, gi) => (
                <div key={gi} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', marginBottom: 10, paddingLeft: 4 }}>{group.title}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {group.letters.map((letter, li) => (
                      <button
                        key={li}
                        onClick={() => { setSelected(letter); speak(letter.char); }}
                        style={{
                          background: selected?.char === letter.char ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#fff',
                          color: selected?.char === letter.char ? '#fff' : '#0F172A',
                          border: selected?.char === letter.char ? 'none' : '1px solid #E2E8F0',
                          borderRadius: 14, padding: '12px 4px', cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        }}
                      >
                        <span style={{ fontSize: 30, fontFamily: scriptFont, lineHeight: 1.3 }}>{letter.char}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: selected?.char === letter.char ? 'rgba(255,255,255,0.9)' : '#6366F1' }}>{letter.roman}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            /* 퀴즈 모드 */
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#64748B' }}>Score: <span style={{ color: '#6366F1' }}>{quizScore}/{quizTotal}</span></div>
                <button
                  onClick={() => speak(quizTarget?.char || '')}
                  style={{ background: '#EEF2FF', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 14, fontWeight: 800, color: '#4338CA', cursor: 'pointer', fontFamily: FONT }}
                >
                  🔊 Replay sound
                </button>
              </div>
              {quizTarget && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', marginBottom: 8 }}>Which sound is this?</div>
                  <div style={{ fontSize: 84, fontFamily: scriptFont, lineHeight: 1.2, marginBottom: 20 }}>{quizTarget.char}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {quizChoices.map((c, i) => {
                      const isTarget = c.char === quizTarget.char;
                      const wasPicked = quizPicked === c.char;
                      const showCorrect = quizPicked && isTarget;
                      const showWrong = quizPicked && wasPicked && !isTarget;
                      return (
                        <button
                          key={i}
                          onClick={() => pickQuiz(c)}
                          disabled={!!quizPicked}
                          style={{
                            border: 'none', borderRadius: 12, padding: '14px 8px',
                            fontSize: 16, fontWeight: 800, cursor: quizPicked ? 'default' : 'pointer', fontFamily: FONT,
                            background: showCorrect ? '#DCFCE7' : showWrong ? '#FEE2E2' : '#F1F5F9',
                            color: showCorrect ? '#166534' : showWrong ? '#991B1B' : '#0F172A',
                          }}
                        >
                          {c.roman}
                        </button>
                      );
                    })}
                  </div>
                  {quizPicked && (
                    <button
                      onClick={() => setQuizIdx(i => i + 1)}
                      style={{ marginTop: 18, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', border: 'none', borderRadius: 99, padding: '12px 40px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}
                    >
                      Next →
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </RtlDir>
  );
}

export default function AlphabetPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F8FAFC' }} />}>
      <AlphabetContent />
    </Suspense>
  );
}
