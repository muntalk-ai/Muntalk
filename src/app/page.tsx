'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import Home from '../components/Home';
import LangSelect from '../components/LangSelect';
import LevelSelect from '../components/LevelSelect';
import RoleSelect from '../components/RoleSelect';
import TutorSelect from '../components/TutorSelect';
import Conversation from '../components/Conversation';

const BETA_PASSWORD = "muntalk77"; 

export default function MuntalkMain() {
  const [isLocked, setIsLocked] = useState(true);
  const [passInput, setPassInput] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const router = useRouter();

  // 대화 관련 상태
  const [step, setStep] = useState('home');
  const [selectedLangId, setSelectedLangId] = useState('en-US');
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [selectedRole, setSelectedRole] = useState('cafe');
  const [selectedTutor, setSelectedTutor] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🕒 무료체험 타이머 로직
  useEffect(() => {
    if (step === 'talk') {
      // 로그인 전 3분(180초), 로그인 후 7분(420초)
      const limitSeconds = user ? 420 : 180; 
      
      const timer = setTimeout(() => {
        setShowPaywall(true);
      }, limitSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [step, user]);

  const handleUnlock = () => {
    if (passInput === BETA_PASSWORD) setIsLocked(false);
    else alert("Invalid invitation code.");
  };

  if (loading) return null;

  // 초대코드 잠금 화면
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

  return (
    <main style={{ position: 'relative' }}>
      {/* 💳 유료 전환 팝업 (Paywall) */}
      {showPaywall && (
        <div style={styles.overlay}>
          <div style={styles.payCard}>
            <span style={{ fontSize: '40px' }}>⏳</span>
            <h2 style={styles.payTitle}>Free Trial Ended</h2>
            <p style={styles.paySubtitle}>You've reached your free limit. Upgrade now to continue your journey to fluency!</p>
            
            <div style={styles.priceContainer}>
              <div style={styles.priceBox}>
                <p style={styles.planName}>Monthly</p>
                <p style={styles.priceText}>US $8.88</p>
                <button onClick={() => window.location.href='https://buy.stripe.com/5kQ14pcrT2QA9E24Yv2ZO01'} style={styles.payBtn}>Start Now</button>
              </div>
              <div style={{ ...styles.priceBox, borderColor: '#1877F2', backgroundColor: '#F0F7FF' }}>
                <div style={styles.bestValue}>BEST VALUE</div>
                <p style={styles.planName}>6-Months</p>
                <p style={styles.priceText}>US $38.88</p>
                <button onClick={() => window.location.href='https://buy.stripe.com/5kQfZjbnPcrabMa3Ur2ZO00'} style={{ ...styles.payBtn, backgroundColor: '#1877F2' }}>Get 27% Off</button>
              </div>
            </div>
            <button onClick={() => setShowPaywall(false)} style={styles.closeBtn}>Maybe later</button>
          </div>
        </div>
      )}

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
  bg: { height: '100dvh', background: 'radial-gradient(circle at top, #F8F9FA 0%, #E9ECEF 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', maxWidth: '400px', padding: '50px 40px', backgroundColor: '#FFFFFF', borderRadius: '32px', textAlign: 'center' as const, boxShadow: '0 20px 50px rgba(0,0,0,0.05)' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#FFF5F5', color: '#FF5252', fontSize: '11px', fontWeight: '800', marginBottom: '15px' },
  title: { color: '#000', fontSize: '32px', fontWeight: '900', margin: '0 0 10px 0' },
  subtitle: { color: '#6C757D', fontSize: '15px', marginBottom: '30px' },
  input: { width: '100%', padding: '15px', borderRadius: '16px', border: '1px solid #E9ECEF', backgroundColor: '#F8F9FA', fontSize: '16px', textAlign: 'center' as const, marginBottom: '15px', outline: 'none' },
  mainBtn: { width: '100%', padding: '16px', backgroundColor: '#000', color: '#FFF', border: 'none', borderRadius: '16px', fontWeight: 'bold' as const, fontSize: '16px', cursor: 'pointer' },
  
  // 💳 결제 팝업 스타일
  overlay: { position: 'fixed' as const, top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' },
  payCard: { width: '90%', maxWidth: '500px', backgroundColor: '#FFF', borderRadius: '32px', padding: '40px', textAlign: 'center' as const },
  payTitle: { fontSize: '24px', fontWeight: '900', margin: '15px 0 10px 0', color: '#000' },
  paySubtitle: { fontSize: '15px', color: '#666', marginBottom: '30px', lineHeight: '1.5' },
  priceContainer: { display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' as const },
  priceBox: { flex: 1, minWidth: '150px', padding: '20px', border: '2px solid #EEE', borderRadius: '20px', position: 'relative' as const },
  bestValue: { position: 'absolute' as const, top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1877F2', color: '#FFF', padding: '2px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' },
  planName: { fontSize: '14px', fontWeight: 'bold', color: '#888', marginBottom: '5px' },
  priceText: { fontSize: '20px', fontWeight: '900', color: '#000', marginBottom: '15px' },
  payBtn: { width: '100%', padding: '12px', backgroundColor: '#000', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, cursor: 'pointer' },
  closeBtn: { marginTop: '15px', backgroundColor: 'transparent', border: 'none', color: '#AAA', cursor: 'pointer', textDecoration: 'underline' }
};