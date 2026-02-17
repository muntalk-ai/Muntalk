'use client';
import { useMemo } from 'react';

// CSV 데이터를 기반으로 생성된 실제 튜터 데이터
const FULL_TUTOR_DATA = Array.from({ length: 152 }).map((_, i) => {
  const n = i + 1;
  const id = n < 10 ? `t0${n}` : `t${n}`;
  
  // 1. 성별 결정 (CSV 기준: 61번까지 female, 62번부터 male)
  const gender = n <= 61 ? 'female' : 'male';

  // 2. CSV의 언어 패턴을 그룹화하여 할당
  // 실제 파일 데이터의 패턴을 순서대로 배열화함
  const patterns = [
    "en-US, ru-RU, pl-PL, bg-BG, ro-MD", // t01 타입
    "en-US, nl-NL, cs-CZ, sr-RS",        // t02 타입
    "en-US, de-DE, hu-HU, ro-RO, es-ES, ru-RU", // t03 타입
    "en-US, fr-FR, uk-UA, he-IL, lv-LV, lt-LT", // t04 타입
    "ko-KR, ja-JP, zh-CN, th-TH, vi-VN, ur-PK, hi-IN, te-IN, mr-IN, tl-PH, id-ID, pa-IN, my-MM, km-KH, mn-MN, ne-NP, hmn-CN, yue-HK, tg-TJ, ky-KG", // t05 타입 (광동어 yue-HK)
    "en-US, fr-FR, sw-KE, af-ZA, kn-IN, ml-IN", // t06 타입
    "en-US, sv-SE, da-DK, no-NO, de-DE, ru-RU", // t07 타입
    "es-ES, it-IT, pt-BR, bn-BD, ta-IN, ms-MY, el-GR, gu-IN", // t08 타입
    "fa-IR, he-IL, tr-TR, af-ZA, ar-SA",       // t09 타입
    "en-US, fi-FI, hr-HR, sk-SK, sl-SI, et-EE, de-DE, ko-KR, ja-JP, zh-CN, th-TH, vi-VN, ur-PK, hi-IN, te-IN, mr-IN, tl-PH, id-ID, pa-IN, my-MM, km-KH, mn-MN, ne-NP, hmn-CN, zh-HK, tg-TJ, ky-KG"  // t10 타입 (광동어 zh-HK)
  ];

  // i % 10 로직을 유지하되, 텍스트 전처리 강화
  const rawLangs = patterns[i % 10];
  
  return {
    id,
    gender,
    langList: rawLangs.split(',').map(s => s.trim().replace('.', '')),
    thumbnail: `/images/${id}.jpg`
  };
});

export default function TutorSelect({ selectedLangId, onNext, onBack }: any) {
  const filteredTutors = useMemo(() => {
    if (!selectedLangId) return [];

    return FULL_TUTOR_DATA.filter(t => {
      // 광동어(yue-HK / zh-HK) 호환성 처리
      if (selectedLangId === 'zh-HK' || selectedLangId === 'yue-HK') {
        return t.langList.includes('zh-HK') || t.langList.includes('yue-HK');
      }
      return t.langList.includes(selectedLangId);
    });
  }, [selectedLangId]);

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerRow}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <h2 style={styles.stepTitle}>Choose your tutor</h2>
        <div style={{ width: '60px' }}></div> 
      </div>

      <div style={styles.tutorGrid}>
        {filteredTutors.length > 0 ? (
          filteredTutors.map(t => (
            <div key={t.id} onClick={() => onNext(t)} style={styles.tutorCard}>
              <div style={styles.imgBox}>
                <img 
                  src={t.thumbnail} 
                  style={styles.thumb} 
                  alt={`tutor-${t.id}`} 
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=Tutor'; }}
                />
              </div>
              {/* 디버깅용: ID 확인이 필요하면 아래 주석 해제 */}
              {/* <p style={{textAlign:'center', fontSize:'10px'}}>{t.id}</p> */}
            </div>
          ))
        ) : (
          <div style={styles.noTutor}>No tutors found for this language.</div>
        )}
      </div>
    </div>
  );
}

const styles: any = {
  pageContainer: { padding: '40px 20px', backgroundColor: '#fff', minHeight: '100dvh', fontFamily: 'sans-serif' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px', margin: '0 auto 30px' },
  stepTitle: { fontSize: '24px', fontWeight: 'bold', color: '#333', margin: 0 },
  backBtn: { background: 'none', border: 'none', color: '#58CC02', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
  tutorGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px', maxWidth: '900px', margin: '0 auto' },
  tutorCard: { cursor: 'pointer', borderRadius: '16px', overflow: 'hidden', transition: 'transform 0.2s ease' },
  imgBox: { width: '100%', aspectRatio: '1 / 1.2', overflow: 'hidden', borderRadius: '16px', backgroundColor: '#f0f0f0' },
  thumb: { width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f9f9f9' },
  noTutor: { gridColumn: '1 / -1', textAlign: 'center', color: '#888', marginTop: '50px' }
};