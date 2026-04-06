// ── Grammar Data — A1 to C2 ──────────────────────────────────────────────────
// MunTalk Grammar Hub — complete chapter data for all CEFR levels

export type GrammarLevel = 'a1'|'a2'|'b1'|'b2'|'c1'|'c2';

export interface StructureRow {
  cells: string[];
  highlight?: boolean; // highlight this row
}

export interface StructureTable {
  headers: string[];
  rows: StructureRow[];
}

export interface UseCase {
  color: string; // hex
  label: string;
  example: string;
  translation: string; // Korean translation
}

export interface Mistake {
  wrong: string;
  right: string;
  note: string;
}

export interface Example {
  en: string;
  ko: string;
  highlight?: string; // the grammar point to highlight in the sentence
}

export interface QuizItem {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface GrammarChapter {
  id: string;
  level: GrammarLevel;
  category: string;
  categoryColor: string;
  emoji: string;
  title: string;
  subtitle: string; // Korean one-liner
  color: string;    // card accent color
  bg: string;       // card background
  keyPoint: string; // one sentence in Korean
  structure: StructureTable;
  useCases: UseCase[];
  examples: Example[];
  mistakes: Mistake[];
  quiz: QuizItem[];
  tip?: string; // pro tip in Korean
}

export interface GrammarCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

// ── Category definitions ──────────────────────────────────────────────────────

export const GRAMMAR_CATEGORIES: GrammarCategory[] = [
  { id:'tenses',    label:'시제',     emoji:'⏰', color:'#2563EB' },
  { id:'verbs',     label:'동사',     emoji:'⚡', color:'#059669' },
  { id:'nouns',     label:'명사·관사', emoji:'📦', color:'#D97706' },
  { id:'questions', label:'의문문',   emoji:'❓', color:'#7C3AED' },
  { id:'modals',    label:'조동사',   emoji:'🎛️', color:'#0891B2' },
  { id:'conditionals', label:'조건문', emoji:'🔀', color:'#DC2626' },
  { id:'passive',   label:'수동태',   emoji:'🔄', color:'#BE185D' },
  { id:'clauses',   label:'절·구',    emoji:'🔗', color:'#065F46' },
  { id:'advanced',  label:'고급문법', emoji:'🎓', color:'#1D4ED8' },
];

// ── Chapter Data ──────────────────────────────────────────────────────────────

export const GRAMMAR_CHAPTERS: GrammarChapter[] = [

  // ══ A1 ════════════════════════════════════════════════════════════════════

  {
    id: 'a1-be-verb',
    level: 'a1', category: 'verbs', categoryColor: '#059669',
    emoji: '🌱', title: 'Be Verb (am / is / are)',
    subtitle: '가장 기본이 되는 동사 — "이다, 있다"',
    color: '#059669', bg: '#ECFDF5',
    keyPoint: 'be동사는 주어에 따라 am / is / are로 변해요. 부정문은 뒤에 not만 붙이면 됩니다.',
    structure: {
      headers: ['주어 (Subject)', 'Be동사', '예문'],
      rows: [
        { cells: ['I', 'am', 'I am a student.'], highlight: true },
        { cells: ['He / She / It', 'is', 'She is happy.'] },
        { cells: ['You / We / They', 'are', 'They are friends.'] },
      ],
    },
    useCases: [
      { color:'#2563EB', label:'신분·직업', example:'I am a teacher.', translation:'나는 선생님이에요.' },
      { color:'#059669', label:'상태·감정', example:'She is tired.', translation:'그녀는 피곤해요.' },
      { color:'#D97706', label:'위치', example:'We are at home.', translation:'우리는 집에 있어요.' },
    ],
    examples: [
      { en:'I am 25 years old.', ko:'저는 25살이에요.', highlight:'am' },
      { en:'He is a doctor.', ko:'그는 의사예요.', highlight:'is' },
      { en:'They are not here.', ko:'그들은 여기 없어요.', highlight:'are not' },
      { en:'Is she your sister?', ko:'그녀가 당신 여동생인가요?', highlight:'Is' },
    ],
    mistakes: [
      { wrong:'I is happy.', right:'I am happy.', note:'I 뒤에는 반드시 am을 써요.' },
      { wrong:'He are a student.', right:'He is a student.', note:'He/She/It 뒤에는 is를 써요.' },
      { wrong:'They is from Korea.', right:'They are from Korea.', note:'They 뒤에는 are를 써요.' },
    ],
    quiz: [
      { question: 'She ___ my best friend.', options:['am','is','are','be'], answer:1, explanation:'She는 3인칭 단수이므로 is를 사용해요.' },
      { question: 'We ___ students.', options:['am','is','are','be'], answer:2, explanation:'We는 복수이므로 are를 사용해요.' },
      { question: 'I ___ not tired.', options:['am','is','are','do'], answer:0, explanation:'I 뒤에는 am을 사용해요.' },
      { question: '다음 중 올바른 문장은?', options:['He am happy.','I is a doctor.','They are late.','She are kind.'], answer:2, explanation:'They + are가 올바른 조합이에요.' },
    ],
    tip: 'am/is/are를 줄여서 I\'m, she\'s, they\'re처럼 쓸 수 있어요. 회화에서 더 자연스럽습니다!',
  },

  {
    id: 'a1-present-simple',
    level: 'a1', category: 'tenses', categoryColor: '#2563EB',
    emoji: '☀️', title: 'Present Simple (현재 단순시제)',
    subtitle: '반복되는 일상과 사실을 표현할 때',
    color: '#2563EB', bg: '#EFF6FF',
    keyPoint: '매일 하는 일, 습관, 변하지 않는 사실을 말할 때 써요. He/She/It이 주어면 동사에 -s를 붙여요.',
    structure: {
      headers: ['주어', '동사', '예문'],
      rows: [
        { cells: ['I / You / We / They', '동사 원형', 'I eat breakfast every day.'], highlight: true },
        { cells: ['He / She / It', '동사 + s/es', 'She works at a bank.'] },
        { cells: ['부정문', "don't / doesn't + 동사", "He doesn't like coffee."] },
        { cells: ['의문문', 'Do / Does + 주어 + 동사?', 'Do you speak English?'] },
      ],
    },
    useCases: [
      { color:'#2563EB', label:'일상·습관', example:'I drink coffee every morning.', translation:'나는 매일 아침 커피를 마셔요.' },
      { color:'#059669', label:'변하지 않는 사실', example:'The sun rises in the east.', translation:'태양은 동쪽에서 떠요.' },
      { color:'#D97706', label:'좋아하는 것', example:'She loves music.', translation:'그녀는 음악을 좋아해요.' },
    ],
    examples: [
      { en:'I wake up at 7am every day.', ko:'나는 매일 7시에 일어나요.', highlight:'wake up' },
      { en:'He plays football on weekends.', ko:'그는 주말에 축구를 해요.', highlight:'plays' },
      { en:'We don\'t eat meat.', ko:'우리는 고기를 먹지 않아요.', highlight:"don't eat" },
      { en:'Does she live in Seoul?', ko:'그녀는 서울에 살고 있나요?', highlight:'Does' },
    ],
    mistakes: [
      { wrong:'She work in a hospital.', right:'She works in a hospital.', note:'He/She/It + 동사에는 -s/-es를 꼭 붙여요.' },
      { wrong:'He don\'t like spicy food.', right:'He doesn\'t like spicy food.', note:'3인칭 단수 부정문은 doesn\'t를 써요.' },
      { wrong:'Does she likes pizza?', right:'Does she like pizza?', note:'Does 뒤에는 동사 원형을 써요. -s 불필요.' },
    ],
    quiz: [
      { question:'She ___ to work by bus.', options:['go','goes','going','went'], answer:1, explanation:'She는 3인칭 단수이므로 goes를 써요.' },
      { question:'They ___ not drink alcohol.', options:['do','does','is','are'], answer:0, explanation:'They는 복수이므로 do를 써요.' },
      { question:'___ he speak French?', options:['Do','Does','Is','Are'], answer:1, explanation:'He 3인칭 단수 의문문은 Does로 시작해요.' },
      { question:'Water ___ at 100°C.', options:['boil','boils','boiling','boiled'], answer:1, explanation:'과학적 사실도 현재 단순시제, It(water)이므로 boils.' },
    ],
    tip: '3인칭 단수 규칙: 동사가 -s/-sh/-ch/-x/-o로 끝나면 -es를 붙여요. 예: watches, goes, fixes',
  },

  {
    id: 'a1-articles',
    level: 'a1', category: 'nouns', categoryColor: '#D97706',
    emoji: '📦', title: 'Articles (관사: a / an / the)',
    subtitle: '명사 앞에 붙는 작은 단어, 엄청난 차이',
    color: '#D97706', bg: '#FFFBEB',
    keyPoint: 'a/an은 처음 언급하는 것, the는 이미 아는 특정한 것. 모음 앞에는 an을 써요.',
    structure: {
      headers: ['관사', '언제 쓰나요?', '예문'],
      rows: [
        { cells: ['a', '처음 언급 / 자음으로 시작하는 단어', 'I saw a dog.'], highlight: true },
        { cells: ['an', '처음 언급 / 모음(a,e,i,o,u)으로 시작', 'She ate an apple.'], highlight: true },
        { cells: ['the', '이미 알고 있는 특정한 것', 'The dog was cute.'] },
        { cells: ['없음 (zero)', '일반적인 것 전체를 말할 때', 'I love music.'] },
      ],
    },
    useCases: [
      { color:'#D97706', label:'처음 언급 (a/an)', example:'I bought a new phone.', translation:'나는 새 전화기를 샀어요.' },
      { color:'#2563EB', label:'두 번째 언급 (the)', example:'The phone is great.', translation:'그 전화기는 훌륭해요.' },
      { color:'#059669', label:'세상에 하나뿐 (the)', example:'The sun is bright today.', translation:'오늘 태양이 밝아요.' },
    ],
    examples: [
      { en:'I have a cat and a dog.', ko:'나는 고양이 한 마리와 개 한 마리가 있어요.', highlight:'a' },
      { en:'The cat is black.', ko:'그 고양이는 검은색이에요.', highlight:'The' },
      { en:'She is an engineer.', ko:'그녀는 엔지니어예요.', highlight:'an' },
      { en:'I love the moon.', ko:'나는 달을 좋아해요.', highlight:'the' },
    ],
    mistakes: [
      { wrong:'I am a engineer.', right:'I am an engineer.', note:'모음(e)으로 시작하면 an을 써요.' },
      { wrong:'The life is short.', right:'Life is short.', note:'추상적 개념 전체를 말할 때는 관사 불필요.' },
      { wrong:'I go to the school.', right:'I go to school.', note:'학교·병원 등은 목적(공부·치료)을 말할 때 the 없이 써요.' },
    ],
    quiz: [
      { question:'She is ___ doctor.', options:['a','an','the','없음'], answer:0, explanation:'doctor는 자음 d로 시작하므로 a를 써요.' },
      { question:'___ Earth is round.', options:['A','An','The','없음'], answer:2, explanation:'지구는 세상에 하나뿐이므로 The를 써요.' },
      { question:'I ate ___ orange.', options:['a','an','the','없음'], answer:1, explanation:'orange는 모음 o로 시작하므로 an을 써요.' },
      { question:'___ love is beautiful.', options:['A','An','The','없음'], answer:3, explanation:'추상적 개념 전체를 말할 때 관사 불필요.' },
    ],
    tip: 'an honest, an hour처럼 h가 묵음일 때도 an을 써요. 발음이 모음으로 시작하면 an!',
  },

  {
    id: 'a1-questions',
    level: 'a1', category: 'questions', categoryColor: '#7C3AED',
    emoji: '❓', title: 'Basic Questions (기본 의문문)',
    subtitle: 'Yes/No 질문과 Wh- 질문 만들기',
    color: '#7C3AED', bg: '#F5F3FF',
    keyPoint: 'Yes/No 질문은 동사를 앞으로, Wh- 질문은 의문사로 시작해요.',
    structure: {
      headers: ['질문 유형', '구조', '예문'],
      rows: [
        { cells: ['Yes/No (be동사)', 'Am/Is/Are + 주어?', 'Are you happy?'], highlight: true },
        { cells: ['Yes/No (일반동사)', 'Do/Does + 주어 + 동사?', 'Do you like pizza?'], highlight: true },
        { cells: ['What (무엇)', 'What + do/does + 주어?', 'What do you eat?'] },
        { cells: ['Where (어디)', 'Where + do/does + 주어?', 'Where does she live?'] },
        { cells: ['When (언제)', 'When + do/does + 주어?', 'When do you sleep?'] },
        { cells: ['Who (누구)', 'Who + 동사?', 'Who is your teacher?'] },
      ],
    },
    useCases: [
      { color:'#7C3AED', label:'Yes/No 질문', example:'Is he your brother?', translation:'그가 당신 오빠인가요?' },
      { color:'#2563EB', label:'정보 묻기', example:'What is your name?', translation:'이름이 뭐예요?' },
      { color:'#059669', label:'장소 묻기', example:'Where do you work?', translation:'어디서 일하세요?' },
    ],
    examples: [
      { en:'Are you from Japan?', ko:'당신은 일본 출신인가요?', highlight:'Are' },
      { en:'What do you do?', ko:'직업이 뭐예요?', highlight:'What' },
      { en:'Where does he live?', ko:'그는 어디 살아요?', highlight:'Where does' },
      { en:'Who is your favourite singer?', ko:'좋아하는 가수가 누구예요?', highlight:'Who' },
    ],
    mistakes: [
      { wrong:'Where you live?', right:'Where do you live?', note:'의문사 뒤에도 do/does가 필요해요.' },
      { wrong:'What she likes?', right:'What does she like?', note:'3인칭 단수면 does를 써요.' },
      { wrong:'Do you are a student?', right:'Are you a student?', note:'be동사 질문에 do/does를 쓰지 않아요.' },
    ],
    quiz: [
      { question:'___ you like coffee?', options:['Are','Do','Does','Is'], answer:1, explanation:'일반동사(like) + you → Do를 써요.' },
      { question:'Where ___ she work?', options:['do','does','is','are'], answer:1, explanation:'She는 3인칭 단수이므로 does를 써요.' },
      { question:'___ your name?', options:["What's","What do","What does","What are"], answer:0, explanation:"What's = What is. 가장 자연스러운 표현이에요." },
      { question:'Who ___ your English teacher?', options:['do','does','is','are'], answer:2, explanation:'Who + be동사 + 주어의 구조예요.' },
    ],
  },

  // ══ A2 ════════════════════════════════════════════════════════════════════

  {
    id: 'a2-past-simple',
    level: 'a2', category: 'tenses', categoryColor: '#2563EB',
    emoji: '📅', title: 'Past Simple (과거 단순시제)',
    subtitle: '이미 끝난 과거의 일을 말할 때',
    color: '#0284C7', bg: '#F0F9FF',
    keyPoint: '규칙 동사는 -ed를 붙이고, 불규칙 동사는 따로 외워야 해요. 부정문/의문문은 did를 사용해요.',
    structure: {
      headers: ['형태', '구조', '예문'],
      rows: [
        { cells: ['긍정 (규칙)', '동사 + -ed', 'I walked to school.'], highlight: true },
        { cells: ['긍정 (불규칙)', '불규칙 과거형', 'She went to Paris.'], highlight: true },
        { cells: ['부정', "didn't + 동사 원형", "He didn't come."] },
        { cells: ['의문', 'Did + 주어 + 동사 원형?', 'Did you see it?'] },
      ],
    },
    useCases: [
      { color:'#0284C7', label:'완료된 과거', example:'I finished work at 6pm.', translation:'6시에 일이 끝났어요.' },
      { color:'#7C3AED', label:'역사적 사실', example:'He was born in 1990.', translation:'그는 1990년에 태어났어요.' },
      { color:'#D97706', label:'연속된 사건', example:'I woke up, ate, and left.', translation:'일어나서 먹고 나갔어요.' },
    ],
    examples: [
      { en:'I visited my grandmother yesterday.', ko:'나는 어제 할머니를 방문했어요.', highlight:'visited' },
      { en:'She didn\'t eat breakfast this morning.', ko:'그녀는 오늘 아침 식사를 안 했어요.', highlight:"didn't eat" },
      { en:'Did you watch the game last night?', ko:'어제 밤 경기 봤어요?', highlight:'Did' },
      { en:'They went to the beach last summer.', ko:'그들은 지난 여름 해변에 갔어요.', highlight:'went' },
    ],
    mistakes: [
      { wrong:'I didn\'t went there.', right:'I didn\'t go there.', note:"didn't 뒤에는 동사 원형을 써요. went → go" },
      { wrong:'Did she came?', right:'Did she come?', note:'Did 뒤에는 동사 원형을 써요.' },
      { wrong:'I have went yesterday.', right:'I went yesterday.', note:"yesterday 같은 과거 시간 표현엔 현재완료가 아닌 과거시제를 써요." },
    ],
    quiz: [
      { question:'She ___ a movie last night.', options:['watch','watches','watched','watching'], answer:2, explanation:'last night은 과거 표현이므로 과거형 watched를 써요.' },
      { question:'They ___ not go to school.', options:['do','does','did','have'], answer:2, explanation:'과거 부정문은 didn\'t(= did not)를 써요.' },
      { question:'___ you enjoy the concert?', options:['Do','Does','Did','Have'], answer:2, explanation:'과거 의문문은 Did로 시작해요.' },
      { question:'다음 중 과거형이 올바른 것은?', options:['I buyed a car.','She goed home.','He came late.','They readed a book.'], answer:2, explanation:'came은 come의 올바른 불규칙 과거형이에요.' },
    ],
    tip: '자주 쓰는 불규칙 동사: go→went, have→had, see→saw, come→came, give→gave, take→took, make→made',
  },

  {
    id: 'a2-present-continuous',
    level: 'a2', category: 'tenses', categoryColor: '#2563EB',
    emoji: '🔄', title: 'Present Continuous (현재진행형)',
    subtitle: '지금 이 순간 일어나고 있는 일',
    color: '#0891B2', bg: '#F0F9FF',
    keyPoint: '지금 하고 있는 행동을 말할 때 be동사 + 동사-ing를 써요.',
    structure: {
      headers: ['형태', '구조', '예문'],
      rows: [
        { cells: ['긍정', 'am/is/are + 동사-ing', 'I am eating.'], highlight: true },
        { cells: ['부정', "am/is/are + not + 동사-ing", "She isn't sleeping."] },
        { cells: ['의문', 'Am/Is/Are + 주어 + 동사-ing?', 'Are you watching TV?'] },
      ],
    },
    useCases: [
      { color:'#0891B2', label:'지금 이 순간', example:'I am writing an email.', translation:'나는 지금 이메일을 쓰고 있어요.' },
      { color:'#7C3AED', label:'일시적인 상황', example:'She is staying at a hotel.', translation:'그녀는 호텔에 머물고 있어요.' },
      { color:'#D97706', label:'가까운 미래 계획', example:'We are meeting tomorrow.', translation:'우리 내일 만날 거예요.' },
    ],
    examples: [
      { en:'The children are playing outside.', ko:'아이들이 밖에서 놀고 있어요.', highlight:'are playing' },
      { en:'I am not feeling well today.', ko:'오늘 몸이 좋지 않아요.', highlight:'am not feeling' },
      { en:'Is it raining outside?', ko:'밖에 비 오고 있나요?', highlight:'Is it raining' },
      { en:'She is learning Korean these days.', ko:'그녀는 요즘 한국어를 배우고 있어요.', highlight:'is learning' },
    ],
    mistakes: [
      { wrong:'I am knowing the answer.', right:'I know the answer.', note:'know, like, want, love 같은 상태동사는 진행형으로 쓰지 않아요.' },
      { wrong:'She is eat dinner.', right:'She is eating dinner.', note:'진행형에서 동사에 반드시 -ing를 붙여요.' },
      { wrong:'They are work hard.', right:'They are working hard.', note:'be동사 뒤에 동사 원형이 아닌 -ing 형태를 써요.' },
    ],
    quiz: [
      { question:'He ___ a book right now.', options:['reads','is reading','read','has read'], answer:1, explanation:'right now(지금 이 순간)이므로 진행형을 써요.' },
      { question:'I ___ (not) feel hungry.', options:["don't","isn't","am not","aren't"], answer:2, explanation:'I + am의 부정은 am not이에요.' },
      { question:'___ they ___ the game?', options:['Are/watch','Is/watching','Are/watching','Do/watching'], answer:2, explanation:'Are + they + watching — 올바른 진행형 의문문이에요.' },
      { question:'다음 중 진행형을 쓸 수 없는 것은?', options:['run','eat','believe','sleep'], answer:2, explanation:'believe는 상태동사라 진행형으로 쓰지 않아요.' },
    ],
    tip: '현재진행형 vs 현재시제: "I eat rice" (매일 먹어요) vs "I am eating rice" (지금 먹고 있어요)',
  },

  {
    id: 'a2-comparative',
    level: 'a2', category: 'nouns', categoryColor: '#D97706',
    emoji: '⚖️', title: 'Comparatives & Superlatives (비교급·최상급)',
    subtitle: '더 ~한, 가장 ~한 표현하기',
    color: '#B45309', bg: '#FFFBEB',
    keyPoint: '두 가지 비교는 비교급(-er/more), 셋 이상에서 최고는 최상급(-est/most)을 써요.',
    structure: {
      headers: ['형용사', '비교급', '최상급'],
      rows: [
        { cells: ['short (1음절)', 'shorter', 'the shortest'], highlight: true },
        { cells: ['big (1음절+자음)', 'bigger', 'the biggest'] },
        { cells: ['beautiful (3음절+)', 'more beautiful', 'the most beautiful'], highlight: true },
        { cells: ['good (불규칙)', 'better', 'the best'] },
        { cells: ['bad (불규칙)', 'worse', 'the worst'] },
        { cells: ['far (불규칙)', 'farther / further', 'the farthest'] },
      ],
    },
    useCases: [
      { color:'#B45309', label:'두 가지 비교 (than)', example:'Seoul is bigger than Busan.', translation:'서울은 부산보다 커요.' },
      { color:'#059669', label:'셋 이상 최상급', example:'She is the tallest in the class.', translation:'그녀는 반에서 가장 키가 커요.' },
      { color:'#2563EB', label:'동등 비교 (as~as)', example:'He is as tall as his father.', translation:'그는 아버지만큼 키가 커요.' },
    ],
    examples: [
      { en:'This coffee is hotter than that one.', ko:'이 커피가 저것보다 더 뜨거워요.', highlight:'hotter than' },
      { en:'It\'s the most expensive restaurant here.', ko:'여기서 가장 비싼 식당이에요.', highlight:'the most expensive' },
      { en:'Today is better than yesterday.', ko:'오늘이 어제보다 더 좋아요.', highlight:'better than' },
      { en:'She runs faster than anyone else.', ko:'그녀는 다른 누구보다 빨리 달려요.', highlight:'faster than' },
    ],
    mistakes: [
      { wrong:'She is more tall than me.', right:'She is taller than me.', note:'1-2음절 형용사는 -er을 붙여요. more 불필요.' },
      { wrong:'He is the most fast runner.', right:'He is the fastest runner.', note:'fast처럼 짧은 형용사는 -est를 써요.' },
      { wrong:'This is more good.', right:'This is better.', note:'good의 비교급은 better (불규칙)이에요.' },
    ],
    quiz: [
      { question:'Mount Everest is ___ mountain in the world.', options:['higher','the highest','most high','more high'], answer:1, explanation:'셋 이상(전 세계)에서 최고이므로 the highest(최상급)를 써요.' },
      { question:'My bag is ___ than yours.', options:['more heavy','heavier','heaviest','most heavy'], answer:1, explanation:'heavy처럼 -y로 끝나는 2음절은 -ier로 바꿔요.' },
      { question:'English is ___ French for me.', options:['easy than','easier as','easier than','more easy than'], answer:2, explanation:'비교급 + than을 써요. easy → easier.' },
      { question:'다음 중 올바른 최상급은?', options:['the most big','the biggest','the more big','the bigest'], answer:1, explanation:'big처럼 단모음+단자음은 자음을 겹쳐서 -gest: biggest.' },
    ],
    tip: '2음절 형용사도 -er/-est를 쓸 수 있어요: simple→simpler, clever→cleverer. 하지만 more/most도 OK!',
  },

  // ══ B1 ════════════════════════════════════════════════════════════════════

  {
    id: 'b1-present-perfect',
    level: 'b1', category: 'tenses', categoryColor: '#2563EB',
    emoji: '✨', title: 'Present Perfect (현재완료)',
    subtitle: '과거와 현재를 연결하는 핵심 시제',
    color: '#6366F1', bg: '#EEF2FF',
    keyPoint: '과거에 일어났지만 현재와 연결된 경험·결과·지속을 말할 때 have/has + 과거분사를 써요.',
    structure: {
      headers: ['형태', '구조', '예문'],
      rows: [
        { cells: ['긍정', 'have/has + 과거분사(p.p.)', 'I have visited London.'], highlight: true },
        { cells: ['부정', "haven't/hasn't + p.p.", "She hasn't eaten."] },
        { cells: ['의문', 'Have/Has + 주어 + p.p.?', 'Have you ever been there?'] },
      ],
    },
    useCases: [
      { color:'#6366F1', label:'경험 (ever/never)', example:'Have you ever tried sushi?', translation:'스시 먹어본 적 있나요?' },
      { color:'#059669', label:'결과 (just/already)', example:'I have just finished work.', translation:'방금 일이 끝났어요.' },
      { color:'#D97706', label:'지속 (for/since)', example:'She has lived here since 2010.', translation:'그녀는 2010년부터 여기 살고 있어요.' },
    ],
    examples: [
      { en:'I have never eaten octopus.', ko:'나는 낙지를 먹어본 적이 없어요.', highlight:'have never eaten' },
      { en:'She has already left the office.', ko:'그녀는 이미 사무실을 떠났어요.', highlight:'has already left' },
      { en:'We have known each other for 10 years.', ko:'우리는 10년간 알고 지냈어요.', highlight:'have known...for' },
      { en:'Have you seen this film yet?', ko:'이 영화 아직 안 봤나요?', highlight:'Have you seen...yet' },
    ],
    mistakes: [
      { wrong:'I have went to Paris.', right:'I have been to Paris.', note:"been to = 방문한 경험. went는 단순 과거동사예요." },
      { wrong:'She has finished it yesterday.', right:'She finished it yesterday.', note:"yesterday처럼 구체적 과거 시점엔 현재완료가 아닌 과거시제를 써요." },
      { wrong:'Have you ever went?', right:'Have you ever been?', note:'Have + 과거분사(been)을 써요. went는 과거형.' },
    ],
    quiz: [
      { question:'I ___ never ___ to Australia.', options:['have/went','have/been','has/been','had/gone'], answer:1, explanation:'have + been (경험을 나타내는 현재완료).' },
      { question:'She ___ already ___ dinner.', options:['has/eat','have/eaten','has/eaten','had/eat'], answer:2, explanation:'She는 3인칭 단수이므로 has. 과거분사 eaten.' },
      { question:'How long ___ you ___ here?', options:['have/lived','did/live','are/living','were/living'], answer:0, explanation:'지속기간 + 현재완료: have lived.' },
      { question:'다음 중 현재완료가 올바른 문장은?', options:['I have went out yesterday.','She has seen that film last week.','They have just arrived.','He has ate breakfast an hour ago.'], answer:2, explanation:"just(방금)는 현재완료의 핵심 시간 표현이에요." },
    ],
    tip: 'for = 기간 (for 3 years), since = 시작점 (since 2020). 둘 다 현재완료와 함께 써요!',
  },

  {
    id: 'b1-modal-verbs',
    level: 'b1', category: 'modals', categoryColor: '#0891B2',
    emoji: '🎛️', title: 'Modal Verbs (조동사)',
    subtitle: '능력·의무·가능성·허락을 표현하는 조동사',
    color: '#0891B2', bg: '#F0F9FF',
    keyPoint: '조동사 뒤에는 항상 동사 원형. can(능력), must(의무), should(조언), may/might(가능성).',
    structure: {
      headers: ['조동사', '의미', '예문'],
      rows: [
        { cells: ['can / could', '능력·가능·허락', 'I can swim. Can I help?'], highlight: true },
        { cells: ['must / have to', '강한 의무', 'You must wear a seatbelt.'], highlight: true },
        { cells: ['should / ought to', '조언·권고', 'You should see a doctor.'] },
        { cells: ['may / might', '가능성 (불확실)', 'It might rain later.'] },
        { cells: ['will / would', '의지·미래·정중한 요청', 'Would you like some tea?'] },
        { cells: ['shall', '제안 (주로 영국식)', 'Shall we go?'] },
      ],
    },
    useCases: [
      { color:'#0891B2', label:'능력 (can)', example:'She can speak five languages.', translation:'그녀는 5개 국어를 해요.' },
      { color:'#DC2626', label:'의무 (must)', example:'You must not smoke here.', translation:'여기서 흡연하면 안 돼요.' },
      { color:'#D97706', label:'조언 (should)', example:'You should drink more water.', translation:'물을 더 마셔야 해요.' },
      { color:'#7C3AED', label:'가능성 (might)', example:'He might be at home.', translation:'그는 집에 있을 수도 있어요.' },
    ],
    examples: [
      { en:'You should apologise to her.', ko:'그녀에게 사과해야 해요.', highlight:'should' },
      { en:'It might snow tomorrow.', ko:'내일 눈이 올 수도 있어요.', highlight:'might' },
      { en:'Can you help me with this?', ko:'이것 좀 도와줄 수 있어요?', highlight:'Can' },
      { en:'You must not park here.', ko:'여기에 주차하면 안 돼요.', highlight:'must not' },
    ],
    mistakes: [
      { wrong:'She can to swim.', right:'She can swim.', note:'조동사 뒤에는 to 없이 동사 원형을 써요.' },
      { wrong:'You should to rest.', right:'You should rest.', note:'should 뒤에도 to 없이 동사 원형.' },
      { wrong:'He musts go now.', right:'He must go now.', note:'조동사는 3인칭 단수여도 형태가 변하지 않아요.' },
    ],
    quiz: [
      { question:'You ___ drink and drive. It\'s illegal.', options:['should','might','must not','can'], answer:2, explanation:'금지는 must not(= mustn\'t)을 써요.' },
      { question:'___ you pass me the salt, please?', options:['Shall','Could','Must','Might'], answer:1, explanation:'Could는 공손한 요청에 써요.' },
      { question:'She ___ be tired. She worked 12 hours.', options:['can','might','shall','would'], answer:1, explanation:'might = 가능성 (확실하지 않지만 그럴 수도 있음).' },
      { question:'You ___ see a dentist soon.', options:['must not','should','can\'t','might not'], answer:1, explanation:'should = 조언·권고.' },
    ],
    tip: 'must vs have to: 둘 다 의무이지만 must는 화자의 의지, have to는 외부 규칙이에요. "I must study" vs "I have to study (for the exam)"',
  },

  {
    id: 'b1-passive',
    level: 'b1', category: 'passive', categoryColor: '#BE185D',
    emoji: '🔄', title: 'Passive Voice (수동태)',
    subtitle: '행위자보다 행위 자체나 대상을 강조할 때',
    color: '#BE185D', bg: '#FDF2F8',
    keyPoint: '수동태는 be동사 + 과거분사(p.p.)로 만들어요. 행위자는 by + 명사로 추가할 수 있어요.',
    structure: {
      headers: ['시제', '구조', '예문'],
      rows: [
        { cells: ['현재', 'am/is/are + p.p.', 'English is spoken here.'], highlight: true },
        { cells: ['과거', 'was/were + p.p.', 'The window was broken.'], highlight: true },
        { cells: ['미래', 'will be + p.p.', 'The report will be sent.'] },
        { cells: ['현재완료', 'have/has been + p.p.', 'The work has been done.'] },
      ],
    },
    useCases: [
      { color:'#BE185D', label:'행위자 불명·불필요', example:'My wallet was stolen.', translation:'지갑을 도둑맞았어요.' },
      { color:'#2563EB', label:'공식·뉴스 문체', example:'The law was passed.', translation:'법이 통과됐어요.' },
      { color:'#059669', label:'과학·학술 문체', example:'Water is made of H₂O.', translation:'물은 H₂O로 이루어져 있어요.' },
    ],
    examples: [
      { en:'The Eiffel Tower was built in 1889.', ko:'에펠탑은 1889년에 지어졌어요.', highlight:'was built' },
      { en:'Spanish is spoken in 20 countries.', ko:'스페인어는 20개 나라에서 사용돼요.', highlight:'is spoken' },
      { en:'The email has been sent.', ko:'이메일이 전송됐어요.', highlight:'has been sent' },
      { en:'The cake was eaten by the children.', ko:'케이크는 아이들이 먹었어요.', highlight:'was eaten by' },
    ],
    mistakes: [
      { wrong:'The book is write by her.', right:'The book is written by her.', note:'수동태는 be + 과거분사(p.p.)예요. write → written.' },
      { wrong:'It was builded in 1900.', right:'It was built in 1900.', note:'build의 과거분사는 built (불규칙)이에요.' },
      { wrong:'The work is did by him.', right:'The work is done by him.', note:'do의 과거분사는 done이에요.' },
    ],
    quiz: [
      { question:'The letter ___ yesterday.', options:['is sent','was sent','sends','sent'], answer:1, explanation:'yesterday = 과거. 수동태 과거 = was sent.' },
      { question:'The Pyramids ___ by the Egyptians.', options:['built','were built','are built','have built'], answer:1, explanation:'과거의 사실, 수동태: were built.' },
      { question:'English ___ all over the world.', options:['speak','spoke','is spoken','was spoken'], answer:2, explanation:'현재의 일반적 사실, 수동태 현재: is spoken.' },
      { question:'능동태를 수동태로: "Someone broke the window."', options:['The window broke.','The window was broken.','The window is broken.','The window has broke.'], answer:1, explanation:'과거(broke) → 수동태 과거: was broken.' },
    ],
    tip: '수동태가 어색할 때는 능동태를 써요! 수동태는 행위자가 불명확하거나 중요하지 않을 때 자연스러워요.',
  },

  {
    id: 'b1-first-conditional',
    level: 'b1', category: 'conditionals', categoryColor: '#DC2626',
    emoji: '🔀', title: 'First Conditional (1형식 조건문)',
    subtitle: '실현 가능한 미래 조건',
    color: '#DC2626', bg: '#FEF2F2',
    keyPoint: '충분히 일어날 수 있는 상황을 말해요. If + 현재시제, will + 동사 원형.',
    structure: {
      headers: ['절', '구조', '예문'],
      rows: [
        { cells: ['조건절 (if)', 'If + 현재 단순시제', 'If it rains...'], highlight: true },
        { cells: ['결과절', 'will + 동사 원형', '...I will stay home.'] },
        { cells: ['순서 바꾸기', '결과 + if + 조건', "I'll stay home if it rains."] },
      ],
    },
    useCases: [
      { color:'#DC2626', label:'실현 가능한 조건', example:'If I pass the exam, I will celebrate.', translation:'시험에 합격하면 축하할 거예요.' },
      { color:'#D97706', label:'경고·위협', example:'If you touch that, it will break.', translation:'그걸 만지면 부서질 거예요.' },
      { color:'#059669', label:'약속·제안', example:'If you help me, I\'ll buy you lunch.', translation:'도와주면 점심 살게요.' },
    ],
    examples: [
      { en:'If you study hard, you will pass.', ko:'열심히 공부하면 합격할 거예요.', highlight:'If...will' },
      { en:'She will be late if she doesn\'t hurry.', ko:'서두르지 않으면 늦을 거예요.', highlight:"doesn't hurry...will be late" },
      { en:'If it snows, we won\'t go out.', ko:'눈이 오면 외출하지 않을 거예요.', highlight:"If it snows...won't" },
      { en:'What will you do if you lose your job?', ko:'직장을 잃으면 어떻게 할 거예요?', highlight:'if you lose...will' },
    ],
    mistakes: [
      { wrong:'If it will rain, I will stay.', right:'If it rains, I will stay.', note:'if절에는 will을 쓰지 않아요. 현재시제를 써요.' },
      { wrong:'If she will come, we start.', right:'If she comes, we will start.', note:'if절 = 현재시제, 결과절 = will + 동사 원형.' },
      { wrong:'If I am tired, I will sleep.', right:'If I feel tired, I will sleep.', note:'상태보다 구체적 동사가 더 자연스러워요.' },
    ],
    quiz: [
      { question:'If you ___ hard, you ___ succeed.', options:['work/will','will work/will','work/would','worked/will'], answer:0, explanation:'1형식: if + 현재(work), 결과 = will succeed.' },
      { question:'I\'ll call you if I ___ the answer.', options:['will know','knew','know','known'], answer:2, explanation:'if절에는 현재시제(know)를 써요.' },
      { question:'If it ___ sunny, we ___ to the beach.', options:['is/go','will be/will go','is/will go','will be/go'], answer:2, explanation:'if절 = is(현재), 결과절 = will go.' },
      { question:'다음 중 올바른 1형식 조건문은?', options:['If she will come, I am happy.','If it rains, I stay home.','If you eat this, you will feel better.','If he studied, he will pass.'], answer:2, explanation:'if절 현재(eat) + 결과절 will + 동사(feel). 올바른 1형식.' },
    ],
    tip: 'Unless = If not: "Unless you hurry, you will be late" = "If you don\'t hurry, you will be late"',
  },

  // ══ B2 ════════════════════════════════════════════════════════════════════

  {
    id: 'b2-second-conditional',
    level: 'b2', category: 'conditionals', categoryColor: '#DC2626',
    emoji: '💭', title: 'Second Conditional (2형식 조건문)',
    subtitle: '현실과 다른 가정, 상상의 상황',
    color: '#7C3AED', bg: '#F5F3FF',
    keyPoint: '현재 사실과 반대되거나 실현 가능성이 낮은 상황을 상상할 때. If + 과거시제, would + 동사 원형.',
    structure: {
      headers: ['절', '구조', '예문'],
      rows: [
        { cells: ['조건절', 'If + 과거 단순시제', 'If I had a million dollars...'], highlight: true },
        { cells: ['결과절', 'would/could/might + 동사 원형', '...I would travel the world.'] },
        { cells: ['be동사', 'If I were (격식) / If I was (회화)', 'If I were you...'], highlight: true },
      ],
    },
    useCases: [
      { color:'#7C3AED', label:'비현실적 상상', example:'If I could fly, I would go to Paris.', translation:'날 수 있다면 파리에 갈 텐데요.' },
      { color:'#2563EB', label:'조언 (If I were you)', example:'If I were you, I would apologise.', translation:'내가 당신이라면 사과할 거예요.' },
      { color:'#059669', label:'꿈·소망', example:'If I lived by the sea, I would swim every day.', translation:'바닷가에 살면 매일 수영할 텐데요.' },
    ],
    examples: [
      { en:'If I won the lottery, I would buy a house.', ko:'복권에 당첨되면 집을 살 텐데요.', highlight:'If I won...would buy' },
      { en:'What would you do if you lost your phone?', ko:'전화기를 잃어버리면 어떻게 할 거예요?', highlight:'would you do...if you lost' },
      { en:'If I were a bird, I would fly to the sea.', ko:'내가 새라면 바다로 날아갈 텐데요.', highlight:'If I were...would fly' },
      { en:'She would help if she could.', ko:'할 수 있다면 그녀가 도울 텐데요.', highlight:'would help...if she could' },
    ],
    mistakes: [
      { wrong:'If I would have money, I would travel.', right:'If I had money, I would travel.', note:"if절에 would를 쓰지 않아요. 과거시제(had)를 써요." },
      { wrong:'If I was rich, I would stop working.', right:'If I were rich, I would stop working.', note:"격식체에서는 were를 써요. 특히 If I were you 표현." },
      { wrong:'If he knew, he will tell us.', right:'If he knew, he would tell us.', note:'2형식 결과절에는 will이 아닌 would를 써요.' },
    ],
    quiz: [
      { question:'If I ___ you, I ___ accept the offer.', options:['am/will','were/would','was/will','were/will'], answer:1, explanation:'2형식: If I were you + would + 동사 원형.' },
      { question:'She ___ speak better if she ___ more.', options:['will/practises','would/practised','would/practise','will/practised'], answer:1, explanation:'2형식: would + 동사 원형 + if + 과거시제.' },
      { question:'What ___ you do if you ___ invisible?', options:['will/are','would/were','would/are','will/were'], answer:1, explanation:'2형식: would + 동사 원형 + if + were(과거).' },
      { question:'1형식과 2형식의 차이는?', options:['시제가 같다','1형식은 실현 가능, 2형식은 비현실적 상상','2형식이 더 격식체다','아무 차이 없다'], answer:1, explanation:'1형식 = 가능한 미래 조건, 2형식 = 현실과 반대되는 상상.' },
    ],
    tip: '"If I were you" 표현을 통째로 외워두세요! 조언을 줄 때 가장 많이 써요.',
  },

  {
    id: 'b2-relative-clauses',
    level: 'b2', category: 'clauses', categoryColor: '#065F46',
    emoji: '🔗', title: 'Relative Clauses (관계절)',
    subtitle: '명사를 설명하는 절을 연결하는 방법',
    color: '#065F46', bg: '#ECFDF5',
    keyPoint: '관계대명사(who, which, that, whose)를 사용해 두 문장을 하나로 연결해요.',
    structure: {
      headers: ['관계대명사', '사용 대상', '예문'],
      rows: [
        { cells: ['who / that', '사람', 'The man who called you is here.'], highlight: true },
        { cells: ['which / that', '사물·동물', 'The book which I read was great.'], highlight: true },
        { cells: ['whose', '소유 (사람·사물)', 'The girl whose father is a doctor...'] },
        { cells: ['where', '장소', 'The city where I grew up...'] },
        { cells: ['when', '시간', 'The day when we met...'] },
      ],
    },
    useCases: [
      { color:'#065F46', label:'사람 설명 (who)', example:'She is the teacher who helped me.', translation:'그분이 저를 도와준 선생님이에요.' },
      { color:'#2563EB', label:'사물 설명 (which)', example:'That\'s the film which won the Oscar.', translation:'그게 오스카를 받은 영화예요.' },
      { color:'#D97706', label:'소유 (whose)', example:'I know a girl whose sister is famous.', translation:'언니가 유명한 여자애를 알아요.' },
    ],
    examples: [
      { en:'The woman who lives next door is a nurse.', ko:'옆집에 사는 여자는 간호사예요.', highlight:'who lives next door' },
      { en:'The phone that I bought is broken.', ko:'제가 산 전화기가 고장 났어요.', highlight:'that I bought' },
      { en:'I know a man whose wife is a chef.', ko:'아내가 요리사인 남자를 알아요.', highlight:'whose wife is a chef' },
      { en:'Paris is the city where they got married.', ko:'파리는 그들이 결혼한 도시예요.', highlight:'where they got married' },
    ],
    mistakes: [
      { wrong:'The woman which called you left.', right:'The woman who called you left.', note:'사람에게는 which 대신 who를 써요.' },
      { wrong:'The car who I drive is red.', right:'The car which/that I drive is red.', note:'사물에게는 who 대신 which/that을 써요.' },
      { wrong:'The man whose he works here...', right:'The man who works here...', note:"whose는 소유를 나타내요. '그가 일하는' = who works." },
    ],
    quiz: [
      { question:'The student ___ won the prize is from Korea.', options:['which','whose','who','what'], answer:2, explanation:'사람(student)을 수식하므로 who를 써요.' },
      { question:'I bought the book ___ you recommended.', options:['who','whose','what','which'], answer:3, explanation:'사물(book)을 수식하므로 which(또는 that)를 써요.' },
      { question:'She works for a company ___ products are sold worldwide.', options:['who','which','whose','that'], answer:2, explanation:"회사의 제품 = 소유 관계이므로 whose를 써요." },
      { question:'관계절에서 생략 가능한 것은?', options:['주격 관계대명사','목적격 관계대명사','소유격 관계대명사','없음'], answer:1, explanation:'목적격 관계대명사(the book I read = the book that I read)는 생략 가능해요.' },
    ],
    tip: '관계절에 콤마(,)가 있으면 비한정 관계절 — 추가 정보만 제공해요. "My brother, who lives in London, called me." (오빠는 한 명뿐)',
  },

  // ══ C1 ════════════════════════════════════════════════════════════════════

  {
    id: 'c1-third-conditional',
    level: 'c1', category: 'conditionals', categoryColor: '#DC2626',
    emoji: '⏮️', title: 'Third Conditional (3형식 조건문)',
    subtitle: '과거에 일어나지 않은 일에 대한 후회·가정',
    color: '#1D4ED8', bg: '#EFF6FF',
    keyPoint: '과거에 실제로 일어나지 않은 상황을 가정해요. If + had + p.p., would have + p.p.',
    structure: {
      headers: ['절', '구조', '예문'],
      rows: [
        { cells: ['조건절', 'If + had + 과거분사(p.p.)', 'If I had studied...'], highlight: true },
        { cells: ['결과절', 'would/could/might + have + p.p.', '...I would have passed.'], highlight: true },
        { cells: ['혼합 조건문', 'If + 과거완료, would + 동사 원형', 'If I had saved money, I would be rich now.'] },
      ],
    },
    useCases: [
      { color:'#1D4ED8', label:'과거에 대한 후회', example:'If I had worked harder, I would have succeeded.', translation:'더 열심히 했더라면 성공했을 텐데요.' },
      { color:'#DC2626', label:'과거의 가정', example:'If she had left earlier, she wouldn\'t have missed the train.', translation:'더 일찍 떠났다면 기차를 놓치지 않았을 텐데요.' },
      { color:'#059669', label:'과거가 현재에 미치는 영향', example:'If he had taken that job, he would be rich now.', translation:'그 일을 받아들였다면 지금 부자일 텐데요.' },
    ],
    examples: [
      { en:'If I had known, I would have told you.', ko:'알았더라면 말했을 텐데요.', highlight:'had known...would have told' },
      { en:'She would have come if she had been invited.', ko:'초대받았다면 왔을 텐데요.', highlight:'would have come...had been invited' },
      { en:'If we had left earlier, we wouldn\'t have been late.', ko:'더 일찍 떠났다면 늦지 않았을 거예요.', highlight:"had left...wouldn't have been" },
      { en:'He could have won if he had trained harder.', ko:'더 열심히 훈련했더라면 이겼을 텐데요.', highlight:'could have won...had trained' },
    ],
    mistakes: [
      { wrong:'If I had known, I would told you.', right:'If I had known, I would have told you.', note:"결과절은 would have + p.p. 'have'를 빠뜨리지 마세요." },
      { wrong:'If I would have studied, I passed.', right:'If I had studied, I would have passed.', note:'if절에 would 쓰지 않아요. had + p.p.를 써요.' },
      { wrong:'If she hadn\'t come, everything is fine.', right:'If she hadn\'t come, everything would have been fine.', note:"결과절에 would have + p.p.가 필요해요." },
    ],
    quiz: [
      { question:'If I ___ the map, I ___ lost.', options:["had/wouldn't have got","had brought/wouldn't have got","brought/won't get","had brought/hadn't got"], answer:1, explanation:'If + had brought + would not have got (3형식).' },
      { question:'She could ___ the job if she ___ earlier.', options:['have got/applied','got/had applied','have got/had applied','get/had applied'], answer:2, explanation:'could have got (결과) + if had applied (조건).' },
      { question:'이 문장의 의미는? "If I had been you, I would have accepted."', options:['나는 당신이 될 것이다','내가 당신이었다면 수락했을 텐데','나는 당신이 수락하길 바란다','수락하는 것이 좋겠다'], answer:1, explanation:'3형식 = 과거의 비현실적 가정. 이미 지나간 일에 대한 가정.' },
      { question:'3형식의 핵심 구조는?', options:['If+현재, will+동사','If+과거, would+동사','If+had+p.p., would have+p.p.','If+were, would+동사'], answer:2, explanation:'3형식: If + had + p.p. → would/could/might + have + p.p.' },
    ],
    tip: '3형식은 "그때 그랬더라면..."의 후회를 표현해요. 현실과 완전히 반대인 과거 상황이에요.',
  },

  {
    id: 'c1-inversion',
    level: 'c1', category: 'advanced', categoryColor: '#1D4ED8',
    emoji: '🔃', title: 'Inversion (도치)',
    subtitle: '강조와 격식을 위한 주어-동사 순서 바꾸기',
    color: '#1D4ED8', bg: '#EFF6FF',
    keyPoint: '특정 표현을 문두에 놓으면 주어와 동사의 순서가 바뀌어요. 격식체와 강조에 자주 써요.',
    structure: {
      headers: ['조건', '도치 구조', '예문'],
      rows: [
        { cells: ['부정어 Never', 'Never + have/has + 주어 + p.p.', 'Never have I seen this.'], highlight: true },
        { cells: ['부정어 Not only', 'Not only + 조동사 + 주어...', 'Not only did he lie...'], highlight: true },
        { cells: ['Hardly/Scarcely', 'Hardly had + 주어 + p.p. + when...', 'Hardly had I arrived when...'] },
        { cells: ['Only then', 'Only then + did/was + 주어', 'Only then did I understand.'] },
        { cells: ['So/Such', 'So + adj + that + 도치', 'So tired was she that she slept.'] },
      ],
    },
    useCases: [
      { color:'#1D4ED8', label:'부정어 강조', example:'Never have I been so happy.', translation:'이렇게 행복해본 적이 없어요.' },
      { color:'#7C3AED', label:'격식 글쓰기', example:'Not only is he smart, but he is also kind.', translation:'그는 똑똑할 뿐만 아니라 친절하기도 해요.' },
      { color:'#059669', label:'극적 효과', example:'Only then did she realise the truth.', translation:'그때서야 그녀는 진실을 깨달았어요.' },
    ],
    examples: [
      { en:'Never have I met such an interesting person.', ko:'이렇게 흥미로운 사람을 만나본 적이 없어요.', highlight:'Never have I met' },
      { en:'Not only did he forget, but he also didn\'t apologise.', ko:'잊어버렸을 뿐만 아니라 사과도 안 했어요.', highlight:'Not only did he' },
      { en:'Hardly had I sat down when the phone rang.', ko:'앉자마자 전화가 울렸어요.', highlight:'Hardly had I...when' },
      { en:'Only by working together can we solve this.', ko:'함께 일해야만 이걸 해결할 수 있어요.', highlight:'Only by...can we' },
    ],
    mistakes: [
      { wrong:'Never I have seen this.', right:'Never have I seen this.', note:'부정어 뒤에 조동사, 그 뒤에 주어 순서로 도치해요.' },
      { wrong:'Not only he is smart but also kind.', right:'Not only is he smart but he is also kind.', note:'Not only 뒤에 be/조동사 + 주어로 도치해요.' },
      { wrong:'Seldom she goes out.', right:'Seldom does she go out.', note:'부정 부사어 뒤에 do/does/did + 주어로 도치해요.' },
    ],
    quiz: [
      { question:'___ I seen such a beautiful view.', options:['Never have','Have never','Never had','Not have'], answer:0, explanation:'Never + have + 주어의 도치 순서.' },
      { question:'Not only ___ late, but he also forgot his report.', options:['he was','was he','did he','he did'], answer:1, explanation:'Not only + was/did/is + 주어의 도치 순서.' },
      { question:'도치가 일어나는 가장 일반적인 경우는?', options:['의문문','부정어·부정 부사가 문두에 올 때','주어가 길 때','동사가 두 개일 때'], answer:1, explanation:'Never, Not only, Hardly, Seldom 같은 부정어가 문두에 오면 도치가 일어나요.' },
      { question:'Hardly ___ arrived when it started raining.', options:['I had','had I','have I','I have'], answer:1, explanation:'Hardly + had + 주어: Hardly had I arrived.' },
    ],
    tip: '도치는 특히 IELTS/TOEFL 에세이, 공식 연설, 문학에서 자주 보여요. 시험에 나오면 당황하지 마세요!',
  },

  // ══ C2 ════════════════════════════════════════════════════════════════════

  {
    id: 'c2-subjunctive',
    level: 'c2', category: 'advanced', categoryColor: '#1D4ED8',
    emoji: '🎭', title: 'Subjunctive Mood (가정법)',
    subtitle: '소망·요구·제안을 표현하는 특별한 동사 형태',
    color: '#4F46E5', bg: '#EEF2FF',
    keyPoint: '가정법은 현실이 아닌 소망·제안·요구를 표현해요. 주어에 관계없이 동사 원형을 써요.',
    structure: {
      headers: ['유형', '구조', '예문'],
      rows: [
        { cells: ['현재 가정법', 'It is important that + 주어 + 동사 원형', 'It is essential that he be present.'], highlight: true },
        { cells: ['제안·요구 동사', 'suggest/recommend/insist + that + 주어 + 동사 원형', 'I suggest that she leave now.'], highlight: true },
        { cells: ['고정 표현', 'If I were to, Were he to...', 'Were she to resign...'] },
        { cells: ['양보 가정법', 'Be that as it may / Come what may', 'Come what may, I will be there.'] },
      ],
    },
    useCases: [
      { color:'#4F46E5', label:'요구·제안 (that절)', example:'The doctor insisted that he rest.', translation:'의사가 그가 쉬어야 한다고 주장했어요.' },
      { color:'#DC2626', label:'격식 조건문', example:'Were this to happen, we would act.', translation:'이런 일이 생긴다면 행동할 거예요.' },
      { color:'#D97706', label:'고정 표현', example:'Come what may, we will succeed.', translation:'무슨 일이 있어도 성공할 거예요.' },
    ],
    examples: [
      { en:'It is vital that every student attend the meeting.', ko:'모든 학생이 회의에 참석하는 것이 중요해요.', highlight:'attend (not attends)' },
      { en:'I recommend that she apply for the position.', ko:'그녀가 그 자리에 지원하도록 추천해요.', highlight:'apply (not applies)' },
      { en:'Were he to know the truth, he would be devastated.', ko:'그가 진실을 안다면 망연자실할 거예요.', highlight:'Were he to know' },
      { en:'The committee demanded that the report be submitted.', ko:'위원회는 보고서를 제출하도록 요구했어요.', highlight:'be submitted (not is)' },
    ],
    mistakes: [
      { wrong:'It is important that he attends.', right:'It is important that he attend.', note:'가정법 현재는 3인칭 단수여도 -s를 붙이지 않아요.' },
      { wrong:'I suggest that she leaves now.', right:'I suggest that she leave now.', note:'suggest that + 동사 원형 (가정법).' },
      { wrong:'The rule requires that everyone pays.', right:'The rule requires that everyone pay.', note:'require that + 동사 원형.' },
    ],
    quiz: [
      { question:'It is essential that every employee ___ the training.', options:['completes','complete','completed','completing'], answer:1, explanation:'가정법 현재: 주어에 관계없이 동사 원형(complete).' },
      { question:'The judge ordered that the evidence ___ destroyed.', options:['is','be','was','being'], answer:1, explanation:'order that + be + p.p. (가정법 수동).' },
      { question:'"Were she to leave" 의 의미는?', options:['그녀가 떠났다','그녀가 떠난다면','그녀가 떠났더라면','그녀가 떠나야 한다'], answer:1, explanation:'Were + 주어 + to + 동사 = 격식체 조건문 "만약 ~한다면".' },
      { question:'미국 영어와 영국 영어의 차이는?', options:['가정법은 미국 영어에만 있다','영국 영어는 should를 선호한다','미국 영어는 동사 원형을 쓴다','차이 없다'], answer:1, explanation:"영국식: 'It is important that he should attend.' 미국식: 'It is important that he attend.'" },
    ],
    tip: 'IELTS C1+ 필수! "It is important/vital/essential/crucial that..." + 동사 원형 패턴을 완성 문장으로 5개 외워두세요.',
  },

  {
    id: 'c2-cleft-sentences',
    level: 'c2', category: 'advanced', categoryColor: '#1D4ED8',
    emoji: '✂️', title: 'Cleft Sentences (분열문)',
    subtitle: '특정 정보를 극적으로 강조하는 고급 구조',
    color: '#0F172A', bg: '#F8FAFC',
    keyPoint: '분열문은 문장의 특정 부분을 It is/was... that 또는 What...is/was 구조로 강조해요.',
    structure: {
      headers: ['유형', '구조', '예문'],
      rows: [
        { cells: ['It-cleft', 'It is/was + 강조요소 + that...', 'It was John that called.'], highlight: true },
        { cells: ['Wh-cleft', 'What + 절 + is/was + 강조요소', 'What I need is rest.'], highlight: true },
        { cells: ['All-cleft', 'All + 절 + is/was + 강조요소', 'All I want is peace.'] },
        { cells: ['Reverse wh', '강조요소 + is/was + what + 절', 'Rest is what I need.'] },
      ],
    },
    useCases: [
      { color:'#0F172A', label:'사람 강조', example:'It was Sarah who solved the problem.', translation:'그 문제를 푼 것은 사라였어요.' },
      { color:'#2563EB', label:'원하는 것 강조', example:'What I want is an honest answer.', translation:'내가 원하는 것은 솔직한 답변이에요.' },
      { color:'#7C3AED', label:'최소 강조', example:'All I ask is that you be honest.', translation:'내가 바라는 것은 그저 정직함이에요.' },
    ],
    examples: [
      { en:'It was in Paris that they first met.', ko:'그들이 처음 만난 곳은 파리였어요.', highlight:'It was...that' },
      { en:'What surprised me was his reaction.', ko:'나를 놀라게 한 것은 그의 반응이었어요.', highlight:'What surprised me was' },
      { en:'It is honesty that I value most.', ko:'내가 가장 중요시하는 것은 정직이에요.', highlight:'It is...that' },
      { en:'All she wanted was to be understood.', ko:'그녀가 원했던 것은 그저 이해받는 것이었어요.', highlight:'All she wanted was' },
    ],
    mistakes: [
      { wrong:'It was John who he called me.', right:'It was John who called me.', note:'who 이후에 대명사를 반복하지 않아요.' },
      { wrong:'What I need it is rest.', right:'What I need is rest.', note:"'it'을 반복하지 않아요. What I need = 주어." },
      { wrong:'It is yesterday that I saw her.', right:'It was yesterday that I saw her.', note:"과거 사실에는 It was를 써요." },
    ],
    quiz: [
      { question:'___ my sister ___ bought this house.', options:['It is/who','It was/who','It was/which','It is/which'], answer:1, explanation:'사람(sister) + 과거(bought) → It was + who.' },
      { question:'___ I enjoy most is reading.', options:['That','Which','What','Who'], answer:2, explanation:'What = the thing that. "내가 가장 즐기는 것은".' },
      { question:'분열문의 주된 목적은?', options:['시제를 명확히 하기','특정 정보를 강조하기','문장을 짧게 만들기','격식을 높이기'], answer:1, explanation:'분열문은 문장의 특정 요소를 강조하기 위해 사용해요.' },
      { question:'"All I need is love." 이 문장의 유형은?', options:['It-cleft','Wh-cleft','All-cleft','Reverse wh-cleft'], answer:2, explanation:"All + 주어 + 동사 + is + 강조요소 = All-cleft." },
    ],
    tip: '분열문은 말할 때 강세(stress)와 함께 써야 효과적이에요. "It was JOHN who did it (not me)" — 대화에서 억양으로 강조하는 연습을 해보세요!',
  },
];

// ── Helper functions ──────────────────────────────────────────────────────────

export const getChaptersByLevel = (level: GrammarLevel) =>
  GRAMMAR_CHAPTERS.filter(c => c.level === level);

export const getChapterById = (id: string) =>
  GRAMMAR_CHAPTERS.find(c => c.id === id);

export const getLevelInfo = (level: GrammarLevel) => {
  const map: Record<GrammarLevel, { label: string; desc: string; color: string; bg: string; xpRange: string }> = {
    a1: { label:'A1', desc:'Beginner', color:'#059669', bg:'#ECFDF5', xpRange:'0–800 XP' },
    a2: { label:'A2', desc:'Elementary', color:'#0891B2', bg:'#F0F9FF', xpRange:'800–1,400 XP' },
    b1: { label:'B1', desc:'Intermediate', color:'#6366F1', bg:'#EEF2FF', xpRange:'1,400–2,400 XP' },
    b2: { label:'B2', desc:'Upper-Intermediate', color:'#7C3AED', bg:'#F5F3FF', xpRange:'2,400–4,000 XP' },
    c1: { label:'C1', desc:'Advanced', color:'#1D4ED8', bg:'#EFF6FF', xpRange:'4,000–6,500 XP' },
    c2: { label:'C2', desc:'Mastery', color:'#0F172A', bg:'#F8FAFC', xpRange:'6,500+ XP' },
  };
  return map[level];
};

export const LEVEL_ORDER: GrammarLevel[] = ['a1','a2','b1','b2','c1','c2'];
