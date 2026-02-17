import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, lang } = await req.json();

    // 1. 구글 API 키 (AIzaSy... 로 시작하는 키를 여기에 넣으세요)
    const GOOGLE_API_KEY = "AIzaSyCpYBpdsg4aXo3wVq_weCv69viDuDwF4Rw"; 

    // 2. 구글 제미나이 API 호출 (v1beta 버전 사용)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ 
              text: `You are a friendly and encouraging ${lang} tutor for the app 'muntalk'. 
              Answer in ${lang} or simple English to help the user learn.
              User message: ${message}` 
            }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        }
      }),
    });

    const data = await response.json();

    // 3. 상세 에러 체크
    if (!response.ok) {
      console.error("Gemini 상세 에러 내용:", JSON.stringify(data, null, 2));
      return NextResponse.json({ 
        text: `AI 에러: ${data.error?.message || '연결에 실패했습니다.'}` 
      });
    }

    // 4. 답변 추출 (Gemini의 응답 구조에 맞춤)
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const aiText = data.candidates[0].content.parts[0].text;
      return NextResponse.json({ text: aiText });
    } else {
      return NextResponse.json({ text: "AI가 답변을 생성하지 못했습니다." });
    }

  } catch (error) {
    console.error('서버 내부 에러:', error);
    return NextResponse.json(
      { text: "서버 연결 중 오류가 발생했습니다." }, 
      { status: 500 }
    );
  }
}