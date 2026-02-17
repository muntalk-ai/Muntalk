import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    // 연결 테스트용 응답
    const testReply = `서버 연결 성공! 보낸 메시지: ${message}`;

    return NextResponse.json({ text: testReply });
  } catch (error) {
    return NextResponse.json({ error: "API 연결 실패" }, { status: 500 });
  }
}