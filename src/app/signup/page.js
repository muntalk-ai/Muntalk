'use client';

import React, { useState } from 'react';
import { auth, db } from '../../lib/firebase'; 
import { 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); 
  const router = useRouter();

  // 1. 구글 연동 가입
  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          phone: '', 
          role: 'user',
          createdAt: new Date().toISOString()
        });
      }
      router.push('/');
    } catch (error) {
      alert("Google Sign-in Error: " + error.message);
    }
  };

  // 2. 이메일 가입
  const handleEmailSignup = async () => {
    if (!email || !password || !name) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: name,
        phone: phone, 
        role: 'user',
        createdAt: new Date().toISOString()
      });

      alert("가입을 환영합니다!");
      router.push('/login'); 
    } catch (error) {
      alert("에러: " + error.message);
    }
  };

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Join MunTalk and start learning.</p>
        
        <button onClick={handleGoogleSignup} style={styles.googleBtn}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '18px', marginRight: '12px'}} />
          Continue with Google
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerText}>or email signup</span>
        </div>

        <div style={styles.inputGroup}>
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Full Name</label>
            <input type="text" placeholder="" style={styles.input} onChange={(e) => setName(e.target.value)} />
          </div>

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Email Address</label>
            <input type="email" placeholder="" style={styles.input} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Phone Number (Optional)</label>
            <input type="tel" placeholder="" style={styles.input} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Password</label>
            <input type="password" placeholder="" style={styles.input} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Confirm Password</label>
            <input type="password" placeholder="" style={styles.input} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>

        <button onClick={handleEmailSignup} style={styles.mainBtn}>Create Account</button>
        
        <p style={styles.footerText}>
          Already have an account?{' '}
          <Link href="/login" style={styles.link}>Log In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  bg: { 
    height: '100dvh', 
    backgroundColor: '#F8F9FA', // 밝은 연회색 배경
    display: 'flex', justifyContent: 'center', alignItems: 'center', 
    fontFamily: '-apple-system, sans-serif' 
  },
  card: { 
    width: '90%', maxWidth: '440px', padding: '40px', 
    backgroundColor: '#FFFFFF', // 순백색 카드
    borderRadius: '24px', textAlign: 'center', 
    border: '1px solid #E9ECEF',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    overflowY: 'auto',
    maxHeight: '90dvh'
  },
  title: { color: '#212529', fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  subtitle: { color: '#6C757D', fontSize: '15px', marginBottom: '32px' },
  googleBtn: { 
    width: '100%', padding: '14px', borderRadius: '12px', 
    border: '1px solid #DEE2E6', 
    backgroundColor: '#FFF', color: '#495057', 
    fontWeight: '600', cursor: 'pointer', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
  },
  divider: { position: 'relative', height: '1px', backgroundColor: '#EDF2F7', margin: '24px 0' },
  dividerText: { 
    position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', 
    backgroundColor: '#FFF', padding: '0 15px', color: '#ADB5BD', fontSize: '12px' 
  },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '32px', textAlign: 'left' },
  inputWrapper: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#495057', fontSize: '13px', fontWeight: '600', marginLeft: '4px' },
  input: { 
    width: '100%', padding: '14px 16px', borderRadius: '12px', 
    border: '1px solid #CED4DA', 
    backgroundColor: '#FFF', color: '#212529', 
    fontSize: '15px', outline: 'none'
  },
  mainBtn: { 
    width: '100%', padding: '16px', backgroundColor: '#000', // 검정색 버튼으로 포인트
    color: '#FFF', border: 'none', borderRadius: '12px', 
    fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
  },
  footerText: { color: '#6C757D', marginTop: '24px', fontSize: '14px' },
  link: { color: '#000', fontWeight: '700', textDecoration: 'none' }
};