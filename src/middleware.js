// src/middleware.js
import { NextResponse } from 'next/server';

// 이 함수가 반드시 'middleware'라는 이름으로 export 되어야 합니다.
export function middleware(request) {
  // 현재는 아무 작업도 하지 않고 통과시킵니다.
  return NextResponse.next();
}

// 미들웨어가 실행될 경로를 설정합니다. (필요 시 수정)
export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'], 
};