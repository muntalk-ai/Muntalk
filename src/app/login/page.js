'use client';

import React, { useState, useEffect } from 'react'; // useEffect 추가
import { auth, db } from '../../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithRedirect, // Redirect 방식으로 변경
  getRedirectResult    // 결과 확인을 위해 추가
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // 페이지 로드 시 리다이렉트 로그인 결과 처리
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          // Firestore 유저 저장 로직
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

  // 1. Google 로그인 (Redirect 방식)
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // 팝업 대신 리다이렉트 실행
      await signInWithRedirect(auth, provider);
    } catch (error) {
      alert("Google Login Error: " + error.message);
    }
  };

  // 2. 일반 이메일 로그인 (기존과 동일)
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
  divider: { position: 'relative' as const, height: '1px', backgroundColor: '#DADCE0', margin: '20px 0', width: '100%' },
  dividerText: { position: 'absolute' as const, top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#FFF', padding: '0 10px', color: '#8D949E', fontSize: '13px' },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '12px', marginBottom: '20px' },
  input: { width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #DDDFE2', backgroundColor: '#F5F6F7', color: '#1C1E21', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const },
  mainBtn: { width: '100%', padding: '14px', backgroundColor: '#1877F2', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, fontSize: '17px', cursor: 'pointer' },
  footerText: { color: '#606770', marginTop: '20px', fontSize: '14px' },
  link: { color: '#1877F2', fontWeight: '600', textDecoration: 'none' }
};