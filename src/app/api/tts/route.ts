import { NextRequest, NextResponse } from 'next/server';

// Google Cloud TTS supported voice map
// Reference: https://cloud.google.com/text-to-speech/docs/voices
const VOICE_MAP: Record<string, { f: string; m: string; lang: string }> = {
  // ── English variants ─────────────────────────────────────────────────
  'en-US': { f: 'en-US-Neural2-F',   m: 'en-US-Neural2-D',   lang: 'en-US' },
  'en-GB': { f: 'en-GB-Neural2-A',   m: 'en-GB-Neural2-B',   lang: 'en-GB' },
  'en-AU': { f: 'en-AU-Neural2-A',   m: 'en-AU-Neural2-B',   lang: 'en-AU' },
  'en-CA': { f: 'en-US-Neural2-F',   m: 'en-US-Neural2-D',   lang: 'en-US' },
  // ── East Asian ───────────────────────────────────────────────────────
  'ko-KR': { f: 'ko-KR-Neural2-A',   m: 'ko-KR-Neural2-C',   lang: 'ko-KR' },
  'ja-JP': { f: 'ja-JP-Neural2-B',   m: 'ja-JP-Neural2-C',   lang: 'ja-JP' },
  'zh-CN': { f: 'cmn-CN-Wavenet-A',  m: 'cmn-CN-Wavenet-B',  lang: 'cmn-CN' },
  'zh-TW': { f: 'cmn-TW-Wavenet-A',  m: 'cmn-TW-Wavenet-B',  lang: 'cmn-TW' },
  'zh-HK': { f: 'yue-HK-Standard-A', m: 'yue-HK-Standard-B', lang: 'yue-HK' },
  'yue-HK':{ f: 'yue-HK-Standard-A', m: 'yue-HK-Standard-B', lang: 'yue-HK' },
  // ── European ─────────────────────────────────────────────────────────
  'fr-FR': { f: 'fr-FR-Neural2-A',   m: 'fr-FR-Neural2-B',   lang: 'fr-FR' },
  'fr-CA': { f: 'fr-CA-Neural2-A',   m: 'fr-CA-Neural2-B',   lang: 'fr-CA' },
  'de-DE': { f: 'de-DE-Neural2-A',   m: 'de-DE-Neural2-B',   lang: 'de-DE' },
  'es-ES': { f: 'es-ES-Neural2-A',   m: 'es-ES-Neural2-B',   lang: 'es-ES' },
  'es-MX': { f: 'es-US-Neural2-A',   m: 'es-US-Neural2-B',   lang: 'es-US' },
  'it-IT': { f: 'it-IT-Neural2-A',   m: 'it-IT-Neural2-C',   lang: 'it-IT' },
  'pt-BR': { f: 'pt-BR-Neural2-A',   m: 'pt-BR-Neural2-B',   lang: 'pt-BR' },
  'pt-PT': { f: 'pt-PT-Wavenet-A',   m: 'pt-PT-Wavenet-B',   lang: 'pt-PT' },
  'nl-NL': { f: 'nl-NL-Wavenet-A',   m: 'nl-NL-Wavenet-B',   lang: 'nl-NL' },
  'pl-PL': { f: 'pl-PL-Wavenet-A',   m: 'pl-PL-Wavenet-B',   lang: 'pl-PL' },
  'ru-RU': { f: 'ru-RU-Wavenet-A',   m: 'ru-RU-Wavenet-B',   lang: 'ru-RU' },
  'sv-SE': { f: 'sv-SE-Wavenet-A',   m: 'sv-SE-Wavenet-B',   lang: 'sv-SE' },
  'nb-NO': { f: 'nb-NO-Wavenet-A',   m: 'nb-NO-Wavenet-B',   lang: 'nb-NO' },
  'no-NO': { f: 'nb-NO-Wavenet-A',   m: 'nb-NO-Wavenet-B',   lang: 'nb-NO' },
  'da-DK': { f: 'da-DK-Wavenet-A',   m: 'da-DK-Wavenet-C',   lang: 'da-DK' },
  'fi-FI': { f: 'fi-FI-Wavenet-A',   m: 'fi-FI-Wavenet-A',   lang: 'fi-FI' },
  'tr-TR': { f: 'tr-TR-Wavenet-A',   m: 'tr-TR-Wavenet-B',   lang: 'tr-TR' },
  'el-GR': { f: 'el-GR-Wavenet-A',   m: 'el-GR-Wavenet-A',   lang: 'el-GR' },
  'hu-HU': { f: 'hu-HU-Wavenet-A',   m: 'hu-HU-Wavenet-A',   lang: 'hu-HU' },
  'cs-CZ': { f: 'cs-CZ-Wavenet-A',   m: 'cs-CZ-Wavenet-A',   lang: 'cs-CZ' },
  'sk-SK': { f: 'sk-SK-Wavenet-A',   m: 'sk-SK-Wavenet-A',   lang: 'sk-SK' },
  'ro-RO': { f: 'ro-RO-Wavenet-A',   m: 'ro-RO-Wavenet-A',   lang: 'ro-RO' },
  'uk-UA': { f: 'uk-UA-Wavenet-A',   m: 'uk-UA-Wavenet-A',   lang: 'uk-UA' },
  'bg-BG': { f: 'bg-BG-Standard-A',  m: 'bg-BG-Standard-A',  lang: 'bg-BG' },
  'hr-HR': { f: 'hr-HR-Standard-A',  m: 'hr-HR-Standard-A',  lang: 'hr-HR' },
  'sr-RS': { f: 'sr-RS-Standard-A',  m: 'sr-RS-Standard-A',  lang: 'sr-RS' },
  'lv-LV': { f: 'lv-LV-Standard-A',  m: 'lv-LV-Standard-A',  lang: 'lv-LV' },
  'lt-LT': { f: 'lt-LT-Standard-A',  m: 'lt-LT-Standard-A',  lang: 'lt-LT' },
  'et-EE': { f: 'et-EE-Standard-A',  m: 'et-EE-Standard-A',  lang: 'et-EE' },
  'sl-SI': { f: 'sl-SI-Standard-A',  m: 'sl-SI-Standard-A',  lang: 'sl-SI' },
  'ca-ES': { f: 'ca-ES-Standard-A',  m: 'ca-ES-Standard-A',  lang: 'ca-ES' },
  'eu-ES': { f: 'eu-ES-Standard-A',  m: 'eu-ES-Standard-A',  lang: 'eu-ES' },
  'gl-ES': { f: 'gl-ES-Standard-A',  m: 'gl-ES-Standard-A',  lang: 'gl-ES' },
  'is-IS': { f: 'is-IS-Standard-A',  m: 'is-IS-Standard-A',  lang: 'is-IS' },
  'ga-IE': { f: 'ga-IE-Standard-A',  m: 'ga-IE-Standard-A',  lang: 'ga-IE' },
  'cy-GB': { f: 'cy-GB-Standard-A',  m: 'cy-GB-Standard-A',  lang: 'cy-GB' },
  'mt-MT': { f: 'mt-MT-Standard-A',  m: 'mt-MT-Standard-A',  lang: 'mt-MT' },
  'af-ZA': { f: 'af-ZA-Standard-A',  m: 'af-ZA-Standard-A',  lang: 'af-ZA' },
  // ── Middle East & South Asia ─────────────────────────────────────────
  'ar-XA': { f: 'ar-XA-Wavenet-A',   m: 'ar-XA-Wavenet-B',   lang: 'ar-XA' },
  'ar-SA': { f: 'ar-XA-Wavenet-A',   m: 'ar-XA-Wavenet-B',   lang: 'ar-XA' },
  'fa-IR': { f: 'fa-IR-Standard-A',  m: 'fa-IR-Standard-A',  lang: 'fa-IR' },
  'he-IL': { f: 'he-IL-Wavenet-A',   m: 'he-IL-Wavenet-B',   lang: 'he-IL' },
  'hi-IN': { f: 'hi-IN-Neural2-A',   m: 'hi-IN-Neural2-B',   lang: 'hi-IN' },
  'ur-IN': { f: 'ur-IN-Wavenet-A',   m: 'ur-IN-Wavenet-B',   lang: 'ur-IN' },
  'ur-PK': { f: 'ur-IN-Wavenet-A',   m: 'ur-IN-Wavenet-B',   lang: 'ur-IN' },
  'bn-IN': { f: 'bn-IN-Wavenet-A',   m: 'bn-IN-Wavenet-B',   lang: 'bn-IN' },
  'bn-BD': { f: 'bn-IN-Wavenet-A',   m: 'bn-IN-Wavenet-B',   lang: 'bn-IN' },
  'ta-IN': { f: 'ta-IN-Wavenet-A',   m: 'ta-IN-Wavenet-B',   lang: 'ta-IN' },
  'te-IN': { f: 'te-IN-Standard-A',  m: 'te-IN-Standard-B',  lang: 'te-IN' },
  'ml-IN': { f: 'ml-IN-Wavenet-A',   m: 'ml-IN-Wavenet-B',   lang: 'ml-IN' },
  'kn-IN': { f: 'kn-IN-Wavenet-A',   m: 'kn-IN-Wavenet-B',   lang: 'kn-IN' },
  'gu-IN': { f: 'gu-IN-Wavenet-A',   m: 'gu-IN-Wavenet-B',   lang: 'gu-IN' },
  'mr-IN': { f: 'mr-IN-Wavenet-A',   m: 'mr-IN-Wavenet-B',   lang: 'mr-IN' },
  'pa-IN': { f: 'pa-IN-Wavenet-A',   m: 'pa-IN-Wavenet-B',   lang: 'pa-IN' },
  // ── Southeast & Central Asia ─────────────────────────────────────────
  'vi-VN': { f: 'vi-VN-Wavenet-A',   m: 'vi-VN-Wavenet-B',   lang: 'vi-VN' },
  'th-TH': { f: 'th-TH-Neural2-C',   m: 'th-TH-Neural2-C',   lang: 'th-TH' },
  'id-ID': { f: 'id-ID-Wavenet-A',   m: 'id-ID-Wavenet-B',   lang: 'id-ID' },
  'ms-MY': { f: 'ms-MY-Wavenet-A',   m: 'ms-MY-Wavenet-B',   lang: 'ms-MY' },
  'tl-PH': { f: 'fil-PH-Wavenet-A',  m: 'fil-PH-Wavenet-B',  lang: 'fil-PH' },
  'km-KH': { f: 'km-KH-Standard-A',  m: 'km-KH-Standard-A',  lang: 'km-KH' },
  'my-MM': { f: 'my-MM-Standard-A',  m: 'my-MM-Standard-A',  lang: 'my-MM' },
  'lo-LA': { f: 'lo-LA-Standard-A',  m: 'lo-LA-Standard-A',  lang: 'lo-LA' },
  'kk-KZ': { f: 'kk-KZ-Standard-A',  m: 'kk-KZ-Standard-A',  lang: 'kk-KZ' },
  'ky-KG': { f: 'ky-KG-Standard-A',  m: 'ky-KG-Standard-A',  lang: 'ky-KG' },
  'mn-MN': { f: 'mn-MN-Standard-A',  m: 'mn-MN-Standard-A',  lang: 'mn-MN' },
  'uz-UZ': { f: 'uz-UZ-Standard-A',  m: 'uz-UZ-Standard-A',  lang: 'uz-UZ' },
  // ── African ──────────────────────────────────────────────────────────
  'sw-KE': { f: 'sw-KE-Standard-A',  m: 'sw-KE-Standard-B',  lang: 'sw-KE' },
  'sw-TZ': { f: 'sw-TZ-Standard-A',  m: 'sw-TZ-Standard-B',  lang: 'sw-TZ' },
  'zu-ZA': { f: 'zu-ZA-Standard-A',  m: 'zu-ZA-Standard-A',  lang: 'zu-ZA' },
  'xh-ZA': { f: 'xh-ZA-Standard-A',  m: 'xh-ZA-Standard-A',  lang: 'xh-ZA' },
  'am-ET': { f: 'am-ET-Standard-A',  m: 'am-ET-Standard-B',  lang: 'am-ET' },
};

