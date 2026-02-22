'use client';

export default function TutorVideo({ tutorId, isTalking }: { tutorId: string, isTalking: boolean }) {
  return (
    <div style={styles.videoArea}>
      <video 
        src={`/videos/${tutorId}_idle.mp4`} 
        autoPlay loop muted playsInline 
        style={{ ...styles.videoFit, position: 'absolute', zIndex: 1, opacity: isTalking ? 0 : 1 }} 
      />
      <video 
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