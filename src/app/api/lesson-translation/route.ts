// app/api/lesson-translation/route.ts — 레슨 벌크 번역 lazy 캐시 (read-through)
//
// LessonPlayer가 비영어 레슨에 진입할 때마다 Gemini로 재생성하던 벌크 번역을
// Firestore `lesson_translations`에 조합당 1회만 저장하고 재사용하기 위한 엔드포인트.
//   POST { action: 'get', lessonId, targetLang, nativeLang }
//     → { hit: true, data } | { hit: false }
//   POST { action: 'put', lessonId, targetLang, nativeLang, data: { vocab, quiz } }
//     → { ok: true }  (클라이언트에서 검증을 통과한 번역만 put 된다)
// Admin SDK를 쓰므로 Firestore rules와 무관하게 동작한다 (rules 변경 불필요).
// Admin 초기화는 lib/serverAuth의 lazy 패턴(getAdminDb)만 사용 — 모듈 로드 시점 초기화 금지.

import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getAdminDb, rateLimit, clientIp } from '@/lib/serverAuth';
import { apiError } from '@/lib/apiGuard';
import {
  LESSON_TRANSLATION_CACHE_VERSION,
  LESSON_TRANSLATIONS_COLLECTION,
  lessonTranslationDocId,
} from '@/lib/lessonTranslationCache';

// 번역 1건은 수 KB 수준 — 비정상적으로 큰 페이로드는 저장 거부 (남용/오염 방지)
const MAX_PAYLOAD_CHARS = 256_000;

interface CacheBody {
  action?: string;
  lessonId?: string;
  targetLang?: string;
  nativeLang?: string;
  data?: { vocab?: unknown; quiz?: unknown };
}

function isValidKeyPart(v: unknown): v is string {
  // 문서 ID 구성 요소 — 슬래시(경로 구분자) 포함 시 거부
  return typeof v === 'string' && v.length > 0 && v.length <= 128 && !v.includes('/');
}

function hasTranslationShape(data: unknown): data is { vocab: unknown[]; quiz: unknown[] } {
  if (!data || typeof data !== 'object') return false;
  const d = data as { vocab?: unknown; quiz?: unknown };
  return Array.isArray(d.vocab) && Array.isArray(d.quiz);
}

export async function POST(req: NextRequest) {
  let body: CacheBody;
  try {
    body = (await req.json()) as CacheBody;
  } catch {
    return apiError('Invalid JSON', 400);
  }

  const { action, lessonId, targetLang, nativeLang, data } = body ?? {};
  if (action !== 'get' && action !== 'put') {
    return apiError('Unknown action', 400);
  }
  if (!isValidKeyPart(lessonId) || !isValidKeyPart(targetLang) || !isValidKeyPart(nativeLang)) {
    return apiError('Missing or invalid lessonId/targetLang/nativeLang', 400);
  }

  // 공개 학습 콘텐츠 — 넉넉한 IP 기준 제한만 건다 (레슨 진입당 get 1회 + put 최대 1회)
  const ip = clientIp(req);
  if (!rateLimit(`lesson-tx:${action}:ip:${ip}`, 120, 60_000)) {
    return apiError('Rate limit exceeded', 429);
  }

  const docId = lessonTranslationDocId(lessonId, targetLang, nativeLang);

  try {
    const ref = getAdminDb().collection(LESSON_TRANSLATIONS_COLLECTION).doc(docId);

    if (action === 'get') {
      const snap = await ref.get();
      if (!snap.exists) return NextResponse.json({ hit: false });
      const cached = snap.data()?.data;
      // 저장 시 검증된 형태가 아니면 미스로 취급 (손상 데이터로 학습 화면을 깨지 않음)
      if (!hasTranslationShape(cached)) return NextResponse.json({ hit: false });
      return NextResponse.json({ hit: true, data: cached });
    }

    // action === 'put'
    if (!hasTranslationShape(data)) {
      return apiError('Invalid translation data: expected { vocab: [], quiz: [] }', 400);
    }
    const payload = { vocab: data.vocab, quiz: data.quiz };
    if (JSON.stringify(payload).length > MAX_PAYLOAD_CHARS) {
      return apiError('Translation payload too large', 413);
    }
    await ref.set({
      data: payload,
      version: LESSON_TRANSLATION_CACHE_VERSION,
      lessonId,
      targetLang,
      nativeLang,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Firestore 접근 실패는 미스와 구분해 502로 반환 — 클라이언트는 fail-open으로
    // Gemini 흐름을 타므로 사용자 영향은 없고, 로그로만 추적한다.
    console.error('[lesson-translation] storage error:', (e as Error).message);
    return apiError('Translation cache unavailable', 502);
  }
}
