'use client';

// Muntuz landing page (client part) — language-exchange redesign port.
// Ported from the approved main-page design prototype (artifact
// `muntuz-mein-peiji-sian`, latest state): language-first hero with a 94
// language picker -> MUNTUZ group spotlight -> Find your partner (5 AI
// friends, real voice clips) -> How it works -> Features -> People Rooms
// (waitlist) -> final CTA -> footer. "Start chatting" opens a partner
// selection modal instead of scrolling to the intro section.
//
// Whole-page language switching in 12 languages (Native language button).
// Friend profile content is English, and Korean when lang is ko (as in the
// prototype). Photos use the locked official faces; the hero strip and the
// group photos reuse the avatar crops. Voice: each friend has a fixed TTS
// voice; the detail Listen button plays their opening line. The waveform
// animates while audio is playing. The group section plays the debut single
// "Say Hi" (Pro v2 MP3, /muntuz/say-hi.mp3) in-page.
//
// Only features that actually work are shown: 50 AI partners, voice-only
// calls, natural-expression corrections, gallery photos in chat, any
// language, free. People Rooms are NOT open yet — the waitlist section is
// their invite list. No video calls, no people chat, no group rooms.
//
// Waitlist storage: client-side Firestore write (same pattern as the
// Exchange waitlist in PR #151). Until the `muntuz_waitlist` console rules
// are published, the write fails with permission-denied — that is expected,
// and the form falls back to a "waitlist opens soon" message instead of
// claiming the signup succeeded. Rules snippet:
//   firestore-snippets/muntuz-waitlist.rules.txt
import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

type Lang = 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'it' | 'vi' | 'hi' | 'ar';

