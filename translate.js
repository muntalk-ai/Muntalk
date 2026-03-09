const { translate } = require('@vitalets/google-translate-api');

// 한국어 포함 테스트용 (원래 LANGUAGES 배열 전체를 넣으셔도 됩니다)
const LANGUAGES = ['ko-KR', 'ja-JP', 'zh-CN', 'es-ES']; 

const englishData = {
  Verbs: ['be', 'have', 'do', 'say', 'go', 'get', 'make', 'know', 'take', 'see', 'come', 'think', 'look', 'want', 'give', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call', 'should', 'may', 'must', 'keep', 'start', 'help', 'talk', 'turn', 'show', 'hear', 'play', 'run', 'move', 'live', 'believe', 'bring', 'happen', 'write', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'begin'],
  Adjectives: ['good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same', 'able', 'real', 'best', 'better', 'economic', 'strong', 'possible', 'whole', 'free', 'true', 'full', 'special', 'easy', 'clear', 'recent', 'late', 'hard', 'major', 'happy', 'beautiful', 'fast', 'slow', 'short', 'dark', 'light', 'cheap'],
  Adverbs: ['up', 'down', 'very', 'just', 'only', 'also', 'really', 'even', 'always', 'never', 'sometimes', 'often', 'already', 'still', 'yet', 'quickly', 'slowly', 'suddenly', 'carefully', 'directly', 'actually', 'exactly', 'probably', 'perhaps', 'maybe', 'quite', 'rather', 'hardly', 'almost', 'enough', 'highly', 'totally', 'finally', 'soon', 'later', 'again', 'instead', 'twice', 'together', 'anywhere', 'everywhere', 'somewhere', 'certainly', 'usually', 'deeply', 'fast', 'well', 'far', 'near', 'slowly'],
  Phrases: ['thank you', 'how are you', 'excuse me', 'I am sorry', 'what do you think', 'how does that sound', 'that sounds great', 'oh never mind', 'nice to meet you', 'where are you from', 'what do you do', 'do you have', 'how much is it', 'can you help me', 'I am looking for', 'break the ice', 'piece of cake', 'under the weather', 'call it a day', 'get over it', 'by the way', 'for example', 'in my opinion', 'let me see', 'long time no see', 'of course', 'take care', 'what is up', 'you are welcome', 'never mind', 'long story short', 'no wonder', 'so far so good', 'to be honest', 'what a pity', 'at all', 'by far', 'for now', 'in fact', 'make sure', 'no way', 'on the other hand', 'right now', 'sooner or later', 'turn out', 'up to you', 'with pleasure', 'without a doubt', 'you know', 'as soon as possible']
};

async function generateData() {
  const result = {};
  result['en-US'] = englishData;

  for (const lang of LANGUAGES) {
    console.error(`\nTranslating to ${lang}...`);
    result[lang] = {};
    const targetLang = lang.split('-')[0];

    for (const topic of Object.keys(englishData)) {
      result[lang][topic] = [];
      for (const word of englishData[topic]) {
        try {
          const res = await translate(word, { to: targetLang });
          result[lang][topic].push(res.text);
          console.error(`  [${lang}] ${word} -> ${res.text}`);
          
          // 💡 구글 차단 방지: 요청당 1.5초 지연 (더 안전하게)
          await new Promise(r => setTimeout(r, 8000));
        } catch (err) {
          console.error(`  [ERROR] ${lang} - ${word}: ${err.message}`);
          result[lang][topic].push(word); // 에러나면 영어 원본 그대로 넣음
          
          // 💡 에러 발생 시 15초간 휴식 (더 길게)
          await new Promise(r => setTimeout(r, 60000));
        }
      }
    }
  }
  // 최종 결과물만 표준 출력으로 내보냄
  process.stdout.write(JSON.stringify(result, null, 2));
}

generateData();