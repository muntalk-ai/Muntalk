'use client';
import { useRouter } from 'next/navigation';

export default function Home({ onStart }: { onStart: () => void }) {
  const router = useRouter();

  return (
    <div style={styles.homeFull}>
      {/* 우측 상단 로그인 & 회원가입 버튼 영역 */}
      <div style={styles.topNav}>
        <button onClick={() => router.push('/login')} style={styles.loginLink}>
          Log In
        </button>
        <button onClick={() => router.push('/login')} style={styles.signupBtn}>
          Sign Up
        </button>
      </div>

      <img src="/logo.png" style={styles.megaLogoImg} alt="muntalk" />
      
      <h1 style={styles.subTitle}>
        Learn languages <br />
        <span style={styles.highlight}>with +150 AI tutors</span>
      </h1>

      <div style={styles.actionArea}>
        <button onClick={onStart} style={styles.compactBtn}>GET STARTED</button>
        <p style={styles.hintText}></p>
      </div>
    </div>
  );
}

const styles: any = {
  homeFull: { 
    height: '100dvh', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#fff',
    fontFamily: 'sans-serif',
    textAlign: 'center',
    padding: '0 20px',
    position: 'relative'
  },
  topNav: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex', // 버튼 두 개를 나란히 배치
    gap: '10px'
  },
  loginLink: {
    padding: '8px 16px',
    borderRadius: '12px',
    backgroundColor: 'transparent', // 배경 투명하게 변경
    color: '#7dd0de',
    border: '2px solid #7dd0de', // 테두리 강조
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  signupBtn: {
    padding: '8px 16px',
    borderRadius: '12px',
    backgroundColor: '#7dd0de', // 배경색 적용
    color: '#fff',
    border: '2px solid #7dd0de',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  megaLogoImg: { 
    width: '300px', 
    marginBottom: '20px' 
  },
  subTitle: {
    fontSize: '22px',
    color: '#4b4b4b',
    fontWeight: '600',
    lineHeight: '1.4',
    marginBottom: '40px',
    wordBreak: 'keep-all'
  },
  highlight: {
    color: '#58CC02',
    fontSize: '18px',
    display: 'block',
    marginTop: '5px'
  },
  actionArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px'
  },
  compactBtn: { 
    padding: '18px 80px', 
    borderRadius: '100px', 
    backgroundColor: '#58CC02', 
    color: '#fff', 
    border: 'none', 
    fontSize: '18px',
    fontWeight: '800', 
    cursor: 'pointer', 
    boxShadow: '0 5px 0 #46a302',
  },
  hintText: {
    fontSize: '13px',
    color: '#afafaf',
    fontWeight: '500'
  }
};