const LANGS: [Lang, string][] = [["en", "English"], ["ko", "한국어"], ["ja", "日本語"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"], ["pt", "Português"], ["zh", "中文"], ["it", "Italiano"], ["vi", "Tiếng Việt"], ["hi", "हिन्दी"], ["ar", "العربية"]];
const EXTRA_LANGS: { code: string; name: string }[] = [
  { code: "ru", name: "Русский" },
  { code: "uk", name: "Українська" },
  { code: "pl", name: "Polski" },
  { code: "nl", name: "Nederlands" },
  { code: "sv", name: "Svenska" },
  { code: "nb", name: "Norsk" },
  { code: "da", name: "Dansk" },
  { code: "fi", name: "Suomi" },
  { code: "el", name: "Ελληνικά" },
  { code: "cs", name: "Čeština" },
  { code: "sk", name: "Slovenčina" },
  { code: "hu", name: "Magyar" },
  { code: "ro", name: "Română" },
  { code: "bg", name: "Български" },
  { code: "hr", name: "Hrvatski" },
  { code: "sr", name: "Српски" },
  { code: "sl", name: "Slovenščina" },
  { code: "lt", name: "Lietuvių" },
  { code: "lv", name: "Latviešu" },
  { code: "et", name: "Eesti" },
  { code: "tr", name: "Türkçe" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "th", name: "ไทย" },
  { code: "tl", name: "Filipino" },
  { code: "he", name: "עברית" },
  { code: "fa", name: "فارسی" },
  { code: "ur", name: "اردو" },
  { code: "bn", name: "বাংলা" },
  { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
  { code: "mr", name: "मराठी" },
  { code: "gu", name: "ગુજરાતી" },
  { code: "kn", name: "ಕನ್ನಡ" },
  { code: "ml", name: "മലയാളം" },
  { code: "pa", name: "ਪੰਜਾਬੀ" },
  { code: "sw", name: "Kiswahili" },
  { code: "am", name: "አማርኛ" },
  { code: "yo", name: "Yorùbá" },
  { code: "ig", name: "Igbo" },
  { code: "ha", name: "Hausa" },
  { code: "zu", name: "isiZulu" },
  { code: "xh", name: "isiXhosa" },
  { code: "af", name: "Afrikaans" },
  { code: "ga", name: "Gaeilge" },
  { code: "cy", name: "Cymraeg" },
  { code: "eu", name: "Euskara" },
  { code: "ca", name: "Català" },
  { code: "gl", name: "Galego" },
  { code: "is", name: "Íslenska" },
  { code: "mt", name: "Malti" },
  { code: "sq", name: "Shqip" },
  { code: "mk", name: "Македонски" },
  { code: "bs", name: "Bosanski" },
  { code: "be", name: "Беларуская" },
  { code: "ka", name: "ქართული" },
  { code: "hy", name: "Հայերեն" },
  { code: "az", name: "Azərbaycan" },
  { code: "kk", name: "Қазақша" },
  { code: "uz", name: "O'zbek" },
  { code: "ky", name: "Кыргызча" },
  { code: "tg", name: "Тоҷикӣ" },
  { code: "mn", name: "Монгол" },
  { code: "my", name: "မြန်မာ" },
  { code: "km", name: "ខ្មែរ" },
  { code: "lo", name: "ລາວ" },
  { code: "ne", name: "नेपाली" },
  { code: "si", name: "සිංහල" },
  { code: "ps", name: "پښتو" },
  { code: "ku", name: "Kurdî" },
  { code: "eo", name: "Esperanto" },
  { code: "ht", name: "Kreyòl" },
  { code: "ny", name: "Chichewa" },
  { code: "st", name: "Sesotho" },
  { code: "sn", name: "chiShona" },
  { code: "so", name: "Soomaali" },
  { code: "mg", name: "Malagasy" },
  { code: "haw", name: "ʻŌlelo Hawaiʻi" },
  { code: "mi", name: "Te Reo Māori" },
  { code: "jv", name: "Basa Jawa" },
  { code: "su", name: "Basa Sunda" },
  { code: "ceb", name: "Bisaya" },
];
// Practice-language codes are display identifiers (94 languages), not the
// 12 UI-translation languages (Lang), so the list is typed with string codes.
const PRACTICE_LANGS = LANGS.map(([code, name]): { code: string; name: string } => ({ code, name })).concat(EXTRA_LANGS);

// 65 UI strings x 12 languages, ported from the approved design prototype
// (I18N + GROUP_EXTRA role/song keys + PICK_EXTRA modal keys), plus the
// auth keys (loginBtn/logoutBtn/native) kept from the previous landing.
const DICT: Record<Lang, Record<string, string>> = {
  "en": {
    "navHow": "How it works",
    "navPartners": "Partners",
    "navRooms": "People Rooms",
    "navPricing": "Pricing",
    "loginBtn": "Log in",
    "logoutBtn": "Log out",
    "native": "Native language",
    "badge": "AI language exchange",
    "heroTitleHtml": "Practice any language with <em>AI friends</em> who feel real.",
    "heroSub": "Chat or talk with five AI friends who remember your life, cheer you on, and fix your sentences the way a real partner would — gently, in one line.",
    "pickerLabel": "I want to practice",
    "cta": "Start chatting free",
    "note": "Free to start · No sign-up for your first chat",
    "practiceMore": "More languages",
    "practiceLess": "Show less",
    "langsNote": "94 languages supported in total",
    "groupBadge": "Also on stage",
    "groupTitle": "The same five friends, as MUNTUZ",
    "groupDesc": "Emily, Jiyoung, Chloe, Sofia and Amara also live together as a five-member girl group, MUNTUZ. Their debut single \"Say Hi\" turns the chorus hook — 말해봐, 너의 언어로 (\"Say it, in your language\") — into your first lesson.",
    "groupCta": "Meet MUNTUZ",
    "groupWatch": "Watch the \"Say Hi\" MV",
    "groupPlay": "Play \"Say Hi\"",
    "groupPause": "Pause \"Say Hi\"",
    "roleJiyoung": "Leader",
    "roleEmily": "Main vocal",
    "roleChloe": "Rapper · Lyricist",
    "roleSofia": "Main dancer",
    "roleAmara": "Sub-vocal",
    "partnersTitle": "Find your partner",
    "partnersSub": "Five friends, five personalities — all of them speak every language. Tap a card to see her profile.",
    "multi": "Multilingual · speaks every language",
    "personality": "Personality",
    "hobbies": "Hobbies",
    "places": "Often at",
    "listen": "Listen to her voice",
    "howTitle": "How it works",
    "step1t": "Pick a partner",
    "step1d": "Choose a friend and a language — switch anytime, mid-conversation if you like.",
    "step2t": "Chat or call",
    "step2d": "Text or talk out loud about your real day: work, trips, the little stuff.",
    "step3t": "Get corrected naturally",
    "step3d": "One gentle fix at a time, right inside the chat — never a red-pen lecture.",
    "featTitle": "Made to feel like a friend",
    "feat1t": "Voice calls",
    "feat1d": "Hear tone, pace, breath and laughter — practice speaking, not just typing.",
    "feat2t": "One-line corrections",
    "feat2d": "The smallest fix that makes you sound natural, offered like a friend would.",
    "feat3t": "Memory callbacks",
    "feat3d": "They remember your exam, your trip, your cat — and ask about them first.",
    "roomsBadge": "Coming soon",
    "roomsTitle": "People Rooms",
    "roomsDesc": "Real people, matched by native language, learning language and level — the way language exchange should work. Join the waitlist and we'll save you a seat.",
    "emailPh": "Your email address",
    "join": "Join the waitlist",
    "joined": "You're on the list — see you in the Rooms.",
    "ctaTitle": "Your first conversation is one tap away.",
    "ctaSub": "Pick a language, pick a friend, say hi.",
    "footerTag": "Practice any language with AI friends who feel real.",
    "rights": "© 2026 Muntuz",
    "pickTitle": "Choose your AI partner",
    "pickSub": "Tap a friend to start chatting — free, no sign-up needed.",
    "pickMore": "45 more AI friends",
    "pickMoreSub": "50 AI friends in total",
    "pickSoon": "The other 45 friends are on their way — start with the five house friends today.",
    "pickClose": "Close",
  },
  "ko": {
    "navHow": "이용 방법",
    "navPartners": "파트너",
    "navRooms": "피플 룸",
    "navPricing": "요금제",
    "loginBtn": "로그인",
    "logoutBtn": "로그아웃",
    "native": "모국어",
    "badge": "AI 언어교환",
    "heroTitleHtml": "진짜 친구 같은 <em>AI 친구</em>와, 어떤 언어든 연습하세요.",
    "heroSub": "당신의 일상을 기억하고, 응원하고, 문장은 진짜 파트너처럼 한 줄로 살짝 고쳐주는 다섯 명의 AI 친구와 채팅하거나 통화하세요.",
    "pickerLabel": "연습하고 싶은 언어",
    "cta": "무료로 채팅 시작하기",
    "note": "무료로 시작 · 첫 채팅은 가입 없이",
    "practiceMore": "언어 더 보기",
    "practiceLess": "접기",
    "langsNote": "총 94개 언어 지원",
    "groupBadge": "무대 위의 그녀들",
    "groupTitle": "다섯 친구가 모이면, 걸그룹 MUNTUZ",
    "groupDesc": "에밀리, 지영, 클로에, 소피아, 아마라 — 다섯 AI 파트너가 함께 사는 걸그룹 MUNTUZ로도 활동해요. 데뷔곡 \"Say Hi\"의 후렴 훅 \"말해봐, 너의 언어로\"가 곧 여러분의 첫 번째 레슨이에요.",
    "groupCta": "MUNTUZ 만나러 가기",
    "groupWatch": "\"Say Hi\" MV 보기",
    "groupPlay": "\"Say Hi\" 재생",
    "groupPause": "\"Say Hi\" 일시정지",
    "roleJiyoung": "리더",
    "roleEmily": "메인보컬",
    "roleChloe": "래퍼 · 작사가",
    "roleSofia": "메인댄서",
    "roleAmara": "서브보컬",
    "partnersTitle": "내 파트너 찾기",
    "partnersSub": "다섯 친구, 다섯 가지 성격 — 모두 모든 언어를 해요. 카드를 눌러 프로필을 확인하세요.",
    "multi": "다국어 가능 · 모든 언어로 대화해요",
    "personality": "성격",
    "hobbies": "취미",
    "places": "자주 가는 곳",
    "listen": "목소리 듣기",
    "howTitle": "이렇게 이용해요",
    "step1t": "파트너 고르기",
    "step1d": "친구와 언어를 고르세요 — 대화 중간에도 언제든 바꿀 수 있어요.",
    "step2t": "채팅 또는 통화",
    "step2d": "일, 여행, 소소한 일상까지 — 진짜 당신의 하루를 말로 나눠요.",
    "step3t": "자연스럽게 교정받기",
    "step3d": "빨간 펜 잔소리가 아니라, 대화 속에 한 번에 하나씩 살짝.",
    "featTitle": "친구처럼 느껴지게 만들었어요",
    "feat1t": "음성 통화",
    "feat1d": "말투와 속도, 숨소리와 웃음까지 — 타이핑이 아니라 말하기 연습을.",
    "feat2t": "한 줄 교정",
    "feat2d": "친구가 알려주듯, 자연스럽게 들리게 하는 가장 작은 교정.",
    "feat3t": "기억 콜백",
    "feat3d": "시험, 여행, 고양이까지 기억하고 먼저 물어봐요.",
    "roomsBadge": "출시 예정",
    "roomsTitle": "피플 룸 (People Rooms)",
    "roomsDesc": "모국어, 배우는 언어, 레벨로 매칭되는 진짜 사람들 — 언어교환이 원래 이래야죠. 대기 명단에 등록하면 자리를 맡아둘게요.",
    "emailPh": "이메일 주소",
    "join": "대기 명단 등록",
    "joined": "등록됐어요 — 룸에서 만나요.",
    "ctaTitle": "첫 대화는 한 번의 탭이면 돼요.",
    "ctaSub": "언어를 고르고, 친구를 고르고, 인사해 보세요.",
    "footerTag": "진짜 친구 같은 AI 친구와, 어떤 언어든 연습하세요.",
    "rights": "© 2026 Muntuz",
    "pickTitle": "AI 파트너 선택하기",
    "pickSub": "친구를 고르면 바로 채팅을 시작할 수 있어요 — 무료, 가입 없이.",
    "pickMore": "AI 친구 45명 더",
    "pickMoreSub": "총 50명의 AI 친구",
    "pickSoon": "다른 45명의 친구는 준비 중이에요 — 오늘은 다섯 명의 하우스 친구부터 시작해 보세요.",
    "pickClose": "닫기",
  },
  "ja": {
    "navHow": "使い方",
    "navPartners": "パートナー",
    "navRooms": "People Rooms",
    "navPricing": "料金",
    "loginBtn": "ログイン",
    "logoutBtn": "ログアウト",
    "native": "母国語",
    "badge": "AI言語交換",
    "heroTitleHtml": "本物の友達みたいな<em>AIフレンド</em>と、どの言語でも練習しよう。",
    "heroSub": "あなたの日常を覚えて、応援して、文章は本当のパートナーみたいに一行でそっと直してくれる、5人のAIフレンドとチャットや通話ができます。",
    "pickerLabel": "練習したい言語",
    "cta": "無料でチャットを始める",
    "note": "無料でスタート · 最初のチャットは登録不要",
    "practiceMore": "もっと見る",
    "practiceLess": "閉じる",
    "langsNote": "全94言語に対応",
    "groupBadge": "ステージでも",
    "groupTitle": "5人が集まれば、ガールズグループ MUNTUZ",
    "groupDesc": "Emily、Jiyoung、Chloe、Sofia、Amaraの5人は、ガールズグループ MUNTUZとしても活動中。デビュー曲「Say Hi」のフック「말해봐, 너의 언어로（言ってみて、あなたの言語で）」が最初のレッスンになります。",
    "groupCta": "MUNTUZに会いに行く",
    "groupWatch": "「Say Hi」MVを見る",
    "groupPlay": "「Say Hi」を再生",
    "groupPause": "「Say Hi」を一時停止",
    "roleJiyoung": "リーダー",
    "roleEmily": "メインボーカル",
    "roleChloe": "ラッパー・作詞",
    "roleSofia": "メインダンサー",
    "roleAmara": "サブボーカル",
    "partnersTitle": "パートナーを見つけよう",
    "partnersSub": "5人の友達、5つの個性 — 全員がすべての言語を話します。カードをタップしてプロフィールを見てみましょう。",
    "multi": "多言語対応 · すべての言語が話せます",
    "personality": "性格",
    "hobbies": "趣味",
    "places": "よくいる場所",
    "listen": "声を聞く",
    "howTitle": "使い方",
    "step1t": "パートナーを選ぶ",
    "step1d": "友達と言語を選んでください — 会話の途中でもいつでも変更できます。",
    "step2t": "チャットか通話",
    "step2d": "仕事、旅行、小さな日常まで、本当の一日を話しましょう。",
    "step3t": "自然に直してもらう",
    "step3d": "赤ペンの説教ではなく、チャットの中で一度に一つ、そっと。",
    "featTitle": "友達みたいに感じる理由",
    "feat1t": "音声通話",
    "feat1d": "声のトーン、速さ、息づかいや笑い声まで — 打つ練習ではなく話す練習を。",
    "feat2t": "一行の修正",
    "feat2d": "友達が教えてくれるように、自然に聞こえる最小の修正。",
    "feat3t": "メモリーコールバック",
    "feat3d": "試験も旅行も猫のことも覚えていて、先に聞いてくれます。",
    "roomsBadge": "近日公開",
    "roomsTitle": "People Rooms",
    "roomsDesc": "母語、学ぶ言語、レベルでマッチする本物の人々 — 言語交換はこうあるべき。ウェイトリストに登録して席を確保しましょう。",
    "emailPh": "メールアドレス",
    "join": "ウェイトリストに登録",
    "joined": "登録しました — Roomsで会いましょう。",
    "ctaTitle": "最初の会話はワンタップ。",
    "ctaSub": "言語を選んで、友達を選んで、挨拶しよう。",
    "footerTag": "本物の友達みたいなAIフレンドと、どの言語でも練習しよう。",
    "rights": "© 2026 Muntuz",
    "pickTitle": "AIパートナーを選ぶ",
    "pickSub": "友達を選ぶとすぐチャットを始められます — 無料、登録不要。",
    "pickMore": "AIフレンド あと45人",
    "pickMoreSub": "AIフレンドは全50人",
    "pickSoon": "他の45人は準備中です — まずはハウスの5人から始めましょう。",
    "pickClose": "閉じる",
  },
  "es": {
    "navHow": "Cómo funciona",
    "navPartners": "Compañeros",
    "navRooms": "People Rooms",
    "navPricing": "Precios",
    "loginBtn": "Iniciar sesión",
    "logoutBtn": "Cerrar sesión",
    "native": "Idioma nativo",
    "badge": "Intercambio de idiomas con IA",
    "heroTitleHtml": "Practica cualquier idioma con <em>amigos de IA</em> que se sienten reales.",
    "heroSub": "Chatea o habla con cinco amigos de IA que recuerdan tu vida, te animan y corrigen tus frases como lo haría un compañero real: con suavidad, en una línea.",
    "pickerLabel": "Quiero practicar",
    "cta": "Empezar a chatear gratis",
    "note": "Gratis para empezar · Sin registro en tu primer chat",
    "practiceMore": "Más idiomas",
    "practiceLess": "Ver menos",
    "langsNote": "94 idiomas en total",
    "groupBadge": "También en el escenario",
    "groupTitle": "Las mismas cinco amigas, como MUNTUZ",
    "groupDesc": "Emily, Jiyoung, Chloe, Sofia y Amara también forman el grupo femenino MUNTUZ. El gancho de su sencillo debut \"Say Hi\" — 말해봐, 너의 언어로 («Dilo, en tu idioma») — es tu primera lección.",
    "groupCta": "Conocer a MUNTUZ",
    "groupWatch": "Ver el MV de \"Say Hi\"",
    "groupPlay": "Escuchar \"Say Hi\"",
    "groupPause": "Pausar \"Say Hi\"",
    "roleJiyoung": "Líder",
    "roleEmily": "Voz principal",
    "roleChloe": "Rapera · Letrista",
    "roleSofia": "Bailarina principal",
    "roleAmara": "Voz secundaria",
    "partnersTitle": "Encuentra a tu compañero",
    "partnersSub": "Cinco amigos, cinco personalidades — todos hablan todos los idiomas. Toca una tarjeta para ver su perfil.",
    "multi": "Multilingüe · habla todos los idiomas",
    "personality": "Personalidad",
    "hobbies": "Aficiones",
    "places": "Suele estar en",
    "listen": "Escuchar su voz",
    "howTitle": "Cómo funciona",
    "step1t": "Elige un compañero",
    "step1d": "Elige un amigo y un idioma — cámbialos cuando quieras, incluso a mitad de conversación.",
    "step2t": "Chatea o llama",
    "step2d": "Escribe o habla de tu día real: el trabajo, los viajes, las pequeñas cosas.",
    "step3t": "Correcciones naturales",
    "step3d": "Una corrección suave a la vez, dentro del chat — nunca una lección con bolígrafo rojo.",
    "featTitle": "Hecho para sentirse como un amigo",
    "feat1t": "Llamadas de voz",
    "feat1d": "Escucha el tono, el ritmo, la respiración y la risa — practica hablar, no solo escribir.",
    "feat2t": "Correcciones en una línea",
    "feat2d": "El arreglo más pequeño para sonar natural, ofrecido como lo haría un amigo.",
    "feat3t": "Recuerdos que vuelven",
    "feat3d": "Recuerdan tu examen, tu viaje y tu gato — y preguntan por ellos primero.",
    "roomsBadge": "Muy pronto",
    "roomsTitle": "People Rooms",
    "roomsDesc": "Personas reales, emparejadas por idioma nativo, idioma que aprendes y nivel — como debería ser el intercambio. Únete a la lista de espera y te guardamos un sitio.",
    "emailPh": "Tu correo electrónico",
    "join": "Unirme a la lista de espera",
    "joined": "Ya estás en la lista — nos vemos en los Rooms.",
    "ctaTitle": "Tu primera conversación está a un toque.",
    "ctaSub": "Elige un idioma, elige un amigo, di hola.",
    "footerTag": "Practica cualquier idioma con amigos de IA que se sienten reales.",
    "rights": "© 2026 Muntuz",
    "pickTitle": "Elige tu compañero de IA",
    "pickSub": "Toca un amigo para empezar a chatear — gratis, sin registro.",
    "pickMore": "45 amigos de IA más",
    "pickMoreSub": "50 amigos de IA en total",
    "pickSoon": "Los otros 45 amigos están en camino — empieza hoy con los cinco de la casa.",
    "pickClose": "Cerrar",
  },
  "fr": {
    "navHow": "Comment ça marche",
    "navPartners": "Partenaires",
    "navRooms": "People Rooms",
    "navPricing": "Tarifs",
    "loginBtn": "Se connecter",
    "logoutBtn": "Se déconnecter",
    "native": "Langue maternelle",
    "badge": "Échange linguistique IA",
    "heroTitleHtml": "Pratiquez n'importe quelle langue avec des <em>amis IA</em> qui semblent réels.",
    "heroSub": "Discutez ou parlez avec cinq amis IA qui se souviennent de votre vie, vous encouragent et corrigent vos phrases comme un vrai partenaire — en douceur, en une ligne.",
    "pickerLabel": "Je veux pratiquer",
    "cta": "Commencer à discuter gratuitement",
    "note": "Gratuit · Pas d'inscription pour le premier chat",
    "practiceMore": "Plus de langues",
    "practiceLess": "Réduire",
    "langsNote": "94 langues au total",
    "groupBadge": "Aussi sur scène",
    "groupTitle": "Les cinq amies, en groupe : MUNTUZ",
    "groupDesc": "Emily, Jiyoung, Chloe, Sofia et Amara forment aussi le girl group MUNTUZ. Le refrain de leur premier single « Say Hi » — 말해봐, 너의 언어로 (« Dis-le, dans ta langue ») — devient votre première leçon.",
    "groupCta": "Découvrir MUNTUZ",
    "groupWatch": "Regarder le clip « Say Hi »",
    "groupPlay": "Écouter « Say Hi »",
    "groupPause": "Pause « Say Hi »",
    "roleJiyoung": "Leader",
    "roleEmily": "Chant principal",
    "roleChloe": "Rappeuse · Parolière",
    "roleSofia": "Danseuse principale",
    "roleAmara": "Chant secondaire",
    "partnersTitle": "Trouvez votre partenaire",
    "partnersSub": "Cinq amis, cinq personnalités — tous parlent toutes les langues. Touchez une carte pour voir son profil.",
    "multi": "Multilingue · parle toutes les langues",
    "personality": "Personnalité",
    "hobbies": "Centres d'intérêt",
    "places": "Souvent à",
    "listen": "Écouter sa voix",
    "howTitle": "Comment ça marche",
    "step1t": "Choisissez un partenaire",
    "step1d": "Choisissez un ami et une langue — changez à tout moment, même en pleine conversation.",
    "step2t": "Discutez ou appelez",
    "step2d": "Écrivez ou parlez de votre vraie journée : le travail, les voyages, les petites choses.",
    "step3t": "Corrigé en douceur",
    "step3d": "Une correction douce à la fois, dans le chat — jamais un cours au stylo rouge.",
    "featTitle": "Pensé pour ressembler à un ami",
    "feat1t": "Appels vocaux",
    "feat1d": "Le ton, le rythme, le souffle et les rires — entraînez-vous à parler, pas seulement à écrire.",
    "feat2t": "Corrections en une ligne",
    "feat2d": "La plus petite correction pour sonner naturel, comme le ferait un ami.",
    "feat3t": "Souvenirs rappelés",
    "feat3d": "Ils se souviennent de votre examen, de votre voyage, de votre chat — et en parlent en premier.",
    "roomsBadge": "Bientôt",
    "roomsTitle": "People Rooms",
    "roomsDesc": "De vraies personnes, assorties par langue maternelle, langue apprise et niveau — comme l'échange devrait être. Rejoignez la liste d'attente.",
    "emailPh": "Votre adresse e-mail",
    "join": "Rejoindre la liste d'attente",
    "joined": "Vous êtes sur la liste — à bientôt dans les Rooms.",
    "ctaTitle": "Votre première conversation est à un toucher.",
    "ctaSub": "Choisissez une langue, un ami, dites bonjour.",
    "footerTag": "Pratiquez n'importe quelle langue avec des amis IA qui semblent réels.",
    "rights": "© 2026 Muntuz",
    "pickTitle": "Choisissez votre partenaire IA",
    "pickSub": "Touchez un ami pour commencer à discuter — gratuit, sans inscription.",
    "pickMore": "45 autres amis IA",
    "pickMoreSub": "50 amis IA au total",
    "pickSoon": "Les 45 autres amis arrivent bientôt — commencez dès aujourd'hui avec les cinq amis de la maison.",
    "pickClose": "Fermer",
  },
  "de": {
    "navHow": "So funktioniert's",
    "navPartners": "Partner",
    "navRooms": "People Rooms",
    "navPricing": "Preise",
    "loginBtn": "Anmelden",
    "logoutBtn": "Abmelden",
    "native": "Muttersprache",
    "badge": "KI-Sprachtausch",
    "heroTitleHtml": "Übe jede Sprache mit <em>KI-Freunden</em>, die sich echt anfühlen.",
    "heroSub": "Chatte oder telefoniere mit fünf KI-Freunden, die sich an dein Leben erinnern, dich anfeuern und deine Sätze korrigieren wie ein echter Partner — sanft, in einer Zeile.",
    "pickerLabel": "Ich möchte üben",
    "cta": "Kostenlos chatten",
    "note": "Kostenlos starten · Kein Konto für den ersten Chat",
    "practiceMore": "Mehr Sprachen",
    "practiceLess": "Weniger anzeigen",
    "langsNote": "Insgesamt 94 Sprachen",
    "groupBadge": "Auch auf der Bühne",
    "groupTitle": "Dieselben fünf Freundinnen — als MUNTUZ",
    "groupDesc": "Emily, Jiyoung, Chloe, Sofia und Amara sind auch die Girlgroup MUNTUZ. Der Hook ihrer Debütsingle „Say Hi\" — 말해봐, 너의 언어로 („Sag es, in deiner Sprache\") — ist deine erste Lektion.",
    "groupCta": "MUNTUZ kennenlernen",
    "groupWatch": "„Say Hi“-MV ansehen",
    "groupPlay": "„Say Hi\" abspielen",
    "groupPause": "„Say Hi\" pausieren",
    "roleJiyoung": "Leader",
    "roleEmily": "Hauptgesang",
    "roleChloe": "Rapperin · Songwriterin",
    "roleSofia": "Haupttänzerin",
    "roleAmara": "Zweitgesang",
    "partnersTitle": "Finde deinen Partner",
    "partnersSub": "Fünf Freunde, fünf Persönlichkeiten — alle sprechen jede Sprache. Tippe auf eine Karte, um ihr Profil zu sehen.",
    "multi": "Mehrsprachig · spricht jede Sprache",
    "personality": "Persönlichkeit",
    "hobbies": "Hobbys",
    "places": "Oft anzutreffen",
    "listen": "Ihre Stimme hören",
    "howTitle": "So funktioniert's",
    "step1t": "Partner wählen",
    "step1d": "Wähle einen Freund und eine Sprache — wechsle jederzeit, auch mitten im Gespräch.",
    "step2t": "Chatten oder anrufen",
    "step2d": "Tippe oder sprich über deinen echten Tag: Arbeit, Reisen, die kleinen Dinge.",
    "step3t": "Natürlich korrigiert werden",
    "step3d": "Eine sanfte Korrektur nach der anderen, direkt im Chat — nie mit Rotstift.",
    "featTitle": "Gebaut, um sich wie ein Freund anzufühlen",
    "feat1t": "Sprachanrufe",
    "feat1d": "Ton, Tempo, Atem und Lachen hören — übe Sprechen, nicht nur Tippen.",
    "feat2t": "Korrekturen in einer Zeile",
    "feat2d": "Die kleinste Korrektur, die dich natürlich klingen lässt — wie von einem Freund.",
    "feat3t": "Erinnerungen, die zurückkommen",
    "feat3d": "Sie erinnern sich an deine Prüfung, deine Reise, deine Katze — und fragen zuerst danach.",
    "roomsBadge": "Bald verfügbar",
    "roomsTitle": "People Rooms",
    "roomsDesc": "Echte Menschen, gematcht nach Muttersprache, Lernsprache und Niveau — so sollte Sprachtausch sein. Trag dich in die Warteliste ein.",
    "emailPh": "Deine E-Mail-Adresse",
    "join": "Auf die Warteliste",
    "joined": "Du bist auf der Liste — bis bald in den Rooms.",
    "ctaTitle": "Dein erstes Gespräch ist einen Tipp entfernt.",
    "ctaSub": "Sprache wählen, Freund wählen, Hallo sagen.",
    "footerTag": "Übe jede Sprache mit KI-Freunden, die sich echt anfühlen.",
    "rights": "© 2026 Muntuz",
    "pickTitle": "Wähle deinen KI-Partner",
    "pickSub": "Tippe auf einen Freund, um sofort zu chatten — kostenlos, ohne Anmeldung.",
    "pickMore": "45 weitere KI-Freunde",
    "pickMoreSub": "Insgesamt 50 KI-Freunde",
    "pickSoon": "Die anderen 45 Freunde sind unterwegs — starte heute mit den fünf Hausfreunden.",
    "pickClose": "Schließen",
  },
  "pt": {
    "navHow": "Como funciona",
    "navPartners": "Parceiros",
    "navRooms": "People Rooms",
    "navPricing": "Preços",
    "loginBtn": "Entrar",
    "logoutBtn": "Sair",
    "native": "Idioma nativo",
    "badge": "Intercâmbio de idiomas com IA",
    "heroTitleHtml": "Pratique qualquer idioma com <em>amigos de IA</em> que parecem reais.",
    "heroSub": "Converse ou ligue para cinco amigos de IA que lembram da sua vida, torcem por você e corrigem suas frases como um parceiro de verdade — com delicadeza, em uma linha.",
    "pickerLabel": "Quero praticar",
    "cta": "Começar a conversar grátis",
    "note": "Grátis para começar · Sem cadastro no primeiro chat",
    "practiceMore": "Mais idiomas",
    "practiceLess": "Ver menos",
    "langsNote": "94 idiomas no total",
    "groupBadge": "Também no palco",
    "groupTitle": "As mesmas cinco amigas, como MUNTUZ",
    "groupDesc": "Emily, Jiyoung, Chloe, Sofia e Amara também formam o grupo feminino MUNTUZ. O refrão do single de estreia \"Say Hi\" — 말해봐, 너의 언어로 (\"Diga, no seu idioma\") — é a sua primeira lição.",
    "groupCta": "Conhecer o MUNTUZ",
    "groupWatch": "Assistir ao MV de \"Say Hi\"",
    "groupPlay": "Ouvir \"Say Hi\"",
    "groupPause": "Pausar \"Say Hi\"",
    "roleJiyoung": "Líder",
    "roleEmily": "Vocal principal",
    "roleChloe": "Rapper · Letrista",
    "roleSofia": "Dançarina principal",
    "roleAmara": "Vocal de apoio",
    "partnersTitle": "Encontre seu parceiro",
    "partnersSub": "Cinco amigos, cinco personalidades — todos falam todos os idiomas. Toque em um cartão para ver o perfil dela.",
    "multi": "Multilíngue · fala todos os idiomas",
    "personality": "Personalidade",
    "hobbies": "Hobbies",
    "places": "Costuma estar em",
    "listen": "Ouvir a voz dela",
    "howTitle": "Como funciona",
    "step1t": "Escolha um parceiro",
    "step1d": "Escolha um amigo e um idioma — troque quando quiser, até no meio da conversa.",
    "step2t": "Converse ou ligue",
    "step2d": "Escreva ou fale do seu dia de verdade: trabalho, viagens, as pequenas coisas.",
    "step3t": "Correções naturais",
    "step3d": "Uma correção gentil por vez, dentro do chat — nunca uma aula de caneta vermelha.",
    "featTitle": "Feito para parecer um amigo",
    "feat1t": "Chamadas de voz",
    "feat1d": "Ouça tom, ritmo, respiração e risadas — pratique falar, não só digitar.",
    "feat2t": "Correções em uma linha",
    "feat2d": "O menor ajuste para soar natural, oferecido como um amigo faria.",
    "feat3t": "Memórias que voltam",
    "feat3d": "Eles lembram da sua prova, da sua viagem e do seu gato — e perguntam primeiro.",
    "roomsBadge": "Em breve",
    "roomsTitle": "People Rooms",
    "roomsDesc": "Pessoas reais, combinadas por idioma nativo, idioma de aprendizado e nível — como o intercâmbio deveria ser. Entre na lista de espera.",
    "emailPh": "Seu e-mail",
    "join": "Entrar na lista de espera",
    "joined": "Você entrou na lista — até logo nos Rooms.",
    "ctaTitle": "Sua primeira conversa está a um toque.",
    "ctaSub": "Escolha um idioma, escolha um amigo, diga olá.",
    "footerTag": "Pratique qualquer idioma com amigos de IA que parecem reais.",
    "rights": "© 2026 Muntuz",
    "pickTitle": "Escolha seu parceiro de IA",
    "pickSub": "Toque em um amigo para começar a conversar — grátis, sem cadastro.",
    "pickMore": "Mais 45 amigos de IA",
    "pickMoreSub": "50 amigos de IA no total",
    "pickSoon": "Os outros 45 amigos estão a caminho — comece hoje com os cinco amigos da casa.",
    "pickClose": "Fechar",
  },
  "zh": {
    "navHow": "如何使用",
    "navPartners": "伙伴",
    "navRooms": "People Rooms",
    "navPricing": "价格",
    "loginBtn": "登录",
    "logoutBtn": "退出",
    "native": "母语",
    "badge": "AI 语言交换",
    "heroTitleHtml": "和像真人一样的 <em>AI 朋友</em>练习任何语言。",
    "heroSub": "与五位 AI 朋友聊天或通话——他们记得你的生活、为你加油，并像真正的语伴一样温柔地用一句话纠正你的句子。",
    "pickerLabel": "我想练习",
    "cta": "免费开始聊天",
    "note": "免费开始 · 第一次聊天无需注册",
    "practiceMore": "更多语言",
    "practiceLess": "收起",
    "langsNote": "共支持 94 种语言",
    "groupBadge": "舞台上的她们",
    "groupTitle": "五位朋友组成的女团 MUNTUZ",
    "groupDesc": "Emily、Jiyoung、Chloe、Sofia 和 Amara 还组成了五人女团 MUNTUZ。出道单曲《Say Hi》的副歌钩子——말해봐, 너의 언어로（\"用你的语言说出来\"）——就是你的第一课。",
    "groupCta": "去认识 MUNTUZ",
    "groupWatch": "观看《Say Hi》MV",
    "groupPlay": "播放《Say Hi》",
    "groupPause": "暂停《Say Hi》",
    "roleJiyoung": "队长",
    "roleEmily": "主唱",
    "roleChloe": "说唱 · 作词",
    "roleSofia": "主舞",
    "roleAmara": "副唱",
    "partnersTitle": "找到你的伙伴",
    "partnersSub": "五位朋友，五种性格——他们都会说所有语言。点开一张卡片查看她的资料。",
    "multi": "多语言 · 会说每一种语言",
    "personality": "性格",
    "hobbies": "爱好",
    "places": "常去的地方",
    "listen": "听她的声音",
    "howTitle": "使用方法",
    "step1t": "选择伙伴",
    "step1d": "选一位朋友和一种语言——随时可以切换，甚至在对话中途。",
    "step2t": "聊天或通话",
    "step2d": "打字或开口聊你真实的一天：工作、旅行、生活小事。",
    "step3t": "自然地被纠正",
    "step3d": "在聊天中一次一个温和的修正——从不用红笔说教。",
    "featTitle": "为像朋友一样的感觉而造",
    "feat1t": "语音通话",
    "feat1d": "听语气、语速、呼吸和笑声——练口语，而不只是打字。",
    "feat2t": "一句话纠正",
    "feat2d": "像朋友一样给出的、让你听起来自然的最小修正。",
    "feat3t": "记忆回访",
    "feat3d": "他们记得你的考试、旅行和你的猫——还会先问起。",
    "roomsBadge": "即将推出",
    "roomsTitle": "People Rooms",
    "roomsDesc": "按母语、学习语言和水平匹配的真人——语言交换本应如此。加入候补名单，我们为你留座。",
    "emailPh": "你的邮箱地址",
    "join": "加入候补名单",
    "joined": "你已在名单上——Rooms 见。",
    "ctaTitle": "第一次对话只需轻点一下。",
    "ctaSub": "选一种语言，选一位朋友，打个招呼。",
    "footerTag": "和像真人一样的 AI 朋友练习任何语言。",
    "rights": "© 2026 Muntuz",
    "pickTitle": "选择你的 AI 伙伴",
    "pickSub": "点选一位朋友即可开始聊天——免费，无需注册。",
    "pickMore": "还有 45 位 AI 朋友",
    "pickMoreSub": "共 50 位 AI 朋友",
    "pickSoon": "其他 45 位朋友即将到来——今天先从五位小屋朋友开始吧。",
    "pickClose": "关闭",
  },
  "it": {
    "navHow": "Come funziona",
    "navPartners": "Partner",
    "navRooms": "People Rooms",
    "navPricing": "Prezzi",
    "loginBtn": "Accedi",
    "logoutBtn": "Esci",
    "native": "Lingua madre",
    "badge": "Scambio linguistico con IA",
    "heroTitleHtml": "Pratica qualsiasi lingua con <em>amici IA</em> che sembrano veri.",
    "heroSub": "Chatta o parla con cinque amici IA che ricordano la tua vita, ti incoraggiano e correggono le tue frasi come farebbe un vero partner — con delicatezza, in una riga.",
    "pickerLabel": "Voglio praticare",
    "cta": "Inizia a chattare gratis",
    "note": "Gratis per iniziare · Nessuna registrazione per la prima chat",
    "practiceMore": "Altre lingue",
    "practiceLess": "Mostra meno",
    "langsNote": "94 lingue in totale",
    "groupBadge": "Anche sul palco",
    "groupTitle": "Le stesse cinque amiche, come MUNTUZ",
    "groupDesc": "Emily, Jiyoung, Chloe, Sofia e Amara formano anche il gruppo femminile MUNTUZ. Il ritornello del singolo di debutto \"Say Hi\" — 말해봐, 너의 언어로 («Dillo, nella tua lingua») — è la tua prima lezione.",
    "groupCta": "Scopri MUNTUZ",
    "groupWatch": "Guarda il video di \"Say Hi\"",
    "groupPlay": "Ascolta \"Say Hi\"",
    "groupPause": "Pausa \"Say Hi\"",
    "roleJiyoung": "Leader",
    "roleEmily": "Voce principale",
    "roleChloe": "Rapper · Autrice",
    "roleSofia": "Ballerina principale",
    "roleAmara": "Voce secondaria",
    "partnersTitle": "Trova il tuo partner",
    "partnersSub": "Cinque amici, cinque personalità — tutti parlano tutte le lingue. Tocca una scheda per vedere il suo profilo.",
    "multi": "Multilingue · parla tutte le lingue",
    "personality": "Personalità",
    "hobbies": "Hobby",
    "places": "Spesso si trova a",
    "listen": "Ascolta la sua voce",
    "howTitle": "Come funziona",
    "step1t": "Scegli un partner",
    "step1d": "Scegli un amico e una lingua — cambia quando vuoi, anche a metà conversazione.",
    "step2t": "Chatta o chiama",
    "step2d": "Scrivi o parla della tua vera giornata: lavoro, viaggi, piccole cose.",
    "step3t": "Correzioni naturali",
    "step3d": "Una correzione gentile alla volta, dentro la chat — mai una lezione con la penna rossa.",
    "featTitle": "Fatto per sembrare un amico",
    "feat1t": "Chiamate vocali",
    "feat1d": "Ascolta tono, ritmo, respiro e risate — allena il parlato, non solo la scrittura.",
    "feat2t": "Correzioni in una riga",
    "feat2d": "La correzione più piccola per suonare naturale, offerta come farebbe un amico.",
    "feat3t": "Ricordi che tornano",
    "feat3d": "Ricordano il tuo esame, il tuo viaggio e il tuo gatto — e lo chiedono per primi.",
    "roomsBadge": "In arrivo",
    "roomsTitle": "People Rooms",
    "roomsDesc": "Persone vere, abbinate per lingua madre, lingua che impari e livello — come dovrebbe essere lo scambio. Iscriviti alla lista d'attesa.",
    "emailPh": "La tua email",
    "join": "Iscriviti alla lista d'attesa",
    "joined": "Sei in lista — a presto nei Rooms.",
    "ctaTitle": "La tua prima conversazione è a un tocco di distanza.",
    "ctaSub": "Scegli una lingua, scegli un amico, di' ciao.",
    "footerTag": "Pratica qualsiasi lingua con amici IA che sembrano veri.",
    "rights": "© 2026 Muntuz",
    "pickTitle": "Scegli il tuo partner IA",
    "pickSub": "Tocca un amico per iniziare a chattare — gratis, senza registrazione.",
    "pickMore": "Altri 45 amici IA",
    "pickMoreSub": "50 amici IA in totale",
    "pickSoon": "Gli altri 45 amici stanno arrivando — inizia oggi con i cinque amici della casa.",
    "pickClose": "Chiudi",
  },
  "vi": {
    "navHow": "Cách hoạt động",
    "navPartners": "Đối tác",
    "navRooms": "People Rooms",
    "navPricing": "Bảng giá",
    "loginBtn": "Đăng nhập",
    "logoutBtn": "Đăng xuất",
    "native": "Ngôn ngữ mẹ đẻ",
    "badge": "Trao đổi ngôn ngữ bằng AI",
    "heroTitleHtml": "Luyện bất kỳ ngôn ngữ nào với <em>bạn AI</em> như thật.",
    "heroSub": "Trò chuyện hoặc gọi điện với năm người bạn AI nhớ cuộc sống của bạn, cổ vũ bạn và sửa câu của bạn như một đối tác thật — nhẹ nhàng, trong một dòng.",
    "pickerLabel": "Tôi muốn luyện",
    "cta": "Bắt đầu trò chuyện miễn phí",
    "note": "Miễn phí bắt đầu · Không cần đăng ký cho lần trò chuyện đầu tiên",
    "practiceMore": "Thêm ngôn ngữ",
    "practiceLess": "Thu gọn",
    "langsNote": "Tổng cộng 94 ngôn ngữ",
    "groupBadge": "Cũng trên sân khấu",
    "groupTitle": "Năm người bạn, trong nhóm nhạc nữ MUNTUZ",
    "groupDesc": "Emily, Jiyoung, Chloe, Sofia và Amara còn là nhóm nhạc nữ MUNTUZ. Câu hook của đĩa đơn ra mắt \"Say Hi\" — 말해봐, 너의 언어로 (\"Hãy nói, bằng ngôn ngữ của bạn\") — chính là bài học đầu tiên của bạn.",
    "groupCta": "Gặp MUNTUZ",
    "groupWatch": "Xem MV \"Say Hi\"",
    "groupPlay": "Nghe \"Say Hi\"",
    "groupPause": "Tạm dừng \"Say Hi\"",
    "roleJiyoung": "Trưởng nhóm",
    "roleEmily": "Giọng ca chính",
    "roleChloe": "Rapper · Viết lời",
    "roleSofia": "Nhảy chính",
    "roleAmara": "Giọng ca phụ",
    "partnersTitle": "Tìm đối tác của bạn",
    "partnersSub": "Năm người bạn, năm cá tính — tất cả đều nói mọi ngôn ngữ. Chạm vào một thẻ để xem hồ sơ của cô ấy.",
    "multi": "Đa ngôn ngữ · nói mọi ngôn ngữ",
    "personality": "Tính cách",
    "hobbies": "Sở thích",
    "places": "Thường ở",
    "listen": "Nghe giọng của cô ấy",
    "howTitle": "Cách hoạt động",
    "step1t": "Chọn một đối tác",
    "step1d": "Chọn một người bạn và một ngôn ngữ — đổi bất cứ lúc nào, kể cả giữa cuộc trò chuyện.",
    "step2t": "Trò chuyện hoặc gọi điện",
    "step2d": "Nhắn tin hoặc nói về ngày thật của bạn: công việc, chuyến đi, những điều nhỏ bé.",
    "step3t": "Được sửa một cách tự nhiên",
    "step3d": "Mỗi lần một sửa nhẹ, ngay trong cuộc trò chuyện — không bao giờ là bài giảng bút đỏ.",
    "featTitle": "Được tạo để giống một người bạn",
    "feat1t": "Cuộc gọi thoại",
    "feat1d": "Nghe giọng điệu, nhịp, hơi thở và tiếng cười — luyện nói, không chỉ gõ phím.",
    "feat2t": "Sửa trong một dòng",
    "feat2d": "Sửa nhỏ nhất để bạn nghe tự nhiên, được đưa ra như một người bạn.",
    "feat3t": "Ký ức được nhắc lại",
    "feat3d": "Họ nhớ kỳ thi, chuyến đi và chú mèo của bạn — và hỏi về chúng trước.",
    "roomsBadge": "Sắp ra mắt",
    "roomsTitle": "People Rooms",
    "roomsDesc": "Người thật, được ghép theo ngôn ngữ mẹ đẻ, ngôn ngữ đang học và trình độ — đúng như trao đổi ngôn ngữ nên có. Tham gia danh sách chờ.",
    "emailPh": "Địa chỉ email của bạn",
    "join": "Tham gia danh sách chờ",
    "joined": "Bạn đã có trong danh sách — hẹn gặp trong Rooms.",
    "ctaTitle": "Cuộc trò chuyện đầu tiên chỉ cách một chạm.",
    "ctaSub": "Chọn một ngôn ngữ, chọn một người bạn, nói xin chào.",
    "footerTag": "Luyện bất kỳ ngôn ngữ nào với những người bạn AI như thật.",
    "rights": "© 2026 Muntuz",
    "pickTitle": "Chọn đối tác AI của bạn",
    "pickSub": "Chạm vào một người bạn để bắt đầu trò chuyện — miễn phí, không cần đăng ký.",
    "pickMore": "Thêm 45 bạn AI",
    "pickMoreSub": "Tổng cộng 50 bạn AI",
    "pickSoon": "45 người bạn còn lại đang trên đường đến — hãy bắt đầu hôm nay với năm người bạn trong nhà.",
    "pickClose": "Đóng",
  },
  "hi": {
    "navHow": "कैसे काम करता है",
    "navPartners": "साथी",
    "navRooms": "People Rooms",
    "navPricing": "कीमतें",
    "loginBtn": "लॉग इन",
    "logoutBtn": "लॉग आउट",
    "native": "मातृभाषा",
    "badge": "AI भाषा विनिमय",
    "heroTitleHtml": "किसी भी भाषा का अभ्यास करें, ऐसे <em>AI दोस्तों</em> के साथ जो असली लगते हैं।",
    "heroSub": "पाँच AI दोस्तों से चैट या बात करें जो आपकी ज़िंदगी याद रखते हैं, आपको प्रोत्साहित करते हैं, और आपके वाक्य एक असली साथी की तरह — नरमी से, एक लाइन में — सुधारते हैं।",
    "pickerLabel": "मैं अभ्यास करना चाहता/चाहती हूँ",
    "cta": "मुफ़्त चैट शुरू करें",
    "note": "शुरू करना मुफ़्त · पहली चैट के लिए साइन-अप नहीं",
    "practiceMore": "और भाषाएँ",
    "practiceLess": "कम देखें",
    "langsNote": "कुल 94 भाषाएँ",
    "groupBadge": "मंच पर भी",
    "groupTitle": "वही पाँच दोस्त, गर्ल ग्रुप MUNTUZ के रूप में",
    "groupDesc": "Emily, Jiyoung, Chloe, Sofia और Amara पाँच सदस्यीय गर्ल ग्रुप MUNTUZ भी हैं। उनके डेब्यू सिंगल \"Say Hi\" का हुक — 말해봐, 너의 언어로 (\"कहो, अपनी भाषा में\") — आपका पहला पाठ है।",
    "groupCta": "MUNTUZ से मिलें",
    "groupWatch": "\"Say Hi\" MV देखें",
    "groupPlay": "\"Say Hi\" सुनें",
    "groupPause": "\"Say Hi\" रोकें",
    "roleJiyoung": "लीडर",
    "roleEmily": "मुख्य गायिका",
    "roleChloe": "रैपर · गीतकार",
    "roleSofia": "मुख्य डांसर",
    "roleAmara": "सह-गायिका",
    "partnersTitle": "अपना साथी खोजें",
    "partnersSub": "पाँच दोस्त, पाँच व्यक्तित्व — सभी हर भाषा बोलते हैं। उसकी प्रोफ़ाइल देखने के लिए कार्ड पर टैप करें।",
    "multi": "बहुभाषी · हर भाषा बोलती है",
    "personality": "व्यक्तित्व",
    "hobbies": "शौक",
    "places": "अक्सर यहाँ मिलती है",
    "listen": "उसकी आवाज़ सुनें",
    "howTitle": "यह कैसे काम करता है",
    "step1t": "साथी चुनें",
    "step1d": "एक दोस्त और एक भाषा चुनें — कभी भी बदलें, बातचीत के बीच में भी।",
    "step2t": "चैट या कॉल करें",
    "step2d": "अपने असली दिन के बारे में लिखें या बोलें: काम, यात्राएँ, छोटी-छोटी बातें।",
    "step3t": "स्वाभाविक सुधार पाएँ",
    "step3d": "चैट के अंदर एक बार में एक नरम सुधार — कभी लाल कलम वाला भाषण नहीं।",
    "featTitle": "दोस्त जैसा महसूस हो, इसलिए बनाया गया",
    "feat1t": "वॉइस कॉल",
    "feat1d": "लहजा, गति, साँस और हँसी सुनें — सिर्फ़ टाइप नहीं, बोलने का अभ्यास करें।",
    "feat2t": "एक लाइन में सुधार",
    "feat2d": "सबसे छोटा सुधार जो आपको स्वाभाविक बनाए, दोस्त की तरह दिया गया।",
    "feat3t": "यादों की वापसी",
    "feat3d": "वे आपकी परीक्षा, यात्रा और आपकी बिल्ली को याद रखते हैं — और पहले खुद पूछते हैं।",
    "roomsBadge": "जल्द आ रहा है",
    "roomsTitle": "People Rooms",
    "roomsDesc": "असली लोग, मातृभाषा, सीखी जा रही भाषा और स्तर के आधार पर मिलाए गए — भाषा विनिमय ऐसा ही होना चाहिए। प्रतीक्षा सूची में शामिल हों।",
    "emailPh": "आपका ईमेल पता",
    "join": "प्रतीक्षा सूची में शामिल हों",
    "joined": "आप सूची में हैं — Rooms में मिलते हैं।",
    "ctaTitle": "आपकी पहली बातचीत बस एक टैप दूर है।",
    "ctaSub": "एक भाषा चुनें, एक दोस्त चुनें, नमस्ते कहें।",
    "footerTag": "किसी भी भाषा का अभ्यास करें, ऐसे AI दोस्तों के साथ जो असली लगते हैं।",
    "rights": "© 2026 Muntuz",
    "pickTitle": "अपना AI साथी चुनें",
    "pickSub": "चैट शुरू करने के लिए किसी दोस्त पर टैप करें — मुफ़्त, बिना साइन-अप।",
    "pickMore": "45 और AI दोस्त",
    "pickMoreSub": "कुल 50 AI दोस्त",
    "pickSoon": "बाकी 45 दोस्त जल्द आ रहे हैं — आज घर के पाँच दोस्तों से शुरुआत करें।",
    "pickClose": "बंद करें",
  },
  "ar": {
    "navHow": "كيف يعمل",
    "navPartners": "الشركاء",
    "navRooms": "غرف الناس",
    "navPricing": "الأسعار",
    "loginBtn": "تسجيل الدخول",
    "logoutBtn": "تسجيل الخروج",
    "native": "اللغة الأم",
    "badge": "تبادل لغات بالذكاء الاصطناعي",
    "heroTitleHtml": "تدرّب على أي لغة مع <em>أصدقاء ذكاء اصطناعي</em> يبدون حقيقيين.",
    "heroSub": "تحدّث أو اتصل بخمسة أصدقاء يتذكرون حياتك ويشجعونك ويصححون جملك كما يفعل الشريك الحقيقي — بلطف، في سطر واحد.",
    "pickerLabel": "أريد أن أتدرّب على",
    "cta": "ابدأ المحادثة مجانًا",
    "note": "مجاني للبدء · لا حاجة للتسجيل في أول محادثة",
    "practiceMore": "المزيد من اللغات",
    "practiceLess": "عرض أقل",
    "langsNote": "94 لغة في المجموع",
    "groupBadge": "على المسرح أيضًا",
    "groupTitle": "الصديقات الخمس أنفسهن، في فرقة MUNTUZ",
    "groupDesc": "إميلي وجيونغ وكلوي وصوفيا وأمارا يشكّلن أيضًا فرقة الفتيات MUNTUZ. عبارة أغنيتهن الأولى \"Say Hi\" — 말해봐, 너의 언어로 («قلها بلغتك») — هي درسك الأول.",
    "groupCta": "تعرّف على MUNTUZ",
    "groupWatch": "شاهد فيديو \"Say Hi\"",
    "groupPlay": "تشغيل \"Say Hi\"",
    "groupPause": "إيقاف \"Say Hi\" مؤقتًا",
    "roleJiyoung": "القائدة",
    "roleEmily": "الغناء الرئيسي",
    "roleChloe": "راب · كلمات",
    "roleSofia": "الرقص الرئيسي",
    "roleAmara": "غناء مساند",
    "partnersTitle": "اعثر على شريكك",
    "partnersSub": "خمسة أصدقاء، خمس شخصيات — وجميعهم يتحدثون كل اللغات. اضغط على بطاقة لعرض ملفها الشخصي.",
    "multi": "متعددة اللغات · تتحدث كل اللغات",
    "personality": "الشخصية",
    "hobbies": "الهوايات",
    "places": "تتواجد غالبًا في",
    "listen": "استمع إلى صوتها",
    "howTitle": "كيف يعمل",
    "step1t": "اختر شريكًا",
    "step1d": "اختر صديقًا ولغة — وبدّل في أي وقت، حتى في منتصف المحادثة.",
    "step2t": "راسل أو اتصل",
    "step2d": "اكتب أو تحدث عن يومك الحقيقي: العمل والرحلات والأشياء الصغيرة.",
    "step3t": "تصحيح طبيعي",
    "step3d": "تصحيح لطيف واحد في كل مرة، داخل المحادثة — دون محاضرات بالقلم الأحمر.",
    "featTitle": "صُنع ليبدو كصديق",
    "feat1t": "مكالمات صوتية",
    "feat1d": "اسمع النبرة والإيقاع والأنفاس والضحك — تدرّب على الكلام لا الكتابة فقط.",
    "feat2t": "تصحيح في سطر واحد",
    "feat2d": "أصغر تصحيح يجعلك تبدو طبيعيًا، يُقدَّم كما يفعل الصديق.",
    "feat3t": "ذكريات تعود",
    "feat3d": "يتذكرون امتحانك ورحلتك وقطك — ويسألون عنها أولًا.",
    "roomsBadge": "قريبًا",
    "roomsTitle": "غرف الناس",
    "roomsDesc": "أشخاص حقيقيون، يتم مطابقتهم حسب اللغة الأم واللغة التي تتعلمها والمستوى — كما ينبغي أن يكون تبادل اللغات. انضم إلى قائمة الانتظار وسنحجز لك مقعدًا.",
    "emailPh": "بريدك الإلكتروني",
    "join": "انضم إلى قائمة الانتظار",
    "joined": "أنت في القائمة — نراك في الغرف.",
    "ctaTitle": "محادثتك الأولى على بُعد نقرة واحدة.",
    "ctaSub": "اختر لغة، اختر صديقًا، وقل مرحبًا.",
    "footerTag": "تدرّب على أي لغة مع أصدقاء ذكاء اصطناعي يبدون حقيقيين.",
    "rights": "© 2026 Muntuz",
    "pickTitle": "اختر شريك الذكاء الاصطناعي",
    "pickSub": "اضغط على صديق لبدء المحادثة — مجانًا، دون تسجيل.",
    "pickMore": "45 صديق ذكاء اصطناعي آخر",
    "pickMoreSub": "50 صديقًا في المجموع",
    "pickSoon": "الأصدقاء الـ45 الآخرون في الطريق — ابدأ اليوم مع أصدقاء المنزل الخمسة.",
    "pickClose": "إغلاق",
  },
};

type FriendContent = {
  id: string;
  name: string;
  img: string;
  avatar: string;
  voice: string;
  alt: string;
  pers: string;
  hobby: string;
  places: string;
};

const FRIENDS_EN: FriendContent[] = [
  {
    "id": "emily",
    "name": "Emily",
    "img": "/muntuz/emily-latte.webp",
    "avatar": "/muntuz-avatars/emily.jpg",
    "voice": "/muntuz/voices/emily.mp3",
    "alt": "Emily holding a latte at a small alley café",
    "pers": "Warm, curious, first to laugh",
    "hobby": "Alley-café hunting, journaling, late-night tea",
    "places": "That tiny alley café · her sunny balcony",
  },
  {
    "id": "jiyoung",
    "name": "Jiyoung",
    "img": "/muntuz/jiyoung-kimbap.webp",
    "avatar": "/muntuz-avatars/jiyoung.jpg",
    "voice": "/muntuz/voices/jiyoung.mp3",
    "alt": "Jiyoung rolling kimbap at her kitchen table",
    "pers": "Bright, encouraging, a little mischievous",
    "hobby": "Kimbap experiments, K-dramas, weekend markets",
    "places": "Her kitchen · the market by the river",
  },
  {
    "id": "chloe",
    "name": "Chloe",
    "img": "/muntuz/chloe-shoot.webp",
    "avatar": "/muntuz-avatars/chloe.jpg",
    "voice": "/muntuz/voices/chloe.mp3",
    "alt": "Chloe smiling outdoors with her braided hair",
    "pers": "Witty, thoughtful, quietly poetic",
    "hobby": "Songwriting, French films, slow coffee",
    "places": "The corner café · old bookshops",
  },
  {
    "id": "sofia",
    "name": "Sofia",
    "img": "/muntuz/sofia-pasta.webp",
    "avatar": "/muntuz-avatars/sofia.jpg",
    "voice": "/muntuz/voices/sofia.mp3",
    "alt": "Sofia laughing while cooking pasta in her kitchen",
    "pers": "Sunny, expressive, feeds everyone",
    "hobby": "Pasta from scratch, salsa nights, farmers' markets",
    "places": "Her kitchen · the dance studio",
  },
  {
    "id": "amara",
    "name": "Amara",
    "img": "/muntuz/amara-sun.webp",
    "avatar": "/muntuz-avatars/amara.jpg",
    "voice": "/muntuz/voices/amara.mp3",
    "alt": "Amara smiling in the morning sun after her run",
    "pers": "Calm, steady, dry sense of humor",
    "hobby": "Sunrise runs, sketching, stargazing",
    "places": "The river path · the hill at dawn",
  },
];

const FRIENDS_KO: FriendContent[] = [
  {
    "id": "emily",
    "name": "Emily",
    "img": "/muntuz/emily-latte.webp",
    "avatar": "/muntuz-avatars/emily.jpg",
    "voice": "/muntuz/voices/emily.mp3",
    "alt": "Emily holding a latte at a small alley café",
    "pers": "따뜻하고 호기심 많고, 제일 먼저 웃는",
    "hobby": "골목 카페 탐방, 일기 쓰기, 늦은 밤의 차",
    "places": "그 작은 골목 카페 · 햇살 드는 베란다",
  },
  {
    "id": "jiyoung",
    "name": "Jiyoung",
    "img": "/muntuz/jiyoung-kimbap.webp",
    "avatar": "/muntuz-avatars/jiyoung.jpg",
    "voice": "/muntuz/voices/jiyoung.mp3",
    "alt": "Jiyoung rolling kimbap at her kitchen table",
    "pers": "밝고 응원을 잘하고, 살짝 장난꾸러기",
    "hobby": "김밥 실험, 드라마, 주말 시장",
    "places": "그녀의 주방 · 강변 시장",
  },
  {
    "id": "chloe",
    "name": "Chloe",
    "img": "/muntuz/chloe-shoot.webp",
    "avatar": "/muntuz-avatars/chloe.jpg",
    "voice": "/muntuz/voices/chloe.mp3",
    "alt": "Chloe smiling outdoors with her braided hair",
    "pers": "재치 있고 사려 깊고, 조용히 시적인",
    "hobby": "작사, 프랑스 영화, 느긋한 커피",
    "places": "모퉁이 카페 · 오래된 서점",
  },
  {
    "id": "sofia",
    "name": "Sofia",
    "img": "/muntuz/sofia-pasta.webp",
    "avatar": "/muntuz-avatars/sofia.jpg",
    "voice": "/muntuz/voices/sofia.mp3",
    "alt": "Sofia laughing while cooking pasta in her kitchen",
    "pers": "햇살 같고 표현이 풍부하고, 모두를 먹이는",
    "hobby": "손수 만드는 파스타, 살사의 밤, 파머스 마켓",
    "places": "그녀의 주방 · 댄스 스튜디오",
  },
  {
    "id": "amara",
    "name": "Amara",
    "img": "/muntuz/amara-sun.webp",
    "avatar": "/muntuz-avatars/amara.jpg",
    "voice": "/muntuz/voices/amara.mp3",
    "alt": "Amara smiling in the morning sun after her run",
    "pers": "차분하고 꾸준하고, 은근한 유머 감각",
    "hobby": "일출 러닝, 스케치, 별 보기",
    "places": "강변 산책로 · 새벽의 언덕",
  },
];

// Hero photo-strip order = left-to-right order in the group photo.
const HERO_ORDER = ['jiyoung', 'amara', 'chloe', 'emily', 'sofia'];

// Group-section photo order (with the member's group role).
const GROUP_ORDER: { id: string; roleKey: string }[] = [
  { id: 'jiyoung', roleKey: 'roleJiyoung' },
  { id: 'emily', roleKey: 'roleEmily' },
  { id: 'chloe', roleKey: 'roleChloe' },
  { id: 'sofia', roleKey: 'roleSofia' },
  { id: 'amara', roleKey: 'roleAmara' },
];

const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: '👋 Our Story', href: '/about' },
  { label: '💬 Help & FAQ', href: '/faq' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund' },
  { label: 'Cookie Policy', href: '/cookies' },
];

type FormStatus = 'idle' | 'loading' | 'done' | 'soon' | 'invalid';

// Waveform bars (prototype heights); the animation runs only while audio plays.
const WAVE_HEIGHTS = [38, 62, 45, 80, 55, 92, 40, 70, 58, 86, 48, 66, 95, 52, 74, 42, 84, 60, 36, 78, 50, 68, 44, 88, 56, 72, 46, 64];

function Waveform({ playing }: { playing: boolean }) {
  return (
    <div className="flex h-[34px] flex-1 items-center gap-[3px]" aria-hidden="true">
      {WAVE_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={playing ? 'wave-bar' : ''}
          style={{
            height: `${h}%`,
            animationDelay: `${i * 0.055}s`,
            flex: 1,
            borderRadius: 3,
            backgroundColor: '#0E7C66',
            display: 'inline-block',
            transformOrigin: 'center',
            opacity: playing ? 0.95 : 0.45,
          }}
        />
      ))}
    </div>
  );
}

