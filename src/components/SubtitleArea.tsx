'use client';
import { useEffect, useRef } from 'react';

export default function SubtitleArea({ reply, translation, isThinking }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reply]);

  return (
    <div style={styles.subtitleSection}>
      <div style={styles.targetText}>{isThinking ? "Thinking..." : reply}</div>
      <div style={styles.subText}>{translation}</div>
      <div ref={scrollRef} />
    </div>
  );
}

const styles: any = {
  subtitleSection: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: '20px', padding: '20px', marginBottom: '15px', border: '1px solid #444', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' },
  targetText: { color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' },
  subText: { color: '#58CC02', fontSize: '15px' },
};