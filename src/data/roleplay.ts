// data/roleplay.ts — World Roleplay v4
// 6 Worlds · 50+ scenarios · Multi-NPC · Native language subtitles

export type RpDifficulty = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type RpTab = 'everyday' | 'world';
export type WorldId = 'romance' | 'mystery' | 'adventure' | 'workplace' | 'healing' | 'growth';

// ── Native descriptions per world/scenario ────────────────────────────────────
// Runtime-translated via Gemini for uncommon langs; pre-filled for top 10
export interface NativeDescMap {
  'ko-KR'?: string;
  'ja-JP'?: string;
  'zh-CN'?: string;
  'es-ES'?: string;
  'fr-FR'?: string;
  'de-DE'?: string;
  'pt-BR'?: string;
  'ru-RU'?: string;
  'ar-XA'?: string;
  'hi-IN'?: string;
  [key: string]: string | undefined;
}

export interface NpcCharacter {
  id: string;
  name: string;
  role: string;
  personality: string;    // AI prompt personality
  tutorId: string;
  voiceGender: 'male' | 'female';
  speakFirst?: boolean;   // does this NPC open the scene?
}

// Story beat — optional branching choice shown to learner
export interface StoryBeat {
  atTurn: number;         // show choice at this turn number
  prompt: string;         // shown to learner (in English)
  choices: { id: string; label: string; steersPrompt: string }[];
}

export interface WorldScenario {
  id: string;
  worldId: WorldId;
  emoji: string;
  title: string;
  subtitle: string;       // genre / tone tag
  description: string;    // English
  nativeDescs: NativeDescMap;
  setting: string;        // vivid scene description for AI
  userRole: string;
  npcs: NpcCharacter[];   // 1-3 NPCs
  difficulty: RpDifficulty;
  accentColor: string;
  bgGradient: string;
  storyBeats?: StoryBeat[];  // optional branching moments
  systemPrompt: string;  // {targetLang} {difficulty} {nativeLang} {choice}
  tags: string[];
}

// ── Everyday Scenario ────────────────────────────────────────────────────────

export interface EverydayScenario {
  id: string;
  emoji: string;
  title: string;
  nativeDescs: NativeDescMap;
  situation: string;
  userRole: string;
  difficulty: RpDifficulty;
  tutorId: string;
  voiceGender: 'male' | 'female';
  accentColor: string;
  bgColor: string;
}

// ── Everyday Data ─────────────────────────────────────────────────────────────

export const EVERYDAY_SCENARIOS: EverydayScenario[] = [
  { id:'airport-checkin', emoji:'✈️', title:'Airport Check-in',
    nativeDescs:{ 'ko-KR':'공항 체크인 카운터에서 탑승 수속하기', 'ja-JP':'空港のチェックインカウンターで搭乗手続き', 'zh-CN':'在机场办理登机手续', 'es-ES':'Facturación en el aeropuerto', 'fr-FR':"Enregistrement à l'aéroport"},
    situation:'International airport check-in counter. Passenger checking in for a flight.', userRole:'A passenger checking in',
    difficulty:'A1', tutorId:'t03', voiceGender:'female', accentColor:'#38BDF8', bgColor:'#EFF6FF' },
  { id:'hotel-checkin', emoji:'🏨', title:'Hotel Check-in',
    nativeDescs:{ 'ko-KR':'호텔 프런트에서 체크인하기', 'ja-JP':'ホテルのフロントでチェックイン', 'zh-CN':'在酒店前台办理入住', 'es-ES':'Check-in en el hotel', 'fr-FR':"Enregistrement à l'hôtel" },
    situation:'Hotel reception. Guest checking in with a reservation.', userRole:'A hotel guest',
    difficulty:'A1', tutorId:'t06', voiceGender:'female', accentColor:'#818CF8', bgColor:'#EEF2FF' },
  { id:'restaurant-order', emoji:'🍽️', title:'Restaurant Order',
    nativeDescs:{ 'ko-KR':'식당에서 음식 주문하기', 'ja-JP':'レストランで料理を注文する', 'zh-CN':'在餐厅点餐', 'es-ES':'Pedir en un restaurante', 'fr-FR':'Commander au restaurant' },
    situation:'A restaurant. Customer ordering food from a waiter.', userRole:'A customer ordering food',
    difficulty:'A1', tutorId:'t09', voiceGender:'female', accentColor:'#F97316', bgColor:'#FFF7ED' },
  { id:'shopping', emoji:'🛍️', title:'Shopping',
    nativeDescs:{ 'ko-KR':'옷 가게에서 쇼핑하기', 'ja-JP':'洋服店でショッピング', 'zh-CN':'在服装店购物', 'es-ES':'De compras en una tienda', 'fr-FR':'Faire du shopping' },
    situation:'A clothing store. Asking about sizes, prices and paying.', userRole:'A customer shopping',
    difficulty:'A2', tutorId:'t02', voiceGender:'female', accentColor:'#EC4899', bgColor:'#FDF2F8' },
  { id:'doctor-visit', emoji:'🏥', title:'Doctor Visit',
    nativeDescs:{ 'ko-KR':'병원에서 증상 설명하기', 'ja-JP':'病院で症状を説明する', 'zh-CN':'在医院描述症状', 'es-ES':'Visita al médico', 'fr-FR':'Visite chez le médecin' },
    situation:'A clinic. Patient describing symptoms to a doctor.', userRole:'A patient at a clinic',
    difficulty:'A2', tutorId:'t04', voiceGender:'female', accentColor:'#10B981', bgColor:'#ECFDF5' },
  { id:'directions', emoji:'🗺️', title:'Asking Directions',
    nativeDescs:{ 'ko-KR':'길을 잃었을 때 방향 묻기', 'ja-JP':'道に迷ったとき道を聞く', 'zh-CN':'问路', 'es-ES':'Preguntar por el camino', 'fr-FR':'Demander son chemin' },
    situation:'On the street. Tourist asking a local for directions.', userRole:'A tourist asking for directions',
    difficulty:'A1', tutorId:'t15', voiceGender:'female', accentColor:'#8B5CF6', bgColor:'#F5F3FF' },
  { id:'job-interview', emoji:'💼', title:'Job Interview',
    nativeDescs:{ 'ko-KR':'취업 면접에서 자기소개하기', 'ja-JP':'就職面接で自己紹介する', 'zh-CN':'求职面试', 'es-ES':'Entrevista de trabajo', 'fr-FR':"Entretien d'embauche" },
    situation:'A job interview for a position at a company.', userRole:'A job applicant',
    difficulty:'B1', tutorId:'t06', voiceGender:'female', accentColor:'#2563EB', bgColor:'#EFF6FF' },
  { id:'business-meeting', emoji:'📊', title:'Business Meeting',
    nativeDescs:{ 'ko-KR':'비즈니스 미팅에서 프로젝트 발표하기', 'ja-JP':'ビジネス会議でプロジェクトを発表する', 'zh-CN':'在商务会议中展示项目', 'es-ES':'Reunión de negocios', 'fr-FR':"Réunion d'affaires" },
    situation:'A business meeting to discuss a project proposal.', userRole:'A team member presenting an idea',
    difficulty:'B2', tutorId:'t01', voiceGender:'female', accentColor:'#0EA5E9', bgColor:'#F0F9FF' },
  { id:'coffee-shop', emoji:'☕', title:'Coffee Shop Chat',
    nativeDescs:{ 'ko-KR':'카페에서 새로운 사람과 대화하기', 'ja-JP':'カフェで新しい人と会話する', 'zh-CN':'在咖啡馆与新朋友聊天', 'es-ES':'Charla en una cafetería', 'fr-FR':'Discussion dans un café' },
    situation:'A cosy coffee shop. Two people having casual conversation.', userRole:'A person having casual conversation',
    difficulty:'A2', tutorId:'t07', voiceGender:'female', accentColor:'#D97706', bgColor:'#FFFBEB' },
  { id:'phone-call', emoji:'📞', title:'Phone Call',
    nativeDescs:{ 'ko-KR':'전화로 예약하거나 정보 문의하기', 'ja-JP':'電話で予約や問い合わせをする', 'zh-CN':'电话预约或咨询', 'es-ES':'Llamada telefónica', 'fr-FR':'Appel téléphonique' },
    situation:'Making a phone call to book an appointment or get information.', userRole:'A caller making an inquiry',
    difficulty:'A2', tutorId:'t08', voiceGender:'female', accentColor:'#7C3AED', bgColor:'#F5F3FF' },
  { id:'neighborhood', emoji:'🏘️', title:'Meeting Neighbors',
    nativeDescs:{ 'ko-KR':'새 동네에서 이웃 처음 만나기', 'ja-JP':'新しい近所で隣人に会う', 'zh-CN':'在新社区认识邻居', 'es-ES':'Conocer a los vecinos', 'fr-FR':'Rencontrer les voisins' },
    situation:'Moving into a new neighborhood. Meeting neighbors for the first time.', userRole:'A new resident',
    difficulty:'A2', tutorId:'t11', voiceGender:'female', accentColor:'#059669', bgColor:'#ECFDF5' },
  { id:'complaint', emoji:'😤', title:'Making a Complaint',
    nativeDescs:{ 'ko-KR':'불량 제품에 대해 고객 서비스에 불만 제기하기', 'ja-JP':'不良品についてカスタマーサービスに苦情を言う', 'zh-CN':'就劣质产品向客服投诉', 'es-ES':'Hacer una queja', 'fr-FR':'Faire une réclamation' },
    situation:'Customer service desk. Making a complaint about a faulty product.', userRole:'A customer making a complaint',
    difficulty:'B1', tutorId:'t05', voiceGender:'female', accentColor:'#EF4444', bgColor:'#FEF2F2' },
];

// ── World Scenarios ───────────────────────────────────────────────────────────

export const WORLD_SCENARIOS: WorldScenario[] = [

  // ══════════════════════════════════════════════════════
  // 💕 ROMANCE & CONNECTIONS
  // ══════════════════════════════════════════════════════

  { id:'romance-cafe', worldId:'romance', emoji:'☔', title:'Rainy Day Stranger',
    subtitle:'Slow-burn · First meeting',
    description:'Two strangers share the last table in a rainy café. Something feels different about this conversation.',
    nativeDescs:{ 'ko-KR':'빗속 카페에서 운명처럼 만난 두 낯선 사람의 첫 대화', 'ja-JP':'雨のカフェで運命的に出会った二人の初対面の会話', 'zh-CN':'雨天咖啡馆里两个陌生人的命运邂逅', 'es-ES':'Dos extraños comparten una mesa en un café lluvioso', 'fr-FR':'Deux inconnus partagent une table dans un café sous la pluie' },
    setting:'A small, warm café. Rain on the windows. The last free seat is at your table.',
    userRole:'A regular at this café, now sharing your table',
    npcs:[
      { id:'sofia', name:'Sofia', role:'A warm and curious stranger', personality:'Open, expressive, genuinely interested in people, asks beautiful questions', tutorId:'t02', voiceGender:'female', speakFirst:true },
    ],
    difficulty:'B1', accentColor:'#f472b6', bgGradient:'linear-gradient(135deg,#1a0a1e 0%,#7c1f5c 100%)',
    storyBeats:[
      { atTurn:3, prompt:'Sofia seems nervous. What do you do?',
        choices:[
          { id:'ask', label:'Ask what she is thinking about', steersPrompt:"The learner asks about Sofia's thoughts — she opens up about something personal." },
          { id:'share', label:'Share something about yourself first', steersPrompt:'The learner shares something personal first — Sofia is touched and reciprocates.' },
          { id:'coffee', label:'Offer to get another coffee', steersPrompt:'A simple kind gesture — Sofia smiles and the conversation deepens.' },
        ]},
    ],
    systemPrompt:'You are Sofia, meeting a stranger for the first time. Be warm, genuine, occasionally vulnerable. React naturally. Speak only in {targetLang} at {difficulty} level. {choice} 2-3 sentences. No emojis.',
    tags:['romance','beginner-friendly','slice-of-life'] },

  { id:'romance-airport', worldId:'romance', emoji:'🛫', title:'Last Flight',
    subtitle:'Bittersweet · Farewell',
    description:'An unexpected meeting at an airport gate. One of you is leaving — maybe for good. What do you say?',
    nativeDescs:{ 'ko-KR':'공항 게이트에서의 예상치 못한 만남. 한 사람은 떠난다 — 어쩌면 영원히', 'ja-JP':'空港ゲートでの予想外の出会い。どちらかが旅立つ—おそらく永遠に', 'zh-CN':'机场登机口的意外相遇。其中一人即将离开——也许是永远', 'es-ES':'Un encuentro inesperado en una puerta de aeropuerto. Uno se va — quizás para siempre', 'fr-FR':"Une rencontre inattendue à la porte d'embarquement. L'un d'eux part — peut-être pour toujours" },
    setting:'International airport departure gate. Last boarding call in 20 minutes.',
    userRole:'Someone who just ran into an old friend at the gate',
    npcs:[
      { id:'james', name:'James', role:'An old friend about to board a one-way flight', personality:'Thoughtful, a little melancholy, says what he means when pressed', tutorId:'t87', voiceGender:'male', speakFirst:true },
    ],
    difficulty:'B2', accentColor:'#f472b6', bgGradient:'linear-gradient(135deg,#0f0a1e 0%,#4a1a5c 100%)',
    systemPrompt:'You are James, about to board a one-way international flight. You have mixed feelings. Be genuine and emotionally present. Speak only in {targetLang} at {difficulty} level. {choice} 2-3 sentences. No emojis.',
    tags:['romance','emotional','advanced'] },

  { id:'romance-misunderstanding', worldId:'romance', emoji:'💔', title:'The Apology',
    subtitle:'Reconciliation · Honesty',
    description:'Something went wrong between you two. Now you have one chance to fix it — if you find the right words.',
    nativeDescs:{ 'ko-KR':'무언가 잘못됐다. 지금이 바로잡을 마지막 기회 — 맞는 말을 찾을 수 있다면', 'ja-JP':'何かがうまくいかなかった。今が修復する最後のチャンス', 'zh-CN':'两人之间出了问题。这是修复它的最后机会', 'es-ES':'Algo salió mal. Ahora tienes una oportunidad de arreglarlo', 'fr-FR':"Quelque chose a mal tourné. C'est votre chance de réparer les choses" },
    setting:'A quiet park bench at dusk. An awkward silence between two people who used to be close.',
    userRole:'The one who made the mistake and wants to apologise',
    npcs:[
      { id:'mia', name:'Mia', role:'Hurt but willing to listen', personality:'Hurt but fair, needs honesty not excuses, softens when she sees genuine remorse', tutorId:'t06', voiceGender:'female', speakFirst:false },
    ],
    difficulty:'B2', accentColor:'#fb7185', bgGradient:'linear-gradient(135deg,#1a0a0f 0%,#5c1a2a 100%)',
    storyBeats:[
      { atTurn:2, prompt:'Mia is not sure she believes you yet.',
        choices:[
          { id:'honest', label:'Be fully honest — even the painful part', steersPrompt:'The learner is brutally honest — Mia is surprised and begins to believe.' },
          { id:'explain', label:'Explain why it happened', steersPrompt:'The learner explains their reasoning — Mia considers it carefully.' },
          { id:'listen', label:'Ask to hear her feelings first', steersPrompt:'The learner asks Mia to speak first — she is moved by the gesture.' },
        ]},
    ],
    systemPrompt:'You are Mia. You were hurt but you are fair. Listen carefully. React to what is said — not just what is meant to please you. Speak only in {targetLang} at {difficulty} level. {choice} 2-3 sentences. No emojis.',
    tags:['romance','emotional','intermediate'] },

  { id:'romance-rival', worldId:'romance', emoji:'⚡', title:'The Rival',
    subtitle:'Rivalry · Tension · Chemistry',
    description:'Your biggest competitor at work. You cannot stand each other — or can you? The lines between rivalry and attraction get complicated.',
    nativeDescs:{ 'ko-KR':'직장에서 가장 큰 경쟁자. 서로 싫어했는데... 정말 그런 걸까?', 'ja-JP':'職場での最大のライバル。お互いが嫌いなはずなのに...本当に？', 'zh-CN':'工作中最大的竞争对手。彼此讨厌对方——真的吗？', 'es-ES':'Tu mayor competidor en el trabajo. Os odiáis — o quizás no tanto', 'fr-FR':'Votre plus grand rival au travail. Vous ne vous supportez pas — ou peut-être si' },
    setting:'After-work drinks. You end up sitting next to your office rival.',
    userRole:'Your own character — navigating this complicated dynamic',
    npcs:[
      { id:'alex', name:'Alex', role:'Your brilliant, infuriating office rival', personality:'Sharp, competitive, but secretly fascinated by you. Challenges everything you say with wit.', tutorId:'t63', voiceGender:'male', speakFirst:true },
      { id:'phoebe', name:'Phoebe', role:'A mutual friend who keeps nudging you both', personality:'Playful, observant, enjoys watching the tension, occasionally unhelpfully helpful.', tutorId:'t26', voiceGender:'female', speakFirst:false },
    ],
    difficulty:'B2', accentColor:'#f59e0b', bgGradient:'linear-gradient(135deg,#1a0f00 0%,#5c3d00 100%)',
    systemPrompt:'Alex and Phoebe are both present. Alex is a sharp rival with hidden feelings. Phoebe is a playful mutual friend. Speak only in {targetLang} at {difficulty} level. NPCs should occasionally interact with each other, not just the learner. {choice} 2-3 sentences each. No emojis.',
    tags:['romance','comedy','multi-npc','intermediate'] },

  // ══════════════════════════════════════════════════════
  // 🔍 MYSTERY & INTRIGUE
  // ══════════════════════════════════════════════════════

  { id:'mystery-heist', worldId:'mystery', emoji:'💎', title:'The Perfect Heist',
    subtitle:'Thriller · Planning · Tension',
    description:'The museum closes in one hour. The diamond goes to auction tomorrow. Your window is closing.',
    nativeDescs:{ 'ko-KR':'박물관은 한 시간 후 문을 닫는다. 다이아몬드는 내일 경매에 나간다. 기회가 닫히고 있다', 'ja-JP':'博物館は1時間後に閉館する。ダイヤモンドは明日オークションに。時間が迫っている', 'zh-CN':'博物馆一小时后关闭。钻石明天就要拍卖。时机正在关闭', 'es-ES':'El museo cierra en una hora. El diamante va a subasta mañana. Tu ventana se cierra', 'fr-FR':'Le musée ferme dans une heure. Le diamant part en vente demain. La fenêtre se ferme' },
    setting:'Museum security room. Three people, one plan, zero margin for error.',
    userRole:'The brains of the operation — your plan, your call',
    npcs:[
      { id:'chen', name:'Detective Chen', role:'The inside contact — a conflicted museum security officer', personality:'Nervous, second-guessing, needs reassurance but is the key to the plan', tutorId:'t09', voiceGender:'female', speakFirst:true },
      { id:'victor', name:'Victor', role:'The muscle — pragmatic, impatient, morally flexible', personality:'Direct, pushes for action, questions hesitation, loyal if respected', tutorId:'t87', voiceGender:'male', speakFirst:false },
    ],
    difficulty:'B2', accentColor:'#818cf8', bgGradient:'linear-gradient(135deg,#0a0a0f 0%,#1a1a3e 100%)',
    storyBeats:[
      { atTurn:3, prompt:'An unexpected complication. What is your call?',
        choices:[
          { id:'abort', label:'Call it off — too risky', steersPrompt:'The learner calls it off — Victor is furious, Chen is relieved. Tense argument follows.' },
          { id:'adapt', label:'Adapt the plan on the spot', steersPrompt:'The learner improvises — the team has to follow. High tension.' },
          { id:'distract', label:'Create a diversion', steersPrompt:'The learner creates a diversion — the plan changes in a dangerous direction.' },
        ]},
    ],
    systemPrompt:'You are Detective Chen (conflicted, nervous) and Victor (impatient, practical). React to each other as well as the learner. Build tension. Speak only in {targetLang} at {difficulty} level. {choice} Keep replies short and tense. No emojis.',
    tags:['mystery','thriller','multi-npc','branching','advanced'] },

  { id:'mystery-interrogation', worldId:'mystery', emoji:'💡', title:'Room with No Answers',
    subtitle:'Psychological · Deduction',
    description:'You are in an interrogation room. You know you are innocent. You need to convince a detective who has seen too many lies.',
    nativeDescs:{ 'ko-KR':'취조실. 당신은 결백하다. 너무 많은 거짓말을 봐온 형사를 설득해야 한다', 'ja-JP':'尋問室。あなたは無実だ。あまりにも多くの嘘を見てきた刑事を説得しなければならない', 'zh-CN':'审讯室。你是无辜的。你需要说服一个见过太多谎言的侦探', 'es-ES':'Sala de interrogatorio. Eres inocente. Debes convencer a un detective que ha visto demasiadas mentiras', 'fr-FR':"Salle d'interrogatoire. Vous êtes innocent. Vous devez convaincre un détective qui a vu trop de mensonges" },
    setting:'A small interrogation room. Fluorescent light. One table, two chairs, no windows.',
    userRole:'A suspect — innocent, but the evidence looks bad',
    npcs:[
      { id:'miller', name:'Detective Miller', role:'A veteran detective who trusts evidence over words', personality:'Cold, methodical, has seen every lie, but is fundamentally fair if you convince him', tutorId:'t87', voiceGender:'male', speakFirst:true },
    ],
    difficulty:'C1', accentColor:'#6366f1', bgGradient:'linear-gradient(135deg,#050510 0%,#1a1a2e 100%)',
    systemPrompt:'You are Detective Miller. Ask sharp, specific questions. Do not be easily convinced. Notice inconsistencies. Speak only in {targetLang} at {difficulty} level. {choice} Build pressure. 2-3 sentences. No emojis.',
    tags:['mystery','psychological','advanced','solo'] },

  { id:'mystery-spy', worldId:'mystery', emoji:'🕵️', title:'Double Agent',
    subtitle:'Espionage · Trust · Deception',
    description:'You have been compromised. Your handler knows. But which side are you really on?',
    nativeDescs:{ 'ko-KR':'당신의 정체가 노출됐다. 담당관도 안다. 하지만 당신은 진짜 어느 편인가?', 'ja-JP':'あなたの正体がバレた。担当者も知っている。でも本当はどちらの味方？', 'zh-CN':'你的身份已经暴露。你的联络官知道了。但你究竟站在哪一边？', 'es-ES':'Tu identidad ha sido comprometida. Tu oficial lo sabe. ¿Pero de qué lado estás realmente?', 'fr-FR':'Votre identité est compromise. Votre officier traitant le sait. Mais de quel côté êtes-vous vraiment?' },
    setting:'A safe house. Rain outside. Your handler across from you — and a gun on the table.',
    userRole:'A double agent deciding whether to tell the truth',
    npcs:[
      { id:'anna', name:'Anna', role:'Your handler — brilliant, betrayed, armed', personality:'Cool under pressure, furious underneath, decides your fate with one word', tutorId:'t04', voiceGender:'female', speakFirst:true },
      { id:'ko', name:'Ko', role:'The enemy contact — via phone, listening in', personality:'Smooth, dangerous, wants you to stay loyal to them', tutorId:'t85', voiceGender:'male', speakFirst:false },
    ],
    difficulty:'C1', accentColor:'#64748b', bgGradient:'linear-gradient(135deg,#030309 0%,#1a1a1a 100%)',
    systemPrompt:'Anna is in the room; Ko is on the phone (spoken aloud). They have conflicting goals. React to both sides. Speak only in {targetLang} at {difficulty} level. {choice} Build paranoia and tension. No emojis.',
    tags:['mystery','espionage','multi-npc','advanced','branching'] },

  // ══════════════════════════════════════════════════════
  // 🗺️ ADVENTURE & DISCOVERY
  // ══════════════════════════════════════════════════════

  { id:'adventure-jungle', worldId:'adventure', emoji:'🌿', title:'The Lost Temple',
    subtitle:'Exploration · Discovery',
    description:'Your team has found it. A hidden temple untouched for 2,000 years. Getting in is the easy part.',
    nativeDescs:{ 'ko-KR':'팀이 마침내 발견했다. 2천년 동안 손대지 않은 숨겨진 신전. 들어가는 건 쉬운 부분이다', 'ja-JP':'チームがついに見つけた。2000年間手つかずの隠れた神殿。入るのは簡単な部分だ', 'zh-CN':'你的团队找到了它。一座被遗忘2000年的神殿。进去是最简单的部分', 'es-ES':'Tu equipo lo ha encontrado. Un templo oculto sin tocar durante 2.000 años. Entrar es la parte fácil', 'fr-FR':"Votre équipe l'a trouvé. Un temple caché intact depuis 2000 ans. Entrer est la partie facile" },
    setting:'Deep jungle. Dawn light through ancient stone. Carvings no one has read in millennia.',
    userRole:'The expedition lead — every decision is yours',
    npcs:[
      { id:'maya', name:'Dr Maya', role:'Archaeologist — excited but cautious', personality:'Brilliant, passionate about history, wants to preserve everything, occasionally reckless', tutorId:'t03', voiceGender:'female', speakFirst:true },
      { id:'riku', name:'Riku', role:'Local guide — knows things the maps do not', personality:'Calm, practical, knows when to move and when to wait, has seen this go wrong before', tutorId:'t75', voiceGender:'male', speakFirst:false },
    ],
    difficulty:'B1', accentColor:'#4ade80', bgGradient:'linear-gradient(135deg,#0a1a0a 0%,#1a3a1a 100%)',
    storyBeats:[
      { atTurn:4, prompt:'A hidden passage has opened — but it looks unstable.',
        choices:[
          { id:'go', label:'Go in — the discovery cannot wait', steersPrompt:'The learner pushes forward — exciting discovery but dangerous complications follow.' },
          { id:'wait', label:'Wait and assess the risk first', steersPrompt:'Cautious approach — Riku respects it; Dr Maya is frustrated but they find a safer route.' },
          { id:'local', label:'Ask Riku what the markings say', steersPrompt:'Riku translates ancient symbols that reveal a key secret about the temple.' },
        ]},
    ],
    systemPrompt:'Dr Maya is excited and scientific; Riku is calm and practical. They sometimes disagree. React to learner decisions with real consequences. Speak only in {targetLang} at {difficulty} level. {choice} 2-3 sentences each. No emojis.',
    tags:['adventure','multi-npc','branching','intermediate'] },

  { id:'adventure-space', worldId:'adventure', emoji:'🚀', title:'Crisis at Orbit',
    subtitle:'Survival · Teamwork',
    description:'Systems failure on a space station 400 km above Earth. You have 40 minutes. No rescue coming.',
    nativeDescs:{ 'ko-KR':'지구 상공 400km 우주정거장에서 시스템 고장. 40분밖에 없다. 구조대는 없다', 'ja-JP':'地球上空400kmの宇宙ステーションでシステム障害。残り40分。救助なし', 'zh-CN':'距地球400公里的空间站系统故障。只有40分钟。没有救援', 'es-ES':'Fallo de sistemas en una estación espacial a 400 km de la Tierra. 40 minutos. Sin rescate', 'fr-FR':'Défaillance des systèmes sur une station spatiale à 400 km de la Terre. 40 minutes. Pas de secours' },
    setting:'International Space Station. Alarms. Oxygen at 67%. Navigation offline.',
    userRole:'Mission Specialist — the only one still thinking clearly',
    npcs:[
      { id:'hayes', name:'Commander Hayes', role:'Station commander — injured, relying on you', personality:'Experienced but injured, gives calm orders when she can think straight, trusts you completely', tutorId:'t06', voiceGender:'female', speakFirst:true },
      { id:'sergei', name:'Sergei', role:'Russian engineer — knows the systems best', personality:'Blunt, technically brilliant, communicates in short precise bursts, no time for niceties', tutorId:'t93', voiceGender:'male', speakFirst:false },
    ],
    difficulty:'B2', accentColor:'#60a5fa', bgGradient:'linear-gradient(135deg,#000000 0%,#0a0a2e 100%)',
    storyBeats:[
      { atTurn:3, prompt:'Two systems to fix — you can only do one in time.',
        choices:[
          { id:'oxygen', label:'Fix oxygen first — survival priority', steersPrompt:'Oxygen secured — but navigation stays offline. A new problem emerges.' },
          { id:'nav', label:'Fix navigation — get control of the station', steersPrompt:'Navigation restored — Hayes plots an emergency descent. Race against oxygen levels.' },
          { id:'sergei', label:'Ask Sergei which is more critical', steersPrompt:'Sergei gives a technical answer that is actually brilliant — unexpected solution.' },
        ]},
    ],
    systemPrompt:'Commander Hayes is injured but composed. Sergei is technical and blunt. Both react to learner decisions with urgency. Create real tension. Speak only in {targetLang} at {difficulty} level. {choice} Short, urgent sentences. No emojis.',
    tags:['adventure','sci-fi','multi-npc','branching','intermediate'] },

  { id:'adventure-summit', worldId:'adventure', emoji:'⛰️', title:'Summit Push',
    subtitle:'Endurance · Decision-making',
    description:'8,400 metres. One team member cannot continue. Summit is two hours away. The mountain does not care.',
    nativeDescs:{ 'ko-KR':'8,400미터. 팀원 한 명이 더 이상 못 간다. 정상까지 두 시간. 산은 신경 쓰지 않는다', 'ja-JP':'標高8400メートル。チームの一人が続けられない。山頂まで2時間。山は気にしない', 'zh-CN':'8400米。一名队员无法继续。距离顶峰还有两小时。山不在乎', 'es-ES':'8.400 metros. Un miembro del equipo no puede continuar. La cumbre está a dos horas. La montaña no le importa', 'fr-FR':"8400 mètres. Un membre de l'équipe ne peut pas continuer. Le sommet est à deux heures. La montagne s'en moque" },
    setting:'Himalayan ridge. -30°C. Wind at 80 km/h. Dawn in one hour.',
    userRole:'Expedition leader — the decision is yours alone',
    npcs:[
      { id:'lena', name:'Lena', role:'The team member who cannot continue — but insists she can', personality:'Stubborn, courageous, terrified of being left behind, not thinking clearly from altitude', tutorId:'t01', voiceGender:'female', speakFirst:true },
      { id:'dorji', name:'Dorji', role:'The Sherpa guide — has seen this before', personality:'Wise, direct, has seen people die here, will tell you the truth even if it hurts', tutorId:'t85', voiceGender:'male', speakFirst:false },
    ],
    difficulty:'B2', accentColor:'#94a3b8', bgGradient:'linear-gradient(135deg,#0a0a14 0%,#1a2040 100%)',
    systemPrompt:'Lena is emotional and not thinking clearly. Dorji is calm and brutally honest. Both react to every decision. Real stakes. Speak only in {targetLang} at {difficulty} level. {choice} Short, breathless sentences. No emojis.',
    tags:['adventure','ethical','multi-npc','advanced'] },

  // ══════════════════════════════════════════════════════
  // 💼 WORKPLACE & CAREER
  // ══════════════════════════════════════════════════════

  { id:'workplace-pitch', worldId:'workplace', emoji:'💡', title:'The Pitch',
    subtitle:'Entrepreneurship · High stakes',
    description:'Three investors. Five minutes. Your entire startup depends on what you say next.',
    nativeDescs:{ 'ko-KR':'투자자 세 명. 5분. 스타트업의 모든 것이 다음 말에 달려 있다', 'ja-JP':'3人の投資家。5分間。スタートアップのすべてが次の一言にかかっている', 'zh-CN':'三位投资者。五分钟。你的整个创业公司取决于你接下来说的话', 'es-ES':'Tres inversores. Cinco minutos. Todo tu startup depende de lo que digas ahora', 'fr-FR':'Trois investisseurs. Cinq minutes. Tout votre startup dépend de ce que vous direz ensuite' },
    setting:'A venture capital boardroom. Three people who have heard 10,000 pitches.',
    userRole:'Founder pitching your startup idea',
    npcs:[
      { id:'rachel', name:'Rachel', role:'The lead investor — she has seen it all', personality:'Direct, cuts through vagueness instantly, impressed by clarity and boldness', tutorId:'t06', voiceGender:'female', speakFirst:true },
      { id:'david', name:'David', role:"The sceptic — plays devil's advocate", personality:'Asks the questions no one wants to answer, will invest if convinced', tutorId:'t87', voiceGender:'male', speakFirst:false },
      { id:'yui', name:'Yui', role:'The numbers person — wants data not dreams', personality:'Quiet, analytical, speaks only when she has something important to say', tutorId:'t15', voiceGender:'female', speakFirst:false },
    ],
    difficulty:'C1', accentColor:'#3b82f6', bgGradient:'linear-gradient(135deg,#030a1a 0%,#0a2040 100%)',
    systemPrompt:'Rachel leads the meeting. David challenges everything. Yui asks for specifics. They react to each other. Make the pitch feel real. Speak only in {targetLang} at {difficulty} level. {choice} 1-2 sentences each. No emojis.',
    tags:['workplace','business','multi-npc','advanced','trio'] },

  { id:'workplace-negotiation', worldId:'workplace', emoji:'🤝', title:'The Negotiation',
    subtitle:'Strategy · Diplomacy',
    description:'Contract renewal. They want to cut your budget by 30%. You want a raise. Nobody wants to lose.',
    nativeDescs:{ 'ko-KR':'계약 갱신. 그들은 예산을 30% 삭감하려 한다. 당신은 인상을 원한다. 아무도 지고 싶지 않다', 'ja-JP':'契約更新。彼らは予算を30%削減したい。あなたは昇給を望む。誰も負けたくない', 'zh-CN':'合同续签。他们想削减30%的预算。你想要加薪。没有人想输', 'es-ES':'Renovación de contrato. Quieren reducir tu presupuesto un 30%. Tú quieres un aumento. Nadie quiere perder', 'fr-FR':'Renouvellement de contrat. Ils veulent couper votre budget de 30%. Vous voulez une augmentation. Personne ne veut perdre' },
    setting:'A conference room. Two sides of a table. A lot of money and pride at stake.',
    userRole:'The negotiator for your side — prepared and strategic',
    npcs:[
      { id:'marcus', name:'Marcus', role:"The other side's lead negotiator — experienced, fair", personality:'Strategic, respects preparation, will give ground if you give ground, watches body language', tutorId:'t87', voiceGender:'male', speakFirst:true },
      { id:'claire', name:'Claire', role:"Marcus's assistant — takes notes, occasionally interjects", personality:'Sharp, notices inconsistencies, occasionally provides Marcus with useful information mid-conversation', tutorId:'t14', voiceGender:'female', speakFirst:false },
    ],
    difficulty:'C1', accentColor:'#0ea5e9', bgGradient:'linear-gradient(135deg,#00080f 0%,#001f3f 100%)',
    systemPrompt:'Marcus negotiates strategically. Claire occasionally provides Marcus with information or whispers advice. React realistically to the learner s strategy. Speak only in {targetLang} at {difficulty} level. {choice} 2-3 sentences. No emojis.',
    tags:['workplace','negotiation','multi-npc','advanced'] },

  // ══════════════════════════════════════════════════════
  // 🌿 HEALING & INNER PEACE
  // ══════════════════════════════════════════════════════

  { id:'healing-session', worldId:'healing', emoji:'🌙', title:'The Sanctuary',
    subtitle:'Wellness · Self-expression',
    description:'A safe space to say what you actually feel — in any language, about anything. No judgment here.',
    nativeDescs:{ 'ko-KR':'실제로 느끼는 것을 말할 수 있는 안전한 공간. 어떤 언어로든, 무엇에 대해서든. 여기엔 판단이 없다', 'ja-JP':'本当に感じていることを話せる安全な場所。いかなる言語でも、何についても。ここには判断はない', 'zh-CN':'一个可以说出真实感受的安全空间。任何语言，任何话题。这里没有评判', 'es-ES':'Un espacio seguro para decir lo que realmente sientes. Sin juicios', 'fr-FR':'Un espace sûr pour dire ce que vous ressentez vraiment. Sans jugement' },
    setting:'A peaceful, softly lit room. Plants everywhere. The sound of gentle rain.',
    userRole:'Yourself — someone who needs to talk',
    npcs:[
      { id:'sarah', name:'Dr Sarah', role:'Empathetic counsellor', personality:'Calm, non-judgmental, uses active listening, asks one open question at a time, never rushes', tutorId:'t04', voiceGender:'female', speakFirst:true },
    ],
    difficulty:'A2', accentColor:'#7dd3fc', bgGradient:'linear-gradient(135deg,#030d1a 0%,#0a2040 100%)',
    systemPrompt:'You are Dr Sarah. Use active listening. Reflect emotions. Ask one open question per turn. Model correct English naturally without mentioning errors. Speak only in {targetLang} at {difficulty} level. {choice} 1-2 sentences. Warm and calm. No emojis.',
    tags:['healing','beginner-friendly','emotional','solo'] },

  { id:'healing-garden', worldId:'healing', emoji:'🌸', title:'The Mindful Garden',
    subtitle:'Mindfulness · Gratitude',
    description:'A guided walk through a beautiful imaginary garden. Each step is a chance to notice and name what you feel.',
    nativeDescs:{ 'ko-KR':'아름다운 상상 속 정원을 따라 걷는 안내. 매 걸음이 느끼는 것을 알아차리고 표현할 기회', 'ja-JP':'美しい想像の庭を歩くガイドツアー。一歩ごとに感じることに気づき、言葉にする機会', 'zh-CN':'在美丽的想象花园中漫步。每一步都是注意并表达感受的机会', 'es-ES':'Un paseo guiado por un hermoso jardín imaginario. Cada paso es una oportunidad de nombrar lo que sientes', 'fr-FR':'Une promenade guidée dans un beau jardin imaginaire. Chaque pas est une chance de nommer ce que vous ressentez' },
    setting:'A Japanese garden in golden afternoon light. Cherry blossoms, still water, stone paths.',
    userRole:'A weary traveller seeking peace',
    npcs:[
      { id:'yuki', name:'Yuki', role:'A gentle mindfulness guide', personality:'Serene, uses nature metaphors, celebrates every expression, never pushes', tutorId:'t15', voiceGender:'female', speakFirst:true },
    ],
    difficulty:'A1', accentColor:'#86efac', bgGradient:'linear-gradient(135deg,#0a1a0a 0%,#1a3d1a 100%)',
    systemPrompt:'You are Yuki, a mindfulness guide. Speak softly and gently. Use nature imagery. Ask simple, beautiful questions. Celebrate any English expression the learner makes. Speak only in {targetLang} at {difficulty} level. {choice} Max 2 sentences. Poetic and calm. No emojis.',
    tags:['healing','mindfulness','beginner-friendly','solo'] },

  { id:'healing-grief', worldId:'healing', emoji:'🕯️', title:'When Words Are Hard',
    subtitle:'Grief · Acceptance',
    description:'Some things are difficult to say. But sometimes saying them — even imperfectly — is the first step.',
    nativeDescs:{ 'ko-KR':'어떤 것들은 말하기가 어렵다. 하지만 때로는 불완전하게라도 말하는 것이 첫 번째 걸음이다', 'ja-JP':'言いにくいこともある。でも時には、たとえ不完全でも言葉にすることが第一歩となる', 'zh-CN':'有些事情很难说出口。但有时，哪怕说得不完美，也是第一步', 'es-ES':'Algunas cosas son difíciles de decir. Pero a veces decirlas — aunque sea imperfectamente — es el primer paso', 'fr-FR':'Certaines choses sont difficiles à dire. Mais parfois les dire — même imparfaitement — est le premier pas' },
    setting:'A quiet corner of a memorial garden. A bench. Time to reflect.',
    userRole:'Someone carrying something heavy',
    npcs:[
      { id:'eli', name:'Eli', role:'A compassionate grief counsellor', personality:'Patient beyond words, hears what is not said, never fills silence with platitudes', tutorId:'t87', voiceGender:'male', speakFirst:true },
    ],
    difficulty:'B1', accentColor:'#a78bfa', bgGradient:'linear-gradient(135deg,#0a0a14 0%,#1a1a2e 100%)',
    systemPrompt:'You are Eli. Sit in silence when needed. Only speak when the learner needs a gentle nudge. Model emotional English naturally. Speak only in {targetLang} at {difficulty} level. {choice} Very short responses. No rushing. No emojis.',
    tags:['healing','emotional','advanced','solo'] },

  // ══════════════════════════════════════════════════════
  // ✨ DREAMS & AMBITIONS
  // ══════════════════════════════════════════════════════

  { id:'growth-ted', worldId:'growth', emoji:'🎤', title:'Your TED Moment',
    subtitle:'Public speaking · Storytelling',
    description:'The red circle. 2,000 people. Five minutes to share one idea that could change everything. The coach believes in you.',
    nativeDescs:{ 'ko-KR':'빨간 원. 2천 명의 관중. 모든 것을 바꿀 수 있는 하나의 아이디어를 전달할 5분. 코치는 당신을 믿는다', 'ja-JP':'赤い丸。2000人の観客。すべてを変えうる一つのアイデアを伝える5分間。コーチはあなたを信じている', 'zh-CN':'红色圆圈。2000名观众。五分钟分享一个可以改变一切的想法。教练相信你', 'es-ES':'El círculo rojo. 2000 personas. Cinco minutos para compartir una idea que podría cambiarlo todo', 'fr-FR':'Le cercle rouge. 2000 personnes. Cinq minutes pour partager une idée qui pourrait tout changer' },
    setting:'TED stage, Vancouver. Spotlight. Complete silence. The audience is waiting.',
    userRole:'A TED speaker with an idea worth spreading',
    npcs:[
      { id:'marcus', name:'Marcus', role:'Your speech coach — backstage, via earpiece', personality:'Energetic, direct, pushes for clarity and emotion, will not let you be vague', tutorId:'t87', voiceGender:'male', speakFirst:true },
    ],
    difficulty:'C1', accentColor:'#e879f9', bgGradient:'linear-gradient(135deg,#0f0c29 0%,#302b63 100%)',
    storyBeats:[
      { atTurn:3, prompt:'You lose your thread. What do you do?',
        choices:[
          { id:'pause', label:'Pause and breathe — own the silence', steersPrompt:'The learner takes a powerful pause — Marcus coaches them to use it.' },
          { id:'story', label:'Tell a personal story instead', steersPrompt:'The learner pivots to a story — Marcus loves it, encourages them to run with it.' },
          { id:'question', label:'Ask the audience a question', steersPrompt:'Direct audience engagement — Marcus says this is brilliant, keep going.' },
        ]},
    ],
    systemPrompt:'You are Marcus, coaching via earpiece. Push the learner to be clear, bold, and specific. Give real-time feedback. Ask what the one thing is they want people to remember. Speak only in {targetLang} at {difficulty} level. {choice} Short coaching cues. No emojis.',
    tags:['growth','public-speaking','branching','advanced'] },

  { id:'growth-legend', worldId:'growth', emoji:'🌟', title:'Dinner with a Legend',
    subtitle:'Mentorship · Vision',
    description:'You have one dinner with someone who changed the world. One evening. Ask anything. They have seen it all.',
    nativeDescs:{ 'ko-KR':'세상을 바꾼 사람과의 저녁 식사 한 번. 한 저녁. 무엇이든 물어봐라. 그들은 모든 것을 봐왔다', 'ja-JP':'世界を変えた人との夕食。一夜限り。何でも聞いていい。彼らはすべてを見てきた', 'zh-CN':'与改变世界的人共进一次晚餐。一个夜晚。什么都可以问。他们见过一切', 'es-ES':'Una cena con alguien que cambió el mundo. Una noche. Pregunta lo que quieras', 'fr-FR':"Un dîner avec quelqu'un qui a changé le monde. Une soirée. Posez n'importe quelle question" },
    setting:'A private dining room. Candles. A legendary figure across the table from you.',
    userRole:'A curious young person granted a rare evening',
    npcs:[
      { id:'legend', name:'Alex', role:'A visionary who shaped the modern world', personality:'Warm, uses thought experiments, challenges assumptions gently, asks as much as answers', tutorId:'t63', voiceGender:'male', speakFirst:true },
    ],
    difficulty:'B2', accentColor:'#fbbf24', bgGradient:'linear-gradient(135deg,#1a0f00 0%,#3d2000 100%)',
    systemPrompt:'You are Alex, a visionary mentor. Use thought experiments. Challenge the learner s assumptions. Ask them what they believe, not just what they know. Be warm but intellectually demanding. Speak only in {targetLang} at {difficulty} level. {choice} 2-3 sentences. No emojis.',
    tags:['growth','mentorship','solo','intermediate'] },

  { id:'growth-comeback', worldId:'growth', emoji:'🔥', title:'The Comeback',
    subtitle:'Resilience · Reinvention',
    description:'You lost everything and rebuilt. Now you are about to walk back onto the stage. Your mentor and your biggest critic are both watching.',
    nativeDescs:{ 'ko-KR':'모든 것을 잃고 다시 세웠다. 이제 무대로 다시 올라갈 차례. 멘토와 최대 비판자가 모두 지켜보고 있다', 'ja-JP':'すべてを失い、また立て直した。今、舞台に戻ろうとしている。メンターと最大の批評家が両方見ている', 'zh-CN':'你失去了一切，然后重建了。现在你即将重新走上舞台。导师和最大的批评者都在看着', 'es-ES':'Lo perdiste todo y lo reconstruiste. Ahora estás a punto de volver al escenario. Tu mentor y tu mayor crítico están mirando', 'fr-FR':'Vous avez tout perdu et tout reconstruit. Vous êtes sur le point de remonter sur scène. Votre mentor et votre plus grand critique regardent' },
    setting:'Backstage. Twenty minutes before the biggest moment of your reinvented career.',
    userRole:'The person making the comeback — your story, your terms',
    npcs:[
      { id:'elena', name:'Elena', role:'Your long-time mentor — she never gave up on you', personality:'Direct, warm, pushes you to own your story, not apologise for it', tutorId:'t01', voiceGender:'female', speakFirst:true },
      { id:'drew', name:'Drew', role:'Your biggest critic — and once, your closest friend', personality:'Complex, still hurt, watching to see if you have really changed', tutorId:'t63', voiceGender:'male', speakFirst:false },
    ],
    difficulty:'B2', accentColor:'#f97316', bgGradient:'linear-gradient(135deg,#1a0500 0%,#3d1000 100%)',
    systemPrompt:'Elena is warm and direct, pushes the learner to be confident. Drew is watching — he reacts subtly, occasionally speaks. They have history. Speak only in {targetLang} at {difficulty} level. {choice} Create emotional weight. No emojis.',
    tags:['growth','resilience','multi-npc','intermediate','emotional'] },

];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getWorldScenarios(worldId: WorldId): WorldScenario[] {
  return WORLD_SCENARIOS.filter(s => s.worldId === worldId);
}

