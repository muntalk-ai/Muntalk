'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, doc, setDoc, getDoc, addDoc,
  serverTimestamp, query, orderBy, limit, where,
} from 'firebase/firestore';

const ADMIN_EMAILS = ['muntalkofficial@gmail.com'];
type PlanId = 'free' | 'monthly' | 'biannual' | 'annual';
type Tab = 'users' | 'email' | 'logs';

interface UserRow {
  uid: string; email: string; displayName: string;
  planId: PlanId; planStatus: string; expiry: string;
  xp: number; streak: number; createdAt: string;
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
// 53행 부근 추가
  const [dataSourceMode, setDataSourceMode] = useState<'json' | 'api'>('json');
  const [tab, setTab] = useState<Tab>('users');
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
// 135행 부근 추가
  useEffect(() => {
    (async () => {
      const docSnap = await getDoc(doc(db, 'app_settings', 'global'));
      if (docSnap.exists()) setDataSourceMode(docSnap.data().dataSourceMode || 'json');
    })();
  }, []);

  const toggleDataSource = async (mode: 'json' | 'api') => {
    try {
      await setDoc(doc(db, 'app_settings', 'global'), { dataSourceMode: mode }, { merge: true });
      setDataSourceMode(mode);
      showToast(`🚀 모드 변경: ${mode.toUpperCase()}`);
      await logAction('settings', 'all', `Data source changed to ${mode}`);
    } catch (e: any) { showToast('❌ ' + e.message); }
  };
  
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
        const res = await fetch('/api/send-email',{
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
    u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const actionColors: Record<string,string> = {
    grant:'#059669', extend:'#6366F1', revoke:'#E11D48', email:'#F59E0B',
  };

  if (loading||fetching) return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Nunito',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:40,height:40,border:'4px solid #E5E7EB',borderTopColor:'#6366F1',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 14px'}}/>
        <div style={{color:'#94A3B8',fontWeight:700,fontSize:14}}>Loading admin panel...</div>
      </div>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{__html:`@keyframes spin{to{transform:rotate(360deg)}}`}}/>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:"'Nunito',sans-serif"}}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{__html:`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes su{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .urow:hover{background:#F8FAFC!important}
        .tab-btn{transition:all .15s}
        textarea{resize:vertical}
      `}}/>

      {/* Toast */}
      {toast&&<div style={{position:'fixed',top:18,left:'50%',transform:'translateX(-50%)',background:'#1E293B',color:'#fff',padding:'11px 22px',borderRadius:12,fontWeight:800,fontSize:13,zIndex:9999,animation:'su .2s ease',whiteSpace:'nowrap'}}>{toast}</div>}

      {/* Nav */}
      <nav style={{background:'#fff',borderBottom:'1px solid #F1F5F9',height:54,display:'flex',alignItems:'center',padding:'0 24px',gap:14}}>
        <button onClick={()=>router.push('/lingua')} style={{background:'none',border:'none',color:'#94A3B8',cursor:'pointer',fontWeight:700,fontSize:13,fontFamily:"'Nunito',sans-serif"}}>← Back</button>
        <div style={{fontWeight:900,fontSize:16,color:'#0F172A'}}>🛡️ Admin Panel</div>
        <div style={{marginLeft:'auto',fontSize:12,color:'#94A3B8',fontWeight:700}}>
          {users.length} users · {users.filter(u=>u.planId!=='free').length} premium
        </div>
      </nav>

      <div style={{maxWidth:1080,margin:'0 auto',padding:'24px 20px'}}>
        
{/* 238행: Stats 섹션 바로 위에 추가 */}
        <div style={{background: '#fff', padding: '16px 20px', borderRadius: 16, marginBottom: 20, border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'su .3s ease'}}>
          <div>
            <div style={{fontSize: 14, fontWeight: 900, color: '#0F172A'}}>🌐 데이터 소스 제어 (Admin 전용)</div>
            <div style={{fontSize: 11, color: '#94A3B8', fontWeight: 700, marginTop: 2}}>
              {dataSourceMode === 'json' ? '📦 내부 JSON 데이터 우선 사용' : '✨ 실시간 Gemini API 강제 사용'}
            </div>
          </div>
          <div style={{display: 'flex', gap: 6, background: '#F1F5F9', padding: 4, borderRadius: 12}}>
            {(['json', 'api'] as const).map(m => (
              <button key={m} onClick={() => toggleDataSource(m)}
                style={{padding: '7px 16px', borderRadius: 9, border: 'none', background: dataSourceMode === m ? '#fff' : 'transparent', color: dataSourceMode === m ? '#6366F1' : '#94A3B8', fontSize: 12, fontWeight: 900, cursor: 'pointer', boxShadow: dataSourceMode === m ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all .2s'}}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:24}}>
          {(['free','monthly','biannual','annual'] as PlanId[]).map(p=>(
            <div key={p} style={{background:'#fff',borderRadius:12,padding:'14px 16px',border:'1px solid #F1F5F9'}}>
              <div style={{fontSize:22,fontWeight:900,color:PLAN_COLORS[p]}}>{users.filter(u=>u.planId===p).length}</div>
              <div style={{fontSize:11,color:'#64748B',fontWeight:700,marginTop:2}}>{PLAN_LABELS[p]}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:6,marginBottom:20,background:'#fff',padding:6,borderRadius:14,border:'1px solid #F1F5F9',width:'fit-content'}}>
          {([['users','👥 Users'],['email','✉️ Email'],['logs','📋 Logs']] as [Tab,string][]).map(([t,label])=>(
            <button key={t} className="tab-btn" onClick={()=>setTab(t)}
              style={{padding:'8px 20px',borderRadius:10,border:'none',background:tab===t?'#EEF2FF':'transparent',color:tab===t?'#6366F1':'#64748B',fontWeight:tab===t?900:700,fontSize:13,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
              {label}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ── */}
        {tab==='users'&&(
          <>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="🔍 Search by email or name..."
              style={{width:'100%',padding:'11px 16px',borderRadius:12,border:'1.5px solid #E5E7EB',fontSize:14,fontFamily:"'Nunito',sans-serif",outline:'none',marginBottom:14,background:'#fff',boxSizing:'border-box'}}
            />
            <div style={{background:'#fff',borderRadius:16,border:'1px solid #F1F5F9',overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 110px 90px 60px 160px',padding:'10px 16px',background:'#F8FAFC',borderBottom:'1px solid #F1F5F9',fontSize:10,fontWeight:900,color:'#94A3B8',letterSpacing:1.2,textTransform:'uppercase'}}>
                <div>Email</div><div>Name</div><div>Plan</div><div>Expires</div><div>XP</div><div>Actions</div>
              </div>
              {filtered.length===0&&<div style={{padding:40,textAlign:'center',color:'#94A3B8',fontWeight:700}}>No users found</div>}
              {filtered.map((u,i)=>(
                <div key={u.uid} className="urow" style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 110px 90px 60px 160px',padding:'12px 16px',borderBottom:i<filtered.length-1?'1px solid #F8FAFC':'none',alignItems:'center',background:'#fff',transition:'background .1s'}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#0F172A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
                  <div style={{fontSize:12,color:'#64748B',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.displayName}</div>
                  <div><span style={{padding:'3px 9px',borderRadius:7,background:PLAN_COLORS[u.planId]+'18',color:PLAN_COLORS[u.planId],fontSize:10,fontWeight:900}}>{PLAN_LABELS[u.planId]}</span></div>
                  <div style={{fontSize:11,color:u.expiry&&u.expiry<new Date().toISOString().slice(0,10)?'#E11D48':'#94A3B8',fontWeight:700}}>{u.expiry||'—'}</div>
                  <div style={{fontSize:12,fontWeight:900,color:'#6366F1'}}>{u.xp.toLocaleString()}</div>
                  <div style={{display:'flex',gap:5}}>
                    <button onClick={()=>openGrant(u)} disabled={saving===u.uid}
                      style={{padding:'5px 10px',borderRadius:7,border:'none',background:'#EEF2FF',color:'#6366F1',fontSize:10,fontWeight:900,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
                      ⭐ Grant
                    </button>
                    {u.planId!=='free'&&<>
                      <button onClick={()=>openExtend(u)} disabled={saving===u.uid}
                        style={{padding:'5px 10px',borderRadius:7,border:'none',background:'#F0FDF4',color:'#059669',fontSize:10,fontWeight:900,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
                        +기간
                      </button>
                      <button onClick={()=>handleRevoke(u)} disabled={saving===u.uid}
                        style={{padding:'5px 8px',borderRadius:7,border:'none',background:'#FFF1F2',color:'#E11D48',fontSize:10,fontWeight:900,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
                        🔒
                      </button>
                    </>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── EMAIL TAB ── */}
        {tab==='email'&&(
          <div style={{background:'#fff',borderRadius:16,border:'1px solid #F1F5F9',padding:'28px'}}>
            <h2 style={{fontSize:16,fontWeight:900,color:'#0F172A',margin:'0 0 20px'}}>✉️ Send Email to Users</h2>

            {/* Target */}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:900,color:'#94A3B8',letterSpacing:1.5,textTransform:'uppercase',marginBottom:8}}>Send To</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {([['single','Single User'],['all','All Users'],['premium','Premium Only'],['free','Free Only']] as [typeof emailTarget,string][]).map(([v,l])=>(
                  <button key={v} onClick={()=>setEmailTarget(v)}
                    style={{padding:'8px 16px',borderRadius:10,border:`1.5px solid ${emailTarget===v?'#6366F1':'#E5E7EB'}`,background:emailTarget===v?'#EEF2FF':'#fff',color:emailTarget===v?'#6366F1':'#374151',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
                    {l} {v!=='single'&&`(${v==='all'?users.length:users.filter(u=>v==='premium'?u.planId!=='free':u.planId==='free').length})`}
                  </button>
                ))}
              </div>
            </div>

            {emailTarget==='single'&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:900,color:'#94A3B8',letterSpacing:1.5,textTransform:'uppercase',marginBottom:6}}>Email Address</div>
                <input value={emailTo} onChange={e=>setEmailTo(e.target.value)}
                  placeholder="user@example.com"
                  style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:14,fontFamily:"'Nunito',sans-serif",outline:'none',boxSizing:'border-box'}}
                />
              </div>
            )}

            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:900,color:'#94A3B8',letterSpacing:1.5,textTransform:'uppercase',marginBottom:6}}>Subject</div>
              <input value={emailSubject} onChange={e=>setEmailSubject(e.target.value)}
                placeholder="e.g. Special offer just for you 🎁"
                style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:14,fontFamily:"'Nunito',sans-serif",outline:'none',boxSizing:'border-box'}}
              />
            </div>

            <div style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div style={{fontSize:11,fontWeight:900,color:'#94A3B8',letterSpacing:1.5,textTransform:'uppercase'}}>Message Body</div>
                <button onClick={()=>setEmailPreview(!emailPreview)}
                  style={{background:'none',border:'none',color:'#6366F1',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
                  {emailPreview?'✏️ Edit':'👁 Preview'}
                </button>
              </div>
              {emailPreview?(
                <div style={{padding:'16px',borderRadius:10,border:'1.5px solid #E5E7EB',minHeight:160,fontSize:14,color:'#374151',lineHeight:1.7}}
                  dangerouslySetInnerHTML={{__html:emailBody.replace(/\n/g,'<br/>')}}/>
              ):(
                <textarea value={emailBody} onChange={e=>setEmailBody(e.target.value)}
                  placeholder={`Hi there!\n\nWe wanted to share something special with you...\n\nBest,\nMunTalk Team`}
                  rows={8}
                  style={{width:'100%',padding:'12px 14px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:14,fontFamily:"'Nunito',sans-serif",outline:'none',boxSizing:'border-box',lineHeight:1.6}}
                />
              )}
              <div style={{fontSize:11,color:'#94A3B8',fontWeight:700,marginTop:4}}>Tip: line breaks become &lt;br&gt; in the email</div>
            </div>

            {/* Quick templates */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:900,color:'#94A3B8',letterSpacing:1.5,textTransform:'uppercase',marginBottom:8}}>Quick Templates</div>
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
                    style={{padding:'7px 14px',borderRadius:9,border:'1px solid #E5E7EB',background:'#F8FAFC',color:'#374151',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSendEmail} disabled={emailSending}
              style={{width:'100%',padding:'13px',borderRadius:12,border:'none',background:emailSending?'#C7D2FE':'linear-gradient(135deg,#6366F1,#8B5CF6)',color:'#fff',fontWeight:900,fontSize:14,cursor:emailSending?'default':'pointer',fontFamily:"'Nunito',sans-serif"}}>
              {emailSending?'Sending...':'✉️ Send Email'}
            </button>
          </div>
        )}

        {/* ── LOGS TAB ── */}
        {tab==='logs'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:900,color:'#0F172A'}}>📋 Activity Logs</div>
              <button onClick={fetchLogs}
                style={{padding:'7px 16px',borderRadius:9,border:'1px solid #E5E7EB',background:'#fff',color:'#6366F1',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
                🔄 Refresh
              </button>
            </div>
            <div style={{background:'#fff',borderRadius:16,border:'1px solid #F1F5F9',overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'100px 1fr 1fr 1fr 140px',padding:'10px 16px',background:'#F8FAFC',borderBottom:'1px solid #F1F5F9',fontSize:10,fontWeight:900,color:'#94A3B8',letterSpacing:1.2,textTransform:'uppercase'}}>
                <div>Action</div><div>Target</div><div>Detail</div><div>Admin</div><div>Time</div>
              </div>
              {logs.length===0&&<div style={{padding:40,textAlign:'center',color:'#94A3B8',fontWeight:700}}>No logs yet</div>}
              {logs.map((l,i)=>(
                <div key={l.id} style={{display:'grid',gridTemplateColumns:'100px 1fr 1fr 1fr 140px',padding:'12px 16px',borderBottom:i<logs.length-1?'1px solid #F8FAFC':'none',alignItems:'center',background:'#fff'}}>
                  <div>
                    <span style={{padding:'3px 9px',borderRadius:7,background:(actionColors[l.action]||'#94A3B8')+'18',color:actionColors[l.action]||'#94A3B8',fontSize:10,fontWeight:900,textTransform:'capitalize'}}>
                      {l.action}
                    </span>
                  </div>
                  <div style={{fontSize:12,color:'#0F172A',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.targetEmail}</div>
                  <div style={{fontSize:11,color:'#64748B',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.detail}</div>
                  <div style={{fontSize:11,color:'#94A3B8',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.adminEmail}</div>
                  <div style={{fontSize:11,color:'#94A3B8',fontWeight:700}}>{l.ts}</div>
                </div>
              ))}
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
            <div style={{fontSize:12,color:'#64748B',fontWeight:700,marginBottom:22}}>{modal.email}</div>
            {modal.expiry&&<div style={{fontSize:12,color:'#94A3B8',fontWeight:700,marginBottom:16}}>
              Current expiry: <strong style={{color:'#374151'}}>{modal.expiry}</strong>
            </div>}

            <div style={{fontSize:10,fontWeight:900,color:'#94A3B8',letterSpacing:1.5,textTransform:'uppercase',marginBottom:8}}>Plan</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:18}}>
              {(['monthly','biannual','annual'] as PlanId[]).map(p=>(
                <button key={p} onClick={()=>{setSelPlan(p); setSelExpiry(modalMode==='extend'?extendExpiry(modal.expiry,p):defaultExpiry(p));}}
                  style={{padding:'9px 6px',borderRadius:10,border:`2px solid ${selPlan===p?PLAN_COLORS[p]:'#E5E7EB'}`,background:selPlan===p?PLAN_COLORS[p]+'18':'#fff',color:selPlan===p?PLAN_COLORS[p]:'#374151',fontSize:11,fontWeight:900,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
                  {PLAN_LABELS[p]}
                </button>
              ))}
            </div>

            <div style={{fontSize:10,fontWeight:900,color:'#94A3B8',letterSpacing:1.5,textTransform:'uppercase',marginBottom:6}}>
              {modalMode==='extend'?'New Expiry (auto-calculated)':'Expiry Date'}
            </div>
            <input type="date" value={selExpiry} onChange={e=>setSelExpiry(e.target.value)}
              style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:14,fontFamily:"'Nunito',sans-serif",outline:'none',marginBottom:22,boxSizing:'border-box'}}
            />

            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setModal(null)}
                style={{flex:1,padding:'11px',borderRadius:11,border:'1.5px solid #E5E7EB',background:'#fff',color:'#374151',fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:"'Nunito',sans-serif"}}>
                Cancel
              </button>
              <button onClick={handleSavePlan} disabled={saving===modal.uid}
                style={{flex:2,padding:'11px',borderRadius:11,border:'none',background:saving===modal.uid?'#C7D2FE':'linear-gradient(135deg,#6366F1,#8B5CF6)',color:'#fff',fontWeight:900,fontSize:13,cursor:saving===modal.uid?'default':'pointer',fontFamily:"'Nunito',sans-serif"}}>
                {saving===modal.uid?'Saving...':`${modalMode==='extend'?'Extend':'Grant'} ${PLAN_LABELS[selPlan]}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
