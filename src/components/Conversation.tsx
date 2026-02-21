'use client';
import { useState } from 'react';
import { useConversation } from '../hooks/useConversation';
import { styles } from './ConversationStyles';

// 분리한 컴포넌트들
import TutorVideo from './TutorVideo';
import SubtitleArea from './SubtitleArea';
import ReportModal from './ReportModal';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
const ADMIN_EMAIL = "muntalkofficial@gmail.com";

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

  // 🚀 관제센터 훅에서 모든 데이터 가져오기
  const { isTalking, isListening, isThinking, timeLeft, isAdmin, aiData, analysisHistory, handleSpeak } = 
    useConversation(selectedLevel, selectedRole, mainLang, mainLangName, subLangName, selectedTutor.gender);

  const [showReport, setShowReport] = useState(false);

  return (
    <div style={styles.container}>
      {/* 상단 바 (Header) */}
      <div style={styles.langSelectorBar}>
        <div style={styles.roleInfo}>
           <span style={styles.timerLabel}>{isAdmin ? "Admin" : `Time: ${Math.floor(timeLeft! / 60)}:${String(timeLeft! % 60).padStart(2, '0')}`}</span>
           <span style={styles.levelLabel}>{selectedRole} | {selectedLevel}</span>
        </div>
        <div style={styles.selectorItem}>
          <button onClick={() => setShowSubMenu(!showSubMenu)} style={styles.langBtn}>Subtitle: {subLangName} ▼</button>
          {showSubMenu && (
            <div style={styles.dropdown}>
              {SUB_LANGS.map(l => (
                <div key={l.id} onClick={() => {setSubLang(l.id); setShowSubMenu(false);}} style={styles.dropItem}>{l.name}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TutorVideo tutorId={selectedTutor.id} isTalking={isTalking} />

      <div style={styles.talkArea}>
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