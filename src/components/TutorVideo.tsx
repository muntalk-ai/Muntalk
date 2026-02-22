'use client';

import { useEffect, useRef } from 'react';

export default function TutorVideo({ tutorId, isTalking }: { tutorId: string, isTalking: boolean }) {
  // 비디오를 직접 조절하기 위한 이름표(Ref)를 붙입니다.
  const talkVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (talkVideoRef.current) {
      if (isTalking) {
        // AI가 대답할 때: 음소거 해제 + 재생 강제
        talkVideoRef.current.muted = false;
        talkVideoRef.current.play().catch(() => {
          // 브라우저가 막을 경우를 대비한 보험
          console.log("Audio waiting for user interaction");
        });
      } else {
        // 대기 중일 때: 다시 음소거
        talkVideoRef.current.muted = true;
      }
    }
  }, [isTalking]);

  return (
    <div style={styles.videoArea}>
      {/* 1. 대기 영상: 항상 무음 유지 */}
      <video 
        src={`/videos/${tutorId}_idle.mp4`} 
        autoPlay loop muted playsInline 
        style={{ ...styles.videoFit, position: 'absolute', zIndex: 1, opacity: isTalking ? 0 : 1 }} 
      />
      {/* 2. 대화 영상: ref를 추가하고 소리 제어 로직 연결 */}
      <video 
        ref={talkVideoRef}
        src={`/videos/${tutorId}_talk.mp4`} 
        autoPlay loop muted playsInline 
        style={{ ...styles.videoFit, position: 'absolute', zIndex: 2, opacity: isTalking ? 1 : 0 }}
      />
    </div>
  );
}

const styles: any = {
  videoArea: { height: '55dvh', width: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' },
  videoFit: { width: '100%', height: '100%', objectFit: 'contain' },
};