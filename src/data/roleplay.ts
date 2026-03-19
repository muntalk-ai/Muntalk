// data/roleplay.ts

export type RpDifficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

// ── Everyday Scenario ────────────────────────────────────────────────────────

export interface EverydayScenario {
  id: string;
  emoji: string;
  title: string;           // English
  titleNative: string;     // 모국어 표시용 (Korean)
  situation: string;       // English description for AI
  nativeDesc: string;      // 모국어 설명 (학습자에게 표시)
  userRole: string;
  difficulty: RpDifficulty;
  tutorId: string;
  voiceGender: 'male' | 'female';
  keyPhrases: string[];    // in target language (generated at runtime)
  accentColor: string;
  bgColor: string;
}

export const EVERYDAY_SCENARIOS: EverydayScenario[] = [
  {
    id: 'airport-checkin',
    emoji: '✈️',
    title: 'Airport Check-in',
    titleNative: '공항 체크인',
    situation: 'International airport check-in counter. Passenger checking in for a flight.',
    nativeDesc: '공항 체크인 카운터에서 탑승 수속을 밟아보세요.',
    userRole: 'A passenger checking in for their flight',
    difficulty: 'A1',
    tutorId: 't03',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#38BDF8',
    bgColor: '#EFF6FF',
  },
  {
    id: 'hotel-checkin',
    emoji: '🏨',
    title: 'Hotel Check-in',
    titleNative: '호텔 체크인',
    situation: 'Hotel reception desk. Guest checking in with a reservation.',
    nativeDesc: '호텔 프런트에서 체크인하고 방 정보를 확인해보세요.',
    userRole: 'A hotel guest checking in',
    difficulty: 'A1',
    tutorId: 't06',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#818CF8',
    bgColor: '#EEF2FF',
  },
  {
    id: 'restaurant-order',
    emoji: '🍽️',
    title: 'Restaurant Order',
    titleNative: '식당 주문',
    situation: 'A restaurant. Customer ordering food and drinks from a waiter.',
    nativeDesc: '식당에서 음식과 음료를 주문하고 계산까지 해보세요.',
    userRole: 'A customer ordering at a restaurant',
    difficulty: 'A1',
    tutorId: 't09',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#F97316',
    bgColor: '#FFF7ED',
  },
  {
    id: 'shopping',
    emoji: '🛍️',
    title: 'Shopping',
    titleNative: '쇼핑',
    situation: 'A clothing store. Customer browsing, asking about sizes, prices and paying.',
    nativeDesc: '옷 가게에서 사이즈와 가격을 묻고 구매해보세요.',
    userRole: 'A customer shopping for clothes',
    difficulty: 'A2',
    tutorId: 't02',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#EC4899',
    bgColor: '#FDF2F8',
  },
  {
    id: 'doctor-visit',
    emoji: '🏥',
    title: 'Doctor Visit',
    titleNative: '병원 진료',
    situation: 'A clinic. Patient describing symptoms to a doctor.',
    nativeDesc: '병원에서 의사에게 증상을 설명하고 처방을 받아보세요.',
    userRole: 'A patient at a clinic',
    difficulty: 'A2',
    tutorId: 't04',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    id: 'directions',
    emoji: '🗺️',
    title: 'Asking Directions',
    titleNative: '길 묻기',
    situation: 'On the street. Tourist asking a local for directions to a landmark.',
    nativeDesc: '길을 잃었을 때 지역 주민에게 방향을 물어보세요.',
    userRole: 'A tourist asking for directions',
    difficulty: 'A1',
    tutorId: 't15',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  {
    id: 'job-interview',
    emoji: '💼',
    title: 'Job Interview',
    titleNative: '취업 면접',
    situation: 'A job interview for a position at a company. Professional setting.',
    nativeDesc: '취업 면접에서 자기소개와 경력을 영어로 설명해보세요.',
    userRole: 'A job applicant being interviewed',
    difficulty: 'B1',
    tutorId: 't06',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#2563EB',
    bgColor: '#EFF6FF',
  },
  {
    id: 'business-meeting',
    emoji: '📊',
    title: 'Business Meeting',
    titleNative: '비즈니스 미팅',
    situation: 'A business meeting to discuss a project proposal with colleagues.',
    nativeDesc: '프로젝트 제안을 발표하고 동료들과 논의해보세요.',
    userRole: 'A team member presenting an idea',
    difficulty: 'B2',
    tutorId: 't01',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#0EA5E9',
    bgColor: '#F0F9FF',
  },
  {
    id: 'coffee-shop',
    emoji: '☕',
    title: 'Coffee Shop Chat',
    titleNative: '카페 대화',
    situation: 'A cosy coffee shop. Two people having a casual conversation.',
    nativeDesc: '카페에서 새로운 사람과 가볍게 대화를 나눠보세요.',
    userRole: 'A person having casual conversation',
    difficulty: 'A2',
    tutorId: 't07',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#D97706',
    bgColor: '#FFFBEB',
  },
  {
    id: 'phone-call',
    emoji: '📞',
    title: 'Phone Call',
    titleNative: '전화 통화',
    situation: 'Making a phone call to book an appointment or get information.',
    nativeDesc: '전화로 예약하거나 정보를 문의하는 상황을 연습해보세요.',
    userRole: 'A caller making an inquiry or booking',
    difficulty: 'A2',
    tutorId: 't08',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#7C3AED',
    bgColor: '#F5F3FF',
  },
  {
    id: 'neighborhood',
    emoji: '🏘️',
    title: 'Meeting Neighbors',
    titleNative: '이웃과 대화',
    situation: 'Moving into a new neighborhood. Meeting neighbors for the first time.',
    nativeDesc: '새로운 동네에서 이웃을 처음 만나 인사를 나눠보세요.',
    userRole: 'A new resident meeting their neighbors',
    difficulty: 'A2',
    tutorId: 't11',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#059669',
    bgColor: '#ECFDF5',
  },
  {
    id: 'complaint',
    emoji: '😤',
    title: 'Making a Complaint',
    titleNative: '불만 제기',
    situation: 'Customer service desk. Making a complaint about a faulty product.',
    nativeDesc: '불량 제품에 대해 고객 서비스에 불만을 제기해보세요.',
    userRole: 'A customer making a complaint',
    difficulty: 'B1',
    tutorId: 't05',
    voiceGender: 'female',
    keyPhrases: [],
    accentColor: '#EF4444',
    bgColor: '#FEF2F2',
  },
];

// ── World Scenario ────────────────────────────────────────────────────────────

export interface WorldScenario {
  id: string;
  emoji: string;
  title: string;
  titleNative: string;
  description: string;
  nativeDesc: string;
  setting: string;
  userRole: string;
  npcs: { name: string; role: string; personality: string; tutorId: string; voiceGender: 'male'|'female' }[];
  difficulty: RpDifficulty;
  accentColor: string;
  bgGradient: string;
  systemPrompt: string;
}

export const WORLD_SCENARIOS: WorldScenario[] = [
  {
    id: 'romance-first-meeting',
    emoji: '💕',
    title: 'A Chance Meeting',
    titleNative: '우연한 만남',
    description: 'Two strangers meet in an unexpected place. Will a connection spark?',
    nativeDesc: '우연히 만난 두 사람. 대화를 이어가며 인연을 만들어보세요.',
    setting: 'A rainy café. Two strangers end up sharing the last table.',
    userRole: 'A stranger who just sat down at the shared table',
    npcs: [
      { name: 'Sofia', role: 'A warm, curious stranger', personality: 'Open, expressive, asks genuine questions', tutorId: 't02', voiceGender: 'female' },
    ],
    difficulty: 'B1',
    accentColor: '#f472b6',
    bgGradient: 'linear-gradient(135deg, #1a0a1e 0%, #7c1f5c 100%)',
    systemPrompt: 'You are Sofia, meeting a stranger for the first time in a rainy café. Be warm and genuine. React naturally to what they say. Ask follow-up questions. Speak in {targetLang} at {difficulty} level. 2-3 sentences. No emojis.',
  },
  {
    id: 'mystery-detective',
    emoji: '🔍',
    title: 'The Investigation',
    titleNative: '미스터리 수사',
    description: 'A crime has been committed. Work with the detective to crack the case.',
    nativeDesc: '범죄 현장에서 형사와 함께 단서를 모아 사건을 해결하세요.',
    setting: 'A detective\'s office. A new case has just come in.',
    userRole: 'A witness with key information about the case',
    npcs: [
      { name: 'Detective Chen', role: 'Sharp investigator', personality: 'Analytical, asks probing questions, notices details', tutorId: 't09', voiceGender: 'female' },
    ],
    difficulty: 'B2',
    accentColor: '#818cf8',
    bgGradient: 'linear-gradient(135deg, #0a0a0f 0%, #2d2d4e 100%)',
    systemPrompt: 'You are Detective Chen investigating a case. Question the witness methodically. Build tension. Praise sharp observations. Speak in {targetLang} at {difficulty} level. 2-3 sentences. No emojis.',
  },
  {
    id: 'adventure-expedition',
    emoji: '🗺️',
    title: 'The Expedition',
    titleNative: '탐험 미션',
    description: 'An expedition into unknown territory. Quick decisions, teamwork, and survival.',
    nativeDesc: '미지의 땅으로 떠나는 탐험. 팀워크와 순발력이 필요해요.',
    setting: 'A remote jungle. The team has just made a surprising discovery.',
    userRole: 'A new expedition member on their first mission',
    npcs: [
      { name: 'Dr Maya', role: 'Expedition leader', personality: 'Decisive, encouraging, expects clear communication', tutorId: 't03', voiceGender: 'female' },
      { name: 'Riku', role: 'Local guide', personality: 'Quick, practical, knows the terrain', tutorId: 't15', voiceGender: 'male' },
    ],
    difficulty: 'B1',
    accentColor: '#4ade80',
    bgGradient: 'linear-gradient(135deg, #0a1a0a 0%, #2d6e2d 100%)',
    systemPrompt: 'You are Dr Maya and Riku on an expedition. Create urgency. Ask the learner to make decisions. React to their choices. Speak in {targetLang} at {difficulty} level. 2-3 sentences. No emojis.',
  },
  {
    id: 'healing-counselor',
    emoji: '🌿',
    title: 'The Sanctuary',
    titleNative: '마음 치유',
    description: 'A safe space to talk. Express feelings freely and find calm.',
    nativeDesc: '편안하고 안전한 공간에서 마음 속 이야기를 나눠보세요.',
    setting: 'A peaceful therapy room. Soft music, plants, warm light.',
    userRole: 'Someone who needs to talk and be heard',
    npcs: [
      { name: 'Dr Sarah', role: 'Empathetic counsellor', personality: 'Calm, non-judgmental, asks one open question at a time', tutorId: 't04', voiceGender: 'female' },
    ],
    difficulty: 'A2',
    accentColor: '#7dd3fc',
    bgGradient: 'linear-gradient(135deg, #0a1628 0%, #2d4f6e 100%)',
    systemPrompt: 'You are Dr Sarah, an empathetic counsellor. Use active listening. Reflect feelings. Ask one open question. Never rush. Speak in {targetLang} at {difficulty} level. 1-2 sentences. No emojis.',
  },
  {
    id: 'growth-ted',
    emoji: '✨',
    title: 'Your TED Moment',
    titleNative: '나의 TED 순간',
    description: 'The spotlight is yours. Share an idea that matters to you.',
    nativeDesc: '내가 전하고 싶은 아이디어를 스피치로 표현해보세요.',
    setting: 'A TED conference stage. The coach is helping you prepare.',
    userRole: 'A speaker preparing and delivering their talk',
    npcs: [
      { name: 'Marcus', role: 'Speech coach', personality: 'Energetic, pushes for clarity and confidence, gives specific feedback', tutorId: 't26', voiceGender: 'male' },
    ],
    difficulty: 'C1',
    accentColor: '#a78bfa',
    bgGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)',
    systemPrompt: 'You are Marcus, a TED talk coach. Push the learner to be clear and confident. Give specific feedback. Ask "what is the one thing you want them to remember?" Speak in {targetLang} at {difficulty} level. 2-3 sentences. No emojis.',
  },
  {
    id: 'famous-mentor',
    emoji: '🌟',
    title: 'Meet a Legend',
    titleNative: '레전드와 만남',
    description: 'A rare conversation with someone who changed the world. Ask anything.',
    nativeDesc: '세상을 바꾼 인물과 단 둘이 대화할 기회. 무엇이든 물어보세요.',
    setting: 'A private meeting with a visionary — inventor, leader, or artist.',
    userRole: 'A young person granted a rare one-on-one conversation',
    npcs: [
      { name: 'Alex', role: 'A visionary thinker and leader', personality: 'Wise, challenges assumptions gently, uses thought experiments', tutorId: 't01', voiceGender: 'female' },
    ],
    difficulty: 'B2',
    accentColor: '#FCD34D',
    bgGradient: 'linear-gradient(135deg, #1a0a00 0%, #7c4d00 100%)',
    systemPrompt: 'You are Alex, a visionary thinker. Use thought experiments. Challenge assumptions. Be warm but intellectually rigorous. Speak in {targetLang} at {difficulty} level. 2-3 sentences. No emojis.',
  },
];

export type RpTab = 'everyday' | 'world';
