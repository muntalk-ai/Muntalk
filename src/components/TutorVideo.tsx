'use client';
// ✅ 아래와 같이 명시적으로 useRef와 useEffect를 import해야 합니다.
import { useEffect, useRef } from 'react';

export default function TutorVideo({ tutorId, isTalking }: { tutorId: string, isTalking: boolean }) {
  const talkRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // AI가 말하기 시작할 때 talk 비디오를 확실하게 재생
    if (isTalking && talkRef.current) {
      talkRef.current.play().catch((err) => {
        console.log("Video play waiting for user gesture...", err);
      });
    }
  }, [isTalking]);

  return (
    <div style={styles.videoArea}>
      {/* 대기(Idle) 영상 */}
      <video 
        id="idle-video"
        src={`/videos/${tutorId}_idle.mp4`} 
        autoPlay 
        loop 
        muted 
        playsInline 
        style={{ 
          ...styles.videoFit, 
          position: 'absolute', 
          zIndex: 1, 
          opacity: isTalking ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out' // 전환을 부드럽게 추가
        }} 
      />
      {/* 대화(Talk) 영상 */}
      <video 
        ref={talkRef}
        id="talk-video"
        src={`/videos/${tutorId}_talk.mp4`} 
        loop 
        muted 
        playsInline 
        style={{ 
          ...styles.videoFit, 
          position: 'absolute', 
          zIndex: 2, 
          opacity: isTalking ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </div>
  );
}

const styles: any = {
  videoArea: { height: '55dvh', width: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' },
  videoFit: { width: '100%', height: '100%', objectFit: 'contain' },
};