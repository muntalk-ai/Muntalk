'use client';

import { useEffect, useRef } from 'react';

export default function TutorVideo({ tutorId, isTalking }: { tutorId: string, isTalking: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 1. 상태에 따라 파일 경로 결정
    const newSrc = isTalking ? `/videos/${tutorId}_talk.mp4` : `/videos/${tutorId}_idle.mp4`;
    
    // 2. 현재 재생 중인 파일과 다를 때만 교체
    if (video.getAttribute('src') !== newSrc) {
      video.src = newSrc;
      video.load(); // 새로운 파일 로드
      
      // 3. 아이폰/크롬 정책 대응: 음소거 설정 후 재생, 성공하면 음소거 해제
      video.muted = !isTalking; 
      
      const playVideo = async () => {
        try {
          await video.play();
          // 재생 성공 후, 대화 중이라면 소리를 켭니다.
          if (isTalking) {
            video.muted = false;
          }
        } catch (err) {
          console.error("Playback failed:", err);
          // 실패 시 무음으로라도 재생 시도 (아이폰 보안 통과용)
          video.muted = true;
          video.play();
        }
      };

      playVideo();
    }
  }, [isTalking, tutorId]);

  return (
    <div style={styles.videoArea}>
      <video 
        ref={videoRef}
        loop 
        playsInline 
        autoPlay
        style={styles.videoFit}
      />
    </div>
  );
}

const styles: any = {
  videoArea: { height: '55dvh', width: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' },
  videoFit: { width: '100%', height: '100%', objectFit: 'contain' },
};