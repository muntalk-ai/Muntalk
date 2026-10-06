import { NextRequest, NextResponse } from 'next/server';
import {
  getIdentity, checkRateLimit, clientIp, fetchWithTimeout, isAdminEmail,
  checkDailyLimit, DAILY_CAP_TTS_USER, DAILY_CAP_TTS_GUEST,
} from '@/lib/apiGuard';
import { cleanTtsText } from '@/lib/stripEmojis';

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
  'es-ES': { f: 'es-ES-Neural2-C',   m: 'es-ES-Neural2-B',   lang: 'es-ES' },
  'es-MX': { f: 'es-US-Neural2-C',   m: 'es-US-Neural2-B',   lang: 'es-US' },
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
  // ── African ──────────────────────────────────────────────────────────
  'sw-KE': { f: 'sw-KE-Standard-A',  m: 'sw-KE-Standard-B',  lang: 'sw-KE' },
  'sw-TZ': { f: 'sw-TZ-Standard-A',  m: 'sw-TZ-Standard-B',  lang: 'sw-TZ' },
  'zu-ZA': { f: 'zu-ZA-Standard-A',  m: 'zu-ZA-Standard-A',  lang: 'zu-ZA' },
  'xh-ZA': { f: 'xh-ZA-Standard-A',  m: 'xh-ZA-Standard-A',  lang: 'xh-ZA' },
  'am-ET': { f: 'am-ET-Standard-A',  m: 'am-ET-Standard-B',  lang: 'am-ET' },
};

// ── In-memory LRU cache: identical (lang, gender, speed, level, text)
// requests reuse previously generated audio instead of burning another
// TTS API call (quota). Module scope = shared across requests in this
// serverless instance. Only successful audio is cached — failures never.
const TTS_CACHE_MAX = 300;
const ttsCache = new Map<string, { audioContent: string; mimeType?: string }>();
function ttsCacheKey(lang: string, gender: string, speed: unknown, level: unknown, text: string) {
  return `${lang}:${gender}:${speed ?? ''}:${level ?? ''}:${text}`;
}
function ttsCacheGet(key: string) {
  const hit = ttsCache.get(key);
  if (hit) { ttsCache.delete(key); ttsCache.set(key, hit); } // refresh LRU order
  return hit;
}
function ttsCacheSet(key: string, val: { audioContent: string; mimeType?: string }) {
  if (ttsCache.has(key)) ttsCache.delete(key);
  else if (ttsCache.size >= TTS_CACHE_MAX) {
    const oldest = ttsCache.keys().next().value;
    if (oldest !== undefined) ttsCache.delete(oldest);
  }
  ttsCache.set(key, val);
}

// Prepend a 44-byte WAV header (16-bit PCM mono 24kHz) to raw audio bytes.
// Gemini TTS models return either WAV (gemini-3.8-flash-tts) or raw PCM
// (older preview models); this normalizes the latter so the client can
// always play `audio/wav`.
function addWavHeader(pcm: Uint8Array): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(24000, 24);
  header.writeUInt32LE(24000 * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * Gemini native speech generation fallback for languages Google Cloud TTS
 * has no voice for. Sends the raw text only — any instruction prefix (e.g.
 * "Read aloud in Burmese, slowly and clearly:") gets vocalized by the model,
 * so the user would hear it spoken before every word. Gemini auto-detects
 * the language from the script; no prefix needed.
 */
async function geminiTts(text: string, gender: string, lang: string, cacheKey: string) {
  const gemKey = process.env.GEMINI_API_KEY;
  if (!gemKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }
  try {
    const isFemale = !gender || gender === 'female' || gender === 'FEMALE';
    const voiceName = isFemale ? 'Kore' : 'Charon';
    const gres = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent?key=${gemKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text.trim() }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
          },
        }) },
      30000
    );
    if (!gres.ok) {
      const err = await gres.text();
      console.error(`[tts] Gemini TTS error lang=${lang}:`, err.slice(0, 200));
      return NextResponse.json({ audioContent: null, error: 'TTS failed' });
    }
    const gdata = await gres.json();
    const parts: any[] = gdata?.candidates?.[0]?.content?.parts ?? [];
    const b64 = parts.find((p: any) => p?.inlineData?.data)?.inlineData?.data;
    if (!b64) {
      console.error(`[tts] Gemini TTS returned no audio lang=${lang}`);
      return NextResponse.json({ audioContent: null, error: 'TTS failed' });
    }
    const decoded = Buffer.from(b64, 'base64');
    // gemini-3.8-flash-tts returns WAV already; older models return raw
    // PCM — normalize to WAV so the client can play it uniformly.
    const wav: Buffer = decoded.subarray(0, 4).toString() !== 'RIFF'
      ? addWavHeader(decoded)
      : decoded;
    const out = { audioContent: wav.toString('base64'), mimeType: 'audio/wav' };
    ttsCacheSet(cacheKey, out);
    return NextResponse.json(out);
  } catch (e) {
    console.error('[tts] Gemini TTS exception:', e);
    return NextResponse.json({ audioContent: null, error: 'TTS failed' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text, lang = 'en-US', gender = 'female', speed = 0.95, level } = await req.json();

    // ── 이모지·기호 제거: TTS가 학습 문장만 읽도록 (전 수업 공통) ──
    const cleanText: string = cleanTtsText(typeof text === 'string' ? text : '');

    // ── PR-F: abuse guards ──
    // 로그인 유저: UID 기준 분당 30회. 게스트: IP 기준 분당 10회. text 500자 캡.
    const id = await getIdentity(req);
    const rlKey = id ? `tts:uid:${id.uid}` : `tts:ip:${clientIp(req)}`;
    const rl = checkRateLimit(rlKey, id ? 30 : 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ audioContent: null, error: 'Rate limit exceeded' }, { status: 429 });
    }
    // ── PR #111: 유저당 일일 상한 (영속 카운터, 어드민 제외) ──
    if (!isAdminEmail(id?.email)) {
      const dailyMax = id ? DAILY_CAP_TTS_USER : DAILY_CAP_TTS_GUEST;
      const dl = await checkDailyLimit('tts', id ? `uid:${id.uid}` : `ip:${clientIp(req)}`, dailyMax);
      if (!dl.ok) {
        return NextResponse.json(
          { audioContent: null, error: `Daily TTS limit reached (${dailyMax}/day) — resets at midnight UTC`, retryAfterSec: dl.retryAfterSec },
          { status: 429 },
        );
      }
    }
    if (cleanText.length > 500) {
      return NextResponse.json({ audioContent: null, error: 'Text too long (max 500 chars)' }, { status: 413 });
    }

    if (!cleanText) {
      return NextResponse.json({ audioContent: null });
    }

    // ── Cache hit: serve previously generated audio without an API call ──
    const key = ttsCacheKey(lang, gender, speed, level, cleanText);
    const cached = ttsCacheGet(key);
    if (cached) {
      return NextResponse.json(cached.mimeType
        ? { audioContent: cached.audioContent, mimeType: cached.mimeType }
        : { audioContent: cached.audioContent });
    }

    // ── Gemini TTS fallback: any language Google Cloud TTS has no voice ──
    // for is served by Gemini's native speech generation instead of
    // returning unsupported_language. Verified 2026-09-27 with
    // gemini-3.8-flash-tts (real audio returned): my (Burmese), mn
    // (Mongolian), kk (Kazakh), ky (Kyrgyz), uz (Uzbek), lo (Lao).
    // (Never fall back to an en-US voice: wrong-language audio is worse than none.)
    const voiceEntry = VOICE_MAP[lang];
    if (!voiceEntry) {
      return geminiTts(cleanText, gender, lang, key);
    }

    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_TTS_API_KEY not set' }, { status: 500 });
    }
    const entry = voiceEntry;
    const isFemale = !gender || gender === 'female' || gender === 'FEMALE';
    const voiceName = isFemale ? entry.f : entry.m;
    const langCode  = entry.lang;

    // Adjust speed for level
    const speakRate = level === 'a1' ? 0.80
                    : level === 'a2' ? 0.85
                    : level === 'b1' ? 0.90
                    : 0.95;

    const body = {
      input: { text: cleanText },
      voice: { languageCode: langCode, name: voiceName },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speed || speakRate,
        pitch: 0,
        effectsProfileId: ['headphone-class-device'],
      },
    };

    const res = await fetchWithTimeout(
     `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      30000
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`[tts] Google TTS error lang=${lang} voice=${voiceName}:`, err);
      // Include Google's message in the response for debugging (visible in
      // devtools/network and server logs, not shown to end users).
      let detail = '';
      try { detail = String(JSON.parse(err)?.error?.message ?? err).slice(0, 140); }
      catch { detail = err.slice(0, 140); }
      // Return empty instead of error so UI doesn't break
      return NextResponse.json({ audioContent: null, error: 'TTS failed', detail });
    }

    const data = await res.json();
    if (data.audioContent) ttsCacheSet(key, { audioContent: data.audioContent });
    return NextResponse.json({ audioContent: data.audioContent });

  } catch (e: any) {
    console.error('[tts] route error:', e);
    // UI 호환을 위해 shape 유지, 메시지는 일반화
    return NextResponse.json({ audioContent: null, error: 'Internal server error' }, { status: 500 });
  }
}