export async function POST(req: NextRequest) {
  try {
    const { text, lang = 'en-US', gender = 'female', speed = 0.95, level } = await req.json();

    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_TTS_API_KEY not set' }, { status: 500 });
    }

    if (!text?.trim()) {
      return NextResponse.json({ audioContent: null });
    }

    // Look up voice — fallback to en-US if language not supported
    const voiceEntry = VOICE_MAP[lang];
    if (!voiceEntry) {
     console.warn(`[tts] No voice for lang=${lang}, using en-US fallback`);
    }
    const entry = voiceEntry || VOICE_MAP['en-US'];
    const isFemale = !gender || gender === 'female' || gender === 'FEMALE';
    const voiceName = isFemale ? entry.f : entry.m;
    const langCode  = entry.lang;

    // Adjust speed for level
    const speakRate = level === 'a1' ? 0.80
                    : level === 'a2' ? 0.85
                    : level === 'b1' ? 0.90
                    : 0.95;

    const body = {
      input: { text },
      voice: { languageCode: langCode, name: voiceName },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speed || speakRate,
        pitch: 0,
        effectsProfileId: ['headphone-class-device'],
      },
    };

    const res = await fetch(
     `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`[tts] Google TTS error lang=${lang} voice=${voiceName}:`, err);
      // Return empty instead of error so UI doesn't break
      return NextResponse.json({ audioContent: null, error: 'TTS failed' });
    }

    const data = await res.json();
    return NextResponse.json({ audioContent: data.audioContent });

  } catch (e: any) {
    console.error('[tts] route error:', e);
    return NextResponse.json({ audioContent: null, error: e.message }, { status: 500 });
  }
}
