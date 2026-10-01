'use client';
import { apiFetch } from '@/lib/apiClient';

import { useState, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, doc, setDoc, getDoc, addDoc,
  serverTimestamp, query, orderBy, limit, where,
} from 'firebase/firestore';

const ADMIN_EMAILS = ['muntalkofficial@gmail.com'];
type PlanId = 'free' | 'monthly' | 'biannual' | 'annual';
type Tab = 'users' | 'email' | 'logs' | 'settings';

interface UserRow {
  uid: string; email: string; displayName: string;
  planId: PlanId; planStatus: string; expiry: string;
  xp: number; streak: number; createdAt: string;
  learnLang: string; nativeLang: string;
  lastActive: string; lessonsDone: number;
}
interface LogEntry {
  id: string; action: string; targetEmail: string;
  adminEmail: string; detail: string; ts: string;
}

const PLAN_LABELS: Record<PlanId, string> = {
  free:'🔓 Free', monthly:'📅 Monthly', biannual:'⭐ 6 Months', annual:'🏆 Annual',
};
const PLAN_COLORS: Record<PlanId, string> = {
  free:'#94A3B8', monthly:'#6366F1', biannual:'#8B5CF6', annual:'#F59E0B',
};

// Language code → readable name (fallback: raw code)
const LANG_NAMES: Record<string,string> = {
  'en-US':'English','ko-KR':'Korean','ja-JP':'Japanese','zh-CN':'Chinese (Simplified)','zh-TW':'Chinese (Traditional)',
  'fr-FR':'French','de-DE':'German','es-ES':'Spanish','it-IT':'Italian','pt-BR':'Portuguese','ru-RU':'Russian',
  'ar-XA':'Arabic','ar-SA':'Arabic','hi-IN':'Hindi','vi-VN':'Vietnamese','th-TH':'Thai','id-ID':'Indonesian','tr-TR':'Turkish',
};
const langLabel = (code: string) => (code && code !== '—') ? (LANG_NAMES[code] || code) : '—';

