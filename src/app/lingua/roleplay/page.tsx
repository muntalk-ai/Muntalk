'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/userProfile';
import { getTutorById } from '@/data/tutors';
import {
  EVERYDAY_SCENARIOS, WORLD_SCENARIOS, WORLD_META,
  type EverydayScenario, type WorldScenario, type RpTab,
  type RpDifficulty, type WorldId, getNativeDesc,
} from '@/data/roleplay';

const DIFF_COLOR: Record<string,string> = { A1:'#10B981',A2:'#3B82F6',B1:'#8B5CF6',B2:'#F59E0B',C1:'#EF4444' };
const DIFF_NATIVE: Record<string,Record<string,string>> = {
  'ko-KR':{ A1:'초급',A2:'초중급',B1:'중급',B2:'중상급',C1:'고급' },
  'ja-JP':{ A1:'初級',A2:'初中級',B1:'中級',B2:'中上級',C1:'上級' },
  'zh-CN':{ A1:'初级',A2:'初中级',B1:'中级',B2:'中高级',C1:'高级' },
  'es-ES':{ A1:'Básico',A2:'Elemental',B1:'Intermedio',B2:'Avanzado',C1:'Superior' },
  'fr-FR':{ A1:'Débutant',A2:'Élémentaire',B1:'Intermédiaire',B2:'Avancé',C1:'Maîtrise' },
  'de-DE':{ A1:'Anfänger',A2:'Grundstufe',B1:'Mittelstufe',B2:'Obere Mittelstufe',C1:'Fortgeschritten' },
  'pt-BR':{ A1:'Básico',A2:'Elementar',B1:'Intermediário',B2:'Avançado',C1:'Proficiente' },
  'ru-RU':{ A1:'Начальный',A2:'Элементарный',B1:'Средний',B2:'Выше среднего',C1:'Продвинутый' },
};
const LANG_LABEL: Record<string,string> = {
  'en-US':'English','en-GB':'English','ja-JP':'Japanese','ko-KR':'Korean',
  'zh-CN':'Chinese','zh-TW':'Chinese','zh-HK':'Cantonese',
  'fr-FR':'French','de-DE':'German','es-ES':'Spanish','es-MX':'Spanish',
  'it-IT':'Italian','pt-BR':'Portuguese','pt-PT':'Portuguese',
  'ru-RU':'Russian','ar-XA':'Arabic','ar-SA':'Arabic',
  'hi-IN':'Hindi','vi-VN':'Vietnamese','th-TH':'Thai',
  'id-ID':'Indonesian','ms-MY':'Malay','nl-NL':'Dutch',
  'pl-PL':'Polish','tr-TR':'Turkish','sv-SE':'Swedish',
  'da-DK':'Danish','no-NO':'Norwegian','fi-FI':'Finnish',
  'cs-CZ':'Czech','sk-SK':'Slovak','hu-HU':'Hungarian',
  'ro-RO':'Romanian','el-GR':'Greek','uk-UA':'Ukrainian',
  'bg-BG':'Bulgarian','hr-HR':'Croatian','sr-RS':'Serbian',
  'he-IL':'Hebrew','fa-IR':'Persian','ur-PK':'Urdu',
  'bn-BD':'Bengali','ta-IN':'Tamil','te-IN':'Telugu',
  'ml-IN':'Malayalam','kn-IN':'Kannada','gu-IN':'Gujarati',
  'sw-KE':'Swahili','af-ZA':'Afrikaans','tl-PH':'Filipino',
  'my-MM':'Burmese','km-KH':'Khmer','mn-MN':'Mongolian',
};

const WORLD_ORDER: WorldId[] = ['romance','mystery','adventure','workplace','healing','growth'];

export default function RoleplayLobby() {
  const router   = useRouter();
  const { user } = useAuth();

  const [tab,      setTab]      = useState<RpTab>('everyday');
  const [langId,   setLangId]   = useState('en-US');
  const [subLang,  setSubLang]  = useState('en-US');
  const [selDiff,  setSelDiff]  = useState<RpDifficulty|'all'>('all');
  const [selWorld, setSelWorld] = useState<WorldId|'all'>('all');
  const [hovered,  setHovered]  = useState<string|null>(null);

  const langLabel  = LANG_LABEL[langId]  || 'English';
  const showNative = subLang !== 'en-US' && subLang !== 'en-GB';
  const diffNative = DIFF_NATIVE[subLang] || {};

  useEffect(() => {
    const ll = localStorage.getItem('mt_learn_lang') || 'en-US';
    const sl = localStorage.getItem('mt_native_lang') || 'en-US';
    setLangId(ll); setSubLang(sl);
    if (user) getUserProfile(user.uid).then(p => {
      if (p?.learnLang) setLangId(p.learnLang);
      if (p?.nativeLang) setSubLang(p.nativeLang);
    });
  }, [user]);

  const go = (s: EverydayScenario | WorldScenario, type: 'everyday'|'world') => {
    if (!user) { router.push('/signup'); return; }
    const diff = selDiff === 'all' ? s.difficulty : selDiff;
    router.push(`/lingua/roleplay/session?${new URLSearchParams({ type, scenarioId:s.id, lang:langId, subLang, difficulty:diff })}`);
  };

  const everydayFiltered = EVERYDAY_SCENARIOS.filter(s => selDiff === 'all' || s.difficulty === selDiff);
  const worldFiltered    = WORLD_SCENARIOS.filter(s =>
    (selDiff === 'all' || s.difficulty === selDiff) &&
    (selWorld === 'all' || s.worldId === selWorld)
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', fontFamily:"'Nunito',sans-serif", color:'#0F172A' }}>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .rp-card{transition:transform .18s,box-shadow .2s;cursor:pointer;}
        .rp-card:hover{transform:translateY(-5px);}
        .world-pill{transition:all .15s;cursor:pointer;}
        .world-pill:hover{transform:translateY(-1px);}
      `}}/>

      {/* HEADER */}
      <div style={{ background:'#fff', borderBottom:'1px solid #F1F5F9', padding:'12px 20px',
        display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:100,
        boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
        <button onClick={() => router.back()}
          style={{ background:'none', border:'none', fontSize:20, cursor:'pointer',
            color:'#64748B', padding:'4px 8px', fontFamily:"'Nunito',sans-serif" }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:900, color:'#0F172A' }}>🎭 Roleplay</div>
          <div style={{ fontSize:11, color:'#94A3B8', fontWeight:700 }}>
            Speaking in {langLabel}
            {showNative && ' · Subtitles in your language'}
          </div>
        </div>
        <div style={{ padding:'5px 14px', borderRadius:99, background:'#EEF2FF',
          border:'1.5px solid #C7D2FE', fontSize:12, fontWeight:800, color:'#6366F1' }}>
          🌐 {langLabel}
        </div>
      </div>

      {/* TABS */}
      <div style={{ background:'#fff', borderBottom:'1px solid #F1F5F9', padding:'0 20px', display:'flex', gap:0 }}>
        {([['everyday','✈️ Everyday','Daily situations'],['world','🌍 Story Worlds','Immersive roleplay']] as const).map(([id,label,sub]) => (
          <button key={id} onClick={() => setTab(id as RpTab)}
            style={{ padding:'12px 20px', background:'none', border:'none', cursor:'pointer',
              borderBottom: tab===id ? '3px solid #6366F1' : '3px solid transparent',
              fontFamily:"'Nunito',sans-serif", color:tab===id?'#6366F1':'#64748B' }}>
            <div style={{ fontSize:14, fontWeight:900 }}>{label}</div>
            <div style={{ fontSize:10, fontWeight:700, opacity:.7 }}>{sub}</div>
          </button>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ padding:'10px 20px', background:'#fff', borderBottom:'1px solid #F1F5F9',
        display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:11, fontWeight:800, color:'#94A3B8', letterSpacing:.5 }}>LEVEL:</span>
        {(['all','A1','A2','B1','B2','C1'] as const).map(d => {
          const active = selDiff===d;
          const col = d==='all'?'#6366F1':DIFF_COLOR[d];
          return (
            <button key={d} onClick={() => setSelDiff(d)}
              style={{ padding:'4px 12px', borderRadius:99, border:'none', cursor:'pointer',
                fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:11,
                background:active?col:'#F1F5F9', color:active?'#fff':'#64748B',
                boxShadow:active?`0 2px 8px ${col}40`:'none', transition:'all .15s' }}>
              {d==='all'?'All':d}{d!=='all'&&showNative&&diffNative[d]?` · ${diffNative[d]}`:''}
            </button>
          );
        })}

        {tab === 'world' && (
          <>
            <span style={{ fontSize:11, fontWeight:800, color:'#94A3B8', marginLeft:8, letterSpacing:.5 }}>WORLD:</span>
            <button onClick={() => setSelWorld('all')}
              style={{ padding:'4px 12px', borderRadius:99, border:'none', cursor:'pointer',
                fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:11,
                background:selWorld==='all'?'#6366F1':'#F1F5F9',
                color:selWorld==='all'?'#fff':'#64748B', transition:'all .15s' }}>All</button>
            {WORLD_ORDER.map(wid => {
              const w = WORLD_META[wid];
              const active = selWorld===wid;
              return (
                <button key={wid} onClick={() => setSelWorld(wid)} className="world-pill"
                  style={{ padding:'4px 12px', borderRadius:99, border:'none', cursor:'pointer',
                    fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:11,
                    background:active?w.accentColor:'#F1F5F9',
                    color:active?'#fff':'#64748B',
                    boxShadow:active?`0 2px 8px ${w.accentColor}40`:'none', transition:'all .15s' }}>
                  {w.emoji} {w.title.split(' ')[0]}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* ── EVERYDAY ── */}
      {tab === 'everyday' && (
        <div style={{ maxWidth:920, margin:'0 auto', padding:'20px 16px 60px' }}>
          {everydayFiltered.length === 0
            ? <div style={{ textAlign:'center', padding:40, color:'#94A3B8', fontWeight:700 }}>No scenarios at this level</div>
            : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12 }}>
                {everydayFiltered.map((s,i) => {
                  const t = getTutorById(s.tutorId);
                  const isHov = hovered===s.id;
                  const desc = showNative ? getNativeDesc(s.nativeDescs, subLang, s.situation.split('.')[0]) : s.situation.split('.')[0];
                  return (
                    <div key={s.id} className="rp-card"
                      onMouseEnter={() => setHovered(s.id)} onMouseLeave={() => setHovered(null)}
                      onClick={() => go(s,'everyday')}
                      style={{ background:isHov?s.bgColor:'#fff',
                        border:`1.5px solid ${isHov?s.accentColor+'60':'#F1F5F9'}`,
                        borderRadius:18, padding:'16px 14px',
                        boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
                        animation:`fadeUp .3s ease ${i*.04}s both` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                        <div style={{ fontSize:28 }}>{s.emoji}</div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                          <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:99,
                            background:DIFF_COLOR[s.difficulty]+'18', color:DIFF_COLOR[s.difficulty] }}>
                            {s.difficulty}{showNative&&diffNative[s.difficulty]?` ${diffNative[s.difficulty]}`:''}
                          </span>
                          <img src={t.thumbnail} alt={t.name}
                            style={{ width:22,height:22,borderRadius:'50%',objectFit:'cover',objectPosition:'center 20%',border:`1.5px solid ${s.accentColor}40` }}/>
                        </div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:900, color:'#0F172A', marginBottom:4 }}>{s.title}</div>
                      <div style={{ fontSize:11, color:'#64748B', fontWeight:600, lineHeight:1.5 }}>{desc}</div>
                      <div style={{ marginTop:10, fontSize:11, fontWeight:800, color:isHov?s.accentColor:'#CBD5E1' }}>Start →</div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}

      {/* ── WORLD ── */}
      {tab === 'world' && (
        <div style={{ maxWidth:920, margin:'0 auto', padding:'20px 16px 60px' }}>
          {/* World summaries */}
          {selWorld === 'all' && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10, marginBottom:24 }}>
              {WORLD_ORDER.map((wid,i) => {
                const w = WORLD_META[wid];
                const count = WORLD_SCENARIOS.filter(s => s.worldId===wid).length;
                return (
                  <button key={wid} onClick={() => setSelWorld(wid)}
                    style={{ borderRadius:16, overflow:'hidden', background:'none', border:'none',
                      cursor:'pointer', textAlign:'left', padding:0,
                      animation:`fadeUp .3s ease ${i*.06}s both`,
                      boxShadow:'0 2px 10px rgba(0,0,0,0.1)', transition:'transform .2s' }}
                    onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-4px)')}
                    onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
                    <div style={{ background:w.bgGradient, padding:'18px 14px', position:'relative' }}>
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)' }}/>
                      <div style={{ position:'relative' }}>
                        <div style={{ fontSize:28, marginBottom:6 }}>{w.emoji}</div>
                        <div style={{ fontSize:12, fontWeight:900, color:'#fff', lineHeight:1.2 }}>{w.title}</div>
                        <div style={{ fontSize:9, color:'rgba(255,255,255,0.6)', fontWeight:700, marginTop:3 }}>{count} scenarios</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {worldFiltered.length === 0
            ? <div style={{ textAlign:'center', padding:40, color:'#94A3B8', fontWeight:700 }}>No scenarios found</div>
            : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {worldFiltered.map((s,i) => {
                  const isHov = hovered===s.id;
                  const desc = showNative ? getNativeDesc(s.nativeDescs, subLang, s.description) : s.description;
                  const multiNpc = s.npcs.length > 1;
                  const hasBranch = (s.storyBeats?.length || 0) > 0;
                  return (
                    <div key={s.id} className="rp-card"
                      onMouseEnter={() => setHovered(s.id)} onMouseLeave={() => setHovered(null)}
                      onClick={() => go(s,'world')}
                      style={{ borderRadius:20, overflow:'hidden',
                        boxShadow:isHov?`0 16px 40px ${s.accentColor}30`:'0 3px 14px rgba(0,0,0,0.08)',
                        animation:`fadeUp .3s ease ${i*.06}s both`, transition:'box-shadow .2s' }}>
                      <div style={{ background:s.bgGradient, padding:'18px 20px', position:'relative',
                        display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.38)' }}/>
                        {/* Emoji */}
                        <div style={{ fontSize:38, flexShrink:0, position:'relative',
                          filter:isHov?'drop-shadow(0 0 12px rgba(255,255,255,0.5))':'none', transition:'filter .2s' }}>
                          {s.emoji}
                        </div>
                        {/* Text */}
                        <div style={{ position:'relative', flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap' }}>
                            <span style={{ fontSize:16, fontWeight:900, color:'#fff' }}>{s.title}</span>
                            <span style={{ fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:99,
                              background:'rgba(255,255,255,0.15)', color:'#fff' }}>
                              {s.difficulty}{showNative&&DIFF_NATIVE[subLang]?.[s.difficulty]?` · ${DIFF_NATIVE[subLang][s.difficulty]}`:''}
                            </span>
                          </div>
                          <div style={{ fontSize:11, color:s.accentColor, fontWeight:700, marginBottom:4 }}>
                            {s.subtitle}
                          </div>
                          <div style={{ fontSize:12, color:'rgba(255,255,255,0.82)', fontWeight:600,
                            lineHeight:1.5, marginBottom:showNative?4:0 }}>
                            {s.description}
                          </div>
                          {showNative && desc !== s.description && (
                            <div style={{ fontSize:11, color:s.accentColor, fontWeight:700, lineHeight:1.4 }}>
                              {desc}
                            </div>
                          )}
                          {/* Feature badges */}
                          <div style={{ display:'flex', gap:5, marginTop:6, flexWrap:'wrap' }}>
                            {multiNpc && (
                              <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:99,
                                background:'rgba(255,255,255,0.15)', color:'#fff' }}>
                                👥 {s.npcs.length} characters
                              </span>
                            )}
                            {hasBranch && (
                              <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:99,
                                background:'rgba(255,255,255,0.15)', color:'#fff' }}>
                                🔀 Story choices
                              </span>
                            )}
                            {s.tags.includes('multi-npc') && (
                              <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:99,
                                background:'rgba(255,255,255,0.15)', color:'#fff' }}>
                                🗣️ Multi-voice
                              </span>
                            )}
                          </div>
                        </div>
                        {/* NPC avatars */}
                        <div style={{ position:'relative', display:'flex', flexShrink:0 }}>
                          {s.npcs.map((npc,ni) => {
                            const t = getTutorById(npc.tutorId);
                            return (
                              <img key={ni} src={t.thumbnail} alt={npc.name}
                                style={{ width:34, height:34, borderRadius:'50%',
                                  objectFit:'cover', objectPosition:'center 20%',
                                  border:`2px solid ${s.accentColor}`,
                                  marginLeft:ni>0?-10:0, boxShadow:'0 2px 6px rgba(0,0,0,0.3)' }}/>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
