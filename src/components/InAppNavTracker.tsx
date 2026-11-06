'use client';

// InAppNavTracker — 앱 내 네비게이션 여부를 sessionStorage에 기록.
// 첫 마운트(직접 진입)에는 기록하지 않고, 경로가 바뀔 때만 기록한다.
// BackButton이 "뒤로 갈 실제 페이지가 있는지" 판단하는 신호 중 하나.
// (새 탭의 window.history.length는 newtab 항목 때문에 1보다 커서
//  뒤로가기 판단에 쓸 수 없음 — PR #182 결함 수정.)
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function InAppNavTracker() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      sessionStorage.setItem('mt_in_app_nav', '1');
    } catch {
      // sessionStorage 사용 불가(비공개 모드 등) — 무시
    }
  }, [pathname]);
  return null;
}
