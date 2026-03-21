'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getTutorForLang } from '@/data/tutors';

// ─── Unit Data ───────────────────────────────────────────────────────────────
const UNITS = [
  { id: 1, title: 'First Words',       emoji: '👋', words: [
    { word: 'Hello',   emoji: '👋', phonetic: 'heh-LOH' },
    { word: 'Yes',     emoji: '✅', phonetic: 'yɛs' },
    { word: 'No',      emoji: '❌', phonetic: 'noʊ' },
    { word: 'Please',  emoji: '🙏', phonetic: 'pliːz' },
    { word: 'Thank you', emoji: '😊', phonetic: 'ΘÆŊK-yuː' },
  ]},
  { id: 2, title: 'Numbers 1–5',       emoji: '🔢', words: [
    { word: 'One',   emoji: '1️⃣', phonetic: 'wʌn' },
    { word: 'Two',   emoji: '2️⃣', phonetic: 'tuː' },
    { word: 'Three', emoji: '3️⃣', phonetic: 'θriː' },
    { word: 'Four',  emoji: '4️⃣', phonetic: 'fɔːr' },
    { word: 'Five',  emoji: '5️⃣', phonetic: 'faɪv' },
  ]},
  { id: 3, title: 'Numbers 6–10',      emoji: '🔟', words: [
    { word: 'Six',   emoji: '6️⃣', phonetic: 'sɪks' },
    { word: 'Seven', emoji: '7️⃣', phonetic: 'SEV-ən' },
    { word: 'Eight', emoji: '8️⃣', phonetic: 'eɪt' },
    { word: 'Nine',  emoji: '9️⃣', phonetic: 'naɪn' },
    { word: 'Ten',   emoji: '🔟', phonetic: 'tɛn' },
  ]},
  { id: 4, title: 'Colors',            emoji: '🎨', words: [
    { word: 'Red',    emoji: '🔴', phonetic: 'rɛd' },
    { word: 'Blue',   emoji: '🔵', phonetic: 'bluː' },
    { word: 'Green',  emoji: '🟢', phonetic: 'ɡriːn' },
    { word: 'Yellow', emoji: '🟡', phonetic: 'YEL-oh' },
    { word: 'White',  emoji: '⬜', phonetic: 'waɪt' },
  ]},
  { id: 5, title: 'Body Parts',        emoji: '🧍', words: [
    { word: 'Head',  emoji: '🗣️', phonetic: 'hɛd' },
    { word: 'Hand',  emoji: '✋', phonetic: 'hænd' },
    { word: 'Eye',   emoji: '👁️', phonetic: 'aɪ' },
    { word: 'Mouth', emoji: '👄', phonetic: 'maʊθ' },
    { word: 'Ear',   emoji: '👂', phonetic: 'ɪər' },
  ]},
  { id: 6, title: 'Family',            emoji: '👨‍👩‍👧', words: [
    { word: 'Mother',  emoji: '👩', phonetic: 'MUH-thər' },
    { word: 'Father',  emoji: '👨', phonetic: 'FAH-thər' },
    { word: 'Sister',  emoji: '👧', phonetic: 'SIS-tər' },
    { word: 'Brother', emoji: '👦', phonetic: 'BRUH-thər' },
    { word: 'Friend',  emoji: '🤝', phonetic: 'frɛnd' },
  ]},
  { id: 7, title: 'Food & Drink',      emoji: '🍽️', words: [
    { word: 'Water', emoji: '💧', phonetic: 'WAW-tər' },
    { word: 'Food',  emoji: '🍱', phonetic: 'fuːd' },
    { word: 'Bread', emoji: '🍞', phonetic: 'brɛd' },
    { word: 'Rice',  emoji: '🍚', phonetic: 'raɪs' },
    { word: 'Fruit', emoji: '🍎', phonetic: 'fruːt' },
  ]},
  { id: 8, title: 'Places',            emoji: '🏠', words: [
    { word: 'Home',   emoji: '🏠', phonetic: 'hoʊm' },
    { word: 'School', emoji: '🏫', phonetic: 'skuːl' },
    { word: 'Store',  emoji: '🏪', phonetic: 'stɔːr' },
    { word: 'Street', emoji: '🛣️', phonetic: 'striːt' },
    { word: 'Park',   emoji: '🌳', phonetic: 'pɑːrk' },
  ]},
  { id: 9, title: 'Actions',           emoji: '🏃', words: [
    { word: 'Go',    emoji: '🚶', phonetic: 'ɡoʊ' },
    { word: 'Come',  emoji: '👉', phonetic: 'kʌm' },
    { word: 'Eat',   emoji: '😋', phonetic: 'iːt' },
    { word: 'Drink', emoji: '🥤', phonetic: 'drɪŋk' },
    { word: 'Sleep', emoji: '😴', phonetic: 'sliːp' },
  ]},
  { id: 10, title: 'Simple Phrases',   emoji: '💬', words: [
    { word: 'I am',    emoji: '🙋', phonetic: 'aɪ æm' },
    { word: 'I want',  emoji: '🙌', phonetic: 'aɪ wɒnt' },
    { word: 'I like',  emoji: '❤️', phonetic: 'aɪ laɪk' },
    { word: 'Good',    emoji: '👍', phonetic: 'ɡʊd' },
    { word: 'Help',    emoji: '🆘', phonetic: 'hɛlp' },
  ]},
];

type Phase = 'lobby' | 'learn' | 'listen' | 'match' | 'speak' | 'chat' | 'complete';
type Word = { word: string; emoji: string; phonetic: string };
type TranslatedUnit = { word: string; emoji: string; phonetic: string; original: string }[];

// ─── Main Component ───────────────────────────────────────────────────────────
function StarterContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const [phase, setPhase]         = useState<Phase>('lobby');
  const [unitIdx, setUnitIdx]     = useState(0);
  const [wordIdx, setWordIdx]     = useState(0);
  const [learnDone, setLearnDone] = useState(false);

  // Translated words for current unit
  const [translatedWords, setTranslatedWords] = useState<TranslatedUnit | null>(null);
  const [isTranslating, setIsTranslating]     = useState(false);

  // Tutor video
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Listen phase
  const [listenWord, setListenWord]   = useState<Word | null>(null);
  const [listenChoice, setListenChoice] = useState<Word[]>([]);
  const [listenResult, setListenResult] = useState<'correct'|'wrong'|null>(null);
  const [listenIdx, setListenIdx]     = useState(0);

  // Match phase
  const [matchLeft, setMatchLeft]   = useState<string[]>([]);
  const [matchRight, setMatchRight] = useState<string[]>([]);
  const [matchSel, setMatchSel]     = useState<string|null>(null);
  const [matchDone, setMatchDone]   = useState<string[]>([]);
  const [matchWrong, setMatchWrong] = useState<string[]>([]);
  const [matchTranslations, setMatchTranslations] = useState<Record<string,string>>({});

  // Speak phase
  const [speakIdx, setSpeakIdx]     = useState(0);
  const [speakDone, setSpeakDone]   = useState<boolean[]>([]);

  // Chat phase
  const [chatMsgs, setChatMsgs]     = useState<{role:'tutor'|'user';text:string}[]>([]);
  const [chatInput, setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

  // XP
  const [xp, setXp]       = useState(0);
  const [xpPop, setXpPop] = useState(false);

  const audioRef   = useRef<HTMLAudioElement|null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recRef     = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  const langId  = params.get('lang')    || (typeof window !== 'undefined' ? localStorage.getItem('mt_learn_lang') : null) || 'en-US';
  const subLang = params.get('subLang') || (typeof window !== 'undefined' ? localStorage.getItem('mt_native_lang') : null) || 'en-US';

  // Tutor for this language
  const tutor = getTutorForLang(langId);

  const unit  = UNITS[unitIdx];
  // Use translated words if available, otherwise fall back to English
  const words: Word[] = translatedWords ?? unit.words;

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (recRef.current) { try { recRef.current.stop(); } catch {} }
    };
  }, []);

  // STT setup for chat
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = langId;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.trim();
      setIsListening(false);
      if (transcript) setChatInput(transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recRef.current = rec;
  }, [langId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    audioRef.current?.pause();
    setIsSpeaking(false);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: langId, gender: tutor.gender, speed: 0.78 }),
      });
      const data = await res.json();
      if (!data.audioContent) return;
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audioRef.current = audio;
      setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); audioRef.current = null; };
      audio.play().catch(() => { setIsSpeaking(false); });
    } catch { setIsSpeaking(false); }
  }, [langId, tutor.gender]);

  // ── Gemini ─────────────────────────────────────────────────────────────────
  const callGemini = useCallback(async (prompt: string) => {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user?.uid ?? null, prompt, temperature: 0.5 }),
    });
    const data = await res.json();
    return data.text?.trim() || '';
  }, [user]);

  // ── Translate unit words into target language on unit change ────────────────
  useEffect(() => {
    // English stays as-is
    if (langId === 'en-US' || langId === 'en-GB' || langId === 'en-AU' || langId === 'en-CA') {
      setTranslatedWords(null);
      return;
    }
    setIsTranslating(true);
    setTranslatedWords(null);

    const LANG_NAMES: Record<string,string> = {
      'ko-KR':'Korean','ja-JP':'Japanese','zh-CN':'Chinese (Simplified)',
      'zh-TW':'Chinese (Traditional)','fr-FR':'French','de-DE':'German',
      'es-ES':'Spanish','it-IT':'Italian','pt-BR':'Portuguese','ru-RU':'Russian',
      'ar-XA':'Arabic','hi-IN':'Hindi','vi-VN':'Vietnamese','th-TH':'Thai',
      'id-ID':'Indonesian','ms-MY':'Malay','tr-TR':'Turkish','nl-NL':'Dutch',
      'pl-PL':'Polish','sv-SE':'Swedish','da-DK':'Danish','fi-FI':'Finnish',
      'he-IL':'Hebrew','uk-UA':'Ukrainian','cs-CZ':'Czech','hu-HU':'Hungarian',
      'ro-RO':'Romanian','el-GR':'Greek','bg-BG':'Bulgarian','hr-HR':'Croatian',
      'sk-SK':'Slovak','bn-IN':'Bengali','ta-IN':'Tamil','te-IN':'Telugu',
      'ml-IN':'Malayalam','kn-IN':'Kannada','gu-IN':'Gujarati','mr-IN':'Marathi',
      'pa-IN':'Punjabi','ur-IN':'Urdu','sw-KE':'Swahili','af-ZA':'Afrikaans',
      'am-ET':'Amharic','ha-NG':'Hausa','yo-NG':'Yoruba','ig-NG':'Igbo',
      'zu-ZA':'Zulu','km-KH':'Khmer','my-MM':'Burmese','lo-LA':'Lao',
      'kk-KZ':'Kazakh','uz-UZ':'Uzbek','mn-MN':'Mongolian','az-AZ':'Azerbaijani',
      'hy-AM':'Armenian','ka-GE':'Georgian','ne-NP':'Nepali','si-LK':'Sinhala',
      'ps-AF':'Pashto','mk-MK':'Macedonian','sq-AL':'Albanian','is-IS':'Icelandic',
      'cy-GB':'Welsh','ca-ES':'Catalan','nb-NO':'Norwegian','lt-LT':'Lithuanian',
      'lv-LV':'Latvian','et-EE':'Estonian','sr-RS':'Serbian','sl-SI':'Slovenian',
    };

    const targetLang = LANG_NAMES[langId] || langId;
    const currentUnit = UNITS[unitIdx];
    const wordList = currentUnit.words.map(w => w.word).join(', ');

    const prompt = `Translate these ${currentUnit.words.length} words into ${targetLang} for a complete beginner.
English words: ${wordList}

Return ONLY a JSON array, no markdown, no explanation:
[{"word":"TRANSLATED_WORD","phonetic":"ROMANIZED_PRONUNCIATION","original":"ENGLISH_WORD"},...]

Rules:
- word: the word in ${targetLang} script
- phonetic: simple romanized pronunciation guide (e.g. "an-nyong" for 안녕)
- original: the original English word exactly as given
- Keep the same order as the input
- Return exactly ${currentUnit.words.length} items`;

    fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user?.uid ?? null, prompt, temperature: 0.2 }),
    }).then(r => r.json()).then(data => {
      const raw = data.text?.trim() || '';
      const clean = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```[\s\S]*$/i,'').trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        // Merge with original emoji
        const merged = parsed.map((item: any, i: number) => ({
          word:     item.word     || currentUnit.words[i].word,
          phonetic: item.phonetic || '',
          emoji:    currentUnit.words[i].emoji,
          original: item.original || currentUnit.words[i].word,
        }));
        setTranslatedWords(merged);
      }
    }).catch(() => {
      // Translation failed — keep English
      setTranslatedWords(null);
    }).finally(() => setIsTranslating(false));
  }, [unitIdx, langId, user?.uid]);

  // ── Translate word (for match phase native meanings) ─────────────────────────
  const translateWord = useCallback(async (word: string): Promise<string> => {
    if (langId === subLang || subLang === 'en-US') return word;
    const NATIVE_NAMES: Record<string,string> = {
      'ko-KR':'Korean','ja-JP':'Japanese','zh-CN':'Chinese','fr-FR':'French',
      'de-DE':'German','es-ES':'Spanish','ru-RU':'Russian','ar-XA':'Arabic',
      'hi-IN':'Hindi','pt-BR':'Portuguese','it-IT':'Italian','vi-VN':'Vietnamese',
    };
    const nativeLang = NATIVE_NAMES[subLang] || 'English';
    try {
      // For match phase: translate the TARGET language word back to native
      const t = await callGemini(`Translate "${word}" to ${nativeLang}. Reply with ONLY the translation.`);
      return t || word;
    } catch { return word; }
  }, [langId, subLang, callGemini]);

  // ── LEARN phase ─────────────────────────────────────────────────────────────
  const startLearn = useCallback(() => {
    setPhase('learn');
    setWordIdx(0);
    speak(words[0].word);
  }, [words, speak]);

  const nextLearnWord = useCallback(() => {
    const next = wordIdx + 1;
    if (next >= words.length) {
      setLearnDone(true);
      startListenPhase();
    } else {
      setWordIdx(next);
      speak(words[next].word);
    }
  }, [wordIdx, words, speak]);

  // ── LISTEN phase ─────────────────────────────────────────────────────────────
  const startListenPhase = useCallback(() => {
    const idx = 0;
    setListenIdx(idx);
    setListenResult(null);
    const correct = words[idx];
    const wrong = words.find(w => w.word !== correct.word) || words[(idx + 1) % words.length];
    const choices = Math.random() > 0.5 ? [correct, wrong] : [wrong, correct];
    setListenWord(correct);
    setListenChoice(choices);
    setPhase('listen');
    setTimeout(() => speak(correct.word), 400);
  }, [words, speak]);

  const nextListenWord = useCallback((nextIdx: number) => {
    if (nextIdx >= words.length) {
      startMatchPhase();
      return;
    }
    setListenIdx(nextIdx);
    setListenResult(null);
    const correct = words[nextIdx];
    const otherIdx = (nextIdx + 1) % words.length;
    const wrong = words[otherIdx].word === correct.word
      ? words[(nextIdx + 2) % words.length]
      : words[otherIdx];
    const choices = Math.random() > 0.5 ? [correct, wrong] : [wrong, correct];
    setListenWord(correct);
    setListenChoice(choices);
    setTimeout(() => speak(correct.word), 400);
  }, [words, speak]);

  const handleListenChoice = useCallback((chosen: Word) => {
    if (listenResult) return;
    const correct = chosen.word === listenWord?.word;
    setListenResult(correct ? 'correct' : 'wrong');
    if (correct) { setXp(x => x + 10); setXpPop(true); setTimeout(() => setXpPop(false), 1000); }
    setTimeout(() => nextListenWord(listenIdx + 1), 900);
  }, [listenResult, listenWord, listenIdx, nextListenWord]);

  // ── MATCH phase ─────────────────────────────────────────────────────────────
  const startMatchPhase = useCallback(async () => {
    const sample = words.slice(0, 3);
    const translations: Record<string,string> = {};
    for (const w of sample) {
      translations[w.word] = await translateWord(w.word);
    }
    setMatchTranslations(translations);
    setMatchLeft(sample.map(w => w.word));
    setMatchRight([...sample].sort(() => Math.random() - 0.5).map(w => translations[w.word] || w.word));
    setMatchSel(null);
    setMatchDone([]);
    setMatchWrong([]);
    setPhase('match');
  }, [words, translateWord]);

  const handleMatchTap = useCallback((item: string, side: 'left'|'right') => {
    if (matchDone.includes(item)) return;
    if (!matchSel) {
      setMatchSel(`${side}:${item}`);
      return;
    }
    const [selSide, selItem] = matchSel.split(':');
    if (selSide === side) { setMatchSel(`${side}:${item}`); return; }

    // Check match
    const leftWord  = side === 'right' ? selItem : item;
    const rightWord = side === 'right' ? item : selItem;
    const isMatch = matchTranslations[leftWord] === rightWord
      || (subLang === 'en-US' && leftWord === rightWord);

    if (isMatch) {
      setMatchDone(d => [...d, leftWord, rightWord]);
      setMatchSel(null);
      setXp(x => x + 15); setXpPop(true); setTimeout(() => setXpPop(false), 1000);
      if (matchDone.length + 2 >= 6) setTimeout(() => startSpeakPhase(), 700);
    } else {
      setMatchWrong([leftWord, rightWord]);
      setTimeout(() => { setMatchWrong([]); setMatchSel(null); }, 800);
    }
  }, [matchSel, matchDone, matchTranslations, subLang]);

  // ── SPEAK phase ─────────────────────────────────────────────────────────────
  const startSpeakPhase = useCallback(() => {
    setSpeakIdx(0);
    setSpeakDone(new Array(words.length).fill(false));
    setPhase('speak');
    setTimeout(() => speak(words[0].word), 400);
  }, [words, speak]);

  const handleSpeakDone = useCallback(() => {
    const next = speakIdx + 1;
    const newDone = [...speakDone];
    newDone[speakIdx] = true;
    setSpeakDone(newDone);
    setXp(x => x + 5);
    if (next >= words.length) {
      setTimeout(() => startChatPhase(), 500);
    } else {
      setSpeakIdx(next);
      setTimeout(() => speak(words[next].word), 300);
    }
  }, [speakIdx, speakDone, words, speak]);

  // ── CHAT phase ─────────────────────────────────────────────────────────────
  const startChatPhase = useCallback(async () => {
    setPhase('chat');
    setChatMsgs([]);
    setChatStarted(false);
    setChatLoading(true);
    const unitWords = words.map(w => w.word).join(', ');
    const LANG_NAMES: Record<string,string> = {
      'en-US':'English','ko-KR':'Korean','ja-JP':'Japanese','zh-CN':'Chinese',
      'fr-FR':'French','de-DE':'German','es-ES':'Spanish','it-IT':'Italian',
      'pt-BR':'Portuguese','ru-RU':'Russian','ar-XA':'Arabic','hi-IN':'Hindi',
      'vi-VN':'Vietnamese','th-TH':'Thai','id-ID':'Indonesian','tr-TR':'Turkish',
    };
    const targetLangName = LANG_NAMES[langId] || langId.split('-')[0];
    const nativeLangName = LANG_NAMES[subLang] || 'English';
    const isEnglishTarget = langId.startsWith('en');
    const prompt = `You are a warm and encouraging tutor for a complete beginner.
The student just learned these ${targetLangName} words: ${unitWords}
Unit topic: "${unit.title}"

LANGUAGE RULES:
- If the student's native language (${nativeLangName}) is different from ${targetLangName}: write your message FIRST in ${targetLangName}, then add a short translation in ${nativeLangName} in parentheses
- If both are the same language: use only ${targetLangName}
- STRICT: Keep to MAX 2 short sentences total
- Ask them to say or type just ONE word from the lesson
- Be enthusiastic with emoji 🎉
- Example: "${words[0].word}! Can you say this? (Can you say this?)"`;
    const text = await callGemini(prompt).catch(() => `Great work! 🎉 Can you say "${words[0].word}"?`);
    setChatMsgs([{ role: 'tutor', text }]);
    speak(text);
    setChatLoading(false);
    setChatStarted(true);
  }, [words, unit, langId, callGemini, speak]);

  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMsgs(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    setXp(x => x + 20);

    const history = [...chatMsgs, { role: 'user' as const, text: userMsg }]
      .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join('\n');

    const unitWords = words.map(w => w.word).join(', ');
    const CHAT_LANG_NAMES: Record<string,string> = {
      'en-US':'English','ko-KR':'Korean','ja-JP':'Japanese','zh-CN':'Chinese',
      'fr-FR':'French','de-DE':'German','es-ES':'Spanish','it-IT':'Italian',
      'pt-BR':'Portuguese','ru-RU':'Russian','ar-XA':'Arabic','hi-IN':'Hindi',
      'vi-VN':'Vietnamese','th-TH':'Thai','id-ID':'Indonesian','tr-TR':'Turkish',
    };
    const tLang = CHAT_LANG_NAMES[langId] || langId.split('-')[0];
    const nLang = CHAT_LANG_NAMES[subLang] || 'English';
    const prompt = `You are a warm tutor for a COMPLETE BEGINNER learning their very first ${tLang} words.
Known ${tLang} words: ${unitWords}
Conversation so far:
${history}

LANGUAGE RULES:
- Write responses in ${tLang} + add a brief ${nLang} translation in parentheses if they differ
- Max 2 short sentences
- If correct: celebrate loudly 🎉
- If wrong: gently say the correct ${tLang} word once
- End by asking them to say one more word from the list`;

    const reply = await callGemini(prompt).catch(() => `Good try! 🌟 You're doing great!`);
    setChatMsgs(prev => [...prev, { role: 'tutor', text: reply }]);
    speak(reply);
    setChatLoading(false);

    // After 2 exchanges, allow completion
    if (chatMsgs.length >= 3) {
      setTimeout(() => setPhase('complete'), 3000);
    }
  }, [chatInput, chatLoading, chatMsgs, words, callGemini, speak]);

  const finishUnit = useCallback(() => {
    if (unitIdx + 1 >= UNITS.length) {
      router.push('/lingua');
      return;
    }
    setUnitIdx(u => u + 1);
    setPhase('lobby');
    setWordIdx(0);
    setLearnDone(false);
    setChatStarted(false);
    setChatMsgs([]);
  }, [unitIdx, router]);

  // ── Styles ──────────────────────────────────────────────────────────────────
  const ACCENT = '#6366F1';
  const BG     = '#F0F4FF';

  const btnBase: React.CSSProperties = {
    border: 'none', cursor: 'pointer',
    fontFamily: "'Nunito',sans-serif", fontWeight: 900,
    borderRadius: 18, transition: 'all .15s',
  };

  // ── LOBBY ───────────────────────────────────────────────────────────────────
  if (phase === 'lobby') return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Nunito',sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pop { 0%{transform:scale(0.8);opacity:0} 50%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        @keyframes xppop { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-40px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}} />

      {/* Back */}
      <button onClick={() => router.push('/lingua')}
        style={{ ...btnBase, position: 'absolute', top: 20, left: 20,
          padding: '8px 16px', background: 'white', color: '#64748B',
          fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        ← Back
      </button>

      {/* XP */}
      <div style={{ position: 'absolute', top: 20, right: 20,
        background: 'white', borderRadius: 99, padding: '6px 14px',
        fontSize: 14, fontWeight: 800, color: ACCENT,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        ⭐ {xp} XP
      </div>

      {/* Tutor Video */}
      <div style={{ position:'relative', width:90, height:90,
        borderRadius:'50%', overflow:'hidden', marginBottom:16, flexShrink:0,
        border:'3px solid #E0E7FF',
        boxShadow:'0 4px 16px rgba(99,102,241,0.12)' }}>
        <video src={tutor.videoIdle} autoPlay loop muted playsInline
          style={{ position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', objectPosition:'center 20%' }}/>
      </div>
      <div style={{ fontSize:11, color:'#94A3B8', fontWeight:700,
        marginBottom:6 }}>{tutor.name}</div>

      {/* Unit list */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8',
        letterSpacing: 1, marginBottom: 8 }}>PRE-A1 · STARTER</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A',
        marginBottom: 4, textAlign: 'center' }}>
        {unit.emoji} {unit.title}
      </div>
      <div style={{ fontSize: 14, color: '#64748B', marginBottom: 32,
        fontWeight: 600 }}>Unit {unit.id} of {UNITS.length}</div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 360, height: 8, background: '#E2E8F0',
        borderRadius: 99, marginBottom: 40, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${ACCENT}, #818CF8)`,
          width: `${(unitIdx / UNITS.length) * 100}%`,
          transition: 'width .4s' }} />
      </div>

      {/* Words preview */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap',
        justifyContent: 'center', marginBottom: 16, maxWidth: 360 }}>
        {isTranslating ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: '#E0E7FF', borderRadius: 14,
              padding: '10px 20px', width: 80, height: 40,
              animation: 'pulse 1.2s infinite' }}/>
          ))
        ) : words.map((w, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 14,
            padding: '10px 16px', fontSize: 13, fontWeight: 800,
            color: '#334155', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20 }}>{w.emoji}</span>
            <div>
              <div>{w.word}</div>
              {(w as any).original && (w as any).original !== w.word && (
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
                  {(w as any).original}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Language badge */}
      {langId !== 'en-US' && langId !== 'en-GB' && (
        <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 700,
          marginBottom: 24, padding: '4px 12px',
          background: '#EEF2FF', borderRadius: 99 }}>
          {isTranslating ? '⏳ Translating...' : `✅ Showing in ${langId.split('-')[0].toUpperCase()}`}
        </div>
      )}

      <button onClick={startLearn}
        style={{ ...btnBase, padding: '18px 56px', fontSize: 20,
          background: `linear-gradient(135deg, ${ACCENT}, #818CF8)`,
          color: 'white', boxShadow: `0 6px 24px ${ACCENT}50`,
          animation: 'bounce 2s infinite' }}>
        Start Learning! 🚀
      </button>

      {/* All units mini map */}
      <div style={{ display: 'flex', gap: 8, marginTop: 40, flexWrap: 'wrap',
        justifyContent: 'center', maxWidth: 360 }}>
        {UNITS.map((u, i) => (
          <div key={u.id}
            style={{ width: 36, height: 36, borderRadius: 10,
              background: i < unitIdx ? ACCENT : i === unitIdx ? '#E0E7FF' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, cursor: i <= unitIdx ? 'pointer' : 'default',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              border: i === unitIdx ? `2px solid ${ACCENT}` : '2px solid transparent',
              color: i < unitIdx ? 'white' : '#64748B' }}
            onClick={() => i <= unitIdx && setUnitIdx(i)}>
            {i < unitIdx ? '✓' : u.emoji}
          </div>
        ))}
      </div>
    </div>
  );

  // ── LEARN ───────────────────────────────────────────────────────────────────
  if (phase === 'learn') {
    const w = words[wordIdx];
    // Show loading while translating
    if (isTranslating) return (
      <div style={{ minHeight:'100vh', background:BG, display:'flex',
        flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ width:40, height:40, border:'4px solid #E0E7FF',
          borderTopColor:ACCENT, borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
        <style dangerouslySetInnerHTML={{ __html:'@keyframes spin{to{transform:rotate(360deg)}}' }}/>
        <div style={{ fontSize:14, fontWeight:700, color:'#6366F1' }}>
          Preparing your {langId.split('-')[0].toUpperCase()} lesson...
        </div>
      </div>
    );
    return (
      <div style={{ minHeight: '100vh', background: BG,
        fontFamily: "'Nunito',sans-serif", display: 'flex',
        flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 24 }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
          @keyframes pop { 0%{transform:scale(0.8);opacity:0} 50%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
          @keyframes xppop { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-40px)} }
          @keyframes spin { to{transform:rotate(360deg)} }
        `}} />

        {/* Tutor Video */}
        <div style={{ position:'relative', width:140, height:140,
          borderRadius:'50%', overflow:'hidden', marginBottom:24,
          border:`3px solid ${isSpeaking ? '#6366F1' : '#E0E7FF'}`,
          boxShadow: isSpeaking ? '0 0 0 6px #6366F120' : 'none',
          transition:'border-color .3s, box-shadow .3s', flexShrink:0 }}>
          <video src={tutor.videoIdle} autoPlay loop muted playsInline
            style={{ position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', objectPosition:'center 20%',
              opacity: isSpeaking ? 0 : 1, transition:'opacity .25s' }}/>
          <video src={tutor.videoTalk} autoPlay loop muted playsInline
            style={{ position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', objectPosition:'center 20%',
              opacity: isSpeaking ? 1 : 0, transition:'opacity .25s' }}/>
        </div>

        {/* XP pop */}
        {xpPop && (
          <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translateX(-50%)',
            fontSize: 28, fontWeight: 900, color: ACCENT,
            animation: 'xppop .8s forwards', pointerEvents: 'none', zIndex: 999 }}>
            +10 ⭐
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8',
          letterSpacing: 1, marginBottom: 20 }}>
          LEARN · {wordIdx + 1} / {words.length}
        </div>

        {/* Word card */}
        <div key={w.word}
          onClick={() => speak(w.word)}
          style={{ background: 'white', borderRadius: 28, padding: '40px 56px',
            textAlign: 'center', cursor: 'pointer', marginBottom: 28,
            boxShadow: '0 8px 40px rgba(99,102,241,0.15)',
            animation: 'pop .35s ease',
            border: `2px solid ${ACCENT}20` }}>
          <div style={{ fontSize: 80, marginBottom: 12,
            lineHeight: 1 }}>{w.emoji}</div>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#0F172A',
            marginBottom: 6, letterSpacing: -1 }}>{w.word}</div>
          <div style={{ fontSize: 16, color: '#94A3B8', fontWeight: 700,
            marginBottom: 8, fontStyle: 'italic' }}>{w.phonetic}</div>
          {/* Original English word (if translated) */}
          {(w as any).original && (w as any).original !== w.word && (
            <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 6, fontWeight: 600 }}>
              {(w as any).original}
            </div>
          )}
          <div style={{ fontSize: 14, color: ACCENT, fontWeight: 800, marginBottom: 0 }}>
            🔊 Tap to hear
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {words.map((_, i) => (
            <div key={i} style={{ width: i === wordIdx ? 24 : 8, height: 8,
              borderRadius: 99, transition: 'all .3s',
              background: i < wordIdx ? ACCENT : i === wordIdx ? ACCENT : '#CBD5E1' }} />
          ))}
        </div>

        <button onClick={nextLearnWord}
          style={{ ...btnBase, padding: '16px 48px', fontSize: 18,
            background: `linear-gradient(135deg, ${ACCENT}, #818CF8)`,
            color: 'white', boxShadow: `0 6px 20px ${ACCENT}40` }}>
          {wordIdx + 1 < words.length ? 'Next Word →' : 'Got it! ✓'}
        </button>
      </div>
    );
  }

  // ── LISTEN ──────────────────────────────────────────────────────────────────
  if (phase === 'listen' && listenWord) return (
    <div style={{ minHeight: '100vh', background: BG,
      fontFamily: "'Nunito',sans-serif", display: 'flex',
      flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        @keyframes pop { 0%{transform:scale(0.9)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
        @keyframes xppop { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-40px)} }
      `}} />

      {xpPop && (
        <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translateX(-50%)',
          fontSize: 28, fontWeight: 900, color: '#10B981',
          animation: 'xppop .8s forwards', pointerEvents: 'none', zIndex: 999 }}>
          +10 ⭐
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8',
        letterSpacing: 1, marginBottom: 20 }}>
        LISTEN & CHOOSE · {listenIdx + 1} / {words.length}
      </div>

      {/* Tutor Video */}
      <div style={{ position:'relative', width:100, height:100,
        borderRadius:'50%', overflow:'hidden', marginBottom:24, flexShrink:0,
        border:`3px solid ${isSpeaking ? ACCENT : '#E0E7FF'}`,
        boxShadow: isSpeaking ? `0 0 0 5px ${ACCENT}20` : 'none',
        transition:'border-color .3s, box-shadow .3s' }}>
        <video src={tutor.videoIdle} autoPlay loop muted playsInline
          style={{ position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', objectPosition:'center 20%',
            opacity:isSpeaking?0:1, transition:'opacity .25s' }}/>
        <video src={tutor.videoTalk} autoPlay loop muted playsInline
          style={{ position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', objectPosition:'center 20%',
            opacity:isSpeaking?1:0, transition:'opacity .25s' }}/>
      </div>

      {/* Listen button */}
      <button onClick={() => speak(listenWord.word)}
        style={{ ...btnBase, width: 120, height: 120, borderRadius: '50%',
          background: `linear-gradient(135deg, ${ACCENT}, #818CF8)`,
          color: 'white', fontSize: 48, marginBottom: 48,
          boxShadow: `0 8px 32px ${ACCENT}50` }}>
        🔊
      </button>

      <div style={{ fontSize: 18, fontWeight: 800, color: '#475569',
        marginBottom: 32 }}>Which word did you hear?</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 340 }}>
        {listenChoice.map((w, i) => {
          const isCorrect = w.word === listenWord.word;
          const picked = listenResult !== null;
          let bg = 'white';
          let border = '2px solid #E2E8F0';
          let anim = '';
          if (picked && isCorrect) { bg = '#DCFCE7'; border = '2px solid #10B981'; anim = 'pop .3s ease'; }
          if (picked && !isCorrect && listenChoice[i].word === listenChoice[i].word) {
            // wrong selection — only animate if result is wrong
          }
          if (listenResult === 'wrong' && !isCorrect) { bg = '#FEE2E2'; border = '2px solid #EF4444'; anim = 'shake .3s ease'; }
          return (
            <button key={i} onClick={() => handleListenChoice(w)}
              disabled={!!listenResult}
              style={{ ...btnBase, padding: '20px', fontSize: 22,
                background: bg, border, animation: anim,
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                color: '#0F172A', textAlign: 'left' }}>
              <span style={{ fontSize: 36 }}>{w.emoji}</span>
              <div>
                <div style={{ fontWeight: 900 }}>{w.word}</div>
                <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 700 }}>{w.phonetic}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── MATCH ───────────────────────────────────────────────────────────────────
  if (phase === 'match') return (
    <div style={{ minHeight: '100vh', background: BG,
      fontFamily: "'Nunito',sans-serif", display: 'flex',
      flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        @keyframes xppop { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-40px)} }
      `}} />

      {xpPop && (
        <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translateX(-50%)',
          fontSize: 28, fontWeight: 900, color: '#10B981',
          animation: 'xppop .8s forwards', pointerEvents: 'none', zIndex: 999 }}>
          +15 ⭐
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8',
        letterSpacing: 1, marginBottom: 8 }}>MATCH PAIRS</div>

      {/* Tutor + instruction row */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <div style={{ position:'relative', width:60, height:60,
          borderRadius:'50%', overflow:'hidden', flexShrink:0,
          border:`2px solid ${isSpeaking ? ACCENT : '#E0E7FF'}`,
          transition:'border-color .3s' }}>
          <video src={tutor.videoIdle} autoPlay loop muted playsInline
            style={{ position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', objectPosition:'center 20%',
              opacity:isSpeaking?0:1, transition:'opacity .25s' }}/>
          <video src={tutor.videoTalk} autoPlay loop muted playsInline
            style={{ position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', objectPosition:'center 20%',
              opacity:isSpeaking?1:0, transition:'opacity .25s' }}/>
        </div>
        <div style={{ fontSize:14, color:'#64748B', fontWeight:600, lineHeight:1.4 }}>
          Connect each word to its meaning
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '12px 20px', width: '100%', maxWidth: 360 }}>
        {/* Left: target words */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {matchLeft.map(word => {
            const selected = matchSel === `left:${word}`;
            const done = matchDone.includes(word);
            const wrong = matchWrong.includes(word);
            return (
              <button key={word} onClick={() => handleMatchTap(word, 'left')}
                disabled={done}
                style={{ ...btnBase, padding: '16px 14px', fontSize: 16,
                  fontWeight: 800, textAlign: 'center',
                  background: done ? '#DCFCE7' : selected ? '#EEF2FF' : 'white',
                  border: `2px solid ${done ? '#10B981' : selected ? ACCENT : '#E2E8F0'}`,
                  color: done ? '#10B981' : '#0F172A',
                  boxShadow: selected ? `0 0 0 4px ${ACCENT}20` : '0 2px 8px rgba(0,0,0,0.06)',
                  animation: wrong ? 'shake .3s ease' : 'none',
                  opacity: done ? 0.7 : 1 }}>
                {done ? '✓' : word}
              </button>
            );
          })}
        </div>
        {/* Right: translations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {matchRight.map(trl => {
            const selected = matchSel === `right:${trl}`;
            const done = matchDone.includes(trl);
            const wrong = matchWrong.includes(trl);
            return (
              <button key={trl} onClick={() => handleMatchTap(trl, 'right')}
                disabled={done}
                style={{ ...btnBase, padding: '16px 14px', fontSize: 16,
                  fontWeight: 800, textAlign: 'center',
                  background: done ? '#DCFCE7' : selected ? '#F0FDF4' : 'white',
                  border: `2px solid ${done ? '#10B981' : selected ? '#10B981' : '#E2E8F0'}`,
                  color: done ? '#10B981' : '#0F172A',
                  boxShadow: selected ? '0 0 0 4px #10B98120' : '0 2px 8px rgba(0,0,0,0.06)',
                  animation: wrong ? 'shake .3s ease' : 'none',
                  opacity: done ? 0.7 : 1 }}>
                {done ? '✓' : trl}
              </button>
            );
          })}
        </div>
      </div>

      {matchDone.length >= 6 && (
        <button onClick={startSpeakPhase}
          style={{ ...btnBase, marginTop: 40, padding: '16px 48px', fontSize: 18,
            background: `linear-gradient(135deg, #10B981, #059669)`,
            color: 'white', boxShadow: '0 6px 20px #10B98140' }}>
          Next →
        </button>
      )}
    </div>
  );

  // ── SPEAK ───────────────────────────────────────────────────────────────────
  if (phase === 'speak') {
    const w = words[speakIdx];
    return (
      <div style={{ minHeight: '100vh', background: BG,
        fontFamily: "'Nunito',sans-serif", display: 'flex',
        flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 24 }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        `}} />

        <div style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8',
          letterSpacing: 1, marginBottom: 20 }}>
          SAY IT · {speakIdx + 1} / {words.length}
        </div>

        {/* Tutor Video */}
        <div style={{ position:'relative', width:100, height:100,
          borderRadius:'50%', overflow:'hidden', marginBottom:20, flexShrink:0,
          border:`3px solid ${isSpeaking ? '#6366F1' : '#E0E7FF'}`,
          boxShadow: isSpeaking ? '0 0 0 5px #6366F120' : 'none',
          transition:'border-color .3s' }}>
          <video src={tutor.videoIdle} autoPlay loop muted playsInline
            style={{ position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', objectPosition:'center 20%',
              opacity:isSpeaking?0:1, transition:'opacity .25s' }}/>
          <video src={tutor.videoTalk} autoPlay loop muted playsInline
            style={{ position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', objectPosition:'center 20%',
              opacity:isSpeaking?1:0, transition:'opacity .25s' }}/>
        </div>

        <div style={{ fontSize: 22, color: '#475569', fontWeight: 700,
          marginBottom: 24 }}>Say this word out loud:</div>

        <div onClick={() => speak(w.word)}
          style={{ background: 'white', borderRadius: 24, padding: '36px 48px',
            textAlign: 'center', cursor: 'pointer', marginBottom: 40,
            boxShadow: '0 8px 40px rgba(99,102,241,0.12)' }}>
          <div style={{ fontSize: 72, marginBottom: 10 }}>{w.emoji}</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#0F172A',
            marginBottom: 6 }}>{w.word}</div>
          <div style={{ fontSize: 15, color: '#94A3B8', fontStyle: 'italic' }}>
            {w.phonetic}
          </div>
          <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, marginTop: 10 }}>
            🔊 Tap to hear again
          </div>
        </div>

        <button onClick={handleSpeakDone}
          style={{ ...btnBase, padding: '18px 48px', fontSize: 18,
            background: `linear-gradient(135deg, #F59E0B, #D97706)`,
            color: 'white', boxShadow: '0 6px 20px #F59E0B40' }}>
          🗣️ I said it!
        </button>

        <div style={{ display: 'flex', gap: 8, marginTop: 32 }}>
          {words.map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%',
              background: speakDone[i] ? ACCENT : i === speakIdx ? '#F59E0B' : '#CBD5E1',
              transition: 'background .3s' }} />
          ))}
        </div>
      </div>
    );
  }

  // ── CHAT ───────────────────────────────────────────────────────────────────
  if (phase === 'chat') return (
    <div style={{ minHeight: '100vh', background: BG,
      fontFamily: "'Nunito',sans-serif", display: 'flex',
      flexDirection: 'column' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
      `}} />

      {/* Header */}
      <div style={{ padding: '12px 16px', background: 'white',
        borderBottom: '1px solid #F1F5F9', display: 'flex',
        alignItems: 'center', gap: 12 }}>
        <button onClick={() => { audioRef.current?.pause(); setPhase('lobby'); }}
          style={{ ...btnBase, padding: '6px 12px', fontSize: 13,
            background: '#F1F5F9', color: '#64748B' }}>←</button>
        {/* Tutor video circle */}
        <div style={{ position:'relative', width:52, height:52,
          borderRadius:'50%', overflow:'hidden', flexShrink:0,
          border:`2px solid ${isSpeaking ? ACCENT : '#E0E7FF'}`,
          boxShadow: isSpeaking ? `0 0 0 4px ${ACCENT}20` : 'none',
          transition:'all .3s' }}>
          <video src={tutor.videoIdle} autoPlay loop muted playsInline
            style={{ position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', objectPosition:'center 20%',
              opacity:isSpeaking?0:1, transition:'opacity .25s' }}/>
          <video src={tutor.videoTalk} autoPlay loop muted playsInline
            style={{ position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', objectPosition:'center 20%',
              opacity:isSpeaking?1:0, transition:'opacity .25s' }}/>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900 }}>
            {tutor.name} <span style={{ color:'#94A3B8', fontWeight:600, fontSize:12 }}>· Mini Chat</span>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>
            Pre-A1 · {unit.title}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: 14 }}>
        {chatLoading && chatMsgs.length === 0 && (
          <div style={{ alignSelf: 'flex-start', background: 'white',
            borderRadius: '0 18px 18px 18px', padding: '14px 18px',
            fontSize: 16, color: '#94A3B8', fontWeight: 600,
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            ...
          </div>
        )}
        {chatMsgs.map((m, i) => (
          <div key={i}
            style={{
              alignSelf: m.role === 'tutor' ? 'flex-start' : 'flex-end',
              maxWidth: '80%',
            }}>
            <div style={{
              background: m.role === 'tutor' ? 'white' : ACCENT,
              color: m.role === 'tutor' ? '#0F172A' : 'white',
              borderRadius: m.role === 'tutor' ? '0 18px 18px 18px' : '18px 0 18px 18px',
              padding: '14px 18px', fontSize: 17, fontWeight: 700, lineHeight: 1.5,
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {chatLoading && chatMsgs.length > 0 && (
          <div style={{ alignSelf: 'flex-start', background: 'white',
            borderRadius: '0 18px 18px 18px', padding: '12px 18px',
            fontSize: 16, color: '#94A3B8', fontWeight: 600,
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            thinking...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', background: 'white',
        borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleChatSend()}
          placeholder="Type or tap mic..."
          disabled={chatLoading || !chatStarted}
          style={{ flex: 1, padding: '14px 16px', borderRadius: 14,
            border: '2px solid #E2E8F0', fontSize: 16, fontFamily: "'Nunito',sans-serif",
            fontWeight: 700, outline: 'none', background: '#F8FAFC' }}
        />
        {/* Mic button */}
        <button
          onMouseDown={() => {
            if (!recRef.current || isListening || chatLoading || !chatStarted) return;
            try { recRef.current.start(); setIsListening(true); } catch {}
          }}
          disabled={chatLoading || !chatStarted}
          style={{ ...btnBase, padding: '14px 16px', fontSize: 18,
            background: isListening ? '#EF4444' : '#F1F5F9',
            color: isListening ? 'white' : '#64748B',
            border: isListening ? 'none' : '2px solid #E2E8F0',
            animation: isListening ? 'pulse 1s infinite' : 'none',
            flexShrink: 0 }}>
          {isListening ? '⏹' : '🎤'}
        </button>
        <button onClick={handleChatSend}
          disabled={!chatInput.trim() || chatLoading || !chatStarted}
          style={{ ...btnBase, padding: '14px 18px', fontSize: 18,
            background: chatInput.trim() && !chatLoading ? ACCENT : '#E2E8F0',
            color: chatInput.trim() && !chatLoading ? 'white' : '#94A3B8',
            flexShrink: 0 }}>
          →
        </button>
      </div>

      {/* Skip / Done */}
      {chatMsgs.length >= 3 && (
        <div style={{ padding: '8px 16px 16px', background: 'white',
          textAlign: 'center' }}>
          <button onClick={() => setPhase('complete')}
            style={{ ...btnBase, padding: '12px 32px', fontSize: 15,
              background: `linear-gradient(135deg, #10B981, #059669)`,
              color: 'white' }}>
            I'm done! ✓
          </button>
        </div>
      )}
    </div>
  );

  // ── COMPLETE ────────────────────────────────────────────────────────────────
  if (phase === 'complete') return (
    <div style={{ minHeight: '100vh', background: BG,
      fontFamily: "'Nunito',sans-serif", display: 'flex',
      flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}} />

      <div style={{ fontSize: 80, marginBottom: 16,
        animation: 'bounce 1s infinite' }}>🎉</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A',
        marginBottom: 8 }}>Unit Complete!</div>
      <div style={{ fontSize: 18, color: '#6366F1', fontWeight: 800,
        marginBottom: 4 }}>{unit.emoji} {unit.title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#F59E0B',
        marginBottom: 32 }}>+{xp} ⭐ XP earned</div>

      {/* Words learned */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap',
        justifyContent: 'center', marginBottom: 40, maxWidth: 360 }}>
        {words.map((w, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 14,
            padding: '10px 16px', fontSize: 14, fontWeight: 800,
            color: '#0F172A', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{w.emoji}</span>{w.word}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12,
        width: '100%', maxWidth: 320 }}>
        {unitIdx + 1 < UNITS.length && (
          <button onClick={finishUnit}
            style={{ ...btnBase, padding: '18px', fontSize: 18,
              background: `linear-gradient(135deg, ${ACCENT}, #818CF8)`,
              color: 'white', boxShadow: `0 6px 20px ${ACCENT}40` }}>
            Next Unit → {UNITS[unitIdx + 1].emoji}
          </button>
        )}
        <button onClick={() => router.push('/lingua')}
          style={{ ...btnBase, padding: '16px', fontSize: 16,
            background: 'white', color: '#64748B',
            border: '1.5px solid #E2E8F0' }}>
          Back to Home
        </button>
      </div>
    </div>
  );

  return null;
}

export default function StarterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F0F4FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #E0E7FF',
          borderTopColor: '#6366F1', borderRadius: '50%',
          animation: 'spin .8s linear infinite' }} />
      </div>
    }>
      <StarterContent />
    </Suspense>
  );
}
