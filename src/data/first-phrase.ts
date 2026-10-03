// src/data/first-phrase.ts — "Try it now" 3분 말하기 체험용 하드코딩 콘텐츠
// Gemini 호출 없이 비용 0으로 동작. 10개 인기 언어 × 문장 3 + 단어 3.

export type WowItem = {
  /** 'phrase' = 문장, 'word' = 단어 */
  kind: 'phrase' | 'word';
  /** 목표 언어 문장/단어 (TTS·STT 타깃) */
  text: string;
  /** 로마자 발음 가이드 */
  romanized: string;
  /** 영어 뜻 */
  meaning: string;
};

export type FirstPhrase = {
  /** TTS용 앱 언어 코드 (/api/tts VOICE_MAP 기준) */
  code: string;
  /** 브라우저 STT용 BCP-47 코드 */
  sttLang: string;
  label: string;
  flag: string;
  /** 체험 아이템 (문장 3 + 단어 3) */
  items: WowItem[];
};

export const FIRST_PHRASES: FirstPhrase[] = [
  {
    code: 'es-ES', sttLang: 'es-ES', label: 'Spanish', flag: '🇪🇸',
    items: [
      { kind: 'phrase', text: 'Hola, ¿cómo estás?', romanized: 'OH-lah, KOH-moh ehs-TAHS', meaning: 'Hello, how are you?' },
      { kind: 'phrase', text: '¿Dónde está el baño?', romanized: 'DOHN-deh ehs-TAH ehl BAH-nyoh', meaning: 'Where is the bathroom?' },
      { kind: 'phrase', text: 'Una cerveza, por favor.', romanized: 'OO-nah thair-VEH-sah, pohr fah-VOHR', meaning: 'One beer, please.' },
      { kind: 'word', text: 'Gracias', romanized: 'GRAH-syahs', meaning: 'Thank you' },
      { kind: 'word', text: 'Por favor', romanized: 'pohr fah-VOHR', meaning: 'Please' },
      { kind: 'word', text: 'Adiós', romanized: 'ah-DYOHS', meaning: 'Goodbye' },
    ],
  },
  {
    code: 'en-US', sttLang: 'en-US', label: 'English', flag: '🇺🇸',
    items: [
      { kind: 'phrase', text: 'Hello! Nice to meet you.', romanized: 'heh-LOH! nyse tuh meet yoo', meaning: 'Hello! Nice to meet you.' },
      { kind: 'phrase', text: 'Where is the station?', romanized: 'wair iz thuh STAY-shuhn', meaning: 'Where is the station?' },
      { kind: 'phrase', text: 'I love coffee.', romanized: 'eye luhv KAW-fee', meaning: 'I love coffee.' },
      { kind: 'word', text: 'Thank you', romanized: 'thangk yoo', meaning: 'Thank you' },
      { kind: 'word', text: 'Excuse me', romanized: 'ehk-SKYOOZ mee', meaning: 'Excuse me' },
      { kind: 'word', text: 'Beautiful', romanized: 'BYOO-tih-fuhl', meaning: 'Beautiful' },
    ],
  },
  {
    code: 'ja-JP', sttLang: 'ja-JP', label: 'Japanese', flag: '🇯🇵',
    items: [
      { kind: 'phrase', text: 'こんにちは！', romanized: 'kohn-nee-chee-wah', meaning: 'Hello!' },
      { kind: 'phrase', text: 'ありがとうございます', romanized: 'ah-ree-gah-toh goh-zah-ee-mahss', meaning: 'Thank you (polite)' },
      { kind: 'phrase', text: 'おいしいですね', romanized: 'oh-ee-shee dehss neh', meaning: "It's delicious" },
      { kind: 'word', text: 'さくら', romanized: 'sah-koo-rah', meaning: 'cherry blossom' },
      { kind: 'word', text: 'すし', romanized: 'soo-shee', meaning: 'sushi' },
      { kind: 'word', text: 'がんばれ', romanized: 'gahn-bah-reh', meaning: 'do your best' },
    ],
  },
  {
    code: 'ko-KR', sttLang: 'ko-KR', label: 'Korean', flag: '🇰🇷',
    items: [
      { kind: 'phrase', text: '안녕하세요!', romanized: 'ahn-nyoung-hah-seh-yoh', meaning: 'Hello!' },
      { kind: 'phrase', text: '감사합니다', romanized: 'gahm-sah-hahm-nee-dah', meaning: 'Thank you' },
      { kind: 'phrase', text: '맛있어요', romanized: 'mah-shee-ssuh-yoh', meaning: "It's delicious" },
      { kind: 'word', text: '사랑', romanized: 'sah-rahng', meaning: 'love' },
      { kind: 'word', text: '김치', romanized: 'keem-chee', meaning: 'kimchi' },
      { kind: 'word', text: '화이팅', romanized: 'hwah-ee-teeng', meaning: 'good luck / you can do it' },
    ],
  },
  {
    code: 'fr-FR', sttLang: 'fr-FR', label: 'French', flag: '🇫🇷',
    items: [
      { kind: 'phrase', text: 'Bonjour, comment ça va ?', romanized: 'bohn-ZHOOR, koh-mahn sah vah', meaning: 'Hello, how are you?' },
      { kind: 'phrase', text: 'Je voudrais un café.', romanized: 'zhuh voo-DREH uhn kah-FEH', meaning: 'I would like a coffee.' },
      { kind: 'phrase', text: 'Où sont les toilettes ?', romanized: 'oo sohn leh twah-LEHT', meaning: 'Where is the bathroom?' },
      { kind: 'word', text: 'Merci', romanized: 'mehr-SEE', meaning: 'Thank you' },
      { kind: 'word', text: "S'il vous plaît", romanized: 'seel voo PLEH', meaning: 'Please' },
      { kind: 'word', text: 'Au revoir', romanized: 'oh ruh-VWAHR', meaning: 'Goodbye' },
    ],
  },
  {
    code: 'de-DE', sttLang: 'de-DE', label: 'German', flag: '🇩🇪',
    items: [
      { kind: 'phrase', text: "Hallo, wie geht's?", romanized: 'HAH-loh, vee gayts', meaning: 'Hello, how are you?' },
      { kind: 'phrase', text: 'Ich hätte gern ein Bier.', romanized: 'eekh HEH-teh gairn ine beer', meaning: 'I would like a beer.' },
      { kind: 'phrase', text: 'Wo ist der Bahnhof?', romanized: 'voh ist dair BAHN-hohf', meaning: 'Where is the train station?' },
      { kind: 'word', text: 'Danke', romanized: 'DAHN-keh', meaning: 'Thank you' },
      { kind: 'word', text: 'Bitte', romanized: 'BIH-teh', meaning: "Please / you're welcome" },
      { kind: 'word', text: 'Tschüss', romanized: 'chooss', meaning: 'Bye' },
    ],
  },
  {
    code: 'zh-CN', sttLang: 'zh-CN', label: 'Chinese', flag: '🇨🇳',
    items: [
      { kind: 'phrase', text: '你好！', romanized: 'nee how', meaning: 'Hello!' },
      { kind: 'phrase', text: '谢谢！', romanized: 'shyeh-shyeh', meaning: 'Thank you!' },
      { kind: 'phrase', text: '我爱你', romanized: 'woh eye nee', meaning: 'I love you' },
      { kind: 'word', text: '爱', romanized: 'eye', meaning: 'love' },
      { kind: 'word', text: '茶', romanized: 'chah', meaning: 'tea' },
      { kind: 'word', text: '朋友', romanized: 'puhng-yoh', meaning: 'friend' },
    ],
  },
  {
    code: 'vi-VN', sttLang: 'vi-VN', label: 'Vietnamese', flag: '🇻🇳',
    items: [
      { kind: 'phrase', text: 'Xin chào!', romanized: 'seen chow', meaning: 'Hello!' },
      { kind: 'phrase', text: 'Cảm ơn!', romanized: 'gahm uhn', meaning: 'Thank you!' },
      { kind: 'phrase', text: 'Tôi yêu bạn', romanized: 'toy yew bahn', meaning: 'I love you' },
      { kind: 'word', text: 'Phở', romanized: 'fuh', meaning: 'pho (noodle soup)' },
      { kind: 'word', text: 'Cà phê', romanized: 'gah feh', meaning: 'coffee' },
      { kind: 'word', text: 'Đẹp', romanized: 'dep', meaning: 'beautiful' },
    ],
  },
  {
    code: 'th-TH', sttLang: 'th-TH', label: 'Thai', flag: '🇹🇭',
    items: [
      { kind: 'phrase', text: 'สวัสดี!', romanized: 'sah-wah-dee', meaning: 'Hello!' },
      { kind: 'phrase', text: 'ขอบคุณ', romanized: 'khop-khoon', meaning: 'Thank you' },
      { kind: 'phrase', text: 'อร่อยมาก', romanized: 'ah-roy mahk', meaning: 'Very delicious' },
      { kind: 'word', text: 'รัก', romanized: 'rahk', meaning: 'love' },
      { kind: 'word', text: 'ข้าว', romanized: 'khao', meaning: 'rice' },
      { kind: 'word', text: 'สวย', romanized: 'suay', meaning: 'beautiful' },
    ],
  },
  {
    code: 'ar-XA', sttLang: 'ar-SA', label: 'Arabic', flag: '🇸🇦',
    items: [
      { kind: 'phrase', text: 'مرحباً!', romanized: 'mar-HAH-bahn', meaning: 'Hello!' },
      { kind: 'phrase', text: 'شكراً', romanized: 'SHOOK-rahn', meaning: 'Thank you' },
      { kind: 'phrase', text: 'كيف حالك؟', romanized: 'kayf HAH-lahk', meaning: 'How are you?' },
      { kind: 'word', text: 'حب', romanized: 'hoob', meaning: 'love' },
      { kind: 'word', text: 'قهوة', romanized: 'QAH-wah', meaning: 'coffee' },
      { kind: 'word', text: 'جميل', romanized: 'jah-MEEL', meaning: 'beautiful' },
    ],
  },
];
