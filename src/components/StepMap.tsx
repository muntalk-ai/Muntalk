'use client';
import { useRouter } from 'next/navigation';
import { CURRICULUM } from '@/data/curriculum';
import { getTutorById } from '@/data/tutors';

interface StepMapProps {
  levelId: string;
  langId?: string;
  subLang?: string;
  xp?: number;
  completedLessons?: Set<string>;
  tutorId?: string;
  isAdmin?: boolean;
}

export default function StepMap({ levelId, langId = 'en-US', subLang = 'ko-KR', xp = 0, completedLessons = new Set(), tutorId = 't01', isAdmin = false }: StepMapProps) {
  const router = useRouter();
  const level = CURRICULUM.find(l => l.id === levelId);
  if (!level) return <div style={{ color: '#fff', padding: 40 }}>Level not found</div>;

  const tutor = getTutorById(tutorId);

  const isStepUnlocked = (stepIdx: number): boolean => {
    if (isAdmin) return true;
    if (stepIdx === 0) return true;
    const prevStep = level.steps[stepIdx - 1];
    return prevStep.lessons.every(l => completedLessons.has(l.id));
  };

  const isLessonUnlocked = (stepIdx: number, lessonIdx: number): boolean => {
    if (isAdmin) return true;
    if (!isStepUnlocked(stepIdx)) return false;
    if (lessonIdx === 0) return true;
    const prevLesson = level.steps[stepIdx].lessons[lessonIdx - 1];
    return completedLessons.has(prevLesson.id);
  };

  const stepProgress = (stepIdx: number) => {
    const step = level.steps[stepIdx];
    const done = step.lessons.filter(l => completedLessons.has(l.id)).length;
    return Math.round((done / step.lessons.length) * 100);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.push('/lingua')}>← Back</button>
        <div style={styles.headerCenter}>
          <span style={{ ...styles.levelPill, background: level.accent }}>CEFR {level.label}</span>
          <span style={styles.headerTitle}>{level.badge} {level.persona}</span>
        </div>
        <div style={{ ...styles.xpChip, color: level.accent }}>⚡ {xp} XP</div>
      </header>

      {/* Tutor strip */}
      <div style={{ ...styles.tutorStrip, background: `linear-gradient(135deg, ${level.color}, ${level.color}88)` }}>
        <img src={tutor.thumbnail} alt={tutor.name} style={styles.tutorThumb} onError={e => { (e.target as HTMLImageElement).src = '/images/tutor-placeholder.jpg'; }} />
        <div>
          <div style={{ ...styles.tutorName, color: level.dark }}>{tutor.name}</div>
          <div style={{ ...styles.tutorLang, color: level.dark }}>Your tutor for this level</div>
        </div>
        <div style={{ ...styles.levelDesc, color: level.dark }}>{level.desc}</div>
      </div>

      {/* Steps */}
      <div style={styles.stepsWrap}>
        {level.steps.map((step, si) => {
          const unlocked = isStepUnlocked(si);
          const completed = step.lessons.every(l => completedLessons.has(l.id));
          const progress = stepProgress(si);

          return (
            <div key={step.id} style={{ ...styles.stepCard, background: unlocked ? step.color : '#141414', border: `2px solid ${unlocked ? step.accent + '60' : '#222'}` }}>
              {/* Step header */}
              <div style={styles.stepHeader}>
                <div style={{ ...styles.stepBadge, background: unlocked ? step.accent : '#333', color: unlocked ? '#fff' : '#555' }}>
                  {unlocked ? step.badge : '🔒'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...styles.stepLabel, color: unlocked ? step.accent : '#444' }}>{step.label}</div>
                  <div style={{ ...styles.stepPersona, color: unlocked ? step.dark : '#555' }}>{step.persona}</div>
                  <div style={{ ...styles.stepTagline, color: unlocked ? step.dark : '#444' }}>{step.tagline}</div>
                </div>
                {completed && <span style={styles.completedBadge}>✅ +{step.xpReward} XP</span>}
              </div>

              {/* Progress bar */}
              {unlocked && (
                <div style={styles.stepProgressWrap}>
                  <div style={styles.progressBg}>
                    <div style={{ ...styles.progressFill, width: `${progress}%`, background: step.accent }} />
                  </div>
                  <span style={{ ...styles.progressPct, color: step.accent }}>{progress}%</span>
                </div>
              )}

              {/* Lessons row */}
              <div style={styles.lessonsRow}>
                {step.lessons.map((lesson, li) => {
                  const lUnlocked = isLessonUnlocked(si, li);
                  const lDone = completedLessons.has(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      style={{
                        ...styles.lessonCard,
                        background: lDone ? step.accent : lUnlocked ? '#fff' : '#1a1a1a',
                        border: `2px solid ${lDone ? step.accent : lUnlocked ? step.accent + '40' : '#222'}`,
                        cursor: lUnlocked ? 'pointer' : 'not-allowed',
                        opacity: lUnlocked ? 1 : 0.4,
                        boxShadow: lUnlocked && !lDone ? `0 4px 16px ${step.accent}20` : 'none',
                      }}
                      onClick={() => lUnlocked && router.push(`/lingua/learn/${levelId}/${step.id}/${lesson.id}?lang=${langId}&tutor=${tutor.id}&subLang=${subLang}`)}
                    >
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{lDone ? '✅' : lUnlocked ? lesson.icon : '🔒'}</div>
                      <div style={{ ...styles.lessonTitle, color: lDone ? '#fff' : lUnlocked ? step.dark : '#444' }}>{lesson.title}</div>
                      <div style={{ ...styles.lessonXp, color: lDone ? '#ffffff99' : step.accent }}>+{lesson.xp} XP</div>
                    </div>
                  );
                })}
              </div>

              {/* Step XP reward */}
              {unlocked && (
                <div style={{ ...styles.stepReward, color: step.dark }}>
                  🏆 Complete all 3 lessons → <strong>+{step.xpReward} XP bonus</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F8F9FA', color: '#111', fontFamily: "'Nunito', sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid #E9ECEF', position: 'sticky', top: 0, background: '#ffffffee', backdropFilter: 'blur(10px)', zIndex: 100 },
  backBtn: { background: 'none', border: '1px solid #E9ECEF', color: '#6B7280', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Nunito', sans-serif" },
  headerCenter: { display: 'flex', alignItems: 'center', gap: 10 },
  levelPill: { fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, color: '#fff', letterSpacing: 1 },
  headerTitle: { fontSize: 15, fontWeight: 800, color: '#111' },
  xpChip: { fontSize: 13, fontWeight: 800 },
  tutorStrip: { display: 'flex', alignItems: 'center', gap: 16, padding: '20px 28px', flexWrap: 'wrap' },
  tutorThumb: { width: 56, height: 56, borderRadius: 99, objectFit: 'cover', objectPosition: 'center 20%', border: '2px solid #E9ECEF' },
  tutorName: { fontSize: 15, fontWeight: 800 },
  tutorLang: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  levelDesc: { fontSize: 13, opacity: 0.8, marginLeft: 'auto', maxWidth: 300, textAlign: 'right' },
  stepsWrap: { display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px 60px', maxWidth: 900, margin: '0 auto' },
  stepCard: { borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  stepHeader: { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  stepBadge: { width: 44, height: 44, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  stepLabel: { fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' },
  stepPersona: { fontSize: 15, fontWeight: 800, marginTop: 2 },
  stepTagline: { fontSize: 12, opacity: 0.7, marginTop: 4 },
  completedBadge: { marginLeft: 'auto', fontSize: 12, fontWeight: 800, background: '#00000010', padding: '6px 12px', borderRadius: 99, whiteSpace: 'nowrap' },
  stepProgressWrap: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  progressBg: { flex: 1, height: 6, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, transition: 'width 0.5s ease' },
  progressPct: { fontSize: 12, fontWeight: 800, minWidth: 32, textAlign: 'right' },
  lessonsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  lessonCard: { borderRadius: 14, padding: '18px 14px', textAlign: 'center', transition: 'transform 0.15s, box-shadow 0.15s' },
  lessonTitle: { fontSize: 12, fontWeight: 800, lineHeight: 1.3, marginBottom: 6 },
  lessonXp: { fontSize: 11, fontWeight: 700 },
  stepReward: { fontSize: 12, marginTop: 16, opacity: 0.7, textAlign: 'center' },
};