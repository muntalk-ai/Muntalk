import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // level 정보를 추가로 받습니다.
    const { text, lang, gender, level } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not found' }, { status: 500 });
    }

    // 성별 설정
    const ssmlGender = gender === 'male' ? 'MALE' : 'FEMALE';

    // [핵심 로직] 레벨이 'Basic'이면 속도를 0.8로 늦추고, 아니면 정상 속도(1.0)
    // 사장님 취향에 따라 0.85 정도로 조절하셔도 좋습니다.
    const speakingRate = (level === 'Basic') ? 0.85 : 1.0;

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { 
            languageCode: lang, 
            ssmlGender: ssmlGender 
          },
          audioConfig: { 
            audioEncoding: 'MP3',
            speakingRate: speakingRate // 결정된 속도 적용
          },
        }),
      }
    );

    const data = await response.json();
    
    return NextResponse.json({ audioContent: data.audioContent });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}