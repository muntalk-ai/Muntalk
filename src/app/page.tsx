'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// 컴포넌트 임포트 (경로를 사장님 환경에 맞게 확인해주세요)
import Home from '../components/Home';
import LangSelect from '../components/LangSelect'; // 사장님의 국기 리스트 그대로 사용
import RoleSelect from '../components/RoleSelect'; // 통합된 선택창
import TutorSelect from '../components/TutorSelect';
import Conversation from '../components/Conversation';

const BETA_PASSWORD = "muntalk77"; 

export default function MuntalkMain() {
  const [isLocked, setIsLocked] = useState(true);
  const [passInput, setPassInput] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const router = useRouter();

  // 대화 설정 상태
  const [step, setStep] = useState('home'); 
  const [selectedLangId, setSelectedLangId] = useState('en-US');
  const [selectedLevel, setSelectedLevel] = useState('Basic');
  const [selectedRole, setSelectedRole] = useState(''); // 주제(Topic)가 저장됨

  const [selectedTutor, setSelectedTutor] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 무료체험 타이머 (기존 로직 유지)
  useEffect(() => {
    if (step === 'talk') {
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
    <main style={{ position: 'relative', backgroundColor: '#fff', minHeight: '100dvh' }}>
      
      {/* 💳 유료 전환 팝업 */}
      {showPaywall && (
        <div style={styles.overlay}>
          <div style={styles.payCard}>
            <span style={{ fontSize: '40px' }}>⏳</span>
            <h2 style={styles.payTitle}>Free Trial Ended</h2>
            <p style={styles.paySubtitle}>You've reached your free limit. Upgrade now to continue!</p>
            <div style={styles.priceContainer}>
              <div style={styles.priceBox}>
                <p style={styles.planName}>Monthly</p>
                <p style={styles.priceText}>US $8.88</p>
                <button onClick={() => window.location.href='https://buy.stripe.com/...'} style={styles.payBtn}>Start</button>
              </div>
              <div style={{ ...styles.priceBox, borderColor: '#1877F2', backgroundColor: '#F0F7FF' }}>
                <div style={styles.bestValue}>BEST VALUE</div>
                <p style={styles.planName}>6-Months</p>
                <p style={styles.priceText}>US $38.88</p>
                <button onClick={() => window.location.href='https://buy.stripe.com/...'} style={{ ...styles.payBtn, backgroundColor: '#1877F2' }}>Get 27% Off</button>
              </div>
            </div>
            <button onClick={() => setShowPaywall(false)} style={styles.closeBtn}>Maybe later</button>
          </div>
        </div>
      )}

      {/* 🚀 단계별 화면 전환 (여기가 핵심입니다) */}
      
{/* 1단계: 홈 (시작 버튼 클릭 시 lang으로) */}
      {step === 'home' && <Home onStart={() => setStep('lang')} />}

      {/* 2단계: 언어 선택 (사장님이 주신 국기 리스트 화면) */}
      {step === 'lang' && (
        <LangSelect onNext={(id) => { 
          setSelectedLangId(id); 
          setStep('select'); // 언어 선택 후 레벨/주제 통합창으로 이동
        }} />
      )}

      {/* 3단계: 레벨 & 주제 통합 선택 */}
      {step === 'select' && (
        <RoleSelect 
          onNext={(lv: string, topic: string) => { 
            setSelectedLevel(lv); 
            setSelectedRole(topic); 
            setStep('tutor'); 
          }} 
        />
      )}

      {/* 4단계: 튜터 선택 */}
      {step === 'tutor' && (
        <TutorSelect 
          selectedLangId={selectedLangId} 
          onNext={(t: any) => { setSelectedTutor(t); setStep('talk'); }} 
          onBack={() => setStep('select')} 
        />
      )}

      {/* 5단계: 대화 시작 */}
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

// 스타일 시트는 사장님 기존 코드와 흰색 테마를 섞었습니다.
const styles: any = {
  bg: { height: '100dvh', background: '#F8F9FA', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', maxWidth: '400px', padding: '50px 40px', backgroundColor: '#FFFFFF', borderRadius: '32px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#FFF5F5', color: '#FF5252', fontSize: '11px', fontWeight: '800', marginBottom: '15px' },
  title: { color: '#000', fontSize: '32px', fontWeight: '900', margin: '0 0 10px 0' },
  subtitle: { color: '#6C757D', fontSize: '15px', marginBottom: '30px' },
  input: { width: '100%', padding: '15px', borderRadius: '16px', border: '1px solid #E9ECEF', backgroundColor: '#F8F9FA', fontSize: '16px', textAlign: 'center', marginBottom: '15px', outline: 'none' },
  mainBtn: { width: '100%', padding: '16px', backgroundColor: '#000', color: '#FFF', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' },
  payCard: { width: '90%', maxWidth: '500px', backgroundColor: '#FFF', borderRadius: '32px', padding: '40px', textAlign: 'center' },
  payTitle: { fontSize: '24px', fontWeight: '900', margin: '15px 0 10px 0', color: '#000' },
  paySubtitle: { fontSize: '15px', color: '#666', marginBottom: '30px', lineHeight: '1.5' },
  priceContainer: { display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' },
  priceBox: { flex: 1, minWidth: '150px', padding: '20px', border: '2px solid #EEE', borderRadius: '20px', position: 'relative' },
  bestValue: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1877F2', color: '#FFF', padding: '2px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' },
  planName: { fontSize: '14px', fontWeight: 'bold', color: '#888', marginBottom: '5px' },
  priceText: { fontSize: '20px', fontWeight: '900', color: '#000', marginBottom: '15px' },
  payBtn: { width: '100%', padding: '12px', backgroundColor: '#000', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  closeBtn: { marginTop: '15px', backgroundColor: 'transparent', border: 'none', color: '#AAA', cursor: 'pointer', textDecoration: 'underline' }
};