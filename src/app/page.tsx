'use client';

import React, { useState, useEffect } from 'react';
// 1. 경로를 src/lib/firebase를 가리키도록 수정 (../ 사용)
import { auth } from '../lib/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// 2. 컴포넌트들도 src/components에 있다면 ../ 를 붙여야 합니다.
import Home from '../components/Home';
import LangSelect from '../components/LangSelect';
import LevelSelect from '../components/LevelSelect';
import RoleSelect from '../components/RoleSelect';
import TutorSelect from '../components/TutorSelect';
import Conversation from '../components/Conversation';

// 관리자 리스트 및 초대 코드
const ALLOWED_USERS = ["muntalkofficial@gmail.com"];
const BETA_PASSWORD = "mt77"; 

export default function MuntalkMain() {
  const [isLocked, setIsLocked] = useState(true);
  const [passInput, setPassInput] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 기존 상태들
  const [step, setStep] = useState('home');
  const [selectedLangId, setSelectedLangId] = useState('en-US');
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [selectedRole, setSelectedRole] = useState('cafe');
  const [selectedTutor, setSelectedTutor] = useState(null);

  useEffect(() => {
    // auth가 정상적으로 import 되었을 때만 실행
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
    else alert("비밀번호가 올바르지 않습니다.");
  };

  if (loading) return null;

  // 1단계: 비번 잠금
  if (isLocked) {
    return (
      <div style={styles.bg}>
        <div style={styles.card}>
          <div style={styles.badge}>Private Beta</div>
          <h1 style={styles.title}>MunTalk</h1>
          <p style={styles.subtitle}>초대 코드를 입력해주세요.</p>
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

  // 2단계: 권한 체크
  if (!user || !ALLOWED_USERS.includes(user.email)) {
    return (
      <div style={styles.bg}>
        <div style={styles.card}>
          <h1 style={styles.title}>Access Restricted</h1>
          <p style={styles.subtitle}>
            {user ? `${user.email}은 권한이 없습니다.` : "승인된 계정 로그인이 필요합니다."}
          </p>
          <button onClick={() => router.push('/login')} style={styles.mainBtn}>Go to Login</button>
          {user && <button onClick={() => signOut(auth)} style={styles.linkBtn}>다른 계정 사용</button>}
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

// 스타일 생략 (이전과 동일)
const styles = {
  bg: { height: '100dvh', background: 'radial-gradient(circle at top, #F8F9FA 0%, #E9ECEF 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '-apple-system, sans-serif' },
  card: { width: '90%', maxWidth: '400px', padding: '50px 40px', backgroundColor: '#FFFFFF', borderRadius: '32px', textAlign: 'center' as const, boxShadow: '0 20px 50px rgba(0,0,0,0.01)', border: '1px solid #FFF' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#FFF5F5', color: '#FF5252', fontSize: '11px', fontWeight: '800', marginBottom: '15px' },
  title: { color: '#000', fontSize: '32px', fontWeight: '900', margin: '0 0 10px 0' },
  subtitle: { color: '#6C757D', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' },
  input: { width: '100%', padding: '15px', borderRadius: '16px', border: '1px solid #E9ECEF', backgroundColor: '#F8F9FA', color: '#000', fontSize: '16px', textAlign: 'center', outline: 'none', marginBottom: '15px' },
  mainBtn: { width: '100%', padding: '16px', backgroundColor: '#000', color: '#FFF', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  linkBtn: { marginTop: '20px', backgroundColor: 'transparent', color: '#ADB5BD', border: 'none', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer' }
};