'use client';
import { useState } from 'react';

const TOP_LANGS = [
  { id: 'en-US', name: 'English', code: 'us' }, 
  { id: 'ko-KR', name: 'Korean', code: 'kr' },
  { id: 'ja-JP', name: 'Japanese', code: 'jp' }, 
  { id: 'zh-CN', name: 'Chinese', code: 'cn' }, // 중국 표준어 (Mandarin으로 명칭 구체화)
  { id: 'es-ES', name: 'Spanish', code: 'es' }, 
  { id: 'fr-FR', name: 'French', code: 'fr' },
  { id: 'de-DE', name: 'German', code: 'de' }, 
  { id: 'it-IT', name: 'Italian', code: 'it' },
  { id: 'pt-BR', name: 'Portuguese', code: 'br' }, 
  { id: 'ru-RU', name: 'Russian', code: 'ru' },
  { id: 'ar-SA', name: 'Arabic', code: 'sa' },
  { id: 'id-ID', name: 'Indonesian', code: 'id' }
];

const MORE_LANGS = [
  { id: 'vi-VN', name: 'Vietnamese', code: 'vn' }, { id: 'th-TH', name: 'Thai', code: 'th' },
  { id: 'hi-IN', name: 'Hindi', code: 'in' }, { id: 'tr-TR', name: 'Turkish', code: 'tr' },
  { id: 'nl-NL', name: 'Dutch', code: 'nl' }, { id: 'pl-PL', name: 'Polish', code: 'pl' },
  { id: 'sv-SE', name: 'Swedish', code: 'se' }, { id: 'da-DK', name: 'Danish', code: 'dk' },
  { id: 'fi-FI', name: 'Finnish', code: 'fi' }, { id: 'no-NO', name: 'Norwegian', code: 'no' },
  { id: 'cs-CZ', name: 'Czech', code: 'cz' }, { id: 'el-GR', name: 'Greek', code: 'gr' },
  { id: 'hu-HU', name: 'Hungarian', code: 'hu' }, { id: 'ro-RO', name: 'Romanian', code: 'ro' },
  { id: 'uk-UA', name: 'Ukrainian', code: 'ua' }, { id: 'he-IL', name: 'Hebrew', code: 'il' },
  { id: 'ms-MY', name: 'Malay', code: 'my' }, { id: 'tl-PH', name: 'Tagalog', code: 'ph' },
  { id: 'bg-BG', name: 'Bulgarian', code: 'bg' }, { id: 'sr-RS', name: 'Serbian', code: 'rs' },
  { id: 'hr-HR', name: 'Croatian', code: 'hr' }, { id: 'sk-SK', name: 'Slovak', code: 'sk' },
  { id: 'sl-SI', name: 'Slovenian', code: 'si' }, { id: 'et-EE', name: 'Estonian', code: 'ee' },
  { id: 'lv-LV', name: 'Latvian', code: 'lv' }, { id: 'lt-LT', name: 'Lithuanian', code: 'lt' },
  { id: 'fa-IR', name: 'Persian', code: 'ir' }, { id: 'bn-BD', name: 'Bengali', code: 'bd' },
  { id: 'ta-IN', name: 'Tamil', code: 'in' }, { id: 'gu-IN', name: 'Gujarati', code: 'in' },
  { id: 'ur-PK', name: 'Urdu', code: 'pk' }, { id: 'pa-IN', name: 'Punjabi', code: 'in' },
  { id: 'kn-IN', name: 'Kannada', code: 'in' }, { id: 'ml-IN', name: 'Malayalam', code: 'in' },
  { id: 'sw-KE', name: 'Swahili', code: 'ke' }, { id: 'af-ZA', name: 'Afrikaans', code: 'za' },
  { id: 'mr-IN', name: 'Marathi', code: 'in' }, { id: 'te-IN', name: 'Telugu', code: 'in' },
  { id: 'my-MM', name: 'Burmese', code: 'mm' },    // 미얀마어
  { id: 'km-KH', name: 'Khmer', code: 'kh' }    // 캄보디아어
  
];


export default function LangSelect({ onNext }: { onNext: (id: string) => void }) {
  const [showMore, setShowMore] = useState(false);
  return (
    <div style={styles.pageContainer}>
      <h2 style={styles.stepTitle}>Pick a language to learn</h2>
      
      <div style={styles.langGrid}>
        {(showMore ? [...TOP_LANGS, ...MORE_LANGS] : TOP_LANGS).map(l => (
          <button key={l.id} onClick={() => onNext(l.id)} style={styles.langBtn}>
            <img 
              src={`https://flagcdn.com/w80/${l.code}.png`} 
              style={styles.flagIcon} 
              alt={l.name} 
              onError={(e: any) => e.target.src = 'https://flagcdn.com/w80/un.png'} // 국기 로드 실패 시 기본 이미지
            />
            <span style={styles.langLabel}>{l.name}</span>
          </button>
        ))}
      </div>
      {!showMore && (
        <button onClick={() => setShowMore(true)} style={styles.moreBtn}>
          + View All 50+ Languages
        </button>
      )}
    </div>
  );
}

const styles: any = {
  pageContainer: { minHeight: '100dvh', padding: '40px 20px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', fontFamily: 'sans-serif' },
  stepTitle: { fontSize: '24px', fontWeight: 'bold', marginBottom: '40px', color: '#333' },
  langGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', // 반응형 그리드로 개선
    gap: '20px', 
    width: '100%', 
    maxWidth: '800px' 
  },
  langBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' },
  flagIcon: { width: '60px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  langLabel: { fontSize: '11px', color: '#555', fontWeight: '500' },
  moreBtn: { marginTop: '30px', padding: '10px 25px', borderRadius: '20px', border: '1px solid #58CC02', color: '#58CC02', background: 'none', cursor: 'pointer', fontWeight: 'bold' },
};