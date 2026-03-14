export type VocabItem = {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
};

export type QuizItem = {
  q: string;
  options: string[];
  answer: number;
};

export type Lesson = {
  id: string;
  title: string;
  icon: string;
  xp: number;
  vocab: VocabItem[];
  quiz: QuizItem[];
  tutorPrompt: string;
};

export type Step = {
  id: string;
  label: string;
  persona: string;
  color: string;
  accent: string;
  dark: string;
  badge: string;
  xpReward: number;
  tagline: string;
  desc: string;
  lessons: Lesson[];
};

export type Level = {
  id: string;
  label: string;
  color: string;
  accent: string;
  dark: string;
  badge: string;
  persona: string;
  desc: string;
  xpRange: string;
  xpMin: number;
  steps: Step[];
};

export const CURRICULUM: Level[] = [
  {
    id: "a1", label: "A1", color: "#ECFDF5", accent: "#059669", dark: "#065F46",
    badge: "🌱", persona: "First Timer", xpMin: 0, xpRange: "0 – 800",
    desc: "Zero experience? Perfect. Start from absolute zero and build real confidence.",
    steps: [
      {
        id: "a1-1", label: "A1 · Step 1", persona: "🌱 First Timer",
        color: "#ECFDF5", accent: "#059669", dark: "#065F46", badge: "🌱", xpReward: 100,
        tagline: "Your very first words", desc: "Start from zero — greetings, names and numbers.",
        lessons: [
          {
            id: "a1-1-1", title: "Hello & Goodbye", icon: "👋", xp: 30,
            vocab: [
              { word: "Hello", phonetic: "heh-LOH", meaning: "Basic greeting", example: "Hello! My name is Emma." },
              { word: "Hi", phonetic: "haɪ", meaning: "Casual greeting", example: "Hi! Nice to meet you." },
              { word: "Goodbye", phonetic: "good-BYE", meaning: "Farewell", example: "Goodbye! See you tomorrow." },
              { word: "Bye", phonetic: "baɪ", meaning: "Casual farewell", example: "Bye! Take care." },
              { word: "Good morning", phonetic: "good MOR-ning", meaning: "Morning greeting", example: "Good morning! How are you?" },
            ],
            quiz: [
              { q: "How do you say 안녕하세요 in English?", options: ["Goodbye", "Hello", "Thank you", "Sorry"], answer: 1 },
              { q: "Which is a CASUAL greeting?", options: ["Good morning", "Goodbye", "Hi", "Good evening"], answer: 2 },
              { q: "What do you say when you LEAVE?", options: ["Hello", "Hi", "Good morning", "Goodbye"], answer: 3 },
            ],
            tutorPrompt: "You are a warm English tutor. The student is a total beginner learning their very first English greetings (Hello, Hi, Goodbye, Bye, Good morning). RULES: English only. Keep it to 2-3 short sentences. Be extremely encouraging. Give one tiny practice task at the end. Use emojis. Start by warmly greeting the student and asking them to try saying \"Hello!\" to you.",
          },
          {
            id: "a1-1-2", title: "What's Your Name?", icon: "🙋", xp: 35,
            vocab: [
              { word: "My name is...", phonetic: "maɪ neɪm ɪz", meaning: "Introduce yourself", example: "My name is Sarah." },
              { word: "What's your name?", phonetic: "wʌts jɔːr neɪm", meaning: "Ask for a name", example: "What's your name?" },
              { word: "Nice to meet you", phonetic: "naɪs tə miːt juː", meaning: "Polite greeting after intro", example: "Nice to meet you, Tom!" },
              { word: "I'm...", phonetic: "aɪm", meaning: "Short form of 'I am'", example: "I'm Emma. Nice to meet you!" },
              { word: "And you?", phonetic: "ænd juː", meaning: "Ask the same question back", example: "I'm great! And you?" },
            ],
            quiz: [
              { q: "How do you introduce yourself?", options: ["What's your name?", "My name is...", "Goodbye", "Nice to meet you"], answer: 1 },
              { q: "'I'm' is short for:", options: ["I am", "I meet", "I like", "I have"], answer: 0 },
              { q: "After 'My name is Sara,' the other person says:", options: ["Goodbye!", "Hello Sara, nice to meet you!", "What?", "My name is Sara too!"], answer: 1 },
            ],
            tutorPrompt: "You are a warm English tutor. The student is learning English introductions: \"My name is...\", \"What's your name?\", \"Nice to meet you\", \"I'm...\", \"And you?\". RULES: English only. 2-3 sentences max. Very encouraging. One practice task at end. Start: Introduce yourself and ask the student their name.",
          },
          {
            id: "a1-1-3", title: "Numbers 1–10", icon: "🔢", xp: 35,
            vocab: [
              { word: "One", phonetic: "wʌn", meaning: "1", example: "I have one cat." },
              { word: "Two", phonetic: "tuː", meaning: "2", example: "Two cups of coffee, please." },
              { word: "Three", phonetic: "θriː", meaning: "3", example: "Three friends." },
              { word: "Four", phonetic: "fɔːr", meaning: "4", example: "Four seasons." },
              { word: "Five", phonetic: "faɪv", meaning: "5", example: "High five! ✋" },
              { word: "Six", phonetic: "sɪks", meaning: "6", example: "Six o'clock." },
              { word: "Seven", phonetic: "ˈsevən", meaning: "7", example: "Seven days a week." },
              { word: "Eight", phonetic: "eɪt", meaning: "8", example: "Eight hours of sleep." },
              { word: "Nine", phonetic: "naɪn", meaning: "9", example: "Nine lives (cats)." },
              { word: "Ten", phonetic: "ten", meaning: "10", example: "Ten fingers." },
            ],
            quiz: [
              { q: "How do you say '5' in English?", options: ["Four", "Six", "Five", "Three"], answer: 2 },
              { q: "Which number sounds like 'ate'?", options: ["Ait", "Eight", "Ate", "Eighty"], answer: 1 },
              { q: "Count: one, two, ___, four", options: ["free", "tree", "three", "thr"], answer: 2 },
            ],
            tutorPrompt: "You are a fun English tutor. The student is learning numbers 1–10. RULES: English only. Short and fun. Encourage every answer. Give a tiny counting game. Start by saying \"Let's count together! Repeat after me: One... Two... Three... Can you continue to Ten?\" 🎉",
          },
        ],
      },
      {
        id: "a1-2", label: "A1 · Step 2", persona: "🗺️ Tourist",
        color: "#EFF6FF", accent: "#2563EB", dark: "#1E3A8A", badge: "🗺️", xpReward: 150,
        tagline: "Survive your first trip!", desc: "Order coffee, ask directions, and handle basic situations abroad.",
        lessons: [
          {
            id: "a1-2-1", title: "Ordering Food & Drinks", icon: "🍜", xp: 45,
            vocab: [
              { word: "Can I have...?", phonetic: "kæn aɪ hæv", meaning: "Polite request", example: "Can I have a coffee, please?" },
              { word: "Please", phonetic: "pliːz", meaning: "Polite word", example: "One water, please." },
              { word: "Thank you", phonetic: "θæŋk juː", meaning: "Express thanks", example: "Thank you very much!" },
              { word: "The menu, please", phonetic: "ðə ˈmenjuː pliːz", meaning: "Ask for menu", example: "Excuse me, the menu, please." },
              { word: "How much is it?", phonetic: "haʊ mʌtʃ ɪz ɪt", meaning: "Ask for price", example: "How much is this coffee?" },
              { word: "Excuse me", phonetic: "ɪkˈskjuːz miː", meaning: "Get attention politely", example: "Excuse me, can I order?" },
            ],
            quiz: [
              { q: "How do you politely ask for something?", options: ["Give me water", "Can I have water, please?", "Water now", "I want water"], answer: 1 },
              { q: "'Thank you' — what does it mean?", options: ["Hello", "Goodbye", "I want", "Express gratitude"], answer: 3 },
              { q: "To get a waiter's attention you say:", options: ["Hey you!", "Come here!", "Excuse me", "I want food"], answer: 2 },
            ],
            tutorPrompt: "You are a friendly English tutor. Student is learning café phrases: \"Can I have...?\", \"Please\", \"Thank you\", \"The menu please\", \"How much is it?\", \"Excuse me\". RULES: English only. 2-3 sentences. Roleplay as café waiter. Start: \"Welcome to our café! ☕ I'm your waiter today. What would you like? Try saying: 'Can I have a coffee, please?'\"",
          },
          {
            id: "a1-2-2", title: "Asking Directions", icon: "🗺️", xp: 50,
            vocab: [
              { word: "Where is...?", phonetic: "wɛr ɪz", meaning: "Ask for location", example: "Where is the hotel?" },
              { word: "Turn left / right", phonetic: "tɜːrn lɛft / raɪt", meaning: "Direction instructions", example: "Turn left at the traffic light." },
              { word: "Go straight", phonetic: "ɡoʊ streɪt", meaning: "Continue forward", example: "Go straight for 200 metres." },
              { word: "Near / Far", phonetic: "nɪr / fɑːr", meaning: "Distance", example: "It's near the station." },
              { word: "I don't understand", phonetic: "aɪ doʊnt ʌndəˈstænd", meaning: "You didn't follow", example: "Sorry, I don't understand. Can you repeat?" },
            ],
            quiz: [
              { q: "How do you ask where something is?", options: ["What is the hotel?", "Where is the hotel?", "How is the hotel?", "Who is the hotel?"], answer: 1 },
              { q: "'Go straight' means:", options: ["Turn left", "Turn right", "Continue forward", "Stop"], answer: 2 },
              { q: "You didn't understand directions. You say:", options: ["Thank you!", "Goodbye!", "I don't understand", "Yes please"], answer: 2 },
            ],
            tutorPrompt: "You are a friendly English tutor. Topic: directions — \"Where is...?\", turn left/right, \"go straight\", near/far, \"I don't understand\". RULES: English only. Roleplay as a local giving directions. Start: \"You're lost in a new city! 🗺️ Ask me where the nearest café is. Try: 'Excuse me, where is the café?'\"",
          },
          {
            id: "a1-2-3", title: "Telling the Time", icon: "🕐", xp: 55,
            vocab: [
              { word: "What time is it?", phonetic: "wʌt taɪm ɪz ɪt", meaning: "Ask for time", example: "Excuse me, what time is it?" },
              { word: "It's ... o'clock", phonetic: "ɪts ... əˈklɒk", meaning: "State the hour", example: "It's three o'clock." },
              { word: "Half past", phonetic: "hɑːf pɑːst", meaning: "30 minutes past", example: "It's half past two." },
              { word: "Quarter to", phonetic: "ˈkwɔːtər tuː", meaning: "15 minutes before", example: "It's quarter to five." },
              { word: "In the morning / afternoon", phonetic: "ɪn ðə ˈmɔːrnɪŋ / ˌæftərˈnuːn", meaning: "AM / PM", example: "The meeting is at 9 in the morning." },
            ],
            quiz: [
              { q: "How do you ask for the time?", options: ["What day is it?", "What time is it?", "Where is it?", "How much is it?"], answer: 1 },
              { q: "'Half past three' means:", options: ["3:15", "3:30", "3:45", "2:30"], answer: 1 },
              { q: "'Quarter to five' means:", options: ["5:15", "5:45", "4:45", "4:15"], answer: 2 },
            ],
            tutorPrompt: "You are a friendly English tutor. Topic: telling time — \"What time is it?\", \"o'clock\", \"half past\", \"quarter to\", morning/afternoon. RULES: English only. Short and fun. Ask the student to say different times. Start: \"Let's learn to tell the time! 🕐 It's three o'clock right now. How do you ask someone for the time? Try it!\"",
          },
        ],
      },
      {
        id: "a1-3", label: "A1 · Step 3", persona: "☕ Café Regular",
        color: "#FFF7ED", accent: "#EA580C", dark: "#7C2D12", badge: "☕", xpReward: 200,
        tagline: "Handle everyday situations", desc: "Shopping, weather chat and describing your daily routine.",
        lessons: [
          {
            id: "a1-3-1", title: "Shopping", icon: "🛍️", xp: 60,
            vocab: [
              { word: "How much does it cost?", phonetic: "haʊ mʌtʃ dʌz ɪt kɒst", meaning: "Ask for price", example: "How much does this shirt cost?" },
              { word: "I'll take it", phonetic: "aɪl teɪk ɪt", meaning: "Decide to buy", example: "It's perfect! I'll take it." },
              { word: "Too expensive", phonetic: "tuː ɪkˈspɛnsɪv", meaning: "Price is too high", example: "That's too expensive for me." },
              { word: "Do you have...?", phonetic: "duː juː hæv", meaning: "Ask if item exists", example: "Do you have this in blue?" },
              { word: "Cash / Card", phonetic: "kæʃ / kɑːrd", meaning: "Payment methods", example: "Can I pay by card?" },
            ],
            quiz: [
              { q: "How do you ask for a price?", options: ["Where is it?", "How much does it cost?", "Do you like it?", "What colour is it?"], answer: 1 },
              { q: "'I'll take it' means:", options: ["I don't want it", "I want to buy it", "I want to look", "I want to return it"], answer: 1 },
              { q: "You want to pay with a card. You say:", options: ["Cash please", "Can I pay by card?", "How much?", "Too expensive"], answer: 1 },
            ],
            tutorPrompt: "You are a friendly English tutor. Topic: shopping — price questions, \"I'll take it\", \"too expensive\", \"do you have...?\", cash/card. RULES: English only. Roleplay as shop assistant. Start: \"Welcome to the shop! 🛍️ I'm your assistant. What are you looking for today? Try: 'Do you have this in a different colour?'\"",
          },
          {
            id: "a1-3-2", title: "Talking About Weather", icon: "🌤️", xp: 60,
            vocab: [
              { word: "weather", phonetic: "ˈwɛðər", meaning: "Atmospheric conditions outside", example: "What is the weather like today?" },
              { word: "temperature", phonetic: "ˈtɛmprɪtʃər", meaning: "How hot or cold it is", example: "The temperature is 20 degrees." },
              { word: "cloudy", phonetic: "ˈklaʊdi", meaning: "Sky covered with clouds", example: "It is cloudy and grey today." },
              { word: "windy", phonetic: "ˈwɪndi", meaning: "A lot of wind", example: "It is very windy outside — take a jacket." },
              { word: "forecast", phonetic: "ˈfɔːrkæst", meaning: "Prediction of future weather", example: "The forecast says it will snow tomorrow." },
              { word: "It's sunny / rainy", phonetic: "ɪts ˈsʌni / ˈreɪni", meaning: "Describe weather", example: "It's sunny today!" },
              { word: "It's cold / hot", phonetic: "ɪts koʊld / hɒt", meaning: "Temperature", example: "It's very cold this morning." },
              { word: "What's the weather like?", phonetic: "wʌts ðə ˈwɛðər laɪk", meaning: "Ask about weather", example: "What's the weather like today?" },
              { word: "I love / hate this weather", phonetic: "aɪ lʌv / heɪt ðɪs ˈwɛðər", meaning: "Express opinion on weather", example: "I love sunny weather!" },
              { word: "Bring an umbrella", phonetic: "brɪŋ ən ʌmˈbrɛlə", meaning: "Weather advice", example: "It's raining — bring an umbrella!" },
            ],
            quiz: [
              { q: "How do you ask about weather?", options: ["What time is it?", "What's the weather like?", "Where is it?", "How much?"], answer: 1 },
              { q: "'It's hot' describes:", options: ["Rain", "Cold temperature", "High temperature", "Wind"], answer: 2 },
              { q: "It's raining. What should you bring?", options: ["Sunglasses", "A hat", "An umbrella", "A coat"], answer: 2 },
            ],
            tutorPrompt: "You are a friendly English tutor. Topic: weather — sunny/rainy, cold/hot, \"What's the weather like?\", opinions, \"bring an umbrella\". RULES: English only. Fun small talk. Ask about the student's weather. Start: \"Let's talk about the weather! ☀️ What's the weather like where you are right now? Use: 'It's...' to describe it!\"",
          },
          {
            id: "a1-3-3", title: "Daily Routine", icon: "⏰", xp: 80,
            vocab: [
              { word: "I wake up at...", phonetic: "aɪ weɪk ʌp æt", meaning: "Morning routine start", example: "I wake up at 7 o'clock." },
              { word: "I go to work / school", phonetic: "aɪ ɡoʊ tə wɜːrk / skuːl", meaning: "Daily destination", example: "I go to work by bus." },
              { word: "I eat breakfast / lunch / dinner", phonetic: "aɪ iːt ˈbrɛkfəst", meaning: "Meals", example: "I eat breakfast at 8." },
              { word: "I go to bed at...", phonetic: "aɪ ɡoʊ tə bɛd æt", meaning: "Bedtime", example: "I go to bed at 11." },
              { word: "Every day / on weekends", phonetic: "ˈɛvri deɪ / ɒn ˈwiːkɛndz", meaning: "Frequency", example: "I exercise every day." },
            ],
            quiz: [
              { q: "'I wake up at 7' means:", options: ["I sleep at 7", "I start my day at 7", "I eat at 7", "I work at 7"], answer: 1 },
              { q: "The meal you eat in the morning is called:", options: ["Lunch", "Dinner", "Breakfast", "Supper"], answer: 2 },
              { q: "'Every day' means:", options: ["Sometimes", "Once a week", "All 7 days", "On weekends"], answer: 2 },
            ],
            tutorPrompt: "You are a friendly English tutor. Topic: daily routine — wake up, go to work/school, meals, go to bed, frequency words. RULES: English only. Conversational. Ask about student's routine. Start: \"Tell me about your day! ⏰ What time do you wake up? Use 'I wake up at...' to answer!\"",
          },
        ],
      },
      {
        id: "a1-4", label: "A1 · Step 4", persona: "🏡 Neighborhood Pro",
        color: "#F0FDF4", accent: "#16A34A", dark: "#14532D", badge: "🏡", xpReward: 250,
        tagline: "Talk about life and people", desc: "Family, likes and dislikes, and making simple plans.",
        lessons: [
          {
            id: "a1-4-1", title: "Family", icon: "👨‍👩‍👧", xp: 70,
            vocab: [
              { word: "Mother / Father", phonetic: "ˈmʌðər / ˈfɑːðər", meaning: "Parents", example: "My mother is a teacher." },
              { word: "Brother / Sister", phonetic: "ˈbrʌðər / ˈsɪstər", meaning: "Siblings", example: "I have one brother and two sisters." },
              { word: "Husband / Wife", phonetic: "ˈhʌzbənd / waɪf", meaning: "Married couple", example: "My husband is a doctor." },
              { word: "Son / Daughter", phonetic: "sʌn / ˈdɔːtər", meaning: "Children", example: "I have a daughter, she is 5." },
              { word: "How many people in your family?", phonetic: "haʊ ˈmɛni ˈpiːpl ɪn jɔːr ˈfæmɪli", meaning: "Ask about family size", example: "How many people are in your family?" },
            ],
            quiz: [
              { q: "Your mother's husband is your:", options: ["Brother", "Uncle", "Father", "Son"], answer: 2 },
              { q: "'I have one sister' means:", options: ["I have no siblings", "I have a female sibling", "I have a male sibling", "I have two sisters"], answer: 1 },
              { q: "A 'daughter' is:", options: ["A female child", "A male child", "A wife", "A mother"], answer: 0 },
            ],
            tutorPrompt: "You are a friendly English tutor. Topic: family vocabulary — mother/father, brother/sister, husband/wife, son/daughter, family size. RULES: English only. Warm and personal. Ask about the student's family. Start: \"Let's talk about family! 👨‍👩‍👧 I'll start: I have one brother and no sisters. Tell me about YOUR family!\"",
          },
          {
            id: "a1-4-2", title: "Likes & Dislikes", icon: "❤️", xp: 75,
            vocab: [
              { word: "I like / love", phonetic: "aɪ laɪk / lʌv", meaning: "Express positive feelings", example: "I love pizza!" },
              { word: "I don't like / hate", phonetic: "aɪ doʊnt laɪk / heɪt", meaning: "Express negative feelings", example: "I don't like loud music." },
              { word: "My favourite is...", phonetic: "maɪ ˈfeɪvərɪt ɪz", meaning: "Best liked thing", example: "My favourite food is sushi." },
              { word: "What's your favourite...?", phonetic: "wʌts jɔːr ˈfeɪvərɪt", meaning: "Ask for preference", example: "What's your favourite movie?" },
              { word: "I prefer...", phonetic: "aɪ prɪˈfɜːr", meaning: "Like more than another", example: "I prefer tea to coffee." },
            ],
            quiz: [
              { q: "'I hate Mondays' means:", options: ["I love Mondays", "Mondays are okay", "I strongly dislike Mondays", "I don't care about Mondays"], answer: 2 },
              { q: "'My favourite food is pizza' — what is the person's most liked food?", options: ["Sushi", "Pasta", "Pizza", "Salad"], answer: 2 },
              { q: "'I prefer cats to dogs' means:", options: ["I like dogs more", "I like cats more", "I like both equally", "I dislike both"], answer: 1 },
            ],
            tutorPrompt: "You are a friendly English tutor. Topic: likes/dislikes — \"I like/love\", \"I don't like/hate\", \"my favourite\", \"what's your favourite?\", \"I prefer\". RULES: English only. Fun conversation. Share YOUR fictional preferences first. Start: \"Let's talk about what we like! ❤️ My favourite food is pasta. What's YOUR favourite food? Tell me using 'My favourite is...'\"",
          },
          {
            id: "a1-4-3", title: "Making Plans", icon: "📅", xp: 105,
            vocab: [
              { word: "Do you want to...?", phonetic: "duː juː wɒnt tə", meaning: "Invite someone", example: "Do you want to have lunch together?" },
              { word: "Yes, I'd love to!", phonetic: "jɛs aɪd lʌv tə", meaning: "Accept enthusiastically", example: "Yes, I'd love to come!" },
              { word: "Sorry, I can't", phonetic: "ˈsɒri aɪ kænt", meaning: "Decline politely", example: "Sorry, I can't — I'm busy." },
              { word: "How about...?", phonetic: "haʊ əˈbaʊt", meaning: "Suggest an alternative", example: "How about Saturday instead?" },
              { word: "See you then!", phonetic: "siː juː ðɛn", meaning: "Confirm the plan", example: "Great! See you then! 👋" },
            ],
            quiz: [
              { q: "'Do you want to go for coffee?' is:", options: ["A statement", "An invitation", "A question about coffee", "A complaint"], answer: 1 },
              { q: "'Sorry, I can't' means:", options: ["I agree", "I am not able to come", "I want to come", "Maybe"], answer: 1 },
              { q: "'How about Friday?' is:", options: ["A question about Friday", "An alternative suggestion", "A refusal", "A greeting"], answer: 1 },
            ],
            tutorPrompt: "You are a friendly English tutor. Topic: making plans — \"Do you want to...?\", accepting/declining, \"How about...?\", \"See you then!\". RULES: English only. Fun roleplay planning an outing. Start: \"Let's practice making plans! 📅 I'll invite you somewhere: 'Do you want to go for coffee this Saturday?' — Say yes or suggest a different time!\"",
          },
        ],
      },
    ],
  },
  {
    id: "a2", label: "A2", color: "#FFFBEB", accent: "#D97706", dark: "#78350F",
    badge: "🏙️", persona: "Local Explorer", xpMin: 800, xpRange: "800 – 1,400",
    desc: "Navigate everyday life — transport, health, past events and phone calls.",
    steps: [
      {
        id: "a2-1", label: "A2 · Step 1", persona: "🚌 Getting Around",
        color: "#FFFBEB", accent: "#D97706", dark: "#78350F", badge: "🚌", xpReward: 180,
        tagline: "Move through the city like a local", desc: "Buses, trains, taxis — get where you need to go.",
        lessons: [
          {
            id: "a2-1-1", title: "Transport & Travel", icon: "🚇", xp: 55,
            vocab: [
              { word: "How do I get to…?", phonetic: "haʊ duː aɪ ɡɛt tə", meaning: "Ask for route", example: "How do I get to the airport?" },
              { word: "Take the subway/bus", phonetic: "teɪk ðə ˈsʌbweɪ / bʌs", meaning: "Use public transport", example: "Take the subway — Line 2." },
              { word: "Single / Return", phonetic: "ˈsɪŋɡl / rɪˈtɜːrn", meaning: "One-way or round trip", example: "A return ticket to London, please." },
              { word: "Platform / Track", phonetic: "ˈplætfɔːrm / træk", meaning: "Where trains depart", example: "Your train leaves from Platform 3." },
              { word: "Is this seat taken?", phonetic: "ɪz ðɪs siːt ˈteɪkən", meaning: "Ask about free seat", example: "Excuse me, is this seat taken?" },
            ],
            quiz: [
              { q: "You want a ticket going there AND back. You ask for a:", options: ["Single", "Return", "Platform", "Seat"], answer: 1 },
              { q: "'Is this seat taken?' means:", options: ["Is this seat dirty?", "Can I sit here?", "Where is the seat?", "I want this seat."], answer: 1 },
              { q: "'How do I get to the museum?' is asking for:", options: ["The price", "The schedule", "Directions", "A ticket"], answer: 2 },
            ],
            tutorPrompt: "You are a friendly English tutor. Topic: transport vocabulary — subway, bus, single/return tickets, platforms, asking for directions in transit. RULES: English only. Max 3 sentences. Encouraging. One roleplay task per turn. Start: \"Imagine we're at a busy train station 🚉 I'm the ticket officer. Ask me: 'How do I get to the city centre?' — go ahead!\"",
          },
          {
            id: "a2-1-2", title: "Past Events", icon: "⏪", xp: 60,
            vocab: [
              { word: "I went to…", phonetic: "aɪ wɛnt tə", meaning: "Past of 'go'", example: "I went to the market yesterday." },
              { word: "I ate / I drank", phonetic: "aɪ eɪt / aɪ dræŋk", meaning: "Past of eat/drink", example: "I ate sushi and drank green tea." },
              { word: "It was…", phonetic: "ɪt wɒz", meaning: "Describe past state", example: "It was amazing!" },
              { word: "Did you…?", phonetic: "dɪd juː", meaning: "Past yes/no question", example: "Did you enjoy the movie?" },
              { word: "I didn't…", phonetic: "aɪ ˈdɪdnt", meaning: "Past negative", example: "I didn't sleep well last night." },
            ],
            quiz: [
              { q: "'I went' is the past tense of:", options: ["I go", "I gone", "I going", "I goed"], answer: 0 },
              { q: "To ask a past yes/no question you start with:", options: ["Do", "Did", "Was", "Have"], answer: 1 },
              { q: "'I didn't sleep' — this is a past:", options: ["Question", "Positive", "Negative", "Future"], answer: 2 },
            ],
            tutorPrompt: "You are a friendly English tutor. Topic: simple past tense — went/ate/drank/was, \"Did you…?\", \"I didn't…\", time expressions. RULES: English only. Short. Correct mistakes gently. One question per turn. Start: \"Let's talk about the past! 📅 Tell me — what did you do last weekend? Even one sentence is great!\"",
          },
          {
            id: "a2-1-3", title: "Phone Calls & Appointments", icon: "📞", xp: 65,
            vocab: [
              { word: "Can I speak to…?", phonetic: "kæn aɪ spiːk tə", meaning: "Ask for a person", example: "Can I speak to Dr. Kim, please?" },
              { word: "Hold on, please", phonetic: "hoʊld ɒn pliːz", meaning: "Wait a moment", example: "Hold on, please — I'll transfer you." },
              { word: "I'd like to make an appointment", phonetic: "aɪd laɪk tə meɪk ən əˈpɔɪntmənt", meaning: "Book a meeting", example: "I'd like to make an appointment for Tuesday." },
              { word: "Is … available?", phonetic: "ɪz ... əˈveɪləbl", meaning: "Check availability", example: "Is 3 PM available?" },
              { word: "I'll call back later", phonetic: "aɪl kɔːl bæk ˈleɪtər", meaning: "Return the call", example: "She's busy — I'll call back later." },
            ],
            quiz: [
              { q: "At the start of a business call you say:", options: ["Hey!", "Can I speak to Mr. Park, please?", "Give me the boss", "Hello boss"], answer: 1 },
              { q: "'Hold on' means:", options: ["Hang up", "Please wait", "Call again", "Wrong number"], answer: 1 },
              { q: "To book a dentist visit you say:", options: ["I want teeth", "Fix my teeth", "I'd like to make an appointment", "Give appointment"], answer: 2 },
            ],
            tutorPrompt: "You are a friendly English tutor. Topic: phone call English — \"Can I speak to…?\", hold on, making appointments, \"Is … available?\", wrong number. RULES: English only. Short. Roleplay telephone conversation. Start: \"Ring ring! 📞 I'm the receptionist at a clinic. You need to book an appointment. Call me! Start with 'Hello, can I speak to…?'\"",
          },
        ],
      },
    ],
  },
  // B1 레벨 예시: Syntax Error가 발생했던 부분
  {
    id: "b1", label: "B1", color: "#EFF6FF", accent: "#3B82F6", dark: "#1E40AF",
    badge: "🎓", persona: "Independent Speaker", xpMin: 1400, xpRange: "1,400 – 2,500",
    desc: "Handle more complex social and work situations with confidence.",
    steps: [
      {
        id: "b1-1", label: "B1 · Step 1", persona: "💼 Professional",
        color: "#EFF6FF", accent: "#3B82F6", dark: "#1E40AF", badge: "💼", xpReward: 250,
        tagline: "English for the workplace", desc: "Meetings, feedback and professional communication.",
        lessons: [
          {
            id: "b1-1-2", title: "Office Communication", icon: "🏢", xp: 85,
            vocab: [
              { word: "delegate", phonetic: "ˈdɛlɪɡeɪt", meaning: "To assign a task to someone else", example: "I will delegate this task to my assistant." },
              { word: "update", phonetic: "ˈʌpdeɪt", meaning: "To give the latest information", example: "Could you update me on the project status?" },
              { word: "agenda", phonetic: "əˈdʒɛndə", meaning: "A list of items to discuss in a meeting", example: "The agenda for today's meeting has five points." },
              { word: "deadline", phonetic: "ˈdɛdlaɪn", meaning: "The latest time by which something must be done", example: "The deadline for this report is Friday at 5 PM." },
            ],
            quiz: [
              { q: "What does 'delegate' mean?", options: ["To do it yourself", "To assign it to someone else", "To cancel it", "To forget it"], answer: 1 },
              { q: "Where do you find the topics for a meeting?", options: ["The deadline", "The agenda", "The update", "The delegation"], answer: 1 },
            ],
            tutorPrompt: "You are a professional English tutor. Topic: office communication — delegate, update, agenda, deadline. RULES: English only. Professional tone. Simulate a brief meeting. Start: \"Good morning! 🏢 Let's look at the agenda for today's project update. What's the deadline for your current task?\"",
          }
        ]
      }
    ]
  }
];

// Helper functions (기존과 동일)
export const getAllLessons = () => CURRICULUM.flatMap(l => l.steps.flatMap(s => s.lessons));
export const getLevelById = (id: string) => CURRICULUM.find(l => l.id === id);
export const getStepById = (levelId: string, stepId: string) => getLevelById(levelId)?.steps.find(s => s.id === stepId);
export const getLessonById = (levelId: string, stepId: string, lessonId: string) => getStepById(levelId, stepId)?.lessons.find(l => l.id === lessonId);
export const getCurrentLevel = (xp: number) => [...CURRICULUM].reverse().find(l => xp >= l.xpMin) || CURRICULUM[0];