'use client';

import { useEffect, useRef } from 'react';

export default function TutorVideo({ tutorId, isTalking }: { tutorId: string, isTalking: boolean }) {
  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const talkVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const playVideo = async (video: HTMLVideoElement | null) => {
      if (!video) return;
      try {
        video.muted = !isTalking; // 대화 중일 때만 음소거 해제
        await video.play();
      } catch (err) {
        console.log("Playback failed, retrying...", err);
        // 정책상 막혔을 경우 음소거 상태로라도 재생 시도
        video.muted = true;
        video.play();
      }
    };

    if (isTalking) {
      // 대화 시작 시: Idle 멈추고 Talk 재생
      idleVideoRef.current?.pause();
      playVideo(talkVideoRef.current);
    } else {
      // 대화 종료 시: Talk 멈추고 Idle 재생
      talkVideoRef.current?.pause();
      playVideo(idleVideoRef.current);
    }
  }, [isTalking]);

  return (
    <div style={styles.videoArea}>
      <video 
        ref={idleVideoRef}
        src={`/videos/${tutorId}_idle.mp4`} 
        autoPlay loop muted playsInline 
        style={{ ...styles.videoFit, position: 'absolute', zIndex: 1, opacity: isTalking ? 0 : 1 }} 
      />
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