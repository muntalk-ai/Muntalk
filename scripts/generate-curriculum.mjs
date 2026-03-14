/**
 * generate-curriculum.mjs
 *
 * 상위 10개 언어의 전체 커리큘럼(72레슨 × vocab + quiz + tutorPrompt)을
 * Gemini API로 번역/생성하여 JSON 파일로 저장합니다.
 *
 * 실행:
 *   GEMINI_API_KEY=your_key node scripts/generate-curriculum.mjs
 *
 * 옵션:
 *   --lang ja-JP          특정 언어만 생성
 *   --lesson a1-1-1       특정 레슨만 생성
 *   --force               이미 생성된 파일도 재생성
 *   --resume              중단된 곳부터 재시작 (기본값)
 *
 * 결과:
 *   public/curriculum/{langCode}.json
 *   예) public/curriculum/ja-JP.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CURRICULUM_TS = path.join(__dirname, '../src/data/curriculum.ts');
const OUTPUT_DIR    = path.join(__dirname, '../public/curriculum');

// ── 상위 10개 학습 언어 ────────────────────────────────────────────────────
const TOP_LANGUAGES = [
  { code: 'ja-JP', label: 'Japanese',           native: '日本語'           },
  { code: 'ko-KR', label: 'Korean',              native: '한국어'           },
  { code: 'zh-CN', label: 'Chinese (Simplified)',native: '中文 (简体)'      },
  { code: 'zh-TW', label: 'Chinese (Traditional)',native:'中文 (繁體)'      },
  { code: 'es-ES', label: 'Spanish',             native: 'Español'         },
  { code: 'fr-FR', label: 'French',              native: 'Français'        },
  { code: 'de-DE', label: 'German',              native: 'Deutsch'         },
  { code: 'pt-BR', label: 'Portuguese',          native: 'Português'       },
  { code: 'it-IT', label: 'Italian',             native: 'Italiano'        },
  { code: 'ru-RU', label: 'Russian',             native: 'Русский'         },
];

// ── 환경변수 체크 ──────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY 환경변수가 없습니다.');
  console.error('   실행: GEMINI_API_KEY=your_key node scripts/generate-curriculum.mjs');
  process.exit(1);
}

// ── CLI 옵션 ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const langArg    = args[args.indexOf('--lang') + 1]    || null;
const lessonArg  = args[args.indexOf('--lesson') + 1]  || null;
const forceRegen = args.includes('--force');

// ── 커리큘럼 파싱 ──────────────────────────────────────────────────────────
function parseCurriculum() {
  const content = fs.readFileSync(CURRICULUM_TS, 'utf-8');

  const lessonIds = [...content.matchAll(/id: '([a-z]\d+-\d+-\d+)'/g)].map(m => m[1]);
  const positions = lessonIds.map(lid => ({ pos: content.indexOf(`id: '${lid}'`), lid }))
                              .sort((a, b) => a.pos - b.pos);

  const lessons = [];
  for (let i = 0; i < positions.length; i++) {
    const { pos, lid } = positions[i];
    const end   = i + 1 < positions.length ? positions[i + 1].pos : content.length;
    const block = content.slice(pos, end);

    // title, icon, xp
    const title = (block.match(/title: ['"]([^'"]+)['"]/)  || [])[1] || '';
    const icon  = (block.match(/icon: ['"]([^'"]+)['"]/)   || [])[1] || '📚';
    const xp    = parseInt((block.match(/xp: (\d+)/)       || [])[1] || '30');

    // vocab
    const vocabRaw = block.match(/vocab: \[([\s\S]*?)\]/)?.[1] || '';
    const vocab = [...vocabRaw.matchAll(
      /word: ['"]([^'"]+)['"],\s*phonetic: ['"]([^'"]+)['"],\s*meaning: ['"]([^'"]+)['"],\s*example: ['"]([^'"]+)['"]/g
    )].map(m => ({ word: m[1], phonetic: m[2], meaning: m[3], example: m[4] }));

    // quiz
    const quizRaw = block.match(/quiz: \[([\s\S]*?)\]/)?.[1] || '';
    const quiz = [...quizRaw.matchAll(
      /\{ q: ['"]([^'"]+)['"],\s*options: \[([^\]]+)\],\s*answer: (\d+)/g
    )].map(m => ({
      q:       m[1],
      options: [...m[2].matchAll(/['"]([^'"]+)['"]/g)].map(o => o[1]),
      answer:  parseInt(m[3]),
    }));

    // tutorPrompt (backtick template literal)
    const tutorPrompt = (block.match(/tutorPrompt: `([\s\S]*?)`/) || [])[1]?.trim() || '';

    lessons.push({ id: lid, title, icon, xp, vocab, quiz, tutorPrompt });
  }

  console.log(`📚 Parsed ${lessons.length} lessons from curriculum.ts`);
  return lessons;
}

// ── Gemini 호출 ────────────────────────────────────────────────────────────
async function callGemini(prompt, maxTokens = 3000) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
}

// ── 레슨 번역 프롬프트 ─────────────────────────────────────────────────────
function buildLessonPrompt(lesson, langLabel, langNative) {
  return `You are a professional language curriculum translator and creator.

Translate and adapt this English language lesson into ${langLabel} (${langNative}).

Original lesson (English):
- Title: ${lesson.title}
- Vocabulary: ${JSON.stringify(lesson.vocab)}
- Quiz questions: ${JSON.stringify(lesson.quiz)}
- Tutor prompt: ${lesson.tutorPrompt}

Your task:
1. "vocab": Translate each word/phrase INTO ${langLabel}. Keep the same structure:
   - "word": The ${langLabel} word/phrase
   - "phonetic": Pronunciation guide (romanization or IPA appropriate for ${langLabel})
   - "meaning": English translation/meaning (keep in English for reference)
   - "example": Example sentence IN ${langLabel}

2. "quiz": Adapt quiz questions for ${langLabel} learning:
   - Questions should test ${langLabel} vocabulary/grammar
   - Write questions IN English (for the learner to understand)
   - Write answer options IN ${langLabel}
   - Keep same number of questions and options
   - Keep "answer" index correct

3. "tutorPrompt": Rewrite the tutor prompt so the AI tutor teaches ${langLabel} instead of English:
   - Replace all English-specific references with ${langLabel} equivalents
   - Keep the same teaching style and structure
   - The tutor should speak ${langLabel} words/phrases during the lesson

Return ONLY valid JSON, no markdown:
{
  "vocab": [{"word":"...","phonetic":"...","meaning":"...","example":"..."}],
  "quiz": [{"q":"...","options":["...","...","...","..."],"answer":0}],
  "tutorPrompt": "..."
}`;
}

// ── 단일 레슨 생성 ─────────────────────────────────────────────────────────
async function generateLesson(lesson, lang, attempt = 1) {
  const prompt = buildLessonPrompt(lesson, lang.label, lang.native);
  try {
    const raw    = await callGemini(prompt, 2500);
    const parsed = JSON.parse(raw);

    if (!parsed.vocab || !parsed.quiz || !parsed.tutorPrompt) {
      throw new Error('Missing required fields in response');
    }
    if (parsed.vocab.length < Math.min(lesson.vocab.length, 3)) {
      throw new Error(`Only ${parsed.vocab.length} vocab items returned`);
    }

    return {
      id:          lesson.id,
      title:       lesson.title,
      icon:        lesson.icon,
      xp:          lesson.xp,
      vocab:       parsed.vocab,
      quiz:        parsed.quiz,
      tutorPrompt: parsed.tutorPrompt,
    };
  } catch (e) {
    if (attempt < 3) {
      console.warn(`    ⚠️  Attempt ${attempt} failed: ${e.message} — retrying...`);
      await sleep(3000);
      return generateLesson(lesson, lang, attempt + 1);
    }
    console.error(`    ❌ Failed after 3 attempts: ${e.message}`);
    // fallback: 원본 영어 반환
    return { ...lesson, _fallback: true };
  }
}

// ── 언어별 전체 생성 ───────────────────────────────────────────────────────
async function generateForLanguage(lang, lessons) {
  const outPath = path.join(OUTPUT_DIR, `${lang.code}.json`);

  // 기존 진행상황 로드 (resume 지원)
  let existing = {};
  if (fs.existsSync(outPath) && !forceRegen) {
    try {
      const data = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
      existing = Object.fromEntries((data.lessons || []).map(l => [l.id, l]));
      console.log(`  📂 Resuming — ${Object.keys(existing).length} lessons already done`);
    } catch { existing = {}; }
  }

  // 특정 레슨만 생성하는 경우
  const targets = lessonArg
    ? lessons.filter(l => l.id === lessonArg)
    : lessons.filter(l => !existing[l.id] || forceRegen);

  if (targets.length === 0) {
    console.log(`  ✅ Already complete — skipping`);
    return true;
  }

  console.log(`  📝 Generating ${targets.length} lessons...`);
  let success = 0, fallback = 0;

  for (let i = 0; i < targets.length; i++) {
    const lesson = targets[i];
    process.stdout.write(`    [${i+1}/${targets.length}] ${lesson.id}: ${lesson.title}... `);

    const result = await generateLesson(lesson, lang);
    existing[lesson.id] = result;

    if (result._fallback) {
      process.stdout.write(`⚠️  fallback\n`);
      fallback++;
    } else {
      process.stdout.write(`✅\n`);
      success++;
    }

    // 매 5레슨마다 중간 저장 (중단 대비)
    if ((i + 1) % 5 === 0 || i === targets.length - 1) {
      saveOutput(outPath, lang, lessons, existing);
      console.log(`    💾 Saved progress (${Object.keys(existing).length}/${lessons.length} lessons)`);
    }

    // rate limit 방지
    if (i < targets.length - 1) await sleep(2000);
  }

  saveOutput(outPath, lang, lessons, existing);
  console.log(`  ✅ Done — ${success} generated, ${fallback} fallback`);
  return fallback === 0;
}

function saveOutput(outPath, lang, lessons, existing) {
  // 원래 레슨 순서 유지
  const orderedLessons = lessons.map(l => existing[l.id] || l);
  fs.writeFileSync(outPath, JSON.stringify({
    langCode:    lang.code,
    langLabel:   lang.label,
    langNative:  lang.native,
    generatedAt: new Date().toISOString(),
    totalLessons: orderedLessons.length,
    lessons:     orderedLessons,
  }, null, 2), 'utf-8');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function updateIndex(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json');
  const index = {};
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
      index[data.langCode] = {
        langLabel:    data.langLabel,
        langNative:   data.langNative,
        totalLessons: data.totalLessons,
        generatedAt:  data.generatedAt,
      };
    } catch {}
  }
  fs.writeFileSync(
    path.join(dir, 'index.json'),
    JSON.stringify({ languages: index, updatedAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );
  console.log(`\n📋 index.json updated — ${files.length} languages`);
}

// ── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 MunTalk Curriculum Generator — Top 10 Languages');
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 커리큘럼 파싱
  const lessons = parseCurriculum();
  if (lessons.length === 0) {
    console.error('❌ No lessons parsed from curriculum.ts');
    process.exit(1);
  }

  // 대상 언어 필터
  const targets = langArg
    ? TOP_LANGUAGES.filter(l => l.code === langArg)
    : TOP_LANGUAGES;

  if (targets.length === 0) {
    console.error(`❌ Language not found: ${langArg}`);
    process.exit(1);
  }

  const totalLessons = targets.length * lessons.length;
  const estMinutes   = Math.ceil(totalLessons * 3 / 60);
  console.log(`🌐 Languages: ${targets.map(l => l.code).join(', ')}`);
  console.log(`📚 Lessons per language: ${lessons.length}`);
  console.log(`⏱️  Total API calls: ~${totalLessons} | Est. time: ~${estMinutes} min\n`);

  let langSuccess = 0, langFail = 0;

  for (let i = 0; i < targets.length; i++) {
    const lang = targets[i];
    console.log(`\n${'='.repeat(55)}`);
    console.log(`[${i+1}/${targets.length}] 🌐 ${lang.label} (${lang.code})`);
    console.log('='.repeat(55));

    const ok = await generateForLanguage(lang, lessons);
    if (ok) langSuccess++; else langFail++;

    // 언어 간 딜레이
    if (i < targets.length - 1) {
      console.log('\n⏳ Waiting 5s before next language...');
      await sleep(5000);
    }
  }

  updateIndex(OUTPUT_DIR);

  console.log('\n' + '='.repeat(55));
  console.log(`✅ Languages completed: ${langSuccess}`);
  if (langFail > 0) {
    console.log(`⚠️  Partial/failed:    ${langFail}`);
    console.log(`   Check fallback lessons and re-run with --force`);
  }
  console.log(`\n📁 Files saved to: ${OUTPUT_DIR}`);
  console.log('\n🎉 Done! Now run:');
  console.log('   git add public/curriculum/');
  console.log('   git commit -m "feat: pregenerated curriculum for 10 languages"');
  console.log('   git push');
}

main().catch(console.error);
