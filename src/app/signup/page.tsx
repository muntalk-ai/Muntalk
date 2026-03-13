'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { createUserProfile } from '@/lib/userProfile';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');

  // 이미 로그인된 상태면 바로 메인으로
  useEffect(() => {
    if (!authLoading && user) router.replace('/lingua');
  }, [user, authLoading]);
  const [emailLoading,  setEmailLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  const friendlyError = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use': return 'An account with this email already exists.';
      case 'auth/weak-password':        return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':        return 'Please enter a valid email address.';
      default: return '';
    }
  };

  // 리디렉션 복귀 처리
  useEffect(() => {
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) router.replace('/lingua');
      })
      .catch((e: any) => {
        const msg = friendlyError(e.code);
        if (msg) setError(msg);
        else if (e.code && e.code !== 'auth/no-current-user') {
          console.error('Redirect error:', e.code, e.message);
        }
      });
  }, []);

  const validate = () => {
    if (!name.trim())        { setError('Please enter your name.'); return false; }
    if (!email.includes('@'))  { setError('Please enter a valid email.'); return false; }
    if (password.length < 6)   { setError('Password must be at least 6 characters.'); return false; }
    if (password !== confirm)  { setError('Passwords do not match.'); return false; }
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setEmailLoading(true); setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await createUserProfile(cred.user.uid, email, name, '');
      router.replace('/lingua');
    } catch (e: any) {
      setError(friendlyError(e.code) || 'Sign up failed. Please try again.');
    } finally { setEmailLoading(false); }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      // Popup 방식 — 즉시 로그인 후 바로 이동
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) router.replace('/lingua');
    } catch (e: any) {
      if (e.code === 'auth/popup-blocked') {
        try { await signInWithRedirect(auth, googleProvider); }
        catch { setError('Google sign-in failed. Please try again.'); setGoogleLoading(false); }
      } else if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        setGoogleLoading(false);
      } else {
        setError(friendlyError(e.code) || 'Google sign-in failed.');
        setGoogleLoading(false);
      }
    }
  };

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const pwColors  = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
  const pwLabels  = ['', 'Too short', 'Fair', 'Good', 'Strong 💪'];

  return (
    <div style={styles.page}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
* { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-input { width:100%; padding:14px 16px; border:2px solid #E5E7EB; border-radius:12px; font-size:15px; font-family:'Nunito',sans-serif; outline:none; transition:border .15s; background:#fff; color:#0F172A; }
        .auth-input:focus { border-color:#6366F1; }
        .auth-btn-primary { width:100%; padding:14px; border:none; border-radius:14px; background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff; font-size:15px; font-weight:800; font-family:'Nunito',sans-serif; cursor:pointer; transition:opacity .15s; }
        .auth-btn-primary:hover:not(:disabled) { opacity:.88; }
        .auth-btn-primary:disabled { opacity:.5; cursor:default; }
        .auth-btn-google { width:100%; padding:13px; border:2px solid #E5E7EB; border-radius:14px; background:#fff; color:#0F172A; font-size:15px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:background .15s,box-shadow .15s; }
        .auth-btn-google:hover:not(:disabled) { background:#F8FAFC; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .auth-btn-google:disabled { opacity:.55; cursor:default; }
        .auth-link { background:none; border:none; color:#6366F1; font-weight:700; font-size:13px; cursor:pointer; font-family:'Nunito',sans-serif; padding:0; }
        .auth-link:hover { text-decoration:underline; }
      ` }} />

      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌍</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: 0 }}>Create your account</h1>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '6px 0 0', fontWeight: 600 }}>Start learning a new language today — it's free</p>
        </div>

        {/* -- Google -- */}
        <button className="auth-btn-google" onClick={handleGoogle} disabled={googleLoading}>
          {googleLoading ? (
            <>
              <span style={{ width: 20, height: 20, border: '2.5px solid #E5E7EB', borderTopColor: '#6366F1', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
              Redirecting to Google…
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.7 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.7 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.6 35.5 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C36.9 38.6 44 33 44 24c0-1.3-.1-2.6-.4-3.9z"/>
              </svg>
              Sign up with Google
            </>
          )}
        </button>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or create account with email</span>
          <div style={styles.dividerLine} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Your Name</label>
          <input className="auth-input" type="text" placeholder="Jane Smith"
            value={name} onChange={e => { setName(e.target.value); setError(''); }} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input className="auth-input" type="email" placeholder="you@example.com"
            value={email} onChange={e => { setEmail(e.target.value); setError(''); }} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <div style={{ position: 'relative' }}>
            <input className="auth-input" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
              value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              style={{ paddingRight: 48 }} />
            <button onClick={() => setShowPw(p => !p)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94A3B8' }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {password.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwStrength ? pwColors[pwStrength] : '#E5E7EB', transition: 'background .3s' }} />
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: pwColors[pwStrength], marginTop: 4 }}>{pwLabels[pwStrength]}</div>
            </div>
          )}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Confirm Password</label>
          <input className="auth-input" type={showPw ? 'text' : 'password'} placeholder="Repeat password"
            value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSignup()}
            style={{ borderColor: confirm && confirm !== password ? '#FECACA' : undefined }} />
          {confirm && confirm !== password && (
            <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 700, marginTop: 4 }}>Passwords don't match</div>
          )}
        </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}

        <button className="auth-btn-primary" onClick={handleSignup} disabled={emailLoading || !agreed}>
          {emailLoading ? 'Creating account…' : 'Create Account 🚀'}
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14, padding: '12px 16px', background: '#F8FAFC', borderRadius: 12, border: agreed ? '1.5px solid #6366F1' : '1.5px solid #E2E8F0' }}>
          <input
            type="checkbox"
            id="agree-terms"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 2, width: 16, height: 16, cursor: 'pointer', accentColor: '#6366F1', flexShrink: 0 }}
          />
          <label htmlFor="agree-terms" style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
            I agree to the{' '}
            <a href="/terms" target="_blank" style={{ color: '#6366F1', fontWeight: 700 }}>Terms of Service</a>,{' '}
            <a href="/privacy" target="_blank" style={{ color: '#6366F1', fontWeight: 700 }}>Privacy Policy</a>, and{' '}
            <a href="/refund" target="_blank" style={{ color: '#6366F1', fontWeight: 700 }}>Refund Policy</a>.
            I confirm I am at least 13 years of age.
          </label>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#64748B', fontWeight: 600 }}>
          Already have an account?{' '}
          <button className="auth-link" style={{ fontSize: 14 }} onClick={() => router.push('/login')}>Sign in</button>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F1F5FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif", padding: '24px 16px', position: 'relative', overflow: 'hidden' },
  blob1: { position: 'fixed', top: -100, left: -100, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, #C7D2FE 0%, transparent 70%)', pointerEvents: 'none' },
  blob2: { position: 'fixed', bottom: -80, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, #DDD6FE 0%, transparent 70%)', pointerEvents: 'none' },
  card: { background: '#fff', borderRadius: 28, padding: '36px 36px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(99,102,241,0.12)', position: 'relative', zIndex: 1 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 6, letterSpacing: 0.3 },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' },
  dividerLine: { flex: 1, height: 1, background: '#E5E7EB' },
  dividerText: { fontSize: 12, color: '#94A3B8', fontWeight: 700, whiteSpace: 'nowrap' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 700, marginBottom: 12 },
};
