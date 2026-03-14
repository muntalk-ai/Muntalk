/**
 * generate-placement-questions.mjs
 *
 * 65개 학습 언어의 placement 문제를 Gemini로 사전 생성 → JSON 파일로 저장
 *
 * 실행:
 *   GEMINI_API_KEY=your_key node scripts/generate-placement-questions.mjs
 *
 * 옵션:
 *   --only en-US,ja-JP   특정 언어만 생성
 *   --force              이미 생성된 파일도 재생성
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/placement-questions');

const ALL_LANGUAGES = [
  { code: 'en-US', native: 'English'               },
  { code: 'en-GB', native: 'English'               },
  { code: 'es-ES', native: 'Spanish'               },
  { code: 'es-MX', native: 'Spanish'               },
  { code: 'fr-FR', native: 'French'                },
  { code: 'de-DE', native: 'German'                },
  { code: 'it-IT', native: 'Italian'               },
  { code: 'pt-BR', native: 'Portuguese'            },
  { code: 'pt-PT', native: 'Portuguese'            },
  { code: 'ru-RU', native: 'Russian'               },
  { code: 'nl-NL', native: 'Dutch'                 },
  { code: 'pl-PL', native: 'Polish'                },
  { code: 'sv-SE', native: 'Swedish'               },
  { code: 'da-DK', native: 'Danish'                },
  { code: 'nb-NO', native: 'Norwegian'             },
  { code: 'fi-FI', native: 'Finnish'               },
  { code: 'cs-CZ', native: 'Czech'                 },
  { code: 'sk-SK', native: 'Slovak'                },
  { code: 'hu-HU', native: 'Hungarian'             },
  { code: 'ro-RO', native: 'Romanian'              },
  { code: 'el-GR', native: 'Greek'                 },
  { code: 'tr-TR', native: 'Turkish'               },
  { code: 'uk-UA', native: 'Ukrainian'             },
  { code: 'bg-BG', native: 'Bulgarian'             },
  { code: 'hr-HR', native: 'Croatian'              },
  { code: 'sl-SI', native: 'Slovenian'             },
  { code: 'sr-RS', native: 'Serbian'               },
  { code: 'et-EE', native: 'Estonian'              },
  { code: 'lv-LV', native: 'Latvian'               },
  { code: 'lt-LT', native: 'Lithuanian'            },
  { code: 'ca-ES', native: 'Catalan'               },
  { code: 'ja-JP', native: 'Japanese'              },
  { code: 'ko-KR', native: 'Korean'                },
  { code: 'zh-CN', native: 'Chinese (Simplified)'  },
  { code: 'zh-TW', native: 'Chinese (Traditional)' },
  { code: 'hi-IN', native: 'Hindi'                 },
  { code: 'bn-IN', native: 'Bengali'               },
  { code: 'gu-IN', native: 'Gujarati'              },
  { code: 'kn-IN', native: 'Kannada'               },
  { code: 'ta-IN', native: 'Tamil'                 },
  { code: 'te-IN', native: 'Telugu'                },
  { code: 'ml-IN', native: 'Malayalam'             },
  { code: 'mr-IN', native: 'Marathi'               },
  { code: 'pa-IN', native: 'Punjabi'               },
  { code: 'vi-VN', native: 'Vietnamese'            },
  { code: 'th-TH', native: 'Thai'                  },
  { code: 'id-ID', native: 'Indonesian'            },
  { code: 'ms-MY', native: 'Malay'                 },
  { code: 'tl-PH', native: 'Filipino'              },
  { code: 'km-KH', native: 'Khmer'                 },
  { code: 'lo-LA', native: 'Lao'                   },
  { code: 'si-LK', native: 'Sinhala'               },
  { code: 'yue-HK',native: 'Cantonese'             },
  { code: 'ar-XA', native: 'Arabic'                },
  { code: 'he-IL', native: 'Hebrew'                },
  { code: 'fa-IR', native: 'Persian'               },
  { code: 'ur-IN', native: 'Urdu'                  },
  { code: 'sw-KE', native: 'Swahili'               },
  { code: 'af-ZA', native: 'Afrikaans'             },
  { code: 'az-AZ', native: 'Azerbaijani'           },
  { code: 'ka-GE', native: 'Georgian'              },
  { code: 'hy-AM', native: 'Armenian'              },
  { code: 'ne-NP', native: 'Nepali'                },
  { code: 'my-MM', native: 'Burmese'               },
];

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY 환경변수가 없습니다.');
  console.error('   실행: GEMINI_API_KEY=your_key node scripts/generate-placement-questions.mjs');
  process.exit(1);
}

const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const forceRegen = args.includes('--force');
const onlyCodes = onlyIdx !== -1 ? args[onlyIdx + 1]?.split(',') : null;

function buildPrompt(langNative) {
  return `You are a language assessment expert. Generate exactly 20 multiple-choice CEFR placement questions for a student learning ${langNative}.

Write ALL question text and ALL answer options IN ${langNative} (the target language being tested).

Rules:
- 4 questions each for levels: A1, A2, B1, B2, C1 (total 20)
- Each question has exactly 4 answer options
- Vary which index (0,1,2,3) is correct — do NOT default to index 0
- Test grammar, vocabulary, or reading comprehension appropriate to each level
- Make difficulty clearly distinct across levels

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
      generationConfig: { temperature: 0.5, maxOutputTokens: 4000 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
}

async function generateForLanguage(lang) {
  console.log(`\n🌐 [${lang.code}] ${lang.native}...`);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await callGemini(buildPrompt(lang.native));
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.questions) || parsed.questions.length < 10) {
        throw new Error(`Only ${parsed.questions?.length ?? 0} questions`);
      }
      const levelCounts = { a1:0, a2:0, b1:0, b2:0, c1:0 };
      parsed.questions.forEach(q => { if (levelCounts[q.level] !== undefined) levelCounts[q.level]++; });
      console.log(`  📊 ${JSON.stringify(levelCounts)}`);

      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${lang.code}.json`),
        JSON.stringify({ langCode: lang.code, langNative: lang.native, generatedAt: new Date().toISOString(), questions: parsed.questions }, null, 2),
        'utf-8'
      );
      console.log(`  ✅ ${parsed.questions.length} questions saved`);
      return true;
    } catch (e) {
      console.warn(`  ⚠️  Attempt ${attempt}/3: ${e.message}`);
      if (attempt < 3) await sleep(3000);
    }
  }
  console.error(`  ❌ Failed after 3 attempts`);
  return false;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function updateIndex() {
  const allFiles = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .map(f => f.replace('.json', ''));
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'index.json'),
    JSON.stringify({ pregenerated: allFiles, count: allFiles.length, updatedAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );
  console.log(`\n📋 index.json updated — ${allFiles.length} / 65 languages`);
}

async function main() {
  console.log('🚀 MunTalk Placement Question Generator — 65 Languages');
  console.log(`📁 ${OUTPUT_DIR}`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let targets = onlyCodes ? ALL_LANGUAGES.filter(l => onlyCodes.includes(l.code)) : ALL_LANGUAGES;

  if (!forceRegen) {
    const existing = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json') && f !== 'index.json').map(f => f.replace('.json',''));
    const skip = targets.filter(l => existing.includes(l.code));
    targets = targets.filter(l => !existing.includes(l.code));
    if (skip.length) console.log(`⏭️  Skipping ${skip.length} existing: ${skip.map(l=>l.code).join(', ')}`);
  }

  if (targets.length === 0) {
    console.log('✅ All done! Use --force to regenerate.');
    return updateIndex();
  }

  console.log(`\n📝 Generating ${targets.length} languages...`);
  console.log(`⏱️  Est. time: ~${Math.ceil(targets.length * 5 / 60)} minutes\n`);

  let success = 0, fail = 0;
  const failed = [];

  for (let i = 0; i < targets.length; i++) {
    console.log(`[${i+1}/${targets.length}]`);
    const ok = await generateForLanguage(targets[i]);
    if (ok) success++; else { fail++; failed.push(targets[i].code); }
    if (i < targets.length - 1) await sleep(2500); // rate limit 방지
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Success: ${success}   ❌ Failed: ${fail}`);
  if (failed.length) console.log(`   Retry: --only ${failed.join(',')}`);
  updateIndex();
}

main().catch(console.error);
