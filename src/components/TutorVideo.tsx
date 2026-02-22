'use client';

import { useEffect, useRef } from 'react';

export default function TutorVideo({ tutorId, isTalking }: { tutorId: string, isTalking: boolean }) {
  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const talkVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // [아이폰 핵심 로직] 사용자가 "Speak"를 눌러 대화가 시작될 때(isTalking이 true가 될 때)
    if (isTalking && talkVideoRef.current) {
      const talkVideo = talkVideoRef.current;
      
      // 1. 음소거를 강제로 풉니다.
      talkVideo.muted = false; 
      
      // 2. 사파리에서 영상이 멈추지 않도록 다시 한번 재생 명령을 내립니다.
      const playPromise = talkVideo.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // 자동 재생이 막혔을 경우 콘솔에 기록 (사용자 터치 대기)
          console.log("Safari browser blocked audio. User interaction needed.");
        });
      }
    } else if (!isTalking && talkVideoRef.current) {
      // 대화가 끝나면 다음을 위해 다시 음소거
      talkVideoRef.current.muted = true;
    }
  }, [isTalking]);

  return (
    <div style={styles.videoArea}>
      {/* 대기 중 영상: 항상 무음 */}
      <video 
        ref={idleVideoRef}
        src={`/videos/${tutorId}_idle.mp4`} 
        autoPlay 
        loop 
        muted 
        playsInline 
        style={{ ...styles.videoFit, position: 'absolute', zIndex: 1, opacity: isTalking ? 0 : 1 }} 
      />
      {/* 대화 중 영상: isTalking일 때 소리가 켜지도록 로직 추가 */}
      <video 
        ref={talkVideoRef}
        src={`/videos/${tutorId}_talk.mp4`} 
        autoPlay 
        loop 
        muted // 초기값은 무음 (아이폰 재생 허용을 위해)
        playsInline 
        style={{ ...styles.videoFit, position: 'absolute', zIndex: 2, opacity: isTalking ? 1 : 0 }}
      />
    </div>
  );
}

const styles: any = {
  videoArea: { height: '55dvh', width: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' },
  videoFit: { width: '100%', height: '100%', objectFit: 'contain' },
};