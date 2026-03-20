import { NextResponse } from 'next/server';

// ⚠️  임시 디버그 — 확인 후 이 파일 삭제할 것
export async function GET() {
  return NextResponse.json({
    GEMINI_API_KEY:              process.env.GEMINI_API_KEY       ? '✅ SET' : '❌ MISSING',
    NEXT_PUBLIC_GEMINI_API_KEY:  process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '✅ SET' : '❌ MISSING',
    GOOGLE_TTS_API_KEY:          process.env.GOOGLE_TTS_API_KEY   ? '✅ SET' : '❌ MISSING',
    FIREBASE_API_KEY:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ SET' : '❌ MISSING',
    FIREBASE_PROJECT_ID:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ SET' : '❌ MISSING',
    NODE_ENV:                    process.env.NODE_ENV,
  });
}