const DISPLAY_FONT = "'Bricolage Grotesque','Nunito',sans-serif";
const BODY_FONT = "'Nunito Sans','Nunito',system-ui,-apple-system,'Segoe UI',sans-serif";

export default function MuntuzLandingClient() {
  const { user, loading: authLoading } = useAuth();
  const [lang, setLang] = useState<Lang>('en');
  const [langOpen, setLangOpen] = useState(false);
  const [practice, setPractice] = useState('ko');
  const [langsOpen, setLangsOpen] = useState(false);
  const [friendIdx, setFriendIdx] = useState(0);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [songPlaying, setSongPlaying] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [pickSoon, setPickSoon] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const songAudioRef = useRef<HTMLAudioElement | null>(null);
  const langWrapRef = useRef<HTMLDivElement | null>(null);
  const pickCloseRef = useRef<HTMLButtonElement | null>(null);
  const pickLastFocusRef = useRef<Element | null>(null);

  const t = (key: string) => DICT[lang][key] ?? DICT.en[key] ?? key;
  const friends = lang === 'ko' ? FRIENDS_KO : FRIENDS_EN;
  const friend = friends[friendIdx];
  const friendById = (id: string) => friends.find((f) => f.id === id) ?? friends[0];
  const heroFaces = HERO_ORDER.map((id) => friendById(id));
  const visibleLangs = langsOpen ? PRACTICE_LANGS : PRACTICE_LANGS.slice(0, 12);
  const steps = [
    { n: '1', title: t('step1t'), body: t('step1d') },
    { n: '2', title: t('step2t'), body: t('step2d') },
    { n: '3', title: t('step3t'), body: t('step3d') },
  ];
  const feats = [
    { t: 'feat1t', d: 'feat1d', icon: 'phone' },
    { t: 'feat2t', d: 'feat2d', icon: 'pen' },
    { t: 'feat3t', d: 'feat3d', icon: 'heart' },
  ] as const;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    // The prototype stops the song when the UI language changes.
    songAudioRef.current?.pause();
    setSongPlaying(false);
  }, [lang]);

  // Close the language menu on an outside click (prototype behaviour).
  useEffect(() => {
    if (!langOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (langWrapRef.current && !langWrapRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [langOpen]);

  // Picker modal: Escape closes, body scroll locks, focus returns.
  useEffect(() => {
    if (!pickOpen) return;
    document.body.style.overflow = 'hidden';
    pickCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePick();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [pickOpen]);

  function selectFriend(i: number) {
    voiceAudioRef.current?.pause();
    setVoicePlaying(false);
    setFriendIdx(i);
  }

  function toggleVoice() {
    const a = voiceAudioRef.current;
    if (!a) return;
    if (voicePlaying) {
      a.pause();
    } else {
      songAudioRef.current?.pause();
      setSongPlaying(false);
      void a.play().catch(() => setVoicePlaying(false));
    }
  }

  function toggleSong() {
    const a = songAudioRef.current;
    if (!a) return;
    if (songPlaying) {
      a.pause();
    } else {
      voiceAudioRef.current?.pause();
      setVoicePlaying(false);
      void a.play().catch(() => setSongPlaying(false));
    }
  }

  function openPick() {
    setPickSoon(false);
    pickLastFocusRef.current = document.activeElement;
    setPickOpen(true);
  }

  function closePick() {
    setPickOpen(false);
    if (pickLastFocusRef.current && (pickLastFocusRef.current as HTMLElement).focus) {
      (pickLastFocusRef.current as HTMLElement).focus();
    }
  }

  function pickFriend(id: string) {
    const i = friends.findIndex((f) => f.id === id);
    if (i >= 0) selectFriend(i);
    closePick();
    document.getElementById('detail')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch {
      // Stay signed in; the header keeps showing the account.
    }
  }

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleaned)) {
      setStatus('invalid');
      return;
    }
    setStatus('loading');
    try {
      await addDoc(collection(db, 'muntuz_waitlist'), {
        email: cleaned,
        createdAt: serverTimestamp(),
      });
      setStatus('done');
    } catch {
      // Rules not published yet (permission-denied) or offline: do not
      // claim success — show the coming-soon fallback instead.
      setStatus('soon');
    }
  }

  return (
    <main className="min-h-screen bg-[#FBF5EA] text-[#1E2A25]" style={{ fontFamily: BODY_FONT }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Nunito+Sans:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />
      <style>{`@keyframes eq { from { transform: scaleY(0.35); } to { transform: scaleY(1); } } .wave-bar { animation: eq 0.9s ease-in-out infinite alternate; } @media (prefers-reduced-motion: reduce) { .wave-bar { animation: none; } html { scroll-behavior: auto; } } .hero-title em { font-style: normal; color: #0E7C66; box-shadow: inset 0 -0.32em 0 #FFC53D; padding: 0 0.04em; }`}</style>

      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-[#E7DCC8] bg-[#FBF5EA]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-[18px] px-5">
          <a href="#top" className="text-2xl font-extrabold tracking-[0.04em]" style={{ fontFamily: DISPLAY_FONT }}>
            MUNTUZ<span className="text-[#0E7C66]">.</span>
          </a>
          <nav className="ms-2 hidden gap-1 min-[860px]:flex" aria-label="Main">
            <a href="#how" className="rounded-full px-3 py-2.5 text-[15.5px] font-bold text-[#5D6C63] hover:bg-[#FFF9EF] hover:text-[#1E2A25]">
              {t('navHow')}
            </a>
            <a href="#partners" className="rounded-full px-3 py-2.5 text-[15.5px] font-bold text-[#5D6C63] hover:bg-[#FFF9EF] hover:text-[#1E2A25]">
              {t('navPartners')}
            </a>
            <a href="/muntuz/group" className="rounded-full px-3 py-2.5 text-[15.5px] font-bold text-[#5D6C63] hover:bg-[#FFF9EF] hover:text-[#1E2A25]">
              MUNTUZ
            </a>
            <a href="#rooms" className="rounded-full px-3 py-2.5 text-[15.5px] font-bold text-[#5D6C63] hover:bg-[#FFF9EF] hover:text-[#1E2A25]">
              {t('navRooms')}
            </a>
            <a href="/pricing" className="rounded-full px-3 py-2.5 text-[15.5px] font-bold text-[#5D6C63] hover:bg-[#FFF9EF] hover:text-[#1E2A25]">
              {t('navPricing')}
            </a>
          </nav>
          <div className="ms-auto flex items-center gap-2.5">
            <div className="relative" ref={langWrapRef}>
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-extrabold ring-1 ring-[#E7DCC8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                <span>{LANGS.find(([c]) => c === lang)?.[1] ?? 'English'}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {langOpen && (
                <div className="absolute end-0 top-[calc(100%+8px)] grid w-[320px] max-w-[calc(100vw-32px)] grid-cols-2 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-[#E7DCC8]" role="listbox" aria-label="Language">
                  <p className="col-span-2 border-b border-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                    {t('native')}
                  </p>
                  {LANGS.map(([code, label]) => (
                    <button
                      key={code}
                      type="button"
                      role="option"
                      aria-selected={code === lang}
                      onClick={() => {
                        setLang(code);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-[15px] font-bold hover:bg-[#FFF9EF] ${
                        code === lang ? 'text-[#0E7C66]' : 'text-[#1E2A25]'
                      }`}
                    >
                      <span>{label}</span>
                      {code === lang ? <span aria-hidden="true">✓</span> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!authLoading && !user && (
              <a
                href="/login?next=/exchange"
                className="inline-flex items-center rounded-full bg-[#1E2A25] px-5 py-2.5 text-[15px] font-extrabold text-[#FBF5EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
              >
                {t('loginBtn')}
              </a>
            )}
            {!authLoading && user && (
              <span className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm font-bold text-[#1E2A25]">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                  <span className="max-w-[90px] truncate">
                    {user.displayName || user.email?.split('@')[0] || 'Learner'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full bg-white px-3 py-2 text-sm font-bold text-[#5D6C63] ring-1 ring-[#E7DCC8] hover:bg-[#FFF9EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
                >
                  {t('logoutBtn')}
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div id="top" className="overflow-hidden pt-14">
        <div className="mx-auto max-w-[1180px] px-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13.5px] font-extrabold tracking-[0.02em] text-[#0A5C4B] ring-1 ring-[#E7DCC8]">
            <i className="inline-block h-2 w-2 rounded-full bg-[#0E7C66]" aria-hidden="true" />
            {t('badge')}
          </span>
          <h1
            className="hero-title mt-5 max-w-[780px] text-[clamp(38px,5.6vw,62px)] font-extrabold leading-[1.08] tracking-[-0.015em]"
            style={{ fontFamily: DISPLAY_FONT }}
            dangerouslySetInnerHTML={{ __html: t('heroTitleHtml') }}
          />
          <p className="mt-4 max-w-[520px] text-[19px] text-[#5D6C63]">{t('heroSub')}</p>
          <p className="mt-[26px] text-sm font-extrabold uppercase tracking-[0.06em] text-[#5D6C63]">
            {t('pickerLabel')}
          </p>
          <div className="mt-2.5 flex max-w-[540px] flex-wrap gap-2" role="group" aria-label={t('pickerLabel')}>
            {visibleLangs.map((l) => (
              <button
                key={l.code}
                type="button"
                aria-pressed={practice === l.code}
                onClick={() => setPractice(l.code)}
                className={`min-h-[2.5rem] rounded-full border-[1.5px] px-4 py-2 text-[15px] font-bold ${
                  practice === l.code
                    ? 'border-[#0E7C66] bg-[#0E7C66] text-white'
                    : 'border-[#E7DCC8] bg-white text-[#1E2A25] hover:border-[#0E7C66]'
                }`}
              >
                {l.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLangsOpen((v) => !v)}
              aria-expanded={langsOpen}
              className="min-h-[2.5rem] rounded-full border-[1.5px] border-dashed border-[#E7DCC8] bg-[#FFF9EF] px-4 py-2 text-[15px] font-extrabold text-[#0A5C4B]"
            >
              {langsOpen ? t('practiceLess') : `${t('practiceMore')} · ${PRACTICE_LANGS.length}`}
            </button>
          </div>
          <p className="mt-3 text-sm font-bold text-[#5D6C63]">{t('langsNote')}</p>
          <div className="mt-[30px] flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={openPick}
              className="rounded-full bg-[#FF6A4D] px-[30px] py-[15px] text-[17.5px] font-extrabold text-white shadow-lg hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
            >
              {t('cta')}
            </button>
            <span className="text-sm font-semibold text-[#5D6C63]">{t('note')}</span>
          </div>
        </div>
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="mt-11 grid grid-cols-5 gap-1.5 sm:gap-2.5" aria-label="The five friends">
            {heroFaces.map((f) => (
              <figure key={f.id} className="relative m-0 overflow-hidden rounded-[18px] shadow-lg">
                <img
                  src={f.avatar}
                  alt={f.name}
                  className="h-[130px] w-full object-cover object-[center_22%] sm:h-[250px]"
                />
                <figcaption className="absolute bottom-1.5 start-1.5 rounded-full bg-black/70 px-2 py-1 text-[11px] font-extrabold text-[#FFF6E6] backdrop-blur-sm sm:bottom-2.5 sm:start-2.5 sm:px-3 sm:py-1 sm:text-[13.5px]">
                  {f.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

      {/* MUNTUZ group spotlight */}
      <section id="group" className="pt-[52px]">
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="overflow-hidden rounded-[32px] bg-[#182420] p-7 text-[#F3EDDC] shadow-xl sm:p-14">
            <span className="inline-block rounded-full bg-[#FF6A4D] px-3.5 py-2 text-[13px] font-extrabold uppercase tracking-[0.06em] text-white">
              {t('groupBadge')}
            </span>
            <div
              className="mt-3.5 text-[clamp(64px,12.5vw,148px)] font-extrabold leading-[0.95] tracking-[0.01em] text-[#FFC53D]"
              style={{ fontFamily: DISPLAY_FONT }}
              aria-hidden="true"
            >
              MUNTUZ
            </div>
            <h2
              className="mt-3 text-[clamp(30px,4.2vw,46px)] font-extrabold text-[#FFF9EA]"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              {t('groupTitle')}
            </h2>
            <p className="mt-3 max-w-[760px] text-[18.5px] text-[#D8D2BE]">{t('groupDesc')}</p>
            <div className="mb-1.5 mt-7 grid grid-cols-5 gap-1.5 sm:gap-3">
              {GROUP_ORDER.map(({ id, roleKey }) => {
                const f = friendById(id);
                return (
                  <figure key={id} className="m-0">
                    <div className="overflow-hidden rounded-[18px]">
                      <img
                        src={f.avatar}
                        alt={f.name}
                        className="h-[150px] w-full object-cover object-[center_22%] sm:h-[290px]"
                      />
                    </div>
                    <figcaption className="px-0 pb-px pt-2 text-center text-sm font-extrabold text-[#F3EDDC] sm:text-base">
                      {f.name}
                      <small className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.05em] text-[#C9BFA4] sm:text-xs">
                        {t(roleKey)}
                      </small>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
            <div className="mt-[26px] flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleSong}
                aria-pressed={songPlaying}
                className={`inline-flex items-center gap-2.5 rounded-full px-[26px] py-[14px] text-[16.5px] font-extrabold text-white hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  songPlaying ? 'bg-[#0E7C66]' : 'bg-[#FF6A4D]'
                }`}
              >
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/25 text-[11px]" aria-hidden="true">
                  {songPlaying ? '❚❚' : '▶'}
                </span>
                {songPlaying ? t('groupPause') : t('groupPlay')}
              </button>
              <a
                href="/muntuz/group"
                className="inline-flex items-center gap-2 rounded-full bg-[#FFC53D] px-7 py-[14px] text-[16.5px] font-extrabold text-[#4A3500] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {t('groupCta')}
                <span aria-hidden="true">→</span>
              </a>
              <a
                href="/muntuz/group"
                className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#71827A] bg-transparent px-7 py-[14px] text-[16.5px] font-extrabold text-[#F3EDDC] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {t('groupWatch')}
              </a>
            </div>
            <audio
              ref={songAudioRef}
              src="/muntuz/say-hi.mp3"
              preload="none"
              onPlay={() => setSongPlaying(true)}
              onPause={() => setSongPlaying(false)}
              onEnded={() => setSongPlaying(false)}
            />
          </div>
        </div>
      </section>

      {/* Find your partner */}
      <section id="partners" className="mt-[72px] scroll-mt-20 border-y border-[#E7DCC8] bg-[#F4EAD8] py-[72px]">
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="mb-9 max-w-[640px]">
            <h2
              className="text-[clamp(30px,4.4vw,44px)] font-extrabold tracking-[-0.01em]"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              {t('partnersTitle')}
            </h2>
            <p className="mt-3 text-lg text-[#5D6C63]">{t('partnersSub')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-5">
            {friends.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => selectFriend(i)}
                aria-pressed={friendIdx === i}
                className={`w-full rounded-[26px] border-2 bg-white p-4 text-start text-[#1E2A25] transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66] ${
                  friendIdx === i ? 'border-[#0E7C66]' : 'border-[#E7DCC8]'
                }`}
              >
                <img src={f.avatar} alt={f.name} className="mb-3 h-[76px] w-[76px] rounded-full object-cover" />
                <div className="text-[21px] font-extrabold" style={{ fontFamily: DISPLAY_FONT }}>
                  {f.name}
                </div>
                <div className="mb-2.5 mt-1 text-xs font-extrabold text-[#0A5C4B]">{t('multi')}</div>
                <div className="text-sm leading-relaxed text-[#5D6C63]">{f.pers}</div>
              </button>
            ))}
          </div>

          {/* Selected partner */}
          <div id="detail" className="mt-[22px] grid overflow-hidden rounded-[26px] bg-white shadow-xl ring-1 ring-[#E7DCC8] lg:grid-cols-[380px_1fr]">
            <div className="min-h-full">
              <img src={friend.img} alt={friend.alt} className="h-full min-h-[340px] w-full object-cover" />
            </div>
            <aside className="border-t border-[#E7DCC8] bg-[#FFF9EF] p-6 lg:border-s lg:border-t-0">
              <h3 className="text-[22px] font-extrabold">{friend.name}</h3>
              <div className="mb-4 mt-1 text-[13px] font-extrabold text-[#0A5C4B]">{t('multi')}</div>
              <dl className="grid gap-3.5">
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-[0.07em] text-[#5D6C63]">
                    {t('personality')}
                  </dt>
                  <dd className="mt-0.5 text-[15.5px] font-semibold">{friend.pers}</dd>
                </div>
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-[0.07em] text-[#5D6C63]">
                    {t('hobbies')}
                  </dt>
                  <dd className="mt-0.5 text-[15.5px] font-semibold">{friend.hobby}</dd>
                </div>
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-[0.07em] text-[#5D6C63]">
                    {t('places')}
                  </dt>
                  <dd className="mt-0.5 text-[15.5px] font-semibold">{friend.places}</dd>
                </div>
              </dl>
              <div className="mt-[18px] flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-[#E7DCC8]">
                <button
                  type="button"
                  onClick={toggleVoice}
                  aria-pressed={voicePlaying}
                  aria-label={t('listen')}
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#FF6A4D] text-white hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
                >
                  {voicePlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
                  )}
                </button>
                <Waveform playing={voicePlaying} />
              </div>
              <audio
                ref={voiceAudioRef}
                src={friend.voice}
                preload="none"
                onPlay={() => setVoicePlaying(true)}
                onPause={() => setVoicePlaying(false)}
                onEnded={() => setVoicePlaying(false)}
              />
              <p className="mt-2.5 text-sm font-extrabold text-[#5D6C63]">{t('listen')}</p>
            </aside>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 py-[72px]">
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="mb-9 max-w-[640px]">
            <h2
              className="text-[clamp(30px,4.4vw,44px)] font-extrabold tracking-[-0.01em]"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              {t('howTitle')}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-[26px] bg-white p-[26px] ring-1 ring-[#E7DCC8]">
                <div
                  className="text-[44px] font-extrabold text-[#FFC53D]"
                  style={{ fontFamily: DISPLAY_FONT, WebkitTextStroke: '1.5px #1E2A25', paintOrder: 'stroke fill' }}
                >
                  {s.n}
                </div>
                <h3 className="mt-2.5 text-[21px] font-extrabold">{s.title}</h3>
                <p className="mt-2 text-[#5D6C63]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-[72px]">
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="mb-9 max-w-[640px]">
            <h2
              className="text-[clamp(30px,4.4vw,44px)] font-extrabold tracking-[-0.01em]"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              {t('featTitle')}
            </h2>
          </div>
          <div className="grid items-center gap-9 lg:grid-cols-[1fr_380px]">
            <div>
              {feats.map((f) => (
                <div key={f.t} className="flex gap-[18px] border-b border-[#E7DCC8] py-[22px] first:pt-0 last:border-b-0">
                  <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#EFF7F2] text-[#0A5C4B]">
                    {f.icon === 'phone' && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    )}
                    {f.icon === 'pen' && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg>
                    )}
                    {f.icon === 'heart' && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold">{t(f.t)}</h3>
                    <p className="mt-1 text-[#5D6C63]">{t(f.d)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-[26px] shadow-xl">
              <img
                src="/muntuz/emily-night.webp"
                alt="Emily at home in the evening with a mug of tea and her cat asleep beside her"
                className="h-[300px] w-full object-cover lg:h-[440px]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* People Rooms — waitlist (not open yet) */}
      <section id="rooms" className="scroll-mt-20 pb-[72px]">
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="grid items-center gap-9 rounded-[26px] bg-[#0A5C4B] p-[30px] text-[#F4FBF7] lg:grid-cols-[1.1fr_0.9fr] lg:p-11">
            <div>
              <span className="inline-block rounded-full bg-[#FFC53D] px-3 py-1.5 text-[13px] font-extrabold uppercase tracking-[0.06em] text-[#4A3500]">
                {t('roomsBadge')}
              </span>
              <h2
                className="mt-3.5 text-[clamp(28px,3.6vw,38px)] font-extrabold"
                style={{ fontFamily: DISPLAY_FONT }}
              >
                {t('roomsTitle')}
              </h2>
              <p className="mt-3 text-[17.5px] opacity-90">{t('roomsDesc')}</p>
            </div>
            <div>
              {status === 'done' ? (
                <p className="rounded-2xl border border-dashed border-white/50 bg-white/10 px-[18px] py-4 text-[17px] font-extrabold" role="status">
                  {t('joined')}
                </p>
              ) : (
                <form onSubmit={joinWaitlist} className="flex flex-wrap gap-2.5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'invalid') setStatus('idle');
                    }}
                    placeholder={t('emailPh')}
                    aria-label={t('emailPh')}
                    autoComplete="email"
                    className="min-w-[210px] flex-1 rounded-full bg-white px-5 py-[13px] text-[#1E2A25] focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="rounded-full bg-[#FF6A4D] px-6 py-[13px] font-extrabold text-white hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Joining…' : t('join')}
                  </button>
                </form>
              )}
              {status === 'invalid' && (
                <p className="mt-2 text-sm font-medium text-white/90">
                  Please enter a valid email address.
                </p>
              )}
              {status === 'soon' && (
                <p className="mt-2 text-sm font-medium text-white/90">
                  The waitlist opens soon — Muntuz isn&rsquo;t taking
                  emails just yet. Please check back at launch!
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <div className="mx-auto max-w-[1180px] px-5 py-[84px] text-center">
        <div className="mb-[26px] flex justify-center" aria-hidden="true">
          {friends.map((f) => (
            <img
              key={f.id}
              src={f.avatar}
              alt=""
              className="ms-[-12px] h-[58px] w-[58px] rounded-full border-[3px] border-[#FBF5EA] object-cover first:ms-0"
            />
          ))}
        </div>
        <h2
          className="mx-auto max-w-[640px] text-[clamp(32px,5vw,52px)] font-extrabold"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          {t('ctaTitle')}
        </h2>
        <p className="mx-auto mt-3.5 text-[19px] text-[#5D6C63]">{t('ctaSub')}</p>
        <button
          type="button"
          onClick={openPick}
          className="mt-7 rounded-full bg-[#FF6A4D] px-[30px] py-[15px] text-[17.5px] font-extrabold text-white shadow-lg hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
        >
          {t('cta')}
        </button>
      </div>

      {/* Footer — prototype layout + the live footer links and disclosures */}
      <footer className="border-t border-[#E7DCC8] bg-[#F4EAD8] py-10">
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="flex flex-wrap items-start justify-between gap-7">
            <div>
              <a href="#top" className="text-2xl font-extrabold tracking-[0.04em]" style={{ fontFamily: DISPLAY_FONT }}>
                MUNTUZ<span className="text-[#0E7C66]">.</span>
              </a>
              <p className="mt-2 max-w-[340px] text-[15px] text-[#5D6C63]">{t('footerTag')}</p>
              <p className="mt-3 text-sm font-bold text-[#1E2A25]">
                🌐 Muntuz &middot; 50 AI partners &middot; Voice &amp; chat
                &middot; Any language
              </p>
            </div>
            <nav className="flex flex-wrap gap-[22px]" aria-label="Footer">
              <a href="#how" className="py-2 text-[15px] font-bold hover:text-[#0E7C66]">{t('navHow')}</a>
              <a href="#partners" className="py-2 text-[15px] font-bold hover:text-[#0E7C66]">{t('navPartners')}</a>
              <a href="#rooms" className="py-2 text-[15px] font-bold hover:text-[#0E7C66]">{t('navRooms')}</a>
              <a href="/pricing" className="py-2 text-[15px] font-bold hover:text-[#0E7C66]">{t('navPricing')}</a>
              <a href="/muntuz/group" className="py-2 text-[15px] font-bold hover:text-[#0E7C66]">MUNTUZ</a>
            </nav>
          </div>
          <nav className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs font-bold text-[#0E7C66] no-underline hover:underline"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <p className="mt-4 text-center text-xs leading-relaxed text-[#5D6C63]">
            These friends are AI, not real people.
          </p>
          <div className="mt-7 flex flex-wrap justify-between gap-[18px] text-sm text-[#5D6C63]">
            <span>{t('rights')}</span>
            <span>{t('multi')}</span>
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-[#5D6C63]">
            &copy; {new Date().getFullYear()} Muntuz. All rights reserved. |
            British Columbia, Canada |{' '}
            <a
              href="mailto:muntuz.official@gmail.com"
              className="text-[#5D6C63] no-underline hover:underline"
            >
              muntuz.official@gmail.com
            </a>
          </p>
          <p className="mt-1 text-center text-[11px] text-[#5D6C63]">
            Muntuz — a MunTalk project.
          </p>
        </div>
      </footer>

      {/* Partner picker — opened by every "Start chatting" button */}
      {pickOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 sm:items-center sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePick();
          }}
        >
          <div
            className="max-h-[88vh] w-full max-w-[560px] overflow-auto rounded-t-[26px] bg-white p-[26px_22px_22px] text-[#1E2A25] shadow-xl sm:rounded-[26px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pickTitle"
          >
            <div className="mb-4 flex items-start justify-between gap-3.5">
              <div>
                <h2 id="pickTitle" className="text-[26px] font-extrabold" style={{ fontFamily: DISPLAY_FONT }}>
                  {t('pickTitle')}
                </h2>
                <p className="mt-1.5 text-[15.5px] text-[#5D6C63]">{t('pickSub')}</p>
              </div>
              <button
                ref={pickCloseRef}
                type="button"
                onClick={closePick}
                aria-label={t('pickClose')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E7DCC8] bg-[#FFF9EF] text-xl leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
              >
                ×
              </button>
            </div>
            <div className="grid gap-2.5">
              {friends.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => pickFriend(f.id)}
                  className="flex w-full items-center gap-3.5 rounded-[18px] border-[1.5px] border-[#E7DCC8] bg-[#FFF9EF] p-3 text-start text-[#1E2A25] hover:border-[#0E7C66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
                >
                  <img src={f.avatar} alt="" className="h-[52px] w-[52px] shrink-0 rounded-full object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-extrabold" style={{ fontFamily: DISPLAY_FONT }}>
                      {f.name}
                    </span>
                    <span className="block text-sm text-[#5D6C63]">{f.pers}</span>
                  </span>
                  <span className="shrink-0 text-lg font-extrabold text-[#0E7C66]" aria-hidden="true">→</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPickSoon(true)}
                className="flex w-full items-center gap-3.5 rounded-[18px] border-[1.5px] border-[#E7DCC8] bg-[#FFF9EF] p-3 text-start text-[#1E2A25] hover:border-[#0E7C66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C66]"
              >
                <span
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#0E7C66] text-base font-extrabold text-white"
                  style={{ fontFamily: DISPLAY_FONT }}
                  aria-hidden="true"
                >
                  +45
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-extrabold" style={{ fontFamily: DISPLAY_FONT }}>
                    {t('pickMore')}
                  </span>
                  <span className="block text-sm text-[#5D6C63]">{t('pickMoreSub')}</span>
                </span>
                <span className="shrink-0 text-lg font-extrabold text-[#0E7C66]" aria-hidden="true">→</span>
              </button>
            </div>
            {pickSoon && (
              <p className="mt-3.5 rounded-[14px] bg-[#FFF3B8] p-3 text-sm font-bold text-[#5C4A00]" role="status">
                {t('pickSoon')}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
