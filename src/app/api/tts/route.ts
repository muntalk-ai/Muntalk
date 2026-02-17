// src/app/api/tts/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, lang, gender } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not found' }, { status: 500 });
    }

    // 성별에 따라 구글 TTS 목소리 매칭 (MALE / FEMALE)
    const ssmlGender = gender === 'male' ? 'MALE' : 'FEMALE';

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { 
            languageCode: lang, // 예: 'en-US' 또는 'ko-KR'
            ssmlGender: ssmlGender 
          },
          audioConfig: { 
            audioEncoding: 'MP3',
            speakingRate: 1.0 // 말하기 속도
          },
        }),
      }
    );

    const data = await response.json();
    
    // Base64로 인코딩된 오디오 데이터 반환
    return NextResponse.json({ audioContent: data.audioContent });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}