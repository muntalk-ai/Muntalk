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

      {/* 메인 로고 */}
      <img src="/logo.png" style={styles.megaLogoImg} alt="muntalk" />
      
      {/* 메인 타이틀 */}
      <h1 style={styles.subTitle}>
        <span style={styles.highlight}>Meet +150 AI tutors </span>
        <br />
        <span style={styles.highlight}></span>
      </h1>

      

      

      {/* 액션 버튼 영역 */}
      <div style={styles.actionArea}>
        <button onClick={onStart} style={styles.compactBtn}>
          🚀 START FREE SESSION
        </button>
        <p style={styles.hintText}>Upgrade for unlimited access $8.88/mo</p>
      </div>

      {/* 결제 로고 */}
      <div style={styles.cardLogos}>
      
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
    display: 'flex',
    gap: '10px'
  },
  loginLink: {
    padding: '8px 16px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: '#7dd0de',
    border: '2px solid #7dd0de',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  signupBtn: {
    padding: '8px 16px',
    borderRadius: '12px',
    backgroundColor: '#7dd0de',
    color: '#fff',
    border: '2px solid #7dd0de',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  megaLogoImg: { 
    width: '280px', 
    marginBottom: '10px' 
  },
  subTitle: {
    fontSize: '26px',
    color: '#1f1f1f',
    fontWeight: '900',
    lineHeight: '1.2',
    marginBottom: '10px',
    wordBreak: 'keep-all'
  },
  highlight: {
    color: '#1877F2',
    fontSize: '24px',
    fontWeight: '800',
    display: 'block',
    marginTop: '5px'
  },
  description: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '25px',
    lineHeight: '1.5',
    fontWeight: '500'
  },
  previewBox: {
    backgroundColor: '#f8f9fa',
    padding: '15px 25px',
    borderRadius: '20px',
    marginBottom: '35px',
    border: '1px solid #eee',
    fontSize: '13px',
    textAlign: 'left',
    color: '#444'
  },
  previewItem: {
    margin: '5px 0',
    fontWeight: '600'
  },
  actionArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  compactBtn: { 
    padding: '18px 60px', 
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
    fontSize: '12px',
    color: '#afafaf',
    fontWeight: '600'
  },
  cardLogos: {
    marginTop: '30px',
    fontSize: '10px',
    color: '#ddd',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  }
}; // ✅ 여기서 닫는 중괄호가 빠져있던 것을 수정했습니다.