'use client';
import { useState } from 'react';
import { useConversation } from '../hooks/useConversation';
import { styles } from './ConversationStyles';

// 분리한 컴포넌트들
import TutorVideo from './TutorVideo';
import SubtitleArea from './SubtitleArea';
import ReportModal from './ReportModal';

// 필요한 상수 (ADMIN_EMAIL 등은 useTimer 내부에서 처리되므로 여기서 쓰지 않는다면 생략 가능)
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

  /**
   * ✅ 수정 포인트 1: useConversation 인자 수정
   * 순서: (level, topic, role, mainLang, mainLangName, subLangName, tutor)
   * 현재 selectedRole을 topic과 role 양쪽에 넣어 에러를 방지합니다.
   */
  const { isTalking, isListening, isThinking, timeLeft, isAdmin, aiData, analysisHistory, handleSpeak } = 
    useConversation(
      selectedLevel, 
      selectedRole, // topic 자리 (추가됨)
      selectedRole, // role 자리
      mainLang, 
      mainLangName, 
      subLangName, 
      selectedTutor // gender만 보냈던 것을 tutor 객체 전체로 변경 (TTS 언어 코드 대응)
    );

  const [showReport, setShowReport] = useState(false);

  return (
    <div style={styles.container}>
      {/* 상단 바 (Header) */}
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
        {/* aiData.translation이 제대로 전달되도록 확인 */}
        <SubtitleArea reply={aiData.reply} translation={aiData.translation} isThinking={isThinking} />

        <div style={styles.btnGroup}>
          <button onClick={handleSpeak} style={{...styles.ctrlBtn, backgroundColor: isListening ? '#ff4b4b' : '#58CC02'}}>
            {isListening ? "Stop" : "Speak"}
          </button>
          <button onClick={() => setShowReport(true)} style={styles.backBtn}>Finish</button>
        </div>
      </div>

      {showReport && <ReportModal history={analysisHistory} onBack={onBack} />}
    </div>
  );
}