// ── Shared design tokens ────────────────────────────────────────────────────
const FONT = "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";
const CARD: CSSProperties = { background:'#fff', borderRadius:16, border:'1px solid #E9EDF3' };
const SECTION_TITLE: CSSProperties = { fontSize:16, fontWeight:900, color:'#0F172A', margin:0 };
const SECTION_SUB: CSSProperties = { fontSize:13, color:'#64748B', fontWeight:600, margin:'6px 0 0' };
const FIELD_LABEL: CSSProperties = { fontSize:11, fontWeight:900, color:'#94A3B8', letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 };
const INPUT: CSSProperties = { width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #E5E7EB', fontSize:14, fontFamily:FONT, outline:'none', boxSizing:'border-box', background:'#fff', color:'#0F172A' };
const TH: CSSProperties = { textAlign:'left', padding:'12px 16px', fontSize:10, fontWeight:900, color:'#94A3B8', letterSpacing:1.2, textTransform:'uppercase', background:'#F8FAFC', position:'sticky', top:0, zIndex:1, whiteSpace:'nowrap' };
const TH_NUM: CSSProperties = { ...TH, textAlign:'right' };
const TD: CSSProperties = { padding:'14px 16px', fontSize:12, borderTop:'1px solid #F1F5F9', verticalAlign:'middle' };
const TD_NUM: CSSProperties = { ...TD, textAlign:'right' };
const BTN_SM: CSSProperties = { padding:'6px 11px', borderRadius:8, border:'none', fontSize:11, fontWeight:900, cursor:'pointer', fontFamily:FONT, whiteSpace:'nowrap' };
const BTN_GHOST: CSSProperties = { ...BTN_SM, border:'1.5px solid #E5E7EB', background:'#fff', color:'#374151' };

function addMonths(d: Date, m: number) { const r = new Date(d); r.setMonth(r.getMonth() + m); return r; }
function defaultExpiry(p: PlanId) {
  const d = new Date();
  if (p==='monthly')  return addMonths(d,1).toISOString().slice(0,10);
  if (p==='biannual') return addMonths(d,6).toISOString().slice(0,10);
  if (p==='annual')   return addMonths(d,12).toISOString().slice(0,10);
  return d.toISOString().slice(0,10);
}
function extendExpiry(current: string, p: PlanId) {
  const base = current && current > new Date().toISOString().slice(0,10)
    ? new Date(current) : new Date();
  if (p==='monthly')  return addMonths(base,1).toISOString().slice(0,10);
  if (p==='biannual') return addMonths(base,6).toISOString().slice(0,10);
  if (p==='annual')   return addMonths(base,12).toISOString().slice(0,10);
  return base.toISOString().slice(0,10);
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('users');
  const [curriculumMode, setCurriculumMode] = useState<'api'|'json'>(
    typeof window !== 'undefined' ? ((localStorage.getItem('mt_curriculum_mode') || 'api') as 'api'|'json') : 'api'
  );
  const [users, setUsers] = useState<UserRow[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // Grant modal
  const [modal, setModal] = useState<UserRow | null>(null);
  const [modalMode, setModalMode] = useState<'grant'|'extend'>('grant');
  const [selPlan, setSelPlan] = useState<PlanId>('monthly');
  const [selExpiry, setSelExpiry] = useState('');

  // Email composer
  const [emailTarget, setEmailTarget] = useState<'all'|'premium'|'free'|'single'>('single');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailPreview, setEmailPreview] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(''),3500); };

  const logAction = useCallback(async (action: string, targetEmail: string, detail: string) => {
    try {
      await addDoc(collection(db, 'admin_logs'), {
        action, targetEmail, detail,
        adminEmail: user?.email || 'admin',
        timestamp: serverTimestamp(),
      });
    } catch {}
  }, [user]);

  // Access guard
  useEffect(() => {
    if (!loading && (!user || !ADMIN_EMAILS.includes(user.email||'')))
      router.replace('/lingua');
  }, [user, loading]);

  // Fetch users
  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email||'')) return;
    (async () => {
      setFetching(true);
      try {
        const snap = await getDocs(collection(db, 'users'));
        const rows: UserRow[] = [];
        for (const d of snap.docs) {
          const u = d.data();
          let planId: PlanId='free', planStatus='active', expiry='';
          try {
            const sub = await getDoc(doc(db,'subscriptions',d.id));
            if (sub.exists()) {
              planId=sub.data().planId||'free';
              planStatus=sub.data().status||'active';
              expiry=sub.data().currentPeriodEnd||'';
            }
          } catch {}
          rows.push({
            uid:d.id, email:u.email||'', displayName:u.displayName||u.name||'—',
            planId, planStatus, expiry, xp:u.xp||0, streak:u.streak||0,
            createdAt:u.createdAt?.toDate?.()?.toISOString?.()?.slice(0,10)||u.createdAt?.slice?.(0,10)||'',
            learnLang:u.learnLang||'—', nativeLang:u.nativeLang||'—',
            lastActive:u.lastActive||'', lessonsDone:Array.isArray(u.completedLessons)?u.completedLessons.length:0,
          });
        }
        rows.sort((a,b)=>(a.planId==='free'?1:-1)-(b.planId==='free'?1:-1)||b.xp-a.xp);
        setUsers(rows);
      } catch(e) { console.error(e); }
      setFetching(false);
    })();
  }, [user]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const q = query(collection(db,'admin_logs'), orderBy('timestamp','desc'), limit(100));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({
        id:d.id,
        action:d.data().action||'',
        targetEmail:d.data().targetEmail||'',
        adminEmail:d.data().adminEmail||'',
        detail:d.data().detail||'',
        ts:d.data().timestamp?.toDate?.()?.toISOString?.()?.slice(0,16)?.replace('T',' ')||'',
      })));
    } catch(e) { console.error(e); }
  }, []);

  useEffect(() => { if (tab==='logs') fetchLogs(); }, [tab]);

  const openGrant = (u: UserRow) => {
    setModal(u); setModalMode('grant');
    const p: PlanId = u.planId==='free'?'monthly':u.planId;
    setSelPlan(p); setSelExpiry(defaultExpiry(p));
  };
  const openExtend = (u: UserRow) => {
    setModal(u); setModalMode('extend');
    const p: PlanId = u.planId==='free'?'monthly':u.planId;
    setSelPlan(p); setSelExpiry(extendExpiry(u.expiry, p));
  };

  const handleSavePlan = async () => {
    if (!modal) return;
    setSaving(modal.uid);
    try {
      const newExpiry = modalMode==='extend' ? extendExpiry(modal.expiry, selPlan) : selExpiry;
      await setDoc(doc(db,'subscriptions',modal.uid),{
        planId:selPlan, status:'active', currentPeriodEnd:newExpiry,
        grantedByAdmin:true, grantedAt:serverTimestamp(), grantedBy:user?.email,
      },{merge:true});
      await setDoc(doc(db,'users',modal.uid),{
        planId:selPlan, planStatus:'active', updatedAt:serverTimestamp(),
      },{merge:true});
      setUsers(p=>p.map(u=>u.uid===modal.uid?{...u,planId:selPlan,expiry:newExpiry}:u));
      const action = modalMode==='extend'?'extend':'grant';
      await logAction(action, modal.email, `${PLAN_LABELS[selPlan]} until ${newExpiry}`);
      showToast(`✅ ${modal.email} → ${PLAN_LABELS[selPlan]} until ${newExpiry}`);
      setModal(null);
    } catch(e:any) { showToast('❌ '+e.message); }
    setSaving(null);
  };

  const handleRevoke = async (u: UserRow) => {
    if (!confirm(`Revoke premium for ${u.email}?`)) return;
    setSaving(u.uid);
    try {
      await setDoc(doc(db,'subscriptions',u.uid),{planId:'free',status:'canceled',updatedAt:serverTimestamp()},{merge:true});
      await setDoc(doc(db,'users',u.uid),{planId:'free',planStatus:'canceled',updatedAt:serverTimestamp()},{merge:true});
      setUsers(p=>p.map(r=>r.uid===u.uid?{...r,planId:'free',expiry:''}:r));
      await logAction('revoke', u.email, 'Reverted to Free');
      showToast(`🔒 ${u.email} → Free`);
    } catch(e:any) { showToast('❌ '+e.message); }
    setSaving(null);
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) { showToast('❌ Subject and body required'); return; }
    let targets: string[] = [];
    if (emailTarget==='single') {
      if (!emailTo) { showToast('❌ Enter email address'); return; }
      targets = [emailTo.trim()];
    } else {
      targets = users
        .filter(u => emailTarget==='all' || (emailTarget==='premium'&&u.planId!=='free') || (emailTarget==='free'&&u.planId==='free'))
        .map(u => u.email).filter(Boolean);
    }
    if (!confirm(`Send email to ${targets.length} recipient(s)?`)) return;
    setEmailSending(true);
    let ok=0, fail=0;
    for (const to of targets) {
      try {
        const res = await apiFetch('/api/send-email',{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ to, subject:emailSubject, html:emailBody.replace(/\n/g,'<br/>') }),
        });
        if (res.ok) ok++; else fail++;
      } catch { fail++; }
    }
    await logAction('email', emailTarget==='single'?emailTo:`${emailTarget} users (${targets.length})`,
      `Subject: ${emailSubject}`);
    showToast(`✅ Sent ${ok} / ${targets.length}${fail>0?` (${fail} failed)`:''}`);
    setEmailSending(false);
    if (ok===targets.length) { setEmailSubject(''); setEmailBody(''); setEmailTo(''); }
  };

  const filtered = users.filter(u =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    langLabel(u.learnLang).toLowerCase().includes(search.toLowerCase()) ||
    langLabel(u.nativeLang).toLowerCase().includes(search.toLowerCase())
  );

  const actionColors: Record<string,string> = {
    grant:'#059669', extend:'#6366F1', revoke:'#E11D48', email:'#F59E0B',
  };

  if (loading||fetching) return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:FONT}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:40,height:40,border:'4px solid #E5E7EB',borderTopColor:'#6366F1',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 14px'}}/>
        <div style={{color:'#94A3B8',fontWeight:700,fontSize:14}}>Loading admin panel...</div>
      </div>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{__html:`@keyframes spin{to{transform:rotate(360deg)}}`}}/>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:FONT,color:'#0F172A'}}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{__html:`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes su{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .admin-table{width:100%;border-collapse:collapse}
        .admin-table tbody tr.urow:hover{background:#EEF2FF!important}
        .tab-btn{transition:all .15s}
        .tab-btn:hover:not(.active){background:#F8FAFC}
        textarea{resize:vertical}
        input:focus,textarea:focus{border-color:#6366F1!important}
      `}}/>

      {/* Toast */}
      {toast&&<div style={{position:'fixed',top:18,left:'50%',transform:'translateX(-50%)',background:'#1E293B',color:'#fff',padding:'11px 22px',borderRadius:12,fontWeight:800,fontSize:13,zIndex:9999,animation:'su .2s ease',whiteSpace:'nowrap',maxWidth:'90vw',overflow:'hidden',textOverflow:'ellipsis'}}>{toast}</div>}

      {/* Nav */}
      <nav style={{background:'#fff',borderBottom:'1px solid #E9EDF3',height:56,display:'flex',alignItems:'center',padding:'0 24px',gap:14,position:'sticky',top:0,zIndex:50}}>
        <button onClick={()=>router.push('/lingua')} style={{background:'none',border:'none',color:'#94A3B8',cursor:'pointer',fontWeight:700,fontSize:13,fontFamily:FONT}}>← Back</button>
        <div style={{fontWeight:900,fontSize:16,color:'#0F172A'}}>🛡️ Admin Panel</div>
        <div style={{marginLeft:'auto',fontSize:12,color:'#64748B',fontWeight:700,background:'#F1F5F9',padding:'5px 12px',borderRadius:999}}>
          {users.length} users · {users.filter(u=>u.planId!=='free').length} premium
        </div>
      </nav>

      <div style={{maxWidth:1080,margin:'0 auto',padding:'28px 20px 48px'}}>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
          {(['free','monthly','biannual','annual'] as PlanId[]).map(p=>(
            <div key={p} style={{...CARD,padding:'16px 18px'}}>
              <div style={{fontSize:24,fontWeight:900,color:PLAN_COLORS[p]}}>{users.filter(u=>u.planId===p).length}</div>
              <div style={{fontSize:11,color:'#64748B',fontWeight:700,marginTop:4}}>{PLAN_LABELS[p]}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:6,marginBottom:24,background:'#fff',padding:6,borderRadius:14,border:'1px solid #E9EDF3',width:'fit-content'}}>
          {([['users','👥 Users'],['email','✉️ Email'],['logs','📋 Logs'],['settings','⚙️ Settings']] as [Tab,string][]).map(([t,label])=>(
            <button key={t} className={`tab-btn${tab===t?' active':''}`} onClick={()=>setTab(t)}
              style={{padding:'9px 22px',borderRadius:10,border:'none',background:tab===t?'#EEF2FF':'transparent',color:tab===t?'#6366F1':'#64748B',fontWeight:tab===t?900:700,fontSize:13,cursor:'pointer',fontFamily:FONT}}>
              {label}
            </button>
          ))}
        </div>

        {/* -- USERS TAB -- */}
        {tab==='users'&&(
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}>
              <h2 style={{...SECTION_TITLE,fontSize:18}}>Users</h2>
              <div style={{fontSize:12,color:'#94A3B8',fontWeight:700}}>{filtered.length} of {users.length} shown</div>
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="🔍 Search by email, name, or language..."
              style={{...INPUT,marginBottom:16}}
            />
            <div style={{...CARD,overflow:'hidden'}}>
              <div style={{overflowX:'auto',maxHeight:'70vh',overflowY:'auto'}}>
                <table className="admin-table" style={{minWidth:980}}>
                  <thead>
                    <tr>
                      <th style={TH}>Email</th>
                      <th style={TH}>Name</th>
                      <th style={TH}>Plan</th>
                      <th style={TH}>Joined</th>
                      <th style={TH}>Learning</th>
                      <th style={TH}>Native</th>
                      <th style={TH_NUM}>XP</th>
                      <th style={TH}>Last active</th>
                      <th style={TH_NUM}>Lessons</th>
                      <th style={TH}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length===0&&(
                      <tr><td colSpan={10} style={{padding:48,textAlign:'center',color:'#94A3B8',fontWeight:700,fontSize:13}}>No users found</td></tr>
                    )}
                    {filtered.map((u,i)=>(
                      <tr key={u.uid} className="urow" style={{background:i%2?'#FAFBFD':'#fff'}}>
                        <td style={{...TD,fontWeight:700,color:'#0F172A',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={u.email}>{u.email}</td>
                        <td style={{...TD,color:'#475569',fontWeight:700,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={u.displayName}>{u.displayName}</td>
                        <td style={TD}>
                          <span style={{padding:'4px 10px',borderRadius:8,background:PLAN_COLORS[u.planId]+'1A',color:PLAN_COLORS[u.planId],fontSize:10,fontWeight:900,whiteSpace:'nowrap'}}>{PLAN_LABELS[u.planId]}</span>
                        </td>
                        <td style={{...TD,color:'#64748B',fontWeight:700,whiteSpace:'nowrap'}}>{u.createdAt||'—'}</td>
                        <td style={{...TD,color:'#475569',fontWeight:700,whiteSpace:'nowrap'}} title={u.learnLang}>{langLabel(u.learnLang)}</td>
                        <td style={{...TD,color:'#475569',fontWeight:700,whiteSpace:'nowrap'}} title={u.nativeLang}>{langLabel(u.nativeLang)}</td>
                        <td style={{...TD_NUM,fontWeight:900,color:'#6366F1',whiteSpace:'nowrap'}}>{u.xp.toLocaleString()}</td>
                        <td style={{...TD,color:'#64748B',fontWeight:700,whiteSpace:'nowrap'}}>{u.lastActive||'—'}</td>
                        <td style={{...TD_NUM,color:'#475569',fontWeight:700,whiteSpace:'nowrap'}}>{u.lessonsDone}</td>
                        <td style={{...TD,whiteSpace:'nowrap'}}>
                          <div style={{display:'flex',gap:6}}>
                            <button onClick={()=>openGrant(u)} disabled={saving===u.uid}
                              style={{...BTN_SM,background:'#EEF2FF',color:'#6366F1',opacity:saving===u.uid?0.5:1}}>
                              ⭐ Grant
                            </button>
                            {u.planId!=='free'&&<>
                              <button onClick={()=>openExtend(u)} disabled={saving===u.uid}
                                style={{...BTN_SM,background:'#F0FDF4',color:'#059669',opacity:saving===u.uid?0.5:1}}>
                                +Extend
                              </button>
                              <button onClick={()=>handleRevoke(u)} disabled={saving===u.uid} title="Revoke premium"
                                style={{...BTN_SM,background:'#FFF1F2',color:'#E11D48',opacity:saving===u.uid?0.5:1}}>
                                🔒
                              </button>
                            </>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* -- EMAIL TAB -- */}
        {tab==='email'&&(
          <div style={{...CARD,padding:'28px'}}>
            <h2 style={SECTION_TITLE}>✉️ Send Email to Users</h2>
            <p style={SECTION_SUB}>Compose and send an email via the admin mailer. Recipients are counted live below.</p>

            {/* Target */}
            <div style={{margin:'22px 0 18px'}}>
              <div style={FIELD_LABEL}>Send To</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {([['single','Single User'],['all','All Users'],['premium','Premium Only'],['free','Free Only']] as [typeof emailTarget,string][]).map(([v,l])=>(
                  <button key={v} onClick={()=>setEmailTarget(v)}
                    style={{padding:'9px 18px',borderRadius:10,border:`1.5px solid ${emailTarget===v?'#6366F1':'#E5E7EB'}`,background:emailTarget===v?'#EEF2FF':'#fff',color:emailTarget===v?'#6366F1':'#374151',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:FONT}}>
                    {l} {v!=='single'&&`(${v==='all'?users.length:users.filter(u=>v==='premium'?u.planId!=='free':u.planId==='free').length})`}
                  </button>
                ))}
              </div>
            </div>

            {emailTarget==='single'&&(
              <div style={{marginBottom:16}}>
                <div style={FIELD_LABEL}>Email Address</div>
                <input value={emailTo} onChange={e=>setEmailTo(e.target.value)}
                  placeholder="user@example.com" style={INPUT}
                />
              </div>
            )}

            <div style={{marginBottom:16}}>
              <div style={FIELD_LABEL}>Subject</div>
              <input value={emailSubject} onChange={e=>setEmailSubject(e.target.value)}
                placeholder="e.g. Special offer just for you 🎁" style={INPUT}
              />
            </div>

            <div style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{...FIELD_LABEL,marginBottom:0}}>Message Body</div>
                <button onClick={()=>setEmailPreview(!emailPreview)}
                  style={{background:'none',border:'none',color:'#6366F1',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:FONT}}>
                  {emailPreview?'✏️ Edit':'👁 Preview'}
                </button>
              </div>
              {emailPreview?(
                <div style={{...INPUT,minHeight:160,lineHeight:1.7,color:'#374151'}}
                  dangerouslySetInnerHTML={{__html:emailBody.replace(/\n/g,'<br/>')}}/>
              ):(
                <textarea value={emailBody} onChange={e=>setEmailBody(e.target.value)}
                  placeholder={`Hi there!\n\nWe wanted to share something special with you...\n\nBest,\nMunTalk Team`}
                  rows={8} style={{...INPUT,lineHeight:1.6}}
                />
              )}
              <div style={{fontSize:11,color:'#94A3B8',fontWeight:700,marginTop:6}}>Tip: line breaks become &lt;br&gt; in the email</div>
            </div>

            {/* Quick templates */}
            <div style={{marginBottom:22}}>
              <div style={FIELD_LABEL}>Quick Templates</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[
                  {label:'🎁 Free → Premium Offer', subject:'Upgrade to Premium — Special Offer Inside',
                   body:`Hi there!\n\nWe've loved having you on MunTalk. As a token of our appreciation, we'd like to offer you an exclusive discount on our Premium plan.\n\nWith Premium you get:\n• All 6 levels (A1→C2)\n• Unlimited AI tutor sessions\n• 18,000+ Word Bank\n• Full League system\n\nUse code SPECIAL30 for 30% off your first month.\n\nHappy learning!\nThe MunTalk Team`},
                  {label:'📅 Renewal Reminder', subject:'Your MunTalk Premium is expiring soon',
                   body:`Hi there!\n\nJust a friendly reminder that your MunTalk Premium subscription is expiring soon.\n\nDon't lose your streak and progress — renew now to keep going!\n\nSee you in the app,\nThe MunTalk Team`},
                  {label:'🎉 Welcome Premium', subject:'Welcome to MunTalk Premium! 🎉',
                   body:`Welcome to MunTalk Premium!\n\nYou now have access to:\n✅ All 6 levels (A1 → C2)\n✅ Unlimited AI tutor sessions\n✅ 18,000+ Word Bank (verbs, adjectives, adverbs, phrases)\n✅ League system & weekly rankings\n✅ Unlimited hearts\n\nJump back in and start learning!\n\nThe MunTalk Team`},
                ].map(t=>(
                  <button key={t.label} onClick={()=>{setEmailSubject(t.subject);setEmailBody(t.body);}}
                    style={{...BTN_GHOST,background:'#F8FAFC',fontSize:11,padding:'8px 14px'}}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSendEmail} disabled={emailSending}
              style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:emailSending?'#C7D2FE':'linear-gradient(135deg,#6366F1,#8B5CF6)',color:emailSending?'#4F46E5':'#fff',fontWeight:900,fontSize:14,cursor:emailSending?'default':'pointer',fontFamily:FONT}}>
              {emailSending?'Sending...':'✉️ Send Email'}
            </button>
          </div>
        )}

        {/* -- LOGS TAB -- */}
        {tab==='logs'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <h2 style={{...SECTION_TITLE,fontSize:18}}>📋 Activity Logs</h2>
              <button onClick={fetchLogs}
                style={{...BTN_GHOST,color:'#6366F1',padding:'8px 18px',fontSize:12}}>
                🔄 Refresh
              </button>
            </div>
            <div style={{...CARD,overflow:'hidden'}}>
              <div style={{overflowX:'auto',maxHeight:'70vh',overflowY:'auto'}}>
                <table className="admin-table" style={{minWidth:820}}>
                  <thead>
                    <tr>
                      <th style={{...TH,width:110}}>Action</th>
                      <th style={TH}>Target</th>
                      <th style={TH}>Detail</th>
                      <th style={TH}>Admin</th>
                      <th style={{...TH,width:150}}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length===0&&(
                      <tr><td colSpan={5} style={{padding:48,textAlign:'center',color:'#94A3B8',fontWeight:700,fontSize:13}}>No logs yet</td></tr>
                    )}
                    {logs.map((l,i)=>(
                      <tr key={l.id} className="urow" style={{background:i%2?'#FAFBFD':'#fff'}}>
                        <td style={TD}>
                          <span style={{padding:'4px 10px',borderRadius:8,background:(actionColors[l.action]||'#94A3B8')+'1A',color:actionColors[l.action]||'#94A3B8',fontSize:10,fontWeight:900,textTransform:'capitalize',whiteSpace:'nowrap'}}>
                            {l.action}
                          </span>
                        </td>
                        <td style={{...TD,color:'#0F172A',fontWeight:700,maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={l.targetEmail}>{l.targetEmail}</td>
                        <td style={{...TD,color:'#475569',fontWeight:600,maxWidth:280,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={l.detail}>{l.detail}</td>
                        <td style={{...TD,color:'#94A3B8',fontWeight:700,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={l.adminEmail}>{l.adminEmail}</td>
                        <td style={{...TD,color:'#64748B',fontWeight:700,whiteSpace:'nowrap'}}>{l.ts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -- SETTINGS TAB -- */}
        {tab==='settings'&&(
          <div>
            <h2 style={{...SECTION_TITLE,fontSize:18}}>System Settings</h2>
            <p style={{...SECTION_SUB,marginBottom:24}}>Configure how lesson content is generated for learners.</p>

            <div style={{...CARD,padding:26,marginBottom:20}}>
              <div style={{fontSize:15,fontWeight:800,color:'#0F172A',marginBottom:6}}>Lesson Content Source</div>
              <div style={{fontSize:13,color:'#64748B',marginBottom:22,lineHeight:1.7,fontWeight:600}}>
                <strong>API Mode:</strong> Gemini AI generates content in real-time. Falls back to JSON if unavailable.<br/>
                <strong>JSON Mode:</strong> Uses pre-generated JSON files first. Falls back to Gemini if file not found.
              </div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <button
                  onClick={()=>{ setCurriculumMode('api'); localStorage.setItem('mt_curriculum_mode','api'); }}
                  style={{padding:'13px 28px',borderRadius:12,border:'none',cursor:'pointer',fontFamily:FONT,fontWeight:900,fontSize:14,
                    background:curriculumMode==='api'?'linear-gradient(135deg,#6366F1,#8B5CF6)':'#F1F5F9',
                    color:curriculumMode==='api'?'#fff':'#64748B',
                    boxShadow:curriculumMode==='api'?'0 4px 14px rgba(99,102,241,0.3)':'none',
                    transition:'all .2s'}}>
                  🤖 API Mode (Gemini First)
                </button>
                <button
                  onClick={()=>{ setCurriculumMode('json'); localStorage.setItem('mt_curriculum_mode','json'); }}
                  style={{padding:'13px 28px',borderRadius:12,border:'none',cursor:'pointer',fontFamily:FONT,fontWeight:900,fontSize:14,
                    background:curriculumMode==='json'?'linear-gradient(135deg,#10B981,#059669)':'#F1F5F9',
                    color:curriculumMode==='json'?'#fff':'#64748B',
                    boxShadow:curriculumMode==='json'?'0 4px 14px rgba(16,185,129,0.3)':'none',
                    transition:'all .2s'}}>
                  📦 JSON Mode (Pre-generated First)
                </button>
              </div>

              <div style={{marginTop:18,padding:'14px 18px',borderRadius:12,
                background:curriculumMode==='api'?'#EEF2FF':'#ECFDF5',
                border:'1.5px solid '+(curriculumMode==='api'?'#C7D2FE':'#A7F3D0')}}>
                <div style={{fontSize:13,fontWeight:800,color:curriculumMode==='api'?'#6366F1':'#10B981',marginBottom:4}}>
                  {curriculumMode==='api'
                    ? '🤖 Active: API Mode — Gemini AI generates lessons, JSON is fallback'
                    : '📦 Active: JSON Mode — Pre-generated files load first, Gemini is fallback'}
                </div>
                <div style={{fontSize:11,color:'#64748B',fontWeight:600}}>
                  Stored in browser localStorage. Applies immediately to all new lesson sessions on this device.
                </div>
              </div>
            </div>

            <div style={{background:'#FFF7ED',borderRadius:14,border:'1px solid #FED7AA',padding:18}}>
              <div style={{fontSize:12,fontWeight:800,color:'#EA580C',marginBottom:10}}>When to use each mode</div>
              <div style={{fontSize:12,color:'#78350F',lineHeight:1.9,fontWeight:600}}>
                Use <strong>API Mode</strong> when Gemini is working well and you want real-time personalised content<br/>
                Use <strong>JSON Mode</strong> when Gemini is slow, rate-limited, or pre-generated files are ready<br/>
                JSON files must exist in <code style={{background:'#FEF3C7',padding:'1px 4px',borderRadius:4}}>/public/curriculum/</code> for JSON mode to work
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grant / Extend Modal */}
      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div style={{background:'#fff',borderRadius:20,padding:'28px',maxWidth:400,width:'100%'}}>
            <div style={{fontSize:16,fontWeight:900,color:'#0F172A',marginBottom:4}}>
              {modalMode==='grant'?'⭐ Grant Premium':'⏳ Extend Subscription'}
            </div>
            <div style={{fontSize:12,color:'#64748B',fontWeight:700,marginBottom:8}}>{modal.email}</div>
            <div style={{fontSize:12,color:'#64748B',fontWeight:700,marginBottom:8}}>
              Learning: <strong style={{color:'#374151'}}>{langLabel(modal.learnLang)}</strong>
              {' · '}Native: <strong style={{color:'#374151'}}>{langLabel(modal.nativeLang)}</strong>
            </div>
            {modal.expiry&&<div style={{fontSize:12,color:'#94A3B8',fontWeight:700,marginBottom:16}}>
              Current expiry: <strong style={{color:'#374151'}}>{modal.expiry}</strong>
            </div>}

            <div style={{...FIELD_LABEL,marginBottom:8}}>Plan</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:18}}>
              {(['monthly','biannual','annual'] as PlanId[]).map(p=>(
                <button key={p} onClick={()=>{setSelPlan(p); setSelExpiry(modalMode==='extend'?extendExpiry(modal.expiry,p):defaultExpiry(p));}}
                  style={{padding:'9px 6px',borderRadius:10,border:`2px solid ${selPlan===p?PLAN_COLORS[p]:'#E5E7EB'}`,background:selPlan===p?PLAN_COLORS[p]+'1A':'#fff',color:selPlan===p?PLAN_COLORS[p]:'#374151',fontSize:11,fontWeight:900,cursor:'pointer',fontFamily:FONT}}>
                  {PLAN_LABELS[p]}
                </button>
              ))}
            </div>

            <div style={{...FIELD_LABEL,marginBottom:6}}>
              {modalMode==='extend'?'New Expiry (auto-calculated)':'Expiry Date'}
            </div>
            <input type="date" value={selExpiry} onChange={e=>setSelExpiry(e.target.value)}
              readOnly={modalMode==='extend'}
              title={modalMode==='extend'?'Auto-calculated from current expiry':undefined}
              style={{...INPUT,marginBottom:22,background:modalMode==='extend'?'#F8FAFC':'#fff',color:modalMode==='extend'?'#94A3B8':'#0F172A'}}
            />

            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setModal(null)}
                style={{flex:1,padding:'11px',borderRadius:11,border:'1.5px solid #E5E7EB',background:'#fff',color:'#374151',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:FONT}}>
                Cancel
              </button>
              <button onClick={handleSavePlan} disabled={saving===modal.uid}
                style={{flex:2,padding:'11px',borderRadius:11,border:'none',background:saving===modal.uid?'#C7D2FE':'linear-gradient(135deg,#6366F1,#8B5CF6)',color:saving===modal.uid?'#4F46E5':'#fff',fontWeight:900,fontSize:13,cursor:saving===modal.uid?'default':'pointer',fontFamily:FONT}}>
                {saving===modal.uid?'Saving...':`${modalMode==='extend'?'Extend':'Grant'} ${PLAN_LABELS[selPlan]}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