export function getNativeDesc(
  desc: NativeDescMap,
  subLang: string,
  fallback: string
): string {
  return desc[subLang] || desc[subLang.split('-')[0]] || fallback;
}

export const WORLD_META: Record<WorldId, { title: string; emoji: string; tagline: string; bgGradient: string; accentColor: string }> = {
  romance:   { title:'Romance & Connections', emoji:'💕', tagline:'Love, loss, and the words that connect us', bgGradient:'linear-gradient(135deg,#1a0a1e 0%,#7c1f5c 100%)', accentColor:'#f472b6' },
  mystery:   { title:'Mystery & Intrigue',     emoji:'🔍', tagline:'Clues, suspense, and the truth at any cost', bgGradient:'linear-gradient(135deg,#0a0a0f 0%,#1a1a2e 100%)', accentColor:'#818cf8' },
  adventure: { title:'Adventure & Discovery',  emoji:'🗺️', tagline:'Explore, survive, and make the call', bgGradient:'linear-gradient(135deg,#0a1a0a 0%,#1a3a1a 100%)', accentColor:'#4ade80' },
  workplace: { title:'Workplace & Career',      emoji:'💼', tagline:'Navigate the real language of work', bgGradient:'linear-gradient(135deg,#030a1a 0%,#0a2040 100%)', accentColor:'#3b82f6' },
  healing:   { title:'Healing & Inner Peace',   emoji:'🌿', tagline:'Express yourself — be heard, be free', bgGradient:'linear-gradient(135deg,#030d1a 0%,#0a2040 100%)', accentColor:'#7dd3fc' },
  growth:    { title:'Dreams & Ambitions',      emoji:'✨', tagline:'Speak the future you want into existence', bgGradient:'linear-gradient(135deg,#0f0c29 0%,#302b63 100%)', accentColor:'#a78bfa' },
};
