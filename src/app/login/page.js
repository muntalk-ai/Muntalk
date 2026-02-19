'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // 리다이렉트 로그인 결과 처리
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, "users", user.uid), {
              uid: user.uid,
              email: user.email,
              name: user.displayName,
              role: 'user',
              createdAt: new Date().toISOString()
            });
          }
          router.push('/');
        }
      } catch (error) {
        console.error("Redirect Login Error:", error);
      }
    };
    checkRedirect();
  }, [router]);

  // Google 로그인 (계정 선택창 강제 활성화)
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      alert("Google Login Error: " + error.message);
    }
  };

  const handleEmailLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/'); 
    } catch (error) {
      alert("Login Failed: " + error.message);
    }
  };

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Log in to continue your language learning.</p>
        
        <button onClick={handleGoogleLogin} style={styles.googleBtn}>
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            style={{ width: '18px', marginRight: '10px' }} 
          />
          Continue with Google
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>

        <div style={styles.inputGroup}>
          <input 
            type="email" 
            placeholder="Email Address" 
            style={styles.input} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            style={styles.input} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>

        <button onClick={handleEmailLogin} style={styles.mainBtn}>Log In</button>
        
        <p style={styles.footerText}>
          Don't have an account?{' '}
          <Link href="/signup" style={styles.link}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  bg: { height: '100dvh', backgroundColor: '#F0F2F5', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' },
  card: { width: '90%', maxWidth: '400px', padding: '40px 30px', backgroundColor: '#FFFFFF', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  title: { color: '#1C1E21', fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' },
  subtitle: { color: '#606770', fontSize: '15px', marginBottom: '24px' },
  googleBtn: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #DADCE0', backgroundColor: '#FFF', color: '#3C4043', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', borderStyle: 'solid' },
  divider: { position: 'relative', height: '1px', backgroundColor: '#DADCE0', margin: '20px 0', width: '100%' },
  dividerText: { position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#FFF', padding: '0 10px', color: '#8D949E', fontSize: '13px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' },
  input: { width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #DDDFE2', backgroundColor: '#F5F6F7', color: '#1C1E21', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  mainBtn: { width: '100%', padding: '14px', backgroundColor: '#1877F2', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '17px', cursor: 'pointer' },
  footerText: { color: '#606770', marginTop: '20px', fontSize: '14px' },
  link: { color: '#1877F2', fontWeight: '600', textDecoration: 'none' }
};