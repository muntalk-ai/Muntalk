/**
 * generate-placement-questions.mjs
 * 
 * 상위 10개 언어의 placement 문제를 Gemini로 사전 생성 → JSON 파일로 저장
 * 
 * 실행: node scripts/generate-placement-questions.mjs
 * 
 * 결과: public/placement-questions/{langCode}.json
 *       예) public/placement-questions/ja-JP.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/placement-questions');

// ── 상위 10개 언어 (학습자 수 기준) ──────────────────────────────────────
const TOP_LANGUAGES = [
  { code: 'en-US', native: 'English',    nativeLabel: 'Korean' },
  { code: 'ja-JP', native: '日本語',      nativeLabel: 'Korean' },
  { code: 'zh-CN', native: '普通话',      nativeLabel: 'Korean' },
  { code: 'es-ES', native: 'Español',    nativeLabel: 'Korean' },
  { code: 'fr-FR', native: 'Français',   nativeLabel: 'Korean' },
  { code: 'de-DE', native: 'Deutsch',    nativeLabel: 'Korean' },
  { code: 'ko-KR', native: '한국어',      nativeLabel: 'English' },
  { code: 'pt-BR', native: 'Português',  nativeLabel: 'Korean' },
  { code: 'ru-RU', native: 'Русский',    nativeLabel: 'Korean' },
  { code: 'it-IT', native: 'Italiano',   nativeLabel: 'Korean' },
];

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY 환경변수가 없습니다.');
  console.error('   실행: GEMINI_API_KEY=your_key node scripts/generate-placement-questions.mjs');
  process.exit(1);
}

function buildPrompt(langNative, nativeLangLabel) {
  return `You are a language assessment expert. Generate exactly 10 multiple-choice CEFR placement questions for a student learning ${langNative}. The student's native language is ${nativeLangLabel}.

Write all question text and answer options IN ${langNative} (the target language).

Rules:
- 2 questions each for levels: A1, A2, B1, B2, C1
- Each question has exactly 4 options
- Vary which index (0,1,2,3) is the correct answer — do NOT always use index 0
- Test grammar, vocabulary, or comprehension appropriate to each CEFR level

Return ONLY valid JSON, no markdown, no extra text:
{"questions":[{"id":1,"level":"a1","q":"...","options":["...","...","...","..."],"answer":2},...]}`;
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2000 },
    }),
  });
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
}

async function generateForLanguage(lang) {
  console.log(`\n🌐 Generating ${lang.native} (${lang.code})...`);
  
  // 3번 시도
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const prompt = buildPrompt(lang.native, lang.nativeLabel);
      const raw = await callGemini(prompt);
      const parsed = JSON.parse(raw);
      
      if (!parsed.questions || parsed.questions.length < 8) {
        throw new Error(`Only ${parsed.questions?.length} questions generated`);
      }

      // 저장
      const outPath = path.join(OUTPUT_DIR, `${lang.code}.json`);
      fs.writeFileSync(outPath, JSON.stringify({
        langCode:    lang.code,
        langNative:  lang.native,
        generatedAt: new Date().toISOString(),
        questions:   parsed.questions,
      }, null, 2), 'utf-8');

      console.log(`  ✅ ${lang.code}: ${parsed.questions.length} questions saved`);
      return true;
    } catch (e) {
      console.warn(`  ⚠️  Attempt ${attempt} failed: ${e.message}`);
      if (attempt < 3) await sleep(2000);
    }
  }
  console.error(`  ❌ ${lang.code}: failed after 3 attempts`);
  return false;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🚀 MunTalk Placement Question Generator');
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  
  // 출력 폴더 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('📂 Created output directory');
  }

  // 이미 생성된 파일 건너뛰기
  const existing = fs.readdirSync(OUTPUT_DIR).map(f => f.replace('.json', ''));
  const toGenerate = TOP_LANGUAGES.filter(l => !existing.includes(l.code));
  
  if (toGenerate.length === 0) {
    console.log('✅ All languages already generated!');
    return;
  }

  console.log(`\n📝 Will generate: ${toGenerate.map(l => l.code).join(', ')}`);
  console.log(`⏭️  Skipping existing: ${existing.join(', ') || 'none'}`);

  let success = 0, fail = 0;

  for (const lang of toGenerate) {
    const ok = await generateForLanguage(lang);
    if (ok) success++; else fail++;
    // Gemini rate limit 방지
    if (toGenerate.indexOf(lang) < toGenerate.length - 1) {
      await sleep(1500);
    }
  }

  console.log(`\n✅ Done! ${success} success, ${fail} failed`);
  console.log(`📁 Files saved to: ${OUTPUT_DIR}`);
  
  // 인덱스 파일 생성 (어떤 언어가 사전생성됐는지 앱에서 알 수 있게)
  const allFiles = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .map(f => f.replace('.json', ''));
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'index.json'),
    JSON.stringify({ pregenerated: allFiles, updatedAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );
  console.log(`📋 Index updated: ${allFiles.length} languages`);
}

main().catch(console.error);
