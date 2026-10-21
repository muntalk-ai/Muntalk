// lib/lessonTranslationCache.ts — 레슨 벌크 번역 lazy 캐시의 공유 상수 (순수 모듈)
//
// 클라이언트(LessonPlayer)와 서버(/api/lesson-translation)가 함께 import한다.
// firebase-admin 등 서버 전용 모듈을 절대 import하지 말 것 — 클라이언트 번들에 포함된다.
//
// 동작: 검증(validateBulkTranslation)을 통과한 레슨 번역만 Firestore
// `lesson_translations` 컬렉션에 (레슨 × 학습어 × 모국어) 조합당 1회 저장하고,
// 이후 같은 조합은 Gemini를 다시 부르지 않고 캐시를 재사용한다 (read-through).
//
// 무효화: 번역 프롬프트/검증 규칙이 바뀌면 LESSON_TRANSLATION_CACHE_VERSION을
// 올린다. 문서 ID에 버전이 포함되므로 구버전 문서는 자연히 조회되지 않는다
// (구 문서는 남지만 무해 — 필요 시 콘솔에서 컬렉션째 삭제).

export const LESSON_TRANSLATION_CACHE_VERSION = 1;

export const LESSON_TRANSLATIONS_COLLECTION = 'lesson_translations';

/** Firestore 문서 ID: `${lessonId}__${targetLang}__${nativeLang}__v${VERSION}` */
export function lessonTranslationDocId(
  lessonId: string,
  targetLang: string,
  nativeLang: string,
): string {
  return `${lessonId}__${targetLang}__${nativeLang}__v${LESSON_TRANSLATION_CACHE_VERSION}`;
}
