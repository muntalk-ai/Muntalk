'use client';

// BackButton — Muntuz 페이지 전용 뒤로가기 버튼 (Jay 2026-11-06).
// 히스토리가 있으면 브라우저 뒤로가기, 없으면 fallback 경로로 이동.
// Muntuz 페이지(Exchange·setup·login)에만 쓰고, muntalk.com 페이지와
// 랜딩(첫 화면이라 갈 곳이 없음)에는 쓰지 않는다.
import { useRouter } from 'next/navigation';

export default function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      aria-label="Back"
      className="flex shrink-0 items-center gap-0.5 rounded-full px-2 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      <span aria-hidden="true" className="text-lg leading-none">‹</span>
      Back
    </button>
  );
}
