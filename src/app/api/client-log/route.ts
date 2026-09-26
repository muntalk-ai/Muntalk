// app/api/client-log/route.ts — 클라이언트 에러 수집 엔드포인트 (PR-G)
// useErrorTracking 훅에서 전송. admin_logs 컬렉션에 기록 → 어드민 Logs 탭에서 확인.
// 스팸 방지: IP당 분당 20건 레이트리밋 + body 검증. 인증 불필요(에러는 비로그인에서도 발생).
import { NextRequest } from 'next/server';
import { checkRateLimit, clientIp, apiError } from '@/lib/apiGuard';
import { FieldValue } from 'firebase-admin/firestore';
// firebaseAdmin은 요청 시점에 lazy import — 빌드 시점의 page-data 수집에서
// 서비스 계정 초기화가 터지는 것을 방지 (Vercel 프로덕션에는 실제 키 존재).

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`client-log:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return apiError('rate limited', 429);

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return apiError('invalid json', 400);
  }
  const kind = body?.kind === 'unhandledrejection' ? 'unhandledrejection' : 'error';
  const message = String(body?.message || '').slice(0, 500);
  if (!message) return apiError('empty', 400);
  const stack = String(body?.stack || '').slice(0, 2000);
  const url = String(body?.url || '').slice(0, 200);

  try {
    const { adminDb } = await import('@/lib/firebaseAdmin');
    await adminDb.collection('admin_logs').add({
      // 어드민 Logs 탭의 기존 필드 규격(action/targetEmail/detail)에 맞춤
      action: `client-${kind}`,
      targetEmail: url || '(unknown page)',
      adminEmail: 'system',
      detail: message + (stack ? ` | ${stack.slice(0, 300)}` : ''),
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch {
    return apiError('store failed', 500);
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
