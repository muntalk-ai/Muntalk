'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import Home from '../components/Home';
import LangSelect from '../components/LangSelect';
import LevelSelect from '../components/LevelSelect';
import RoleSelect from '../components/RoleSelect';
import TutorSelect from '../components/TutorSelect';
import Conversation from '../components/Conversation';

// 수정 후 (권한 리스트 체크 삭제)
if (!user) {
  // 로그인 안 된 상태면 로그인 페이지로
  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome</h1>
        <p style={styles.subtitle}>Please login to continue.</p>
        <button onClick={() => router.push('/login')} style={styles.mainBtn}>Go to Login</button>
      </div>
    </div>
  );
}

// 2. 초대 코드 수정 (현재 4자리: muntalk77의 뒷부분처럼 관리 가능)
const BETA_PASSWORD = "muntalk77"; 

export default function MuntalkMain() {
  const [isLocked, setIsLocked] = useState(true);
  const [passInput, setPassInput] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [step, setStep] = useState('home');
  const [selectedLangId, setSelectedLangId] = useState('en-US');
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [selectedRole, setSelectedRole] = useState('cafe');
  const [selectedTutor, setSelectedTutor] = useState(null);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleUnlock = () => {
    if (passInput === BETA_PASSWORD) setIsLocked(false);
    // 한글 알림 -> 영어로 수정
    else alert("Invalid invitation code.");
  };

  if (loading) return null;

  // 1단계: 초대 코드 입력 화면 (영문 수정)
  if (isLocked) {
    return (
      <div style={styles.bg}>
        <div style={styles.card}>
          <div style={styles.badge}>Private Beta</div>
          <h1 style={styles.title}>MunTalk</h1>
          <p style={styles.subtitle}>Please enter your invitation code.</p>
          <input 
            type="password" style={styles.input} 
            onChange={(e) => setPassInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="Invite Code"
          />
          <button onClick={handleUnlock} style={styles.mainBtn}>Unlock</button>
        </div>
      </div>
    );
  }

  // 2단계: 접근 권한 제한 화면 (영문 수정)
  if (!user || !ALLOWED_USERS.includes(user.email)) {
    return (
      <div style={styles.bg}>
        <div style={styles.card}>
          <h1 style={styles.title}>Access Restricted</h1>
          <p style={styles.subtitle}>
            {user 
              ? `Sorry, ${user.email} does not have access.` 
              : "Authorized login is required."}
          </p>
          <button onClick={() => router.push('/login')} style={styles.mainBtn}>Go to Login</button>
          {user && <button onClick={() => signOut(auth)} style={styles.linkBtn}>Use another account</button>}
        </div>
      </div>
    );
  }

  // 3단계: 메인 앱 실행
  return (
    <main>
      {step === 'home' && <Home onStart={() => setStep('lang')} />}
      {step === 'lang' && <LangSelect onNext={(id) => { setSelectedLangId(id); setStep('level'); }} />}
      {step === 'level' && <LevelSelect onNext={(lv) => { setSelectedLevel(lv); setStep('role'); }} />}
      {step === 'role' && <RoleSelect onNext={(r) => { setSelectedRole(r); setStep('tutor'); }} />}
      {step === 'tutor' && (
        <TutorSelect 
          selectedLangId={selectedLangId} 
          onNext={(t) => { setSelectedTutor(t); setStep('talk'); }} 
          onBack={() => setStep('role')} 
        />
      )}
      {step === 'talk' && (
        <Conversation 
          selectedLangId={selectedLangId}
          selectedTutor={selectedTutor}
          selectedLevel={selectedLevel}
          selectedRole={selectedRole}
          onBack={() => setStep('tutor')}
        />
      )}
    </main>
  );
}

const styles = {
  bg: { height: '100dvh', background: 'radial-gradient(circle at top, #F8F9FA 0%, #E9ECEF 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '-apple-system, sans-serif' },
  card: { width: '90%', maxWidth: '400px', padding: '50px 40px', backgroundColor: '#FFFFFF', borderRadius: '32px', textAlign: 'center' as const, boxShadow: '0 20px 50px rgba(0,0,0,0.01)', border: '1px solid #FFF' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#FFF5F5', color: '#FF5252', fontSize: '11px', fontWeight: '800', marginBottom: '15px' },
  title: { color: '#000', fontSize: '32px', fontWeight: '900', margin: '0 0 10px 0' },
  subtitle: { color: '#6C757D', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' },
  input: { width: '100%', padding: '15px', borderRadius: '16px', border: '1px solid #E9ECEF', backgroundColor: '#F8F9FA', color: '#000', fontSize: '16px', textAlign: 'center' as const, outline: 'none', marginBottom: '15px' },
  mainBtn: { width: '100%', padding: '16px', backgroundColor: '#000', color: '#FFF', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  linkBtn: { marginTop: '20px', backgroundColor: 'transparent', color: '#ADB5BD', border: 'none', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer' }
};