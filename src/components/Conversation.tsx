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

  const { isTalking, isListening, isThinking, timeLeft, isAdmin, aiData, analysisHistory, handleSpeak: originalHandleSpeak } = 
    useConversation(
      selectedLevel, 
      selectedRole, 
      selectedRole, 
      mainLang, 
      mainLangName, 
      subLangName, 
      selectedTutor 
    );

  /**
   * ✅ 배포 환경(muntalk.com)용 강력 권한 해제 로직
   */
  const handleSpeakWithAudioUnlock = async () => {
    // 1. 모든 비디오 태그 권한 획득 (Warm-up)
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      video.muted = true; // 중복 방지를 위해 무음 고정
      // 버튼 누른 순간 아주 잠깐 재생시켜 브라우저 승인을 받아냄
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // 승인 완료되면 원래 로직이 제어하도록 둠
        }).catch(err => console.log("Video prep failed:", err));
      }
    });

    // 2. 오디오 엔진(TTS용) 깨우기
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
    }

    // 3. 기존 대화 로직 실행
    originalHandleSpeak();
  };

  const [showReport, setShowReport] = useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.langSelectorBar}>
        <div style={styles.roleInfo}>
           <span style={styles.timerLabel}>
             {isAdmin ? "Admin" : `Time: ${Math.floor(timeLeft! / 60)}:${String(timeLeft! % 60).padStart(2, '0')}`}
           </span>
           <span style={styles.levelLabel}>{selectedRole} | {selectedLevel}</span>
        </div>
        <div style={styles.selectorItem}>
          <button onClick={() => setShowSubMenu(!showSubMenu)} style={styles.langBtn}>Subtitle: {subLangName} ▼</button>
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

      <TutorVideo tutorId={selectedTutor.id} isTalking={isTalking} />

      <div style={styles.talkArea}>
        <SubtitleArea reply={aiData.reply} translation={aiData.translation} isThinking={isThinking} />

        <div style={styles.btnGroup}>
          <button 
            onClick={handleSpeakWithAudioUnlock} 
            style={{...styles.ctrlBtn, backgroundColor: isListening ? '#ff4b4b' : '#58CC02'}}
          >
            {isListening ? "Stop" : "Speak"}
          </button>
          <button onClick={() => setShowReport(true)} style={styles.backBtn}>Finish</button>
        </div>
      </div>

      {showReport && <ReportModal history={analysisHistory} onBack={onBack} />}
    </div>
  );
}