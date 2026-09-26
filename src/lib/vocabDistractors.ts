// lib/vocabDistractors.ts
// B-5: Vanishing Words 유사 의미군 오답 생성 — Gemini 호출 없이 의미 유사도 휴리스틱
// meaning 영문 토큰 오버랩 스코어링: 정답과 의미가 가장 유사한 항목을 오답으로 선택

const STOPWORDS = new Set([
  'the','a','an','and','or','of','to','in','on','for','with','by','at','from',
  'as','is','are','was','were','be','been','being','it','its','this','that',
  'these','those','which','who','whom','whose','what','when','where','why',
  'how','not','no','yes','but','if','then','than','so','such','into','out',
  'up','down','over','under','again','once','very','can','will','just','about',
  'also','other','some','any','each','both','few','more','most','own','same',
  'too','s','re','ll','ve','d','m','t','one','two','way','make','made','get',
  'take','used','use','often','always','never','something','someone','thing',
]);

function tokenize(meaning: string): Set<string> {
  return new Set(
    meaning.toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && !STOPWORDS.has(t))
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n;
}

function shuffleLocal<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 정답 인덱스의 의미와 가장 유사한 meanings를 오답으로 선택.
 * 상위 8개 후보 중 랜덤 3개를 뽑아 매번 다른 오답 조합 제공.
 * Gemini 호출 없음 — 클라이언트 측 휴리스틱.
 */
export function pickDistractorMeanings(
  vocab: { meaning: string }[],
  currentIdx: number,
  count = 3
): string[] {
  const target = tokenize(vocab[currentIdx].meaning);
  const targetMeaning = vocab[currentIdx].meaning;
  const scored = vocab
    .map((v, i) => ({
      i,
      score: i === currentIdx ? -1 : overlapScore(target, tokenize(v.meaning)),
      meaning: v.meaning,
    }))
    .filter(s => s.score >= 0 && s.meaning !== targetMeaning);
  if (scored.length <= count) return scored.map(s => s.meaning);
  scored.sort((a, b) => b.score - a.score);
  const pool = scored.slice(0, Math.max(8, count)); // 상위 8개 후보
  return shuffleLocal(pool).slice(0, count).map(s => s.meaning);
}
