'use client';

// BackButton — Muntuz 페이지 전용 뒤로가기 버튼 (Jay 2026-11-06).
// 뒤로 갈 실제 페이지가 있으면 브라우저 뒤로가기, 없으면 fallback 경로로 이동.
// 판단 신호 2개 (둘 중 하나라도 참이면 뒤로가기):
//  1. InAppNavTracker가 기록한 앱 내 네비게이션 (sessionStorage 'mt_in_app_nav')
//  2. 같은 origin referrer (전체 페이지 이동으로 들어온 경우)
// window.history.length는 쓰지 않음 — 새 탭의 히스토리에도 newtab 항목이
// 들어 있어 직접 진입인데도 1보다 커서, 뒤로가기가 chrome://newtab/으로
// 튀는 결함이 있었음 (PR #182).
// Muntuz 페이지(Exchange·setup·login)에만 쓰고, muntalk.com 페이지와
// 랜딩(첫 화면이라 갈 곳이 없음)에는 쓰지 않는다.
import { useRouter } from 'next/navigation';

export default function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        let inAppNav = false;
        try {
          inAppNav = sessionStorage.getItem('mt_in_app_nav') === '1';
        } catch {
          // sessionStorage 사용 불가(비공개 모드 등) — referrer만으로 판단
        }
        const sameOriginReferrer =
          typeof document !== 'undefined' &&
          document.referrer.startsWith(window.location.origin);
        if (inAppNav || sameOriginReferrer) router.back();
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
