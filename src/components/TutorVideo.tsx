'use client';
import { useEffect, useRef } from 'react';

export default function TutorVideo({ tutorId, isTalking }: { tutorId: string, isTalking: boolean }) {
  const talkRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // AI가 말할 때 talk 비디오를 강제로 틀어줌
    if (isTalking && talkRef.current) {
      talkRef.current.play().catch(() => {
        console.log("Play failed, but it's okay");
      });
    }
  }, [isTalking]);

  return (
    <div style={styles.videoArea}>
      <video 
        id="idle-video"
        src={`/videos/${tutorId}_idle.mp4`} 
        autoPlay loop muted playsInline 
        style={{ ...styles.videoFit, position: 'absolute', zIndex: 1, opacity: isTalking ? 0 : 1 }} 
      />
      <video 
        ref={talkRef}
        id="talk-video"
        src={`/videos/${tutorId}_talk.mp4`} 
        loop muted playsInline 
        style={{ ...styles.videoFit, position: 'absolute', zIndex: 2, opacity: isTalking ? 1 : 0 }}
      />
    </div>
  );
}

const styles: any = {
  videoArea: { height: '55dvh', width: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' },
  videoFit: { width: '100%', height: '100%', objectFit: 'contain' },
};