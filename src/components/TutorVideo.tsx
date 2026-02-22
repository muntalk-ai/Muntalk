'use client';

import { useEffect, useRef } from 'react';

export default function TutorVideo({ tutorId, isTalking }: { tutorId: string, isTalking: boolean }) {
  // 각 비디오를 직접 조절하기 위한 갈고리(Ref)
  const idleRef = useRef<HTMLVideoElement>(null);
  const talkRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // [핵심] 대화가 시작될 때 talk 비디오의 음소거를 강제로 해제
    if (isTalking && talkRef.current) {
      talkRef.current.muted = false; // 소리 켜기
      
      // 혹시 브라우저가 소리 켜는 걸 보고 영상을 멈췄을까봐 다시 재생 명령
      const playPromise = talkRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.log("아이폰 정책으로 무음 재생 중 - 터치 필요");
        });
      }
    } else if (!isTalking && talkRef.current) {
      talkRef.current.muted = true; // 대화 끝나면 다시 무음으로
    }
  }, [isTalking]);

  return (
    <div style={styles.videoArea}>
      {/* 1. 대기 영상 (언제나 무음) */}
      <video 
        ref={idleRef}
        src={`/videos/${tutorId}_idle.mp4`} 
        autoPlay loop muted playsInline 
        style={{ ...styles.videoFit, position: 'absolute', zIndex: 1, opacity: isTalking ? 0 : 1 }} 
      />
      {/* 2. 대화 영상 (isTalking일 때 소리 해제 로직 작동) */}
      <video 
        ref={talkRef}
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