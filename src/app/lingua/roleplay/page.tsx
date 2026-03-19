'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/userProfile';
import { getTutorById } from '@/data/tutors';
import {
  EVERYDAY_SCENARIOS, WORLD_SCENARIOS,
  type EverydayScenario, type WorldScenario, type RpTab, type RpDifficulty,
} from '@/data/roleplay';

const LANG_LABELS: Record<string, string> = {
  'en-US':'English','en-GB':'English','ja-JP':'Japanese','ko-KR':'Korean',
  'zh-CN':'Chinese (Simplified)','zh-TW':'Chinese (Traditional)','zh-HK':'Cantonese',
  'fr-FR':'French','de-DE':'German','es-ES':'Spanish','es-MX':'Spanish (Mexico)',
  'it-IT':'Italian','pt-BR':'Portuguese','pt-PT':'Portuguese (Portugal)',
  'ru-RU':'Russian','ar-XA':'Arabic','ar-SA':'Arabic','hi-IN':'Hindi',
  'vi-VN':'Vietnamese','th-TH':'Thai','id-ID':'Indonesian','ms-MY':'Malay',
  'nl-NL':'Dutch','pl-PL':'Polish','tr-TR':'Turkish','sv-SE':'Swedish',
  'da-DK':'Danish','no-NO':'Norwegian','fi-FI':'Finnish','cs-CZ':'Czech',
  'sk-SK':'Slovak','hu-HU':'Hungarian','ro-RO':'Romanian','el-GR':'Greek',
  'uk-UA':'Ukrainian','bg-BG':'Bulgarian','hr-HR':'Croatian','sr-RS':'Serbian',
  'sl-SI':'Slovenian','et-EE':'Estonian','lv-LV':'Latvian','lt-LT':'Lithuanian',
  'he-IL':'Hebrew','fa-IR':'Persian','ur-PK':'Urdu','bn-BD':'Bengali',
  'ta-IN':'Tamil','te-IN':'Telugu','ml-IN':'Malayalam','kn-IN':'Kannada',
  'gu-IN':'Gujarati','mr-IN':'Marathi','pa-IN':'Punjabi',
  'sw-KE':'Swahili','af-ZA':'Afrikaans','tl-PH':'Filipino',
  'my-MM':'Burmese','km-KH':'Khmer','mn-MN':'Mongolian',
  'tg-TJ':'Tajik','ky-KG':'Kyrgyz','ro-MD':'Romanian (Moldova)',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  A1:'#10B981', A2:'#3B82F6', B1:'#8B5CF6', B2:'#F59E0B', C1:'#EF4444',
};

// Per-difficulty native label
const DIFF_NATIVE: Record<string, Record<string, string>> = {
  'ko-KR': { A1:'초급', A2:'초중급', B1:'중급', B2:'중상급', C1:'고급' },
  'ja-JP': { A1:'初級', A2:'初中級', B1:'中級', B2:'中上級', C1:'上級' },
  'zh-CN': { A1:'初级', A2:'初中级', B1:'中级', B2:'中高级', C1:'高级' },
  'es-ES': { A1:'Básico', A2:'Elemental', B1:'Intermedio', B2:'Avanzado', C1:'Superior' },
  'fr-FR': { A1:'Débutant', A2:'Élémentaire', B1:'Intermédiaire', B2:'Avancé', C1:'Maîtrise' },
};

export default function RoleplayLobby() {
  const router   = useRouter();
  const { user } = useAuth();

  const [tab,       setTab]       = useState<RpTab>('everyday');
  const [langId,    setLangId]    = useState('en-US');
  const [subLang,   setSubLang]   = useState('ko-KR');
  const [hovered,   setHovered]   = useState<string | null>(null);
  const [selDiff,   setSelDiff]   = useState<RpDifficulty | 'all'>('all');

  const langLabel = LANG_LABELS[langId] || 'English';
  const showNative = subLang !== 'en-US' && subLang !== 'en-GB';
  const diffNative = DIFF_NATIVE[subLang] || {};

  useEffect(() => {
    const ll = localStorage.getItem('mt_learn_lang') || 'en-US';
    const sl = localStorage.getItem('mt_native_lang') || 'ko-KR';
    setLangId(ll); setSubLang(sl);
    if (user) getUserProfile(user.uid).then(p => {
      if (p?.learnLang) setLangId(p.learnLang);
      if (p?.nativeLang) setSubLang(p.nativeLang);
    });
  }, [user]);

  const go = (s: EverydayScenario | WorldScenario, type: 'everyday' | 'world') => {
    if (!user) { router.push('/signup'); return; }
    const diff = selDiff === 'all' ? s.difficulty : selDiff;
    const p = new URLSearchParams({
      type, scenarioId: s.id, lang: langId, subLang, difficulty: diff,
    });
    router.push(`/lingua/roleplay/session?${p}`);
  };

  const everyday = selDiff === 'all'
    ? EVERYDAY_SCENARIOS
    : EVERYDAY_SCENARIOS.filter(s => s.difficulty === selDiff);

  const worlds = selDiff === 'all'
    ? WORLD_SCENARIOS
    : WORLD_SCENARIOS.filter(s => s.difficulty === selDiff);

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC',
      fontFamily:"'Nunito',sans-serif", color:'#0F172A' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .rp-card{transition:transform .18s,box-shadow .18s;cursor:pointer;}
        .rp-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,0.12)!important;}
      `}}/>

      {/* HEADER */}
      <div style={{ background:'#fff', borderBottom:'1px solid #F1F5F9',
        padding:'12px 20px', display:'flex', alignItems:'center', gap:12,
        position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <button onClick={() => router.back()}
          style={{ background:'none', border:'none', fontSize:20, cursor:'pointer',
            color:'#64748B', padding:'4px 8px', borderRadius:8, fontFamily:"'Nunito',sans-serif" }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:900, color:'#0F172A' }}>🎭 Roleplay</div>
          <div style={{ fontSize:11, color:'#94A3B8', fontWeight:700 }}>
            NPC speaks in {langLabel}
            {showNative && ' · Subtitles in your language'}
          </div>
        </div>
        <div style={{ padding:'5px 14px', borderRadius:99, background:'#EEF2FF',
          border:'1.5px solid #C7D2FE', fontSize:12, fontWeight:800, color:'#6366F1' }}>
          🌐 {langLabel}
        </div>
      </div>

      {/* TABS */}
      <div style={{ background:'#fff', borderBottom:'1px solid #F1F5F9',
        padding:'0 20px', display:'flex', gap:4 }}>
        {([
          { id:'everyday' as RpTab, label:'✈️ Everyday', sub:'Daily situations' },
          { id:'world'    as RpTab, label:'🌍 World',    sub:'Story worlds' },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'12px 18px', background:'none', border:'none',
              borderBottom: tab===t.id ? '3px solid #6366F1' : '3px solid transparent',
              cursor:'pointer', fontFamily:"'Nunito',sans-serif",
              color: tab===t.id ? '#6366F1' : '#64748B' }}>
            <div style={{ fontSize:14, fontWeight:900 }}>{t.label}</div>
            <div style={{ fontSize:10, fontWeight:700, opacity:.7 }}>{t.sub}</div>
          </button>
        ))}
      </div>

      {/* DIFFICULTY FILTER */}
      <div style={{ padding:'12px 20px', background:'#fff',
        borderBottom:'1px solid #F1F5F9', display:'flex', gap:6, flexWrap:'wrap',
        alignItems:'center' }}>
        <span style={{ fontSize:11, fontWeight:800, color:'#94A3B8',
          marginRight:4, letterSpacing:.5 }}>LEVEL:</span>
        {(['all','A1','A2','B1','B2','C1'] as const).map(d => {
          const isAll = d === 'all';
          const active = selDiff === d;
          const col = isAll ? '#6366F1' : DIFFICULTY_COLOR[d];
          return (
            <button key={d} onClick={() => setSelDiff(d)}
              style={{ padding:'4px 12px', borderRadius:99, border:'none', cursor:'pointer',
                fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:12,
                background: active ? col : '#F1F5F9',
                color: active ? '#fff' : '#64748B',
                boxShadow: active ? `0 2px 8px ${col}50` : 'none',
                transition:'all .15s' }}>
              {isAll ? 'All' : d}
              {!isAll && showNative && diffNative[d] ? ` · ${diffNative[d]}` : ''}
            </button>
          );
        })}
      </div>

      {/* EVERYDAY */}
      {tab === 'everyday' && (
        <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 16px 60px' }}>
          {everyday.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontWeight:700 }}>
              No scenarios at this level
            </div>
          )}
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:12 }}>
            {everyday.map((s, i) => {
              const t = getTutorById(s.tutorId);
              const isHov = hovered === s.id;
              return (
                <div key={s.id} className="rp-card"
                  onMouseEnter={() => setHovered(s.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => go(s, 'everyday')}
                  style={{ background: isHov ? s.bgColor : '#fff',
                    border:`1.5px solid ${isHov ? s.accentColor+'60' : '#F1F5F9'}`,
                    borderRadius:18, padding:'18px 16px',
                    boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
                    animation:`fadeUp .3s ease ${i*.04}s both` }}>
                  {/* Top row */}
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'flex-start', marginBottom:10 }}>
                    <div style={{ fontSize:30 }}>{s.emoji}</div>
                    <div style={{ display:'flex', flexDirection:'column',
                      alignItems:'flex-end', gap:4 }}>
                      <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px',
                        borderRadius:99,
                        background: DIFFICULTY_COLOR[s.difficulty]+'18',
                        color: DIFFICULTY_COLOR[s.difficulty] }}>
                        {s.difficulty}
                        {showNative && diffNative[s.difficulty]
                          ? ` ${diffNative[s.difficulty]}` : ''}
                      </span>
                      <img src={t.thumbnail} alt={t.name}
                        style={{ width:24, height:24, borderRadius:'50%',
                          objectFit:'cover', objectPosition:'center 20%',
                          border:`1.5px solid ${s.accentColor}40` }}/>
                    </div>
                  </div>
                  {/* Title */}
                  <div style={{ fontSize:14, fontWeight:900, color:'#0F172A', marginBottom:4 }}>
                    {s.title}
                  </div>
                  {/* English description */}
                  <div style={{ fontSize:12, color:'#64748B', fontWeight:600,
                    lineHeight:1.5, marginBottom: showNative ? 5 : 0 }}>
                    {s.situation.split('.')[0]}
                  </div>
                  {/* Native subtitle */}
                  {showNative && (
                    <div style={{ fontSize:11, color:s.accentColor, fontWeight:700,
                      lineHeight:1.4 }}>
                      {s.nativeDesc}
                    </div>
                  )}
                  {/* CTA */}
                  <div style={{ marginTop:10, fontSize:11, fontWeight:800,
                    color: isHov ? s.accentColor : '#CBD5E1' }}>
                    Start now →
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WORLD */}
      {tab === 'world' && (
        <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 16px 60px' }}>
          {worlds.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8', fontWeight:700 }}>
              No scenarios at this level
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {worlds.map((s, i) => {
              const isHov = hovered === s.id;
              return (
                <div key={s.id} className="rp-card"
                  onMouseEnter={() => setHovered(s.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => go(s, 'world')}
                  style={{ borderRadius:20, overflow:'hidden',
                    boxShadow:'0 2px 12px rgba(0,0,0,0.08)',
                    animation:`fadeUp .3s ease ${i*.07}s both` }}>
                  <div style={{ background:s.bgGradient, padding:'20px 22px',
                    position:'relative', display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)' }}/>
                    {/* Emoji */}
                    <div style={{ fontSize:42, flexShrink:0, position:'relative',
                      filter: isHov ? 'drop-shadow(0 0 10px rgba(255,255,255,0.4))' : 'none',
                      transition:'filter .2s' }}>
                      {s.emoji}
                    </div>
                    {/* Text */}
                    <div style={{ position:'relative', flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <div style={{ fontSize:17, fontWeight:900, color:'#fff' }}>{s.title}</div>
                        <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px',
                          borderRadius:99, background:'rgba(255,255,255,0.15)',
                          color:'#fff', border:'1px solid rgba(255,255,255,0.25)' }}>
                          {s.difficulty}
                          {showNative && diffNative[s.difficulty]
                            ? ` · ${diffNative[s.difficulty]}` : ''}
                        </span>
                      </div>
                      {/* English description */}
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.85)',
                        fontWeight:600, lineHeight:1.5,
                        marginBottom: showNative ? 4 : 0 }}>
                        {s.description}
                      </div>
                      {/* Native subtitle */}
                      {showNative && (
                        <div style={{ fontSize:11, color:s.accentColor,
                          fontWeight:700, lineHeight:1.4 }}>
                          {s.nativeDesc}
                        </div>
                      )}
                    </div>
                    {/* Tutor avatars */}
                    <div style={{ position:'relative', display:'flex', flexShrink:0 }}>
                      {s.npcs.map((npc, ni) => {
                        const t = getTutorById(npc.tutorId);
                        return (
                          <img key={ni} src={t.thumbnail} alt={npc.name}
                            style={{ width:34, height:34, borderRadius:'50%',
                              objectFit:'cover', objectPosition:'center 20%',
                              border:`2px solid ${s.accentColor}`,
                              marginLeft: ni>0 ? -10 : 0 }}/>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
