'use client';
// hooks/useErrorTracking.ts — 경량 클라이언트 에러 트래킹 (PR-G)
// 전역 error / unhandledrejection을 수집해 /api/client-log로 전송.
// 과도 설계 금지: 세션당 최대 5건, 동일 메시지 중복 제거, fire-and-forget.
import { useEffect } from 'react';

const MAX_PER_SESSION = 5;
const seen = new Set<string>();
let sent = 0;

function report(kind: 'error' | 'unhandledrejection', message: string, stack?: string) {
  if (sent >= MAX_PER_SESSION) return;
  const key = `${kind}:${message}`;
  if (seen.has(key)) return;
  seen.add(key);
  sent += 1;
  try {
    fetch('/api/client-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        message: String(message).slice(0, 500),
        stack: String(stack || '').slice(0, 2000),
        url: typeof window !== 'undefined' ? window.location.pathname : '',
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* 리포팅 실패는 무시 */
  }
}

export function useErrorTracking() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      report('error', e.message || 'unknown error', e.error?.stack);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      report(
        'unhandledrejection',
        r instanceof Error ? r.message : String(r ?? 'unknown rejection'),
        r instanceof Error ? r.stack : undefined,
      );
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
}
