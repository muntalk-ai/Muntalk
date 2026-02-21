'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // 여기에 유저의 상태를 'Pro'로 변경하는 로직(Firebase DB 업데이트 등)을 넣습니다.
    alert("Payment Successful! You now have unlimited access.");
    router.push('/'); // 메인 화면으로 이동
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h1>Processing your upgrade... 🚀</h1>
    </div>
  );
}