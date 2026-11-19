'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import BackButton from '@/components/BackButton';

// Dedicated password-reset form (QA 11-16 guest batch 1: MunTalk D15 /
// Muntuz D16). Previously the reset ran inline on /login, reusing the
// sign-in button state so it read "Signing in…" while sending, and
// asserted "✅ Password reset email sent!" even for unknown addresses.
// This page has its own form, immediate "Sending…" feedback, and neutral
// copy that never discloses whether the address has an account (D16/D17).
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) { setError('Enter your email address.'); return; }
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }
    // D20: immediate feedback before the (sometimes slow) mail call.
    setSending(true); setError('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (e: any) {
      // Non-disclosure: an unknown address gets the same neutral success
      // as a real one — never reveal whether the account exists.
      if (e.code === 'auth/user-not-found') { setSent(true); return; }
      if (e.code === 'auth/invalid-email') { setError('Please enter a valid email address.'); return; }
      setError('Failed to send reset email. Please try again.');
    } finally { setSending(false); }
  };

  return (
    <div style={styles.page}>
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>
        <BackButton fallback="/login" />
      </div>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
* { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-input { width:100%; padding:14px 16px; border:2px solid #E5E7EB; border-radius:12px; font-size:15px; font-family:'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif; outline:none; transition:border .15s; background:#fff; color:#0F172A; }
        .auth-input:focus { border-color:#6366F1; }
        .auth-btn-primary { width:100%; padding:14px; border:none; border-radius:14px; background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff; font-size:15px; font-weight:800; font-family:'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif; cursor:pointer; transition:opacity .15s; }
        .auth-btn-primary:hover:not(:disabled) { opacity:.88; }
        .auth-btn-primary:disabled { opacity:.5; cursor:default; }
        .auth-link { background:none; border:none; color:#6366F1; font-weight:700; font-size:13px; cursor:pointer; font-family:'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif; padding:0; }
        .auth-link:hover { text-decoration:underline; }
      ` }} />

      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: 0 }}>Reset your password</h1>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '6px 0 0', fontWeight: 600 }}>Enter your email and we&apos;ll send you a reset link</p>
        </div>

        {sent ? (
          <>
            <div style={styles.success}>
              If an account exists for <strong>{email}</strong>, a reset link has been sent.
              Check your inbox (and spam folder).
            </div>
            <button className="auth-btn-primary" onClick={() => router.push('/login')} style={{ marginTop: 8 }}>
              Back to sign in →
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#64748B', fontWeight: 600 }}>
              Didn&apos;t get it?{' '}
              <button className="auth-link" onClick={() => setSent(false)}>Send again</button>
            </p>
          </>
        ) : (
          <>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input className="auth-input" type="email" placeholder="you@example.com"
                value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSend()} />
            </div>

            {error && <div style={styles.error}>{'⚠️ '}{error}</div>}

            <button className="auth-btn-primary" onClick={handleSend} disabled={sending} style={{ marginTop: 8 }}>
              {sending ? 'Sending…' : 'Send reset link →'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748B', fontWeight: 600 }}>
              Remember your password?{' '}
              <button className="auth-link" style={{ fontSize: 14 }} onClick={() => router.push('/login')}>Back to sign in</button>
            </p>
            <p style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: '#64748B', fontWeight: 600 }}>
              No account yet?{' '}
              <button className="auth-link" style={{ fontSize: 14 }} onClick={() => router.push('/signup')}>Create one free</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F1F5FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif", padding: '24px 16px', position: 'relative', overflow: 'hidden' },
  blob1: { position: 'fixed', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #C7D2FE 0%, transparent 70%)', pointerEvents: 'none' },
  blob2: { position: 'fixed', bottom: -100, left: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, #DDD6FE 0%, transparent 70%)', pointerEvents: 'none' },
  card: { background: '#fff', borderRadius: 28, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(99,102,241,0.12)', position: 'relative', zIndex: 1 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 6, letterSpacing: 0.3 },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 700, marginBottom: 12 },
  success: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#16A34A', fontWeight: 700, marginBottom: 12, lineHeight: 1.6 },
};
