'use client';
import { useState } from 'react';

// 1. 영어로 번역된 레벨별 주제 데이터
const LEVEL_DATA: any = {
  Basic: [
    { id: 'grammar', name: 'Basic Grammar\n(Lesson)', icon: '📖' },
    { id: 'idioms', name: 'Must-know Idioms\n(Lesson)', icon: '💡' },
    { id: 'intro', name: 'Self-Introduction\n(Lesson)', icon: '👋' },
    { id: 'ordering', name: 'Ordering Food\n(Lesson)', icon: '☕' },
  ],
  Intermediate: [
    { id: 'grammar_corr', name: 'Grammar Focus\n(Lesson)', icon: '✍️' },
    { id: 'idioms_int', name: 'Daily Idioms\n(Lesson)', icon: '🧠' },
    { id: 'emergency', name: 'Urgent Situations\n(Roleplay)', icon: '🚨' },
    { id: 'travel', name: 'Travel Scenarios\n(Roleplay)', icon: '✈️' },
  ],
  Advanced: [
    { id: 'adv_idioms', name: 'Native Idioms\n(Lesson)', icon: '🎭' },
    { id: 'business', name: 'Business English\n(Talk)', icon: '💼' },
    { id: 'topic_disc', name: 'Topic Discussion\n(Talk)', icon: '🗣️' },
    { id: 'casual', name: 'Casual Free Talk\n(Talk)', icon: '🍻' },
  ]
};

export default function RoleSelect({ onNext }: any) {
  const [level, setLevel] = useState('Basic');

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h2 style={styles.title}>Step 1. Select Your Level</h2>
        
        <div style={styles.levelTabGroup}>
          {['Basic', 'Intermediate', 'Advanced'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              style={{
                ...styles.levelBtn,
                backgroundColor: level === lvl ? '#58CC02' : 'transparent',
                color: level === lvl ? '#fff' : '#8E8E93',
                fontWeight: level === lvl ? '700' : '500',
              }}
            >
              {lvl}
            </button>
          ))}
        </div>

        <h2 style={styles.title}>Step 2. Choose a Topic</h2>

        <div style={styles.topicGrid}>
          {LEVEL_DATA[level].map((topic: any) => (
            <button
              key={topic.id}
              onClick={() => onNext(level, topic.id)}
              style={styles.topicCard}
            >
              <span style={styles.topicIcon}>{topic.icon}</span>
              <span style={styles.topicName}>{topic.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  container: { 
    padding: '40px 24px', 
    backgroundColor: '#FFFFFF', 
    minHeight: '100dvh',
    // 🚀 가독성을 위한 시스템 폰트 스택 최적화
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
    WebkitFontSmoothing: 'antialiased',
    letterSpacing: '-0.02em', // 자간을 살짝 좁혀 가독성 향상
  },
  content: {
    maxWidth: '520px',
    margin: '0 auto'
  },
  title: { 
    color: '#1C1C1E', 
    fontSize: '22px', 
    fontWeight: '800', // 더 굵게 강조
    marginBottom: '20px', 
    marginTop: '24px',
    letterSpacing: '-0.03em'
  },
  levelTabGroup: { 
    display: 'flex', 
    gap: '4px', 
    marginBottom: '40px',
    backgroundColor: '#F2F2F7', 
    padding: '4px',
    borderRadius: '16px'
  },
  levelBtn: { 
    flex: 1, 
    padding: '14px 0', 
    borderRadius: '12px', 
    border: 'none', 
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  topicGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '16px' 
  },
  topicCard: {
    backgroundColor: '#FFFFFF', 
    padding: '28px 16px', 
    borderRadius: '24px', 
    border: '1.5px solid #F2F2F7', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: '14px', 
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(0,0,0,0.04)', // 더 부드러운 그림자
    transition: 'transform 0.2s ease, border-color 0.2s ease'
  },
  topicIcon: { fontSize: '36px', marginBottom: '4px' },
  topicName: { 
    color: '#3A3A3C', 
    fontSize: '14px', 
    fontWeight: '700', // 제목을 굵게
    textAlign: 'center',
    lineHeight: '1.4', // 행간 확보
    whiteSpace: 'pre-line' // \n 줄바꿈 적용
  }
};