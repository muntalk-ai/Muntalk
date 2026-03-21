'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { POS_META, POS_SET_COUNT, PartOfSpeech } from '@/data/wordSets';
import { useAuth } from '@/context/AuthContext';
import { isAdminEmail } from '@/lib/subscription';
import { getSubscription } from '@/lib/subscription';

const POS_LIST: PartOfSpeech[] = ['Verbs', 'Adjectives', 'Adverbs', 'Phrases'];

function WordsContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [lang,        setLang]        = useState('en-US');
  const [subLang,     setSubLang]     = useState('ko-KR');
  const [selectedPos, setSelectedPos] = useState<PartOfSpeech | null>(null);
  const [isPremium,   setIsPremium]   = useState(false);
  const [subChecked,  setSubChecked]  = useState(false);

  useEffect(() => {
    setLang(localStorage.getItem('mt_learn_lang') || 'en-US');
    setSubLang(localStorage.getItem('mt_native_lang') || 'ko-KR');
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setSubChecked(true); return; }
    getSubscription(user.uid).then(sub => {
      setIsPremium(sub.planId !== 'free');
      setSubChecked(true);
    });
  }, [user, authLoading]);

  const handleLesson = (pos: PartOfSpeech, setIdx: number, lessonIdx: number) => {
    router.push(`/lingua/words/lesson?pos=${pos}&set=${setIdx}&lesson=${lessonIdx}&lang=${lang}&subLang=${subLang}`);
  };

  // Loading
  if (!subChecked) return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:40, height:40, border:'4px solid #E5E7EB', borderTopColor:'#6366F1', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg)}}` }} />
    </div>
  );

  // Word Bank 미지원 언어 목록
  const WORDBANK_UNSUPPORTED = new Set([
    'sq-AL','am-ET','hy-AM','az-AZ','eu-ES','be-BY','bs-BA','ca-ES',
    'ny-MW','eo-XX','gl-ES','ka-GE','ht-HT','ha-NG','is-IS','ig-NG',
    'ga-IE','jv-ID','ku-TR','la-XX','mk-MK','mg-MG','mt-MT','ne-NP',
    'st-ZA','si-LK','so-SO','su-ID','tk-TM','cy-GB','xh-ZA','yo-NG','zu-ZA',
  ]);

  // 미지원 언어 안내
  if (WORDBANK_UNSUPPORTED.has(lang)) {
    const LANG_LABELS: Record<string,string> = {
      'sq-AL':'Albanian','am-ET':'Amharic','hy-AM':'Armenian',
      'az-AZ':'Azerbaijani','eu-ES':'Basque','be-BY':'Belarusian',
      'bs-BA':'Bosnian','ca-ES':'Catalan','ny-MW':'Chichewa',
      'eo-XX':'Esperanto','gl-ES':'Galician','ka-GE':'Georgian',
      'ht-HT':'Haitian Creole','ha-NG':'Hausa','is-IS':'Icelandic',
      'ig-NG':'Igbo','ga-IE':'Irish','jv-ID':'Javanese',
      'ku-TR':'Kurdish','la-XX':'Latin','mk-MK':'Macedonian',
      'mg-MG':'Malagasy','mt-MT':'Maltese','ne-NP':'Nepali',
      'st-ZA':'Sesotho','si-LK':'Sinhala','so-SO':'Somali',
      'su-ID':'Sundanese','tk-TM':'Turkmen','cy-GB':'Welsh',
      'xh-ZA':'Xhosa','yo-NG':'Yoruba','zu-ZA':'Zulu',
    };
    const langName = LANG_LABELS[lang] || lang;
    return (
      <div style={{ minHeight:'100vh', background:'#F8FAFC',
        fontFamily:"'Nunito',sans-serif",
        display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ maxWidth:440, textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🌱</div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#0F172A',
            marginBottom:10, letterSpacing:-0.5 }}>
            {langName} Word Bank Coming Soon
          </h1>
          <p style={{ fontSize:14, color:'#64748B', lineHeight:1.7,
            marginBottom:8, fontWeight:600 }}>
            We're currently building the <strong>{langName}</strong> vocabulary
            library. Check back soon — new languages are added regularly!
          </p>
          <p style={{ fontSize:13, color:'#94A3B8', marginBottom:32, fontWeight:600 }}>
            In the meantime, you can use AI Lessons, Roleplay, and Discover
            — all fully support {langName}.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => router.push('/lingua')}
              style={{ padding:'13px 28px', borderRadius:14, border:'none',
                background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color:'#fff', fontSize:14, fontWeight:900, cursor:'pointer',
                fontFamily:"'Nunito',sans-serif" }}>
              ← Back to Learning
            </button>
            <button onClick={() => router.push('/lingua/roleplay')}
              style={{ padding:'13px 20px', borderRadius:14,
                border:'1.5px solid #E5E7EB', background:'#fff',
                color:'#374151', fontSize:14, fontWeight:800, cursor:'pointer',
                fontFamily:"'Nunito',sans-serif" }}>
              Try Roleplay →
            </button>
          </div>
          <p style={{ fontSize:11, color:'#CBD5E1', marginTop:24, fontWeight:600 }}>
            Currently supporting 67 languages in Word Bank
          </p>
        </div>
      </div>
    );
  }

  // Paywall — not premium
  if (!isPremium && !isAdminEmail(user?.email)) return (
    <div style={{ minHeight:'100vh', background:'#fff', fontFamily:"'Nunito',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ maxWidth:440, textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>📚</div>
        <h1 style={{ fontSize:26, fontWeight:900, color:'#0F172A', marginBottom:10, letterSpacing:-0.5 }}>
          Word Bank is Premium
        </h1>
        <p style={{ fontSize:14, color:'#64748B', lineHeight:1.7, marginBottom:8, fontWeight:600 }}>
          Unlock <strong>18,000+ essential words</strong> — verbs, adjectives, adverbs, and phrases — organized into bite-sized lessons.
        </p>
        <p style={{ fontSize:13, color:'#94A3B8', marginBottom:32, fontWeight:600 }}>
          10 words per lesson · 5 sentences each · AI-powered practice
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button
            onClick={() => router.push('/pricing')}
            style={{ padding:'13px 28px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:14, fontWeight:900, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
            ⭐ Upgrade to Premium
          </button>
          <button
            onClick={() => router.push('/lingua')}
            style={{ padding:'13px 20px', borderRadius:14, border:'1.5px solid #E5E7EB', background:'#fff', color:'#374151', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#fff', color:'#0F172A', fontFamily:"'Nunito',sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .lesson-btn:hover { background: var(--accent-bg) !important; border-color: var(--accent) !important; transform: translateY(-2px); }
      ` }} />

      <div style={{ padding:'32px 24px 64px', maxWidth:900, margin:'0 auto' }}>
        <button onClick={() => router.push('/lingua')}
          style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer', fontSize:14, marginBottom:24, display:'flex', alignItems:'center', gap:6, fontFamily:"'Nunito',sans-serif", fontWeight:700 }}>
          ← Back
        </button>

        <div style={{ fontSize:11, fontWeight:800, letterSpacing:3, color:'#94A3B8', textTransform:'uppercase', marginBottom:8 }}>Word Bank</div>
        <h1 style={{ fontSize:34, fontWeight:900, margin:'0 0 8px', letterSpacing:-0.8, color:'#0F172A' }}>
          Parts of Speech
        </h1>
        <p style={{ color:'#64748B', fontSize:14, margin:'0 0 40px', fontWeight:700 }}>
          18,000+ words · 10 per lesson · 5 example sentences each
        </p>

        {/* POS Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:14, marginBottom:48 }}>
          {POS_LIST.map(pos => {
            const meta = POS_META[pos];
            const isSelected = selectedPos === pos;
            return (
              <button key={pos} onClick={() => setSelectedPos(isSelected ? null : pos)}
                style={{ background: isSelected ? meta.accent : '#fff', border:`2px solid ${isSelected ? meta.accent : '#E5E7EB'}`, borderRadius:16, padding:'22px 18px', cursor:'pointer', textAlign:'left', transition:'all .2s', transform: isSelected ? 'translateY(-2px)' : 'none', fontFamily:"'Nunito',sans-serif" }}>
                <div style={{ fontSize:30, marginBottom:10 }}>{meta.icon}</div>
                <div style={{ fontSize:16, fontWeight:800, color: isSelected ? '#fff' : '#0F172A', marginBottom:3 }}>{meta.label}</div>
                <div style={{ fontSize:11, color: isSelected ? 'rgba(255,255,255,0.75)' : '#94A3B8', marginBottom:6, fontWeight:700 }}>{meta.desc}</div>
                <div style={{ fontSize:10, color: isSelected ? 'rgba(255,255,255,0.6)' : '#64748B', fontWeight:800 }}>
                  {POS_SET_COUNT[pos]} sets · {POS_SET_COUNT[pos] * 50} words
                </div>
              </button>
            );
          })}
        </div>

        {/* Lesson Grid */}
        {selectedPos && (
          <div style={{ animation:'fadeIn .3s ease' }}>
            <h2 style={{ fontSize:18, fontWeight:900, marginBottom:20, color: POS_META[selectedPos].accent }}>
              {POS_META[selectedPos].icon} {selectedPos} — Pick a Set & Lesson
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {Array.from({ length: POS_SET_COUNT[selectedPos] }, (_, si) => {
                const accent = POS_META[selectedPos].accent;
                const icons = ['🌱','🔥','⚡','🎯','🏆'];
                const names = ['Basics','Build Up','Power Up','Challenge','Mastery'];
                return (
                  <div key={si} style={{ background:'#fff', borderRadius:18, padding:'22px', border:'1.5px solid #F1F5F9', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:`${accent}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                        {POS_META[selectedPos].icon}
                      </div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:900, color:'#0F172A' }}>Set {si + 1}</div>
                        <div style={{ fontSize:11, color:'#94A3B8', fontWeight:700 }}>words {si * 50 + 1}–{(si + 1) * 50}</div>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
                      {Array.from({ length: 5 }, (_, li) => (
                        <button key={li} onClick={() => handleLesson(selectedPos, si + 1, li + 1)}
                          style={{ background:'#F8FAFC', border:'2px solid #F1F5F9', borderRadius:14, padding:'14px 6px', cursor:'pointer', textAlign:'center', fontFamily:"'Nunito',sans-serif", transition:'all .15s' }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background=`${accent}15`; el.style.borderColor=accent; el.style.transform='translateY(-2px)'; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background='#F8FAFC'; el.style.borderColor='#F1F5F9'; el.style.transform='none'; }}>
                          <div style={{ fontSize:20, marginBottom:5 }}>{icons[li]}</div>
                          <div style={{ fontSize:11, fontWeight:800, color:'#0F172A', marginBottom:2 }}>{names[li]}</div>
                          <div style={{ fontSize:10, fontWeight:700, color:accent, marginBottom:3 }}>Lesson {li + 1}</div>
                          <div style={{ fontSize:9, color:'#94A3B8', fontWeight:700 }}>{si*50+li*10+1}–{si*50+(li+1)*10}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WordsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#fff' }} />}>
      <WordsContent />
    </Suspense>
  );
}
