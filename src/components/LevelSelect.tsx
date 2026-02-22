'use client';

const LEVELS = [
  { id: 'beginner', title: 'Beginner', desc: 'Basic vocabulary and short sentences' },
  { id: 'intermediate', title: 'Intermediate', desc: 'Daily conversations and general grammar' },
  { id: 'advanced', title: 'Advanced', desc: 'Business and professional discussions' }
];

export default function LevelSelect({ onNext }: { onNext: (level: string) => void }) {
  return (
    <div style={styles.pageContainer}>
      {/* 최대한 간단한 영어 문구 추가 */}
      <h2 style={styles.stepTitle}>Select your level</h2>
      
      <div style={styles.list}>
        {LEVELS.map(lv => (
          <button 
            key={lv.id} 
            onClick={() => onNext(lv.id)} 
            style={styles.lvBtn}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#58CC02')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#eee')}
          >
            <strong style={styles.lvTitle}>{lv.title}</strong>
            <span style={styles.lvDesc}>{lv.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: any = {
  pageContainer: { 
    minHeight: '100dvh', 
    padding: '40px 20px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    fontFamily: 'sans-serif'
  },
  stepTitle: { 
    fontSize: '24px', 
    fontWeight: 'bold', 
    marginBottom: '40px',
    color: '#333'
  },
  list: { 
    width: '100%', 
    maxWidth: '400px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '15px' 
  },
  lvBtn: { 
    padding: '20px', 
    borderRadius: '15px', 
    border: '2px solid #eee', 
    backgroundColor: '#fff', 
    cursor: 'pointer', 
    textAlign: 'left', 
    transition: '0.2s',
    outline: 'none'
  },
  lvTitle: { 
    display: 'block', 
    fontSize: '18px', 
    color: '#58CC02', 
    marginBottom: '5px' 
  },
  lvDesc: { 
    fontSize: '13px', 
    color: '#777' 
  }
};