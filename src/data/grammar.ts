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
  { id:'tenses',    label:'Tenses',     emoji:'⏰', color:'#2563EB' },
  { id:'verbs',     label:'Verbs',     emoji:'⚡', color:'#059669' },
  { id:'nouns',     label:'Nouns & Articles', emoji:'📦', color:'#D97706' },
  { id:'questions', label:'Questions',   emoji:'❓', color:'#7C3AED' },
  { id:'modals',    label:'Modal Verbs',   emoji:'🎛️', color:'#0891B2' },
  { id:'conditionals', label:'Conditionals', emoji:'🔀', color:'#DC2626' },
  { id:'passive',   label:'Passive Voice',   emoji:'🔄', color:'#BE185D' },
  { id:'clauses',   label:'Clauses',    emoji:'🔗', color:'#065F46' },
  { id:'advanced',  label:'Advanced', emoji:'🎓', color:'#1D4ED8' },
];

// ── Chapter Data ──────────────────────────────────────────────────────────────

export const GRAMMAR_CHAPTERS: GrammarChapter[] = [

  // ══ A1 ════════════════════════════════════════════════════════════════════

  {
    id: 'a1-be-verb',
    level: 'a1', category: 'verbs', categoryColor: '#059669',
    emoji: '🌱', title: 'Be Verb (am / is / are)',
    subtitle: 'The most fundamental verb — to be',
    color: '#059669', bg: '#ECFDF5',
    keyPoint: 'The verb "be" changes to am / is / are depending on the subject. For negatives, just add "not" after it.',
    structure: {
      headers: ['Subject', 'Be Verb', 'Example'],
      rows: [
        { cells: ['I', 'am', 'I am a student.'], highlight: true },
        { cells: ['He / She / It', 'is', 'She is happy.'] },
        { cells: ['You / We / They', 'are', 'They are friends.'] },
      ],
    },
    useCases: [
      { color:'#2563EB', label:'Profession', example:'I am a teacher.', translation:'I am a teacher.' },
      { color:'#059669', label:'State / Feeling', example:'She is tired.', translation:'She is tired.' },
      { color:'#D97706', label:'Location', example:'We are at home.', translation:'We are at home.' },
    ],
    examples: [
      { en:'I am 25 years old.', highlight:'am' },
      { en:'He is a doctor.', highlight:'is' },
      { en:'They are not here.', highlight:'are not' },
      { en:'Is she your sister?', highlight:'Is' },
    ],
    mistakes: [
      { wrong:'I is happy.', right:'I am happy.', note:'After I, always use am.' },
      { wrong:'He are a student.', right:'He is a student.', note:'After He/She/It, use is.' },
      { wrong:'They is from Korea.', right:'They are from Korea.', note:'After They, use are.' },
    ],
    quiz: [
      { question: 'She ___ my best friend.', options:['am','is','are','be'], answer:1, explanation:'She is 3rd person singular, so use is.' },
      { question: 'We ___ students.', options:['am','is','are','be'], answer:2, explanation:'We is plural, so use are.' },
      { question: 'I ___ not tired.', options:['am','is','are','do'], answer:0, explanation:'After I, always use am.' },
      { question: 'Which sentence is correct?', options:['He am happy.','I is a doctor.','They are late.','She are kind.'], answer:2, explanation:'They + are is the correct combination.' },
    ],
    tip: 'You can contract am/is/are: I\'m, she\'s, they\'re. These contractions sound much more natural in conversation!',
  },

  {
    id: 'a1-present-simple',
    level: 'a1', category: 'tenses', categoryColor: '#2563EB',
    emoji: '☀️', title: 'Present Simple',
    subtitle: 'Habits, routines and facts',
    color: '#2563EB', bg: '#EFF6FF',
    keyPoint: 'Use this for habits, routines and permanent facts. Add -s to the verb when He/She/It is the subject.',
    structure: {
      headers: ['Subject', 'Verb', 'Example'],
      rows: [
        { cells: ['I / You / We / They', 'base verb', 'I eat breakfast every day.'], highlight: true },
        { cells: ['He / She / It', 'verb + s/es', 'She works at a bank.'] },
        { cells: ['Negative', "don't / doesn't + verb", "He doesn't like coffee."] },
        { cells: ['Question', 'Do / Does + subject + verb?', 'Do you speak English?'] },
      ],
    },
    useCases: [
      { color:'#2563EB', label:'Habits & Routines', example:'I drink coffee every morning.', translation:'I drink coffee every morning.' },
      { color:'#059669', label:'Facts & Truths', example:'The sun rises in the east.', translation:'The sun rises in the east.' },
      { color:'#D97706', label:'Likes & Preferences', example:'She loves music.', translation:'She loves music.' },
    ],
    examples: [
      { en:'I wake up at 7am every day.', highlight:'wake up' },
      { en:'He plays football on weekends.', highlight:'plays' },
      { en:'We don\'t eat meat.', highlight:"don't eat" },
      { en:'Does she live in Seoul?', highlight:'Does' },
    ],
    mistakes: [
      { wrong:'She work in a hospital.', right:'She works in a hospital.', note:'He/She/It + verb always takes -s/-es.' },
      { wrong:'He don\'t like spicy food.', right:'He doesn\'t like spicy food.', note:'3rd person singular negatives use doesn\'t.' },
      { wrong:'Does she likes pizza?', right:'Does she like pizza?', note:'After Does, use the base verb. No -s needed.' },
    ],
    quiz: [
      { question:'She ___ to work by bus.', options:['go','goes','going','went'], answer:1, explanation:'She is 3rd person singular, so use goes.' },
      { question:'They ___ not drink alcohol.', options:['do','does','is','are'], answer:0, explanation:'They is plural, so use do not (don\'t).' },
      { question:'___ he speak French?', options:['Do','Does','Is','Are'], answer:1, explanation:'3rd person singular questions use Does.' },
      { question:'Water ___ at 100°C.', options:['boil','boils','boiling','boiled'], answer:1, explanation:'Scientific facts use present simple. It (water) → boils.' },
    ],
    tip: '3rd person singular rule: verbs ending in -s/-sh/-ch/-x/-o add -es. Examples: watches, goes, fixes',
  },

  {
    id: 'a1-articles',
    level: 'a1', category: 'nouns', categoryColor: '#D97706',
    emoji: '📦', title: 'Articles: a / an / the',
    subtitle: 'Small words, big difference',
    color: '#D97706', bg: '#FFFBEB',
    keyPoint: 'Use a/an for first mention, the for something already known. Use an before vowel sounds.',
    structure: {
      headers: ['Article', 'When to use', 'Example'],
      rows: [
        { cells: ['a', 'First mention / starts with consonant', 'I saw a dog.'], highlight: true },
        { cells: ['an', 'First mention / starts with vowel (a,e,i,o,u)', 'She ate an apple.'], highlight: true },
        { cells: ['the', 'Specific / known thing', 'The dog was cute.'] },
        { cells: ['zero article', 'General / uncountable nouns', 'I love music.'] },
      ],
    },
    useCases: [
      { color:'#D97706', label:'First mention (a/an)', example:'I bought a new phone.', translation:'I bought a new phone.' },
      { color:'#2563EB', label:'Second mention (the)', example:'The phone is great.', translation:'The phone is great.' },
      { color:'#059669', label:'Unique in the world (the)', example:'The sun is bright today.', translation:'The sun is bright today.' },
    ],
    examples: [
      { en:'I have a cat and a dog.', highlight:'a' },
      { en:'The cat is black.', highlight:'The' },
      { en:'She is an engineer.', highlight:'an' },
      { en:'I love the moon.', highlight:'the' },
    ],
    mistakes: [
      { wrong:'I am a engineer.', right:'I am an engineer.', note:'Before a vowel sound (e), use an.' },
      { wrong:'The life is short.', right:'Life is short.', note:'No article needed for abstract concepts in general.' },
      { wrong:'I go to the school.', right:'I go to school.', note:'School, hospital etc. are used without the when referring to their purpose.' },
    ],
    quiz: [
      { question:'She is ___ doctor.', options:['a','an','the','Neither'], answer:0, explanation:'doctor starts with a consonant (d), so use a.' },
      { question:'___ Earth is round.', options:['A','An','The','Neither'], answer:2, explanation:'Earth is unique in the world, so use The.' },
      { question:'I ate ___ orange.', options:['a','an','the','Neither'], answer:1, explanation:'orange starts with a vowel (o), so use an.' },
      { question:'___ love is beautiful.', options:['A','An','The','Neither'], answer:3, explanation:'No article needed when talking about abstract concepts in general.' },
    ],
    tip: 'Use an before silent h too: an honest man, an hour. The rule is about sound, not spelling!',
  },

  {
    id: 'a1-questions',
    level: 'a1', category: 'questions', categoryColor: '#7C3AED',
    emoji: '❓', title: 'Basic Questions',
    subtitle: 'Yes/No and Wh- questions',
    color: '#7C3AED', bg: '#F5F3FF',
    keyPoint: 'For Yes/No questions, move the verb to the front. Wh- questions start with a question word.',
    structure: {
      headers: ['Question Type', 'Structure', 'Example'],
      rows: [
        { cells: ['Yes/No (be verb)', 'Am/Is/Are + subject?', 'Are you happy?'], highlight: true },
        { cells: ['Yes/No (regular verb)', 'Do/Does + subject + verb?', 'Do you like pizza?'], highlight: true },
        { cells: ['What', 'What + do/does + subject?', 'What do you eat?'] },
        { cells: ['Where', 'Where + do/does + subject?', 'Where does she live?'] },
        { cells: ['When', 'When + do/does + subject?', 'When do you sleep?'] },
        { cells: ['Who', 'Who + verb?', 'Who is your teacher?'] },
      ],
    },
    useCases: [
      { color:'#7C3AED', label:'Yes/No Questions', example:'Is he your brother?', translation:'Is he your brother?' },
      { color:'#2563EB', label:'Asking for info', example:'What is your name?', translation:'What is your name?' },
      { color:'#059669', label:'Asking about place', example:'Where do you work?', translation:'Where do you work?' },
    ],
    examples: [
      { en:'Are you from Japan?', highlight:'Are' },
      { en:'What do you do?', highlight:'What' },
      { en:'Where does he live?', highlight:'Where does' },
      { en:'Who is your favourite singer?', highlight:'Who' },
    ],
    mistakes: [
      { wrong:'Where you live?', right:'Where do you live?', note:'Even after a question word, you still need do/does.' },
      { wrong:'What she likes?', right:'What does she like?', note:'Use does for third-person singular.' },
      { wrong:'Do you are a student?', right:'Are you a student?', note:'Don\'t use do/does in questions with be verbs.' },
    ],
    quiz: [
      { question:'___ you like coffee?', options:['Are','Do','Does','Is'], answer:1, explanation:'For ordinary verbs with you, use Do.' },
      { question:'Where ___ she work?', options:['do','does','is','are'], answer:1, explanation:'She is 3rd person singular, so use does.' },
      { question:'___ your name?', options:["What's","What do","What does","What are"], answer:0, explanation:"What's = What is. This is the most natural form." },
      { question:'Who ___ your English teacher?', options:['do','does','is','are'], answer:2, explanation:'The structure is Who + be verb + subject.' },
    ],
  },

  // ══ A2 ════════════════════════════════════════════════════════════════════

  {
    id: 'a2-past-simple',
    level: 'a2', category: 'tenses', categoryColor: '#2563EB',
    emoji: '📅', title: 'Past Simple',
    subtitle: 'Talking about completed past events',
    color: '#0284C7', bg: '#F0F9FF',
    keyPoint: 'Regular verbs add -ed; irregular verbs must be memorised. Use did for negatives and questions.',
    structure: {
      headers: ['Form', 'Structure', 'Example'],
      rows: [
        { cells: ['Positive (regular)', 'verb + -ed', 'I walked to school.'], highlight: true },
        { cells: ['Positive (irregular)', 'irregular past form', 'She went to Paris.'], highlight: true },
        { cells: ['Negative', "didn't + base verb", "He didn't come."] },
        { cells: ['Question', 'Did + subject + base verb?', 'Did you see it?'] },
      ],
    },
    useCases: [
      { color:'#0284C7', label:'Completed past action', example:'I finished work at 6pm.', translation:'Work finished at 6pm.' },
      { color:'#7C3AED', label:'Historical facts', example:'He was born in 1990.', translation:'He was born in 1990.' },
      { color:'#D97706', label:'Sequence of events', example:'I woke up, ate, and left.', translation:'I woke up, ate and left.' },
    ],
    examples: [
      { en:'I visited my grandmother yesterday.', highlight:'visited' },
      { en:'She didn\'t eat breakfast this morning.', highlight:"didn't eat" },
      { en:'Did you watch the game last night?', highlight:'Did' },
      { en:'They went to the beach last summer.', highlight:'went' },
    ],
    mistakes: [
      { wrong:'I didn\'t went there.', right:'I didn\'t go there.', note:"After didn't, use the base verb form. went → go" },
      { wrong:'Did she came?', right:'Did she come?', note:'After Did, use the base verb.' },
      { wrong:'I have went yesterday.', right:'I went yesterday.', note:"Use past simple, not present perfect, with specific past time expressions like yesterday." },
    ],
    quiz: [
      { question:'She ___ a movie last night.', options:['watch','watches','watched','watching'], answer:2, explanation:'last night is a past time expression, so use the past tense watched.' },
      { question:'They ___ not go to school.', options:['do','does','did','have'], answer:2, explanation:'Past negatives use didn\'t (= did not).' },
      { question:'___ you enjoy the concert?', options:['Do','Does','Did','Have'], answer:2, explanation:'Past questions start with Did.' },
      { question:'Which past tense form is correct?', options:['I buyed a car.','She goed home.','He came late.','They readed a book.'], answer:2, explanation:'came is the correct irregular past form of come.' },
    ],
    tip: 'Key irregular verbs to memorise: go→went, have→had, see→saw, come→came, give→gave, take→took, make→made',
  },

  {
    id: 'a2-present-continuous',
    level: 'a2', category: 'tenses', categoryColor: '#2563EB',
    emoji: '🔄', title: 'Present Continuous',
    subtitle: 'Actions happening right now',
    color: '#0891B2', bg: '#F0F9FF',
    keyPoint: 'Use be + verb-ing to describe actions happening right now.',
    structure: {
      headers: ['Form', 'Structure', 'Example'],
      rows: [
        { cells: ['Positive', 'am/is/are + verb-ing', 'I am eating.'], highlight: true },
        { cells: ['Negative', "am/is/are + not + verb-ing", "She isn't sleeping."] },
        { cells: ['Question', 'Am/Is/Are + subject + verb-ing?', 'Are you watching TV?'] },
      ],
    },
    useCases: [
      { color:'#0891B2', label:'Right now', example:'I am writing an email.', translation:'I am writing an email right now.' },
      { color:'#7C3AED', label:'Temporary situation', example:'She is staying at a hotel.', translation:'She is staying at a hotel.' },
      { color:'#D97706', label:'Near future plans', example:'We are meeting tomorrow.', translation:'We are meeting tomorrow.' },
    ],
    examples: [
      { en:'The children are playing outside.', highlight:'are playing' },
      { en:'I am not feeling well today.', highlight:'am not feeling' },
      { en:'Is it raining outside?', highlight:'Is it raining' },
      { en:'She is learning Korean these days.', highlight:'is learning' },
    ],
    mistakes: [
      { wrong:'I am knowing the answer.', right:'I know the answer.', note:'State verbs like know, like, want, love are not used in the continuous form.' },
      { wrong:'She is eat dinner.', right:'She is eating dinner.', note:'In continuous tenses, always add -ing to the verb.' },
      { wrong:'They are work hard.', right:'They are working hard.', note:'After the be verb, use the -ing form, not the base verb.' },
    ],
    quiz: [
      { question:'He ___ a book right now.', options:['reads','is reading','read','has read'], answer:1, explanation:'Right now signals something happening at this moment — use continuous.' },
      { question:'I ___ (not) feel hungry.', options:["don't","isn't","am not","aren't"], answer:2, explanation:'The negative of I + am is am not.' },
      { question:'___ they ___ the game?', options:['Are/watch','Is/watching','Are/watching','Do/watching'], answer:2, explanation:'Are + they + watching — correct continuous question structure.' },
      { question:'Which verb CANNOT be used in the continuous tense?', options:['run','eat','believe','sleep'], answer:2, explanation:'Believe is a state verb and cannot be used in continuous tenses.' },
    ],
    tip: 'Present simple vs continuous: "I eat rice" (every day) vs "I am eating rice" (right now)',
  },

  {
    id: 'a2-comparative',
    level: 'a2', category: 'nouns', categoryColor: '#D97706',
    emoji: '⚖️', title: 'Comparatives & Superlatives',
    subtitle: 'Comparing things and people',
    color: '#B45309', bg: '#FFFBEB',
    keyPoint: 'Use -er/more to compare two things; use -est/most for the extreme among three or more.',
    structure: {
      headers: ['Adjective', 'Comparative', 'Superlative'],
      rows: [
        { cells: ['short (1 syllable)', 'shorter', 'the shortest'], highlight: true },
        { cells: ['big (short vowel + consonant)', 'bigger', 'the biggest'] },
        { cells: ['beautiful (3+ syllables)', 'more beautiful', 'the most beautiful'], highlight: true },
        { cells: ['good (irregular)', 'better', 'the best'] },
        { cells: ['bad (irregular)', 'worse', 'the worst'] },
        { cells: ['far (irregular)', 'farther / further', 'the farthest'] },
      ],
    },
    useCases: [
      { color:'#B45309', label:'Comparing two (than)', example:'Seoul is bigger than Busan.', translation:'Seoul is bigger than Busan.' },
      { color:'#059669', label:'Superlative (3 or more)', example:'She is the tallest in the class.', translation:'She is the tallest in the class.' },
      { color:'#2563EB', label:'Equal comparison (as~as)', example:'He is as tall as his father.', translation:'He is as tall as his father.' },
    ],
    examples: [
      { en:'This coffee is hotter than that one.', highlight:'hotter than' },
      { en:'It\'s the most expensive restaurant here.', highlight:'the most expensive' },
      { en:'Today is better than yesterday.', highlight:'better than' },
      { en:'She runs faster than anyone else.', highlight:'faster than' },
    ],
    mistakes: [
      { wrong:'She is more tall than me.', right:'She is taller than me.', note:'1-2 syllable adjectives take -er. No need for more.' },
      { wrong:'He is the most fast runner.', right:'He is the fastest runner.', note:'Short adjectives like fast take -est.' },
      { wrong:'This is more good.', right:'This is better.', note:'The comparative of good is better (irregular).' },
    ],
    quiz: [
      { question:'Mount Everest is ___ mountain in the world.', options:['higher','the highest','most high','more high'], answer:1, explanation:'When comparing within a group of more (the world), use the superlative: the highest.' },
      { question:'My bag is ___ than yours.', options:['more heavy','heavier','heaviest','most heavy'], answer:1, explanation:'2-syllable adjectives ending in -y change to -ier: heavy → heavier.' },
      { question:'English is ___ French for me.', options:['easy than','easier as','easier than','more easy than'], answer:2, explanation:'Use comparative + than. easy → easier.' },
      { question:'Which superlative form is correct?', options:['the most big','the biggest','the more big','the bigest'], answer:1, explanation:'Short vowel + single consonant: double the consonant — big → biggest.' },
    ],
    tip: 'Some 2-syllable adjectives can take -er/-est: simple→simpler, clever→cleverer. Both forms are acceptable!',
  },

  // ══ B1 ════════════════════════════════════════════════════════════════════

  {
    id: 'b1-present-perfect',
    level: 'b1', category: 'tenses', categoryColor: '#2563EB',
    emoji: '✨', title: 'Present Perfect',
    subtitle: 'Connecting past actions to the present',
    color: '#6366F1', bg: '#EEF2FF',
    keyPoint: 'Use have/has + past participle for past experiences, recent results and ongoing situations.',
    structure: {
      headers: ['Form', 'Structure', 'Example'],
      rows: [
        { cells: ['Positive', 'have/has + past participle', 'I have visited London.'], highlight: true },
        { cells: ['Negative', "haven't/hasn't + p.p.", "She hasn't eaten."] },
        { cells: ['Question', 'Have/Has + subject + p.p.?', 'Have you ever been there?'] },
      ],
    },
    useCases: [
      { color:'#6366F1', label:'Experience (ever/never)', example:'Have you ever tried sushi?', translation:'Have you ever tried sushi?' },
      { color:'#059669', label:'Result (just/already)', example:'I have just finished work.', translation:'I have just finished work.' },
      { color:'#D97706', label:'Duration (for/since)', example:'She has lived here since 2010.', translation:'She has lived here since 2010.' },
    ],
    examples: [
      { en:'I have never eaten octopus.', highlight:'have never eaten' },
      { en:'She has already left the office.', highlight:'has already left' },
      { en:'We have known each other for 10 years.', highlight:'have known...for' },
      { en:'Have you seen this film yet?', highlight:'Have you seen...yet' },
    ],
    mistakes: [
      { wrong:'I have went to Paris.', right:'I have been to Paris.', note:"have been to = experience of visiting. went is a simple past verb." },
      { wrong:'She has finished it yesterday.', right:'She finished it yesterday.', note:"With specific past times like yesterday, use the past simple, not present perfect." },
      { wrong:'Have you ever went?', right:'Have you ever been?', note:'Use Have + past participle (been). went is a simple past form.' },
    ],
    quiz: [
      { question:'I ___ never ___ to Australia.', options:['have/went','have/been','has/been','had/gone'], answer:1, explanation:'have + been (present perfect for experience).' },
      { question:'She ___ already ___ dinner.', options:['has/eat','have/eaten','has/eaten','had/eat'], answer:2, explanation:'She is 3rd person singular → has. Past participle: eaten.' },
      { question:'How long ___ you ___ here?', options:['have/lived','did/live','are/living','were/living'], answer:0, explanation:'Duration + present perfect: have lived.' },
      { question:'Which sentence correctly uses present perfect?', options:['I have went out yesterday.','She has seen that film last week.','They have just arrived.','He has ate breakfast an hour ago.'], answer:2, explanation:"just is a key time expression for present perfect." },
    ],
    tip: 'for = duration (for 3 years), since = starting point (since 2020). Both are used with present perfect!',
  },

  {
    id: 'b1-modal-verbs',
    level: 'b1', category: 'modals', categoryColor: '#0891B2',
    emoji: '🎛️', title: 'Modal Verbs',
    subtitle: 'Ability, obligation, possibility and permission',
    color: '#0891B2', bg: '#F0F9FF',
    keyPoint: 'Modal verbs are always followed by the base verb. can=ability, must=obligation, should=advice, might=possibility.',
    structure: {
      headers: ['Modal', 'Meaning', 'Example'],
      rows: [
        { cells: ['can / could', 'ability · possibility · permission', 'I can swim. Can I help?'], highlight: true },
        { cells: ['must / have to', 'strong obligation', 'You must wear a seatbelt.'], highlight: true },
        { cells: ['should / ought to', 'advice · recommendation', 'You should see a doctor.'] },
        { cells: ['may / might', 'possibility (uncertain)', 'It might rain later.'] },
        { cells: ['will / would', 'intention · future · polite request', 'Would you like some tea?'] },
        { cells: ['shall', 'suggestion (mainly British)', 'Shall we go?'] },
      ],
    },
    useCases: [
      { color:'#0891B2', label:'Ability (can)', example:'She can speak five languages.', translation:'She speaks five languages.' },
      { color:'#DC2626', label:'Obligation (must)', example:'You must not smoke here.', translation:'You must not smoke here.' },
      { color:'#D97706', label:'Advice (should)', example:'You should drink more water.', translation:'You should drink more water.' },
      { color:'#7C3AED', label:'Possibility (might)', example:'He might be at home.', translation:'He might be at home.' },
    ],
    examples: [
      { en:'You should apologise to her.', highlight:'should' },
      { en:'It might snow tomorrow.', highlight:'might' },
      { en:'Can you help me with this?', highlight:'Can' },
      { en:'You must not park here.', highlight:'must not' },
    ],
    mistakes: [
      { wrong:'She can to swim.', right:'She can swim.', note:'After modal verbs, use the base verb — no to.' },
      { wrong:'You should to rest.', right:'You should rest.', note:'After should, use the base verb — no to.' },
      { wrong:'He musts go now.', right:'He must go now.', note:'Modal verbs never change form, even with third-person singular.' },
    ],
    quiz: [
      { question:'You ___ drink and drive. It\'s illegal.', options:['should','might','must not','can'], answer:2, explanation:'For prohibition, use must not (= mustn\'t).' },
      { question:'___ you pass me the salt, please?', options:['Shall','Could','Must','Might'], answer:1, explanation:'Could is used for polite requests.' },
      { question:'She ___ be tired. She worked 12 hours.', options:['can','might','shall','would'], answer:1, explanation:'might = possibility (not certain, but it could happen).' },
      { question:'You ___ see a dentist soon.', options:['must not','should','can\'t','might not'], answer:1, explanation:'should = advice and recommendation.' },
    ],
    tip: 'must vs have to: both show obligation but must = personal decision, have to = external rule. "I must study" vs "I have to study (school rule)"',
  },

  {
    id: 'b1-passive',
    level: 'b1', category: 'passive', categoryColor: '#BE185D',
    emoji: '🔄', title: 'Passive Voice',
    subtitle: 'Focusing on the action, not the actor',
    color: '#BE185D', bg: '#FDF2F8',
    keyPoint: 'The passive is formed with be + past participle. Add the agent with "by" if needed.',
    structure: {
      headers: ['Tense', 'Structure', 'Example'],
      rows: [
        { cells: ['Present', 'am/is/are + p.p.', 'English is spoken here.'], highlight: true },
        { cells: ['Past', 'was/were + p.p.', 'The window was broken.'], highlight: true },
        { cells: ['Future', 'will be + p.p.', 'The report will be sent.'] },
        { cells: ['Present perfect', 'have/has been + p.p.', 'The work has been done.'] },
      ],
    },
    useCases: [
      { color:'#BE185D', label:'Unknown / unimportant agent', example:'My wallet was stolen.', translation:'My wallet was stolen.' },
      { color:'#2563EB', label:'Formal / news style', example:'The law was passed.', translation:'The law was passed.' },
      { color:'#059669', label:'Scientific / academic', example:'Water is made of H₂O.', translation:'Water is made of H₂O.' },
    ],
    examples: [
      { en:'The Eiffel Tower was built in 1889.', highlight:'was built' },
      { en:'Spanish is spoken in 20 countries.', highlight:'is spoken' },
      { en:'The email has been sent.', highlight:'has been sent' },
      { en:'The cake was eaten by the children.', highlight:'was eaten by' },
    ],
    mistakes: [
      { wrong:'The book is write by her.', right:'The book is written by her.', note:'Passive voice = be + past participle. write → written.' },
      { wrong:'It was builded in 1900.', right:'It was built in 1900.', note:'The past participle of build is built (irregular).' },
      { wrong:'The work is did by him.', right:'The work is done by him.', note:'The past participle of do is done.' },
    ],
    quiz: [
      { question:'The letter ___ yesterday.', options:['is sent','was sent','sends','sent'], answer:1, explanation:'yesterday = past. Passive past = was sent.' },
      { question:'The Pyramids ___ by the Egyptians.', options:['built','were built','are built','have built'], answer:1, explanation:'Past fact, passive voice: were built.' },
      { question:'English ___ all over the world.', options:['speak','spoke','is spoken','was spoken'], answer:2, explanation:'General present fact, passive present: is spoken.' },
      { question:'Change to passive: "Someone broke the window."', options:['The window broke.','The window was broken.','The window is broken.','The window has broke.'], answer:1, explanation:'Active past (broke) → Passive past: was broken.' },
    ],
    tip: 'When in doubt, use the active voice! The passive is most natural when the agent is unknown or unimportant.',
  },

  {
    id: 'b1-first-conditional',
    level: 'b1', category: 'conditionals', categoryColor: '#DC2626',
    emoji: '🔀', title: 'First Conditional',
    subtitle: 'Real and possible future conditions',
    color: '#DC2626', bg: '#FEF2F2',
    keyPoint: 'Use for real and possible future situations. If + present simple, will + base verb.',
    structure: {
      headers: ['Clause', 'Structure', 'Example'],
      rows: [
        { cells: ['Condition (if)', 'If + present simple', 'If it rains...'], highlight: true },
        { cells: ['Result clause', 'will + base verb', '...I will stay home.'] },
        { cells: ['Reversed order', 'result clause + if + condition', "I'll stay home if it rains."] },
      ],
    },
    useCases: [
      { color:'#DC2626', label:'Possible condition', example:'If I pass the exam, I will celebrate.', translation:'If I pass, I will celebrate.' },
      { color:'#D97706', label:'Warning / threat', example:'If you touch that, it will break.', translation:'If you touch that, it will break.' },
      { color:'#059669', label:'Promise / offer', example:'If you help me, I\'ll buy you lunch.', translation:'If you help me, I will buy you lunch.' },
    ],
    examples: [
      { en:'If you study hard, you will pass.', highlight:'If...will' },
      { en:'She will be late if she doesn\'t hurry.', highlight:"doesn't hurry...will be late" },
      { en:'If it snows, we won\'t go out.', highlight:"If it snows...won't" },
      { en:'What will you do if you lose your job?', highlight:'if you lose...will' },
    ],
    mistakes: [
      { wrong:'If it will rain, I will stay.', right:'If it rains, I will stay.', note:'Do not use will in the if-clause. Use present tense.' },
      { wrong:'If she will come, we start.', right:'If she comes, we will start.', note:'if-clause = present tense; result clause = will + base verb.' },
      { wrong:'If I am tired, I will sleep.', right:'If I feel tired, I will sleep.', note:'A concrete verb is more natural than a state expression here.' },
    ],
    quiz: [
      { question:'If you ___ hard, you ___ succeed.', options:['work/will','will work/will','work/would','worked/will'], answer:0, explanation:'1st conditional: if + present (work), result = will succeed.' },
      { question:'I\'ll call you if I ___ the answer.', options:['will know','knew','know','known'], answer:2, explanation:'Use present tense (know) in the if-clause.' },
      { question:'If it ___ sunny, we ___ to the beach.', options:['is/go','will be/will go','is/will go','will be/go'], answer:2, explanation:'if-clause = is (present), result clause = will go.' },
      { question:'Which sentence is a correct first conditional?', options:['If she will come, I am happy.','If it rains, I stay home.','If you eat this, you will feel better.','If he studied, he will pass.'], answer:2, explanation:'if-clause present (eat) + result will + verb (feel). Correct 1st conditional.' },
    ],
    tip: 'Unless = If not: "Unless you hurry, you will be late" = "If you don\'t hurry, you will be late"',
  },

  // ══ B2 ════════════════════════════════════════════════════════════════════

  {
    id: 'b2-second-conditional',
    level: 'b2', category: 'conditionals', categoryColor: '#DC2626',
    emoji: '💭', title: 'Second Conditional',
    subtitle: 'Imaginary situations, different from reality',
    color: '#7C3AED', bg: '#F5F3FF',
    keyPoint: 'Use for imaginary situations opposite to current reality. If + past simple, would + base verb.',
    structure: {
      headers: ['Clause', 'Structure', 'Example'],
      rows: [
        { cells: ['Condition clause', 'If + past simple', 'If I had a million dollars...'], highlight: true },
        { cells: ['Result clause', 'would/could/might + base verb', '...I would travel the world.'] },
        { cells: ['Be verb', 'If I were (formal) / If I was (informal)', 'If I were you...'], highlight: true },
      ],
    },
    useCases: [
      { color:'#7C3AED', label:'Unreal / imaginary', example:'If I could fly, I would go to Paris.', translation:'If I could fly, I would go to Paris.' },
      { color:'#2563EB', label:'Giving advice', example:'If I were you, I would apologise.', translation:'If I were you, I would apologise.' },
      { color:'#059669', label:'Dreams & wishes', example:'If I lived by the sea, I would swim every day.', translation:'If I lived by the sea, I would swim every day.' },
    ],
    examples: [
      { en:'If I won the lottery, I would buy a house.', highlight:'If I won...would buy' },
      { en:'What would you do if you lost your phone?', highlight:'would you do...if you lost' },
      { en:'If I were a bird, I would fly to the sea.', highlight:'If I were...would fly' },
      { en:'She would help if she could.', highlight:'would help...if she could' },
    ],
    mistakes: [
      { wrong:'If I would have money, I would travel.', right:'If I had money, I would travel.', note:"Do not use would in the if-clause. Use past tense (had)." },
      { wrong:'If I was rich, I would stop working.', right:'If I were rich, I would stop working.', note:"Use were in formal contexts, especially in If I were you." },
      { wrong:'If he knew, he will tell us.', right:'If he knew, he would tell us.', note:'In 2nd conditional result clauses, use would, not will.' },
    ],
    quiz: [
      { question:'If I ___ you, I ___ accept the offer.', options:['am/will','were/would','was/will','were/will'], answer:1, explanation:'2nd conditional: If I were you + would + base verb.' },
      { question:'She ___ speak better if she ___ more.', options:['will/practises','would/practised','would/practise','will/practised'], answer:1, explanation:'2nd conditional: would + base verb + if + past tense.' },
      { question:'What ___ you do if you ___ invisible?', options:['will/are','would/were','would/are','will/were'], answer:1, explanation:'2nd conditional: would + base verb + if + were (past).' },
      { question:'What is the difference between first and second conditional?', options:['The tenses are the same','First = possible future, second = unreal imagination','The second conditional is more formal','There is no difference'], answer:1, explanation:'1st = real possible future, 2nd = imaginary situation opposite to reality.' },
    ],
    tip: 'Memorise "If I were you" as a fixed phrase! It is the most natural way to give advice in English.',
  },

  {
    id: 'b2-relative-clauses',
    level: 'b2', category: 'clauses', categoryColor: '#065F46',
    emoji: '🔗', title: 'Relative Clauses',
    subtitle: 'Connecting clauses to describe nouns',
    color: '#065F46', bg: '#ECFDF5',
    keyPoint: 'Use relative pronouns (who, which, that, whose) to join two sentences into one.',
    structure: {
      headers: ['Relative Pronoun', 'Used for', 'Example'],
      rows: [
        { cells: ['who / that', 'people', 'The man who called you is here.'], highlight: true },
        { cells: ['which / that', 'things · animals', 'The book which I read was great.'], highlight: true },
        { cells: ['whose', 'possession (people · things)', 'The girl whose father is a doctor...'] },
        { cells: ['where', 'places', 'The city where I grew up...'] },
        { cells: ['when', 'time', 'The day when we met...'] },
      ],
    },
    useCases: [
      { color:'#065F46', label:'Describing people (who)', example:'She is the teacher who helped me.', translation:'She is the teacher who helped me.' },
      { color:'#2563EB', label:'Describing things (which)', example:'That\'s the film which won the Oscar.', translation:'That is the film which won the Oscar.' },
      { color:'#D97706', label:'Possession (whose)', example:'I know a girl whose sister is famous.', translation:'I know a girl whose sister is famous.' },
    ],
    examples: [
      { en:'The woman who lives next door is a nurse.', highlight:'who lives next door' },
      { en:'The phone that I bought is broken.', highlight:'that I bought' },
      { en:'I know a man whose wife is a chef.', highlight:'whose wife is a chef' },
      { en:'Paris is the city where they got married.', highlight:'where they got married' },
    ],
    mistakes: [
      { wrong:'The woman which called you left.', right:'The woman who called you left.', note:'Use who, not which, for people.' },
      { wrong:'The car who I drive is red.', right:'The car which/that I drive is red.', note:'Use which/that, not who, for things.' },
      { wrong:'The man whose he works here...', right:'The man who works here...', note:"whose shows possession. 'who works' = the man working there." },
    ],
    quiz: [
      { question:'The student ___ won the prize is from Korea.', options:['which','whose','who','what'], answer:2, explanation:'It modifies a person (student), so use who.' },
      { question:'I bought the book ___ you recommended.', options:['who','whose','what','which'], answer:3, explanation:'It modifies a thing (book), so use which (or that).' },
      { question:'She works for a company ___ products are sold worldwide.', options:['who','which','whose','that'], answer:2, explanation:"The company's products = possession, so use whose." },
      { question:'Which relative pronoun can be omitted?', options:['Subject relative pronoun','Object relative pronoun','Possessive relative pronoun','Neither'], answer:1, explanation:'Object relative pronouns can be omitted: the book I read = the book that I read.' },
    ],
    tip: 'A comma before the relative clause = non-defining (extra info only). "My brother, who lives in London, called me." (I have one brother)',
  },

  // ══ C1 ════════════════════════════════════════════════════════════════════

  {
    id: 'c1-third-conditional',
    level: 'c1', category: 'conditionals', categoryColor: '#DC2626',
    emoji: '⏮️', title: 'Third Conditional',
    subtitle: 'Regrets and hypotheticals about the past',
    color: '#1D4ED8', bg: '#EFF6FF',
    keyPoint: 'Use for hypothetical situations that did NOT happen in the past. If + had + p.p., would have + p.p.',
    structure: {
      headers: ['Clause', 'Structure', 'Example'],
      rows: [
        { cells: ['Condition clause', 'If + had + past participle (p.p.)', 'If I had studied...'], highlight: true },
        { cells: ['Result clause', 'would/could/might + have + p.p.', '...I would have passed.'], highlight: true },
        { cells: ['Mixed conditional', 'If + past perfect, would + base verb', 'If I had saved money, I would be rich now.'] },
      ],
    },
    useCases: [
      { color:'#1D4ED8', label:'Regret about the past', example:'If I had worked harder, I would have succeeded.', translation:'If I had worked harder, I would have succeeded.' },
      { color:'#DC2626', label:'Past hypothetical', example:'If she had left earlier, she wouldn\'t have missed the train.', translation:'If she had left earlier, she wouldn\'t have missed the train.' },
      { color:'#059669', label:'Past affecting present', example:'If he had taken that job, he would be rich now.', translation:'If he had taken that job, he would be rich now.' },
    ],
    examples: [
      { en:'If I had known, I would have told you.', highlight:'had known...would have told' },
      { en:'She would have come if she had been invited.', highlight:'would have come...had been invited' },
      { en:'If we had left earlier, we wouldn\'t have been late.', highlight:"had left...wouldn't have been" },
      { en:'He could have won if he had trained harder.', highlight:'could have won...had trained' },
    ],
    mistakes: [
      { wrong:'If I had known, I would told you.', right:'If I had known, I would have told you.', note:"Result clause = would have + p.p. Don't omit 'have'." },
      { wrong:'If I would have studied, I passed.', right:'If I had studied, I would have passed.', note:'Do not use would in the if-clause. Use had + p.p.' },
      { wrong:'If she hadn\'t come, everything is fine.', right:'If she hadn\'t come, everything would have been fine.', note:"The result clause needs would have + p.p." },
    ],
    quiz: [
      { question:'If I ___ the map, I ___ lost.', options:["had/wouldn't have got","had brought/wouldn't have got","brought/won't get","had brought/hadn't got"], answer:1, explanation:'If + had brought + would not have got (3rd conditional).' },
      { question:'She could ___ the job if she ___ earlier.', options:['have got/applied','got/had applied','have got/had applied','get/had applied'], answer:2, explanation:'could have got (result) + if had applied (condition).' },
      { question:'What does this sentence mean? "If I had been you, I would have accepted."', options:['I will become you','If I had been you, I would have accepted','I want you to accept','You should accept'], answer:1, explanation:'3rd conditional = hypothetical past. A situation that already passed.' },
      { question:'What is the core structure of the third conditional?', options:['If+present, will+verb','If+past, would+verb','If+had+p.p., would have+p.p.','If+were, would+verb'], answer:2, explanation:'3rd conditional: If + had + p.p. → would/could/might + have + p.p.' },
    ],
    tip: 'The third conditional expresses regret — "If only I had..." It describes the complete opposite of what actually happened.',
  },

  {
    id: 'c1-inversion',
    level: 'c1', category: 'advanced', categoryColor: '#1D4ED8',
    emoji: '🔃', title: 'Inversion',
    subtitle: 'Reversing subject-verb order for emphasis',
    color: '#1D4ED8', bg: '#EFF6FF',
    keyPoint: 'Placing certain expressions at the start inverts the subject and verb. Common in formal writing and for emphasis.',
    structure: {
      headers: ['Trigger', 'Inverted structure', 'Example'],
      rows: [
        { cells: ['Negative Never', 'Never + have/has + subject + p.p.', 'Never have I seen this.'], highlight: true },
        { cells: ['Negative Not only', 'Not only + auxiliary + subject...', 'Not only did he lie...'], highlight: true },
        { cells: ['Hardly/Scarcely', 'Hardly had + subject + p.p. + when...', 'Hardly had I arrived when...'] },
        { cells: ['Only then', 'Only then + did/was + subject', 'Only then did I understand.'] },
        { cells: ['So/Such', 'So + adj + that + inversion', 'So tired was she that she slept.'] },
      ],
    },
    useCases: [
      { color:'#1D4ED8', label:'Negative emphasis', example:'Never have I been so happy.', translation:'I have never been so happy.' },
      { color:'#7C3AED', label:'Formal writing', example:'Not only is he smart, but he is also kind.', translation:'He is not only smart but also kind.' },
      { color:'#059669', label:'Dramatic effect', example:'Only then did she realise the truth.', translation:'Only then did she realise the truth.' },
    ],
    examples: [
      { en:'Never have I met such an interesting person.', highlight:'Never have I met' },
      { en:'Not only did he forget, but he also didn\'t apologise.', highlight:'Not only did he' },
      { en:'Hardly had I sat down when the phone rang.', highlight:'Hardly had I...when' },
      { en:'Only by working together can we solve this.', highlight:'Only by...can we' },
    ],
    mistakes: [
      { wrong:'Never I have seen this.', right:'Never have I seen this.', note:'After a negative, the order is: auxiliary + subject (inversion).' },
      { wrong:'Not only he is smart but also kind.', right:'Not only is he smart but he is also kind.', note:'After Not only, invert: be/auxiliary + subject.' },
      { wrong:'Seldom she goes out.', right:'Seldom does she go out.', note:'After negative adverbs, invert with do/does/did + subject.' },
    ],
    quiz: [
      { question:'___ I seen such a beautiful view.', options:['Never have','Have never','Never had','Not have'], answer:0, explanation:'Word order: Never + have + subject.' },
      { question:'Not only ___ late, but he also forgot his report.', options:['he was','was he','did he','he did'], answer:1, explanation:'Word order: Not only + was/did/is + subject.' },
      { question:'When does inversion most commonly occur?', options:['Question','When a negative adverb starts the sentence','When the subject is long','When there are two verbs'], answer:1, explanation:'Inversion occurs when negative adverbs like Never, Not only, Hardly, Seldom appear at the start.' },
      { question:'Hardly ___ arrived when it started raining.', options:['I had','had I','have I','I have'], answer:1, explanation:'Word order: Hardly + had + subject: Hardly had I arrived.' },
    ],
    tip: 'Inversion appears frequently in IELTS/TOEFL essays, formal speeches and literature. Do not panic when you see it in exams!',
  },

  // ══ C2 ════════════════════════════════════════════════════════════════════

  {
    id: 'c2-subjunctive',
    level: 'c2', category: 'advanced', categoryColor: '#1D4ED8',
    emoji: '🎭', title: 'Subjunctive Mood',
    subtitle: 'Expressing wishes, demands and suggestions',
    color: '#4F46E5', bg: '#EEF2FF',
    keyPoint: 'The subjunctive expresses wishes, demands and suggestions. Use the base verb regardless of subject.',
    structure: {
      headers: ['Type', 'Structure', 'Example'],
      rows: [
        { cells: ['Present subjunctive', 'It is important that + subject + base verb', 'It is essential that he be present.'], highlight: true },
        { cells: ['Suggestion/demand verbs', 'suggest/recommend/insist + that + subject + base verb', 'I suggest that she leave now.'], highlight: true },
        { cells: ['Fixed expressions', 'If I were to, Were he to...', 'Were she to resign...'] },
        { cells: ['Concessive expressions', 'Be that as it may / Come what may', 'Come what may, I will be there.'] },
      ],
    },
    useCases: [
      { color:'#4F46E5', label:'Demands & suggestions (that-clause)', example:'The doctor insisted that he rest.', translation:'The doctor insisted that he rest.' },
      { color:'#DC2626', label:'Formal conditionals', example:'Were this to happen, we would act.', translation:'If this were to happen, we would act.' },
      { color:'#D97706', label:'Fixed expressions', example:'Come what may, we will succeed.', translation:'Come what may, we will succeed.' },
    ],
    examples: [
      { en:'It is vital that every student attend the meeting.', highlight:'attend (not attends)' },
      { en:'I recommend that she apply for the position.', highlight:'apply (not applies)' },
      { en:'Were he to know the truth, he would be devastated.', highlight:'Were he to know' },
      { en:'The committee demanded that the report be submitted.', highlight:'be submitted (not is)' },
    ],
    mistakes: [
      { wrong:'It is important that he attends.', right:'It is important that he attend.', note:'In the present subjunctive, do not add -s even for 3rd person singular.' },
      { wrong:'I suggest that she leaves now.', right:'I suggest that she leave now.', note:'suggest that + base verb (subjunctive mood).' },
      { wrong:'The rule requires that everyone pays.', right:'The rule requires that everyone pay.', note:'require that + base verb.' },
    ],
    quiz: [
      { question:'It is essential that every employee ___ the training.', options:['completes','complete','completed','completing'], answer:1, explanation:'Present subjunctive: use the base verb regardless of subject (complete).' },
      { question:'The judge ordered that the evidence ___ destroyed.', options:['is','be','was','being'], answer:1, explanation:'order that + be + p.p. (subjunctive passive).' },
      { question:'What does "Were she to leave" mean?', options:['She left','If she were to leave','If she had left','She must leave'], answer:1, explanation:'Were + subject + to + verb = formal conditional meaning "If... were to...".' },
      { question:'What is the difference between American and British English here?', options:['The subjunctive only exists in American English','British English prefers should','American English uses the base verb','There is no difference'], answer:1, explanation:"British English prefers 'should attend'; American English uses the bare subjunctive 'attend'." },
    ],
    tip: 'Essential for IELTS C1+! Memorise 5 complete sentences with the pattern "It is important/vital/essential that..." + base verb.',
  },

  {
    id: 'c2-cleft-sentences',
    level: 'c2', category: 'advanced', categoryColor: '#1D4ED8',
    emoji: '✂️', title: 'Cleft Sentences',
    subtitle: 'Dramatically highlighting specific information',
    color: '#0F172A', bg: '#F8FAFC',
    keyPoint: 'Cleft sentences emphasise a specific part using It is/was...that or What...is/was structures.',
    structure: {
      headers: ['Type', 'Structure', 'Example'],
      rows: [
        { cells: ['It-cleft', 'It is/was + focused element + that...', 'It was John that called.'], highlight: true },
        { cells: ['Wh-cleft', 'What + clause + is/was + focused element', 'What I need is rest.'], highlight: true },
        { cells: ['All-cleft', 'All + clause + is/was + focused element', 'All I want is peace.'] },
        { cells: ['Reverse wh-cleft', 'focused element + is/was + what + clause', 'Rest is what I need.'] },
      ],
    },
    useCases: [
      { color:'#0F172A', label:'Emphasising a person', example:'It was Sarah who solved the problem.', translation:'It was Sarah who solved the problem.' },
      { color:'#2563EB', label:'Emphasising what you want', example:'What I want is an honest answer.', translation:'What I want is an honest answer.' },
      { color:'#7C3AED', label:'Minimising with "all"', example:'All I ask is that you be honest.', translation:'All I ask is that you be honest.' },
    ],
    examples: [
      { en:'It was in Paris that they first met.', highlight:'It was...that' },
      { en:'What surprised me was his reaction.', highlight:'What surprised me was' },
      { en:'It is honesty that I value most.', highlight:'It is...that' },
      { en:'All she wanted was to be understood.', highlight:'All she wanted was' },
    ],
    mistakes: [
      { wrong:'It was John who he called me.', right:'It was John who called me.', note:'Do not repeat the pronoun after who.' },
      { wrong:'What I need it is rest.', right:'What I need is rest.', note:"Do not repeat 'it'. What I need is already the subject." },
      { wrong:'It is yesterday that I saw her.', right:'It was yesterday that I saw her.', note:"Use It was for past facts." },
    ],
    quiz: [
      { question:'___ my sister ___ bought this house.', options:['It is/who','It was/who','It was/which','It is/which'], answer:1, explanation:'Person (sister) + past (bought) → It was + who.' },
      { question:'___ I enjoy most is reading.', options:['That','Which','What','Who'], answer:2, explanation:'What = the thing that. "The thing I enjoy most is..."' },
      { question:'What is the main purpose of cleft sentences?', options:['To clarify the tense','To emphasise specific information','To make the sentence shorter','To make it more formal'], answer:1, explanation:'Cleft sentences are used to emphasise a specific element of the sentence.' },
      { question:'What type of cleft is "All I need is love"?', options:['It-cleft','Wh-cleft','All-cleft','Reverse wh-cleft'], answer:2, explanation:"All + subject + verb + is + focus element = All-cleft sentence." },
    ],
    tip: 'Cleft sentences work best with stress in speech: "It was JOHN who did it (not me)." Practise the intonation — it makes you sound advanced!',
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
