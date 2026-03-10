'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

import { updateUserProfile } from '@/lib/userProfile';
import { requestPushPermission } from '@/lib/notifications';
import { LEARN_LANGUAGES, UI_LANGUAGES } from '@/data/languages';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [learnLang,   setLearnLang]   = useState(profile?.learnLang || 'en-US');
  const [nativeLang,  setNativeLang]  = useState(profile?.nativeLang || 'ko-KR');

  // Password change
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');

  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');
  const [tab,      setTab]      = useState<'profile' | 'password' | 'notifications' | 'subscription' | 'danger'>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePw, setDeletePw] = useState('');

  // 알림 설정
  const [emailNotif, setEmailNotif] = useState(profile?.emailNotifications ?? true);
  const [pushGranted, setPushGranted] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const isGoogle = user?.providerData?.[0]?.providerId === 'google.com';

  // 구독 상태
  const planId   = (profile as any)?.planId   || 'free';
  const planName = planId === 'free' ? 'Free' : planId === 'monthly' ? 'Monthly' : planId === 'biannual' ? '6 Months' : 'Annual';
  const isPremium = planId !== 'free';

  const handleManageSubscription = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e: any) {
      showError('Could not open billing portal.');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: "'Nunito',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #E5E7EB', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ color: '#94A3B8', fontWeight: 700 }}>Loading…</div>
      </div>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );

  const showSuccess = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000); };
  const showError   = (msg: string) => { setError(msg);   setSuccess(''); };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true); setError('');
    try {
      await updateProfile(user, { displayName });
      await updateUserProfile(user.uid, { learnLang, nativeLang, displayName });
      localStorage.setItem('mt_learn_lang', learnLang);
      localStorage.setItem('mt_native_lang', nativeLang);
      await refreshProfile();
      showSuccess('Profile saved!');
    } catch (e: any) { showError(e.message); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    if (newPw.length < 6) { showError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { showError('Passwords do not match.'); return; }
    setSaving(true); setError('');
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      showSuccess('Password changed!');
    } catch (e: any) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') showError('Current password is incorrect.');
      else showError(e.message);
    } finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (!user || !user.email) return;
    setSaving(true); setError('');
    try {
      const cred = EmailAuthProvider.credential(user.email, deletePw);
      await reauthenticateWithCredential(user, cred);
      await deleteUser(user);
      router.push('/login');
    } catch (e: any) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') showError('Incorrect password.');
      else showError(e.message);
    } finally { setSaving(false); }
  };

  const handleEmailNotifToggle = async (val: boolean) => {
    setEmailNotif(val);
    if (user) await updateUserProfile(user.uid, { emailNotifications: val } as any);
    showSuccess(val ? 'Daily email reminders enabled!' : 'Email reminders disabled.');
  };

  const handlePushPermission = async () => {
    setPushLoading(true);
    const token = await requestPushPermission(user.uid);
    setPushGranted(!!token);
    showSuccess(token ? '🔔 Push notifications enabled!' : 'Could not enable push notifications.');
    setPushLoading(false);
  };

  const tabStyle = (t: string) => ({
    padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13,
    background: tab === t ? '#6366F1' : 'transparent',
    color: tab === t ? '#fff' : '#64748B',
    transition: 'all .15s',
  } as React.CSSProperties);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito', sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .p-input { width:100%; padding:13px 16px; border:2px solid #E5E7EB; border-radius:12px; font-size:14px; font-family:'Nunito',sans-serif; outline:none; background:#fff; transition:border .15s; color:#0F172A; }
        .p-input:focus { border-color:#6366F1; }
        .p-select { width:100%; padding:13px 16px; border:2px solid #E5E7EB; border-radius:12px; font-size:14px; font-family:'Nunito',sans-serif; outline:none; background:#fff; color:#0F172A; cursor:pointer; }
        .p-btn { padding:13px 28px; border:none; border-radius:14px; background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff; font-size:14px; font-weight:800; font-family:'Nunito',sans-serif; cursor:pointer; }
        .p-btn:disabled { opacity:.5; cursor:default; }
        .p-btn-red { padding:13px 28px; border:none; border-radius:14px; background:#EF4444; color:#fff; font-size:14px; font-weight:800; font-family:'Nunito',sans-serif; cursor:pointer; }
      ` }} />

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', height: 62, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 200 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }}>←</button>
        <div style={{ fontWeight: 900, fontSize: 18, color: '#0F172A' }}>👤 Edit Profile</div>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>

        {/* Avatar & Name header */}
        <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #F1F5F9', padding: '28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #E5E7EB' }} />
              : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff' }}>
                  {(displayName || user?.email || '?')[0].toUpperCase()}
                </div>
            }
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>{displayName || 'Learner'}</div>
            <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>{user?.email}</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {isGoogle
                ? <span style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 8, padding: '2px 8px', fontWeight: 700, fontSize: 11 }}>🔵 Google Account</span>
                : <span style={{ background: '#F0FDF4', color: '#16A34A', borderRadius: 8, padding: '2px 8px', fontWeight: 700, fontSize: 11 }}>✉️ Email Account</span>
              }
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '6px', marginBottom: 20, display: 'flex', gap: 4 }}>
          <button style={tabStyle('profile')} onClick={() => setTab('profile')}>👤 Profile</button>
          {!isGoogle && <button style={tabStyle('password')} onClick={() => setTab('password')}>🔒 Password</button>}
          <button style={tabStyle('notifications')} onClick={() => setTab('notifications')}>🔔 Alerts</button>
          <button style={tabStyle('subscription')} onClick={() => setTab('subscription')}>💳 Plan</button>
          <button style={tabStyle('danger')} onClick={() => setTab('danger')}>⚠️ Account</button>
        </div>

        {/* Success / Error */}
        {success && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#16A34A', fontWeight: 700, marginBottom: 16 }}>✅ {success}</div>}
        {error   && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#DC2626', fontWeight: 700, marginBottom: 16 }}>⚠️ {error}</div>}

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '28px' }}>
            <div style={fld}>
              <label style={lbl}>Display Name</label>
              <input className="p-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>

            <div style={fld}>
              <label style={lbl}>I'm learning</label>
              <select className="p-select" value={learnLang} onChange={e => setLearnLang(e.target.value)}>
                {LEARN_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>

            <div style={fld}>
              <label style={lbl}>My native language</label>
              <select className="p-select" value={nativeLang} onChange={e => setNativeLang(e.target.value)}>
                {UI_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>

            <button className="p-btn" onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* ── PASSWORD TAB ── */}
        {tab === 'password' && !isGoogle && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '28px' }}>
            <div style={fld}>
              <label style={lbl}>Current Password</label>
              <input className="p-input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div style={fld}>
              <label style={lbl}>New Password</label>
              <input className="p-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 characters" />
            </div>
            <div style={fld}>
              <label style={lbl}>Confirm New Password</label>
              <input className="p-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password"
                onKeyDown={e => e.key === 'Enter' && handleChangePassword()} />
            </div>
            <button className="p-btn" onClick={handleChangePassword} disabled={saving}>
              {saving ? 'Updating…' : 'Change Password'}
            </button>
          </div>
        )}

        {/* ── SUBSCRIPTION TAB ── */}
        {tab === 'subscription' && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '28px' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', marginBottom: 20 }}>Your Plan</div>

            {/* Current plan card */}
            <div style={{
              borderRadius: 20, padding: '24px', marginBottom: 20,
              background: isPremium ? 'linear-gradient(135deg,#1E1B4B,#312E81)' : '#F8FAFC',
              border: isPremium ? 'none' : '1.5px solid #E5E7EB',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isPremium ? 'rgba(255,255,255,0.6)' : '#94A3B8', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Current Plan</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: isPremium ? '#fff' : '#0F172A', fontFamily: "'Nunito',sans-serif" }}>
                    {isPremium ? '⭐ ' : ''}{planName}
                  </div>
                  <div style={{ fontSize: 13, color: isPremium ? 'rgba(255,255,255,0.6)' : '#64748B', marginTop: 4 }}>
                    {isPremium ? 'All features unlocked' : 'A1 level + 3 AI chats/day'}
                  </div>
                </div>
                {isPremium && <div style={{ fontSize: 40 }}>🏆</div>}
                {!isPremium && <div style={{ fontSize: 40 }}>🆓</div>}
              </div>
            </div>

            {/* Action buttons */}
            {isPremium ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={handleManageSubscription} disabled={saving}
                  style={{ padding: '13px', borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                  {saving ? '…' : '⚙️ Manage Subscription (Stripe Portal)'}
                </button>
                <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
                  Cancel, change plan, or update payment method
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { id: 'biannual', label: '🚀 Get 6 Months — $39.99', sub: 'Most popular · Save 33%', color: 'linear-gradient(135deg,#6366F1,#8B5CF6)' },
                  { id: 'annual',   label: '🏆 Get Annual — $59.99',   sub: 'Best value · Save 50%',   color: 'linear-gradient(135deg,#F59E0B,#F97316)' },
                  { id: 'monthly',  label: 'Monthly — $9.99/month',     sub: 'No commitment',           color: '#64748B' },
                ].map(p => (
                  <button key={p.id} onClick={() => router.push(`/pricing?plan=${p.id}`)}
                    style={{ padding: '13px 16px', borderRadius: 14, border: 'none', background: p.color, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", textAlign: 'left' as const }}>
                    <div>{p.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 600, marginTop: 2 }}>{p.sub}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab === 'notifications' && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', padding: '28px' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', marginBottom: 20 }}>Notification Settings</div>

            {/* Email Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#F8FAFC', borderRadius: 16, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>📧 Daily Email Reminders</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Get today's review words + streak warning every morning</div>
              </div>
              <button onClick={() => handleEmailNotifToggle(!emailNotif)}
                style={{ width: 48, height: 26, borderRadius: 13, border: 'none', background: emailNotif ? '#6366F1' : '#E5E7EB', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: emailNotif ? 24 : 4, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
              </button>
            </div>

            {/* Push Notifications */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#F8FAFC', borderRadius: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>🔔 Push Notifications</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Browser notifications for streak reminders & league updates</div>
              </div>
              <button onClick={handlePushPermission} disabled={pushGranted || pushLoading}
                style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: pushGranted ? '#F0FDF4' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: pushGranted ? '#16A34A' : '#fff', fontSize: 12, fontWeight: 800, cursor: pushGranted ? 'default' : 'pointer', fontFamily: "'Nunito',sans-serif", flexShrink: 0 }}>
                {pushLoading ? '…' : pushGranted ? '✓ Enabled' : 'Enable'}
              </button>
            </div>

            {/* Telegram */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#F8FAFC', borderRadius: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>🤖 Telegram Bot</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                  {(profile as any)?.telegramConnected
                    ? '✅ Connected — receiving notifications'
                    : 'Get reminders via Telegram — works on mobile & desktop'}
                </div>
              </div>
              {(profile as any)?.telegramConnected ? (
                <span style={{ fontSize: 11, background: '#F0FDF4', color: '#16A34A', borderRadius: 8, padding: '4px 10px', fontWeight: 800 }}>Connected ✓</span>
              ) : (
                <a
                  href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'LinguaAIBot'}?start=${user?.uid}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ padding: '8px 16px', borderRadius: 12, background: '#229ED9', color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none', flexShrink: 0, fontFamily: "'Nunito',sans-serif" }}>
                  Connect →
                </a>
              )}
            </div>

            {/* Info box */}
            <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '14px 16px', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', marginBottom: 4 }}>📬 What notifications will you receive?</div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.7 }}>
                • <strong>Daily Review</strong> — 5 words due for review each morning<br />
                • <strong>Streak Warning</strong> — If you haven't studied by 8 PM<br />
                • <strong>League Updates</strong> — Weekly promotion/demotion results<br />
                • No spam. Unsubscribe anytime.
              </div>
            </div>
          </div>
        )}

        {/* ── DANGER TAB ── */}
        {tab === 'danger' && (
          <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #FEE2E2', padding: '28px' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#DC2626', marginBottom: 8 }}>⚠️ Danger Zone</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
              Deleting your account is permanent and cannot be undone. All your XP, streak, and progress will be lost forever.
            </div>

            {!showDeleteConfirm ? (
              <button className="p-btn-red" onClick={() => setShowDeleteConfirm(true)}>
                Delete My Account
              </button>
            ) : (
              <div style={{ background: '#FEF2F2', borderRadius: 16, padding: '20px', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626', marginBottom: 12 }}>
                  Are you sure? This cannot be undone.
                </div>
                {!isGoogle && (
                  <div style={fld}>
                    <label style={lbl}>Enter your password to confirm</label>
                    <input className="p-input" type="password" value={deletePw} onChange={e => setDeletePw(e.target.value)} placeholder="Your password" />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button onClick={() => setShowDeleteConfirm(false)}
                    style={{ padding: '12px 20px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", color: '#374151' }}>
                    Cancel
                  </button>
                  <button className="p-btn-red" onClick={handleDeleteAccount} disabled={saving}>
                    {saving ? 'Deleting…' : 'Yes, Delete Forever'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const fld: React.CSSProperties = { marginBottom: 18 };
const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 6, letterSpacing: 0.3 };
