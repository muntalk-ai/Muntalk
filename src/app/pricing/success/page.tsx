'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function SuccessContent() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [count, setCount] = useState(5);

  useEffect(() => {
    if (user) refreshProfile();
    const timer = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(timer); router.push('/lingua'); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)', fontFamily:"'Syne',sans-serif" }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;600&display=swap');
      @keyframes pop { 0%{transform:scale(0)} 70%{transform:scale(1.1)} 100%{transform:scale(1)} }
      @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }` }} />
      <div style={{ textAlign:'center', padding:40 }}>
        <div style={{ fontSize:80, marginBottom:20, animation:'pop .5s ease' }}>🎉</div>
        <h1 style={{ fontSize:32, fontWeight:800, color:'#0F172A', marginBottom:12, animation:'fadeUp .5s ease .1s both' }}>
          Welcome to Premium!
        </h1>
        <p style={{ fontSize:16, color:'#64748B', marginBottom:8, fontFamily:"'DM Sans',sans-serif", animation:'fadeUp .5s ease .2s both' }}>
          Your subscription is now active. All levels unlocked!
        </p>
        <p style={{ fontSize:14, color:'#94A3B8', fontFamily:"'DM Sans',sans-serif", animation:'fadeUp .5s ease .3s both' }}>
          Redirecting in {count}s…
        </p>
        <button onClick={() => router.push('/lingua')}
          style={{ marginTop:24, padding:'13px 32px', borderRadius:16, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:"'Syne',sans-serif", animation:'fadeUp .5s ease .4s both' }}>
          Start Learning Now →
        </button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}
