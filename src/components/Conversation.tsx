'use client';
import { useState } from 'react';
import { useConversation } from '../hooks/useConversation';
import { styles } from './ConversationStyles';

// 분리한 컴포넌트들
import TutorVideo from './TutorVideo';
import SubtitleArea from './SubtitleArea';
import ReportModal from './ReportModal';

const SUB_LANGS = [
  { id: 'ko-KR', name: 'Korean' }, { id: 'en-US', name: 'English' }, { id: 'ja-JP', name: 'Japanese' },
  { id: 'zh-CN', name: 'Chinese' }, { id: 'es-ES', name: 'Spanish' }, { id: 'fr-FR', name: 'French' },
  { id: 'de-DE', name: 'German' }, { id: 'it-IT', name: 'Italian' }, { id: 'pt-BR', name: 'Portuguese' },
  { id: 'ru-RU', name: 'Russian' }, { id: 'vi-VN', name: 'Vietnamese' }, { id: 'th-TH', name: 'Thai' },
  { id: 'id-ID', name: 'Indonesian' }, { id: 'hi-IN', name: 'Hindi' }, { id: 'ar-SA', name: 'Arabic' },
  { id: 'tr-TR', name: 'Turkish' }, { id: 'nl-NL', name: 'Dutch' }, { id: 'pl-PL', name: 'Polish' },
  { id: 'sv-SE', name: 'Swedish' }, { id: 'da-DK', name: 'Danish' }, { id: 'fi-FI', name: 'Finnish' },
  { id: 'no-NO', name: 'Norwegian' }, { id: 'cs-CZ', name: 'Czech' }, { id: 'el-GR', name: 'Greek' },
  { id: 'hu-HU', name: 'Hungarian' }, { id: 'ro-RO', name: 'Romanian' }, { id: 'uk-UA', name: 'Ukrainian' },
  { id: 'he-IL', name: 'Hebrew' }, { id: 'ms-MY', name: 'Malay' }, { id: 'tl-PH', name: 'Tagalog' },
  { id: 'my-MM', name: 'Burmese' }, { id: 'km-KH', name: 'Khmer' }, { id: 'mn-MN', name: 'Mongolian' },
  { id: 'ne-NP', name: 'Nepali' }, { id: 'tg-TJ', name: 'Tajik' }, { id: 'ky-KG', name: 'Kyrgyz' },
  { id: 'hmn-CN', name: 'Hmong' }, { id: 'ro-MD', name: 'Moldovan' }, { id: 'yue-HK', name: 'Cantonese' }
];

export default function Conversation({ selectedLangId, selectedTutor, selectedLevel, selectedRole, onBack }: any) {
  const [subLang, setSubLang] = useState('ko-KR');
  const [showSubMenu, setShowSubMenu] = useState(false);
  const mainLang = selectedLangId || 'en-US';
  
  const mainLangName = SUB_LANGS.find(l => l.id === mainLang)?.name || "";
  const subLangName = SUB_LANGS.find(l => l.id === subLang)?.name || "";

  // 1. useConversation 훅에서 unlockMedia를 추가로 가져옵니다.
  const { 
    isTalking, 
    isListening, 
    isThinking, 
    timeLeft, 
    isAdmin, 
    aiData, 
    analysisHistory, 
    handleSpeak,
    unlockMedia // ✅ useChatLogic에서 뚫고 올라온 함수
  } = useConversation(
    selectedLevel, 
    selectedRole, 
    selectedRole, 
    mainLang, 
    mainLangName, 
    subLangName, 
    selectedTutor 
  );

  /**
   * ✅ 배포 환경(muntalk.com) 미디어 잠금 해제 통합 로직
   */
  const handleSpeakWithAudioUnlock = () => {
    // A. 훅에 내장된 오디오/비디오 잠금 해제 즉시 실행 (클릭 시점 동기화)
    if (unlockMedia) {
      unlockMedia();
    }

    // B. 브라우저 오디오 엔진(AudioContext) 깨우기
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    // C. 비디오 태그 강제 Warm-up (한 번 더 확실하게)
    const videos = document.querySelectorAll('video');
    videos.forEach((v) => {
      v.muted = true;
      v.play().catch(() => {}); 
    });

    // D. 기존 대화/음성인식 로직 실행
    handleSpeak();
  };

  const [showReport, setShowReport] = useState(false);

  return (
    <div style={styles.container}>
      {/* 상단바: 타이머 및 언어 설정 */}
      <div style={styles.langSelectorBar}>
        <div style={styles.roleInfo}>
           <span style={styles.timerLabel}>
             {isAdmin ? "Admin" : `Time: ${Math.floor(timeLeft! / 60)}:${String(timeLeft! % 60).padStart(2, '0')}`}
           </span>
           <span style={styles.levelLabel}>{selectedRole} | {selectedLevel}</span>
        </div>
        
        <div style={styles.selectorItem}>
          <button onClick={() => setShowSubMenu(!showSubMenu)} style={styles.langBtn}>
            Subtitle: {subLangName} ▼
          </button>
          {showSubMenu && (
            <div style={styles.dropdown}>
              {SUB_LANGS.map(l => (
                <div key={l.id} onClick={() => {setSubLang(l.id); setShowSubMenu(false);}} style={styles.dropItem}>
                  {l.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 튜터 비디오 영역 */}
      <TutorVideo tutorId={selectedTutor.id} isTalking={isTalking} />

      {/* 하단 대화창 및 제어 버튼 */}
      <div style={styles.talkArea}>
        <SubtitleArea reply={aiData.reply} translation={aiData.translation} isThinking={isThinking} />

        <div style={styles.btnGroup}>
          <button 
            onClick={handleSpeakWithAudioUnlock} 
            style={{
              ...styles.ctrlBtn, 
              backgroundColor: isListening ? '#ff4b4b' : '#58CC02'
            }}
          >
            {isListening ? "Stop" : "Speak"}
          </button>
          <button onClick={() => setShowReport(true)} style={styles.backBtn}>Finish</button>
        </div>
      </div>

      {/* 리포트 모달 */}
      {showReport && <ReportModal history={analysisHistory} onBack={onBack} />}
    </div>
  );
}