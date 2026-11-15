'use client';

// Muntuz landing page (client part) — hybrid final design port.
// Photo hero -> Muntuz House (5 rooms) -> Night Voices -> Photo Room
// -> MUNTUZ group teaser -> Pricing pointer -> People Rooms
// -> waitlist (Firestore `muntuz_waitlist`) -> final CTA -> footer.
// The full Debut + dorm episodes live on their own page (/muntuz/group);
// full pricing lives on /pricing. The main page stays a simple
// language-exchange landing (Tandem / HelloTalk / Speaky pattern).
//
// Whole-page language switching in 12 languages (Native language button).
// Friend room content is English, and Korean when lang is ko (as in the
// final-design prototype). Photos use the locked official faces; the hero
// group photo is the sunny-plaza version the user approved ("저 광장").
// Voice: each friend has a fixed TTS voice; the room Listen button plays
// their opening line and Night Voices plays Emily's night note. The waveform
// animates while audio is playing.
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

const LANGS: [Lang, string][] = [["en","English"],["ko","한국어"],["ja","日本語"],["es","Español"],["fr","Français"],["de","Deutsch"],["pt","Português"],["zh","中文"],["it","Italiano"],["vi","Tiếng Việt"],["hi","हिन्दी"],["ar","العربية"]];

// 98 UI strings x 12 languages, ported from the hybrid final-design prototype
// (84 base strings + 14 Debut strings per language).
const DICT: Record<Lang, Record<string, string>> = {
  "en": {
    "navHouse": "The House",
    "navNight": "Night Voices",
    "navPhotos": "Photo Room",
    "navPricing": "Pricing",
    "groupTeaserKicker": "Just debuted · MUNTUZ",
    "groupTeaserSub": "The five housemates just debuted as a group — hear their first single “Say Hi” and peek at life in the house.",
    "groupTeaserCta": "Meet the group →",
    "priceTeaserSub": "Free forever to start. Premium from $9.99 a month — see plans and what's included.",
    "priceTeaserCta": "See pricing →",
    "loginBtn": "Log in",
    "logoutBtn": "Log out",
    "native": "Native language",
    "startFree": "Start talking — free",
    "langNote": "Pick your language — the whole page switches, not just the greeting.",
    "issue": "The Summer Issue · Vol. 01",
    "multi": "Multilingual · speaks every language",
    "heroEm": "five friends,",
    "heroOne": "one house.",
    "heroSub": "Practice any language with AI friends who feel real.",
    "heroSub2": "They talk first — about their day, their latte, their cat. You just answer, and a language sticks. No lessons. No pressure. Just people.",
    "meetBtn": "Meet the five ↓",
    "coverStory": "Cover story",
    "heroCaption": "“shoot day, golden hour — nobody wanted it to end”",
    "heroCaptionSub": "Jiyoung · Amara · Chloe · Emily · Sofia — the official faces, in summer outfits.",
    "cl1t": "Inside the house",
    "cl1": "Five rooms, five lives in progress. Tap a face — their room, their day, their story opens below.",
    "cl2t": "They remember you",
    "cl2": "“Wasn't today your presentation day? How did it go?” — they bring up the little things you mentioned, unprompted.",
    "cl3t": "Voices, not text",
    "cl3": "Tone, pace, breath, laughter. At night, the living room slows down with you. Scroll to the Night Voices.",
    "houseTitle": "Muntuz House",
    "houseSub": "A roof, five rooms, and a note on every door. Tap a room — the conversation below becomes theirs.",
    "roof": "our house — come in, shoes off",
    "justNow": "just now",
    "listen": "Listen to her voice",
    "memoryBtn": "See a memory moment",
    "fixLabel": "one-line fix",
    "inside": "Inside",
    "roomPoss": "'s room",
    "pPers": "Personality",
    "pHobby": "Hobbies",
    "pPlaces": "Always at",
    "pNow": "Into right now",
    "nightKicker": "After dark · Night Voices",
    "nightTitleA": "The living room, at night.",
    "nightLead": "When you're tired, they don't hand you a lesson. The voice gets slower, softer. Sometimes they just send a photo — a cat mid-nap, tea still steaming — and sit with you.",
    "comfortT": "For heavy days",
    "comfort": "“I just brewed a cup too. Drink something warm with me and rest a little, okay?”",
    "tonight": "Tonight, with Emily",
    "nightMsg1": "[deep breath] …long day, huh. You don't have to be okay with me.",
    "nightMsg2": "Want to vent about it, or should I distract you with a ridiculous story? No wrong answer.",
    "nightTone": "[tone: warm, gentle, slower — pitch drops when you're down, lifts when you laugh]",
    "nightMsg3": "And hey — you got through today. On a heavy day, that's a massive win. I'm proud of you.",
    "nightPlay": "Play tonight's voice note",
    "nightNote": "Prototype note: voice is shown as waveform + tone tags in this mockup.",
    "photoTitle": "The Photo Room",
    "photoSub": "Peek into their lives — childhood, school days, trips, ordinary Tuesdays. The good kind of curious.",
    "fAll": "All",
    "fChild": "Childhood",
    "fSchool": "School days",
    "fTravel": "Travel",
    "fDaily": "Everyday",
    "feel1t": "Never judged",
    "feel1": "Say it wrong, say it slow, say it at 2am. Nobody sighs, nobody rushes you. That safety is the whole point.",
    "feel2t": "Kind surprises",
    "feel2": "A life-latte discovery, a would-you-rather at 11pm, a photo of a dozing cat. Never the same opening twice.",
    "feel3t": "Tiny wins, noticed",
    "feel3": "You said one full sentence today? They noticed. They'll tell you. Immediately, and like they mean it.",
    "priceTitle": "Simple pricing",
    "foot": "Five friends, one house, every language.",
    "soon": "coming soon",
    "ctaTitle": "Your room in the house is ready.",
    "ctaSub": "Pick a face, say hi, stay for the story. Your first chat is free — and they will talk first.",
    "peopleRooms": "People Rooms",
    "peopleSub": "real people, soon",
    "peopleMemo": "under construction — peek later!",
    "peopleNote": "Coming soon · waitlist open",
    "youLabel": "You",
    "memTag": "remembered ✦",
    "navDebut": "Debut",
    "heroBadge": "AI language exchange",
    "langStrip": "Practice any language — with 50 AI friends",
  },
  "ko": {
    "navHouse": "하우스",
    "navNight": "밤의 목소리",
    "navPhotos": "사진방",
    "navPricing": "요금",
    "groupTeaserKicker": "막 데뷔했어요 · MUNTUZ",
    "groupTeaserSub": "다섯 하우스메이트가 그룹으로 막 데뷔했어요 — 첫 싱글 “Say Hi”를 듣고 합숙 생활도 살짝 엿보세요.",
    "groupTeaserCta": "그룹 만나기 →",
    "priceTeaserSub": "무료로 시작, 평생 무료 플랜이 있어요. Premium은 월 $9.99부터 — 플랜과 혜택을 확인하세요.",
    "priceTeaserCta": "요금 보기 →",
    "loginBtn": "로그인",
    "logoutBtn": "로그아웃",
    "native": "모국어",
    "startFree": "무료로 대화 시작하기",
    "langNote": "언어를 고르면 인사말만이 아니라 페이지 전체가 바뀝니다.",
    "issue": "여름 특집호 · Vol. 01",
    "multi": "다개국어 구사 가능 · 모든 언어를 말해요",
    "heroEm": "다섯 친구,",
    "heroOne": "하나의 집.",
    "heroSub": "진짜 같은 AI 친구와 어떤 언어든 연습해요.",
    "heroSub2": "먼저 말을 거는 건 친구들이에요 — 오늘 하루, 인생 라떼, 키우는 고양이 이야기. 당신은 답만 하면, 언어가 어느새 붙어 있어요.",
    "meetBtn": "다섯 친구 만나기 ↓",
    "coverStory": "커버 스토리",
    "heroCaption": "“촬영날, 골든아워 — 아무도 끝내고 싶어 하지 않았어요”",
    "heroCaptionSub": "지영 · Amara · Chloe · Emily · Sofia — 공식 얼굴, 여름 옷차림.",
    "cl1t": "집 안으로",
    "cl1": "방 다섯 개, 진행 중인 삶 다섯 개. 얼굴을 누르면 그 친구의 방과 하루가 아래에 열려요.",
    "cl2t": "당신을 기억해요",
    "cl2": "“그러고 보니 오늘 발표날이었지? 잘 됐어?” — 스쳐 지나가듯 말한 것들을 먼저 꺼내요.",
    "cl3t": "텍스트가 아니라 목소리",
    "cl3": "톤, 속도, 숨소리, 웃음소리. 밤이 되면 거실도 당신과 함께 느려져요.",
    "houseTitle": "Muntuz House",
    "houseSub": "지붕 하나, 방 다섯 개, 문마다 붙은 메모 하나. 방을 누르면 아래 대화가 그 친구의 것이 됩니다.",
    "roof": "우리 집 — 들어와요, 신발은 벗고",
    "justNow": "방금",
    "listen": "목소리 듣기",
    "memoryBtn": "기억 콜백 순간 보기",
    "fixLabel": "한 줄 교정",
    "inside": "",
    "roomPoss": "의 방",
    "pPers": "성격",
    "pHobby": "취미",
    "pPlaces": "자주 가는 곳",
    "pNow": "요즘 관심사",
    "nightKicker": "밤이 되면 · 나이트 보이스",
    "nightTitleA": "밤의 거실.",
    "nightLead": "피곤한 날, 그들은 수업을 건네지 않아요. 목소리는 느려지고 부드러워지고, 졸고 있는 고양이 사진이나 김 모락모락 나는 차 사진을 보내며 곁에 앉아 있어요.",
    "comfortT": "무거운 하루에",
    "comfort": "“나도 방금 차 한 잔 우렸어. 따뜻한 거 마시면서 좀 쉬어.”",
    "tonight": "오늘 밤, Emily와",
    "nightMsg1": "[깊은 숨] …긴 하루였지. 내 앞에서는 괜찮은 척 안 해도 돼.",
    "nightMsg2": "얘기하고 싶어, 아니면 웃긴 이야기로 기분 전환해 줄까? 정답은 없어.",
    "nightTone": "[톤: 따뜻하게, 부드럽게, 느리게 — 당신이 가라앉으면 낮아지고, 웃으면 함께 올라가요]",
    "nightMsg3": "그리고 오늘 하루를 버텨낸 거, 무거운 날엔 그게 엄청난 승리야. 정말 자랑스러워.",
    "nightPlay": "오늘 밤 음성 노트 재생",
    "nightNote": "시안 안내: 음성은 파형과 톤 태그로 표현한 연출입니다.",
    "photoTitle": "사진방",
    "photoSub": "그들의 삶을 엿보세요 — 어린 시절, 학창 시절, 여행, 평범한 화요일. 기분 좋은 호기심으로요.",
    "fAll": "전체",
    "fChild": "어린 시절",
    "fSchool": "학창 시절",
    "fTravel": "여행",
    "fDaily": "일상",
    "feel1t": "판단받지 않아요",
    "feel1": "틀려도, 느려도, 새벽 2시여도. 아무도 한숨 쉬지 않고 재촉하지 않아요.",
    "feel2t": "다정한 서프라이즈",
    "feel2": "인생 라떼 발견, 밤 11시의 밸런스 게임, 졸고 있는 고양이 사진. 시작은 매번 달라요.",
    "feel3t": "작은 성취를 알아봐요",
    "feel3": "오늘 문장 하나를 끝까지 말했다고요? 그들이 알아채고, 바로, 진심으로 말해줘요.",
    "priceTitle": "심플한 요금",
    "foot": "다섯 친구, 하나의 집, 모든 언어.",
    "soon": "준비 중",
    "ctaTitle": "이 집에 당신의 방이 준비돼 있어요.",
    "ctaSub": "얼굴을 고르고, 인사하고, 이야기에 머물러 보세요. 첫 대화는 무료 — 그리고 먼저 말을 거는 건 친구들이에요.",
    "peopleRooms": "People Rooms",
    "peopleSub": "실제 사람들, 곧 만나요",
    "peopleMemo": "공사 중 — 나중에 엿보러 오세요!",
    "peopleNote": "준비 중 · 대기자 명단 열려 있어요",
    "youLabel": "나",
    "memTag": "기억해 냈어요 ✦",
    "navDebut": "데뷔",
    "heroBadge": "AI 언어교환",
    "langStrip": "어떤 언어든 연습해요 — 50명의 AI 친구와 함께",
  },
  "ja": {
    "navHouse": "ザ・ハウス",
    "navNight": "ナイトボイス",
    "navPhotos": "フォトルーム",
    "navPricing": "料金",
    "groupTeaserKicker": "デビューしたばかり · MUNTUZ",
    "groupTeaserSub": "5人のハウスメイトがグループとしてデビューしたばかり — ファーストシングル「Say Hi」を聴いて、合宿生活をのぞいてみよう。",
    "groupTeaserCta": "グループに会う →",
    "priceTeaserSub": "無料で始められて、無料プランはずっと無料。Premiumは月額$9.99から — プランと内容を見る。",
    "priceTeaserCta": "料金を見る →",
    "loginBtn": "ログイン",
    "logoutBtn": "ログアウト",
    "native": "母国語",
    "startFree": "無料で話し始める",
    "langNote": "言語を選ぶと、挨拶だけでなくページ全体が切り替わります。",
    "issue": "夏の特集号 · Vol. 01",
    "multi": "多言語対応 · すべての言語を話します",
    "heroEm": "5人の友達、",
    "heroOne": "ひとつの家。",
    "heroSub": "本物のようなAIフレンドと、どんな言語でも練習しよう。",
    "heroSub2": "先に話しかけるのは友達のほう。今日のこと、人生ラテ、飼い猫の話。あなたは答えるだけ、気づけば言語が身についています。レッスンなし、プレッシャーなし。ただ人と話すだけ。",
    "meetBtn": "5人に会う ↓",
    "coverStory": "カバーストーリー",
    "heroCaption": "「撮影日、ゴールデンアワー — 誰も終わらせたくなかった」",
    "heroCaptionSub": "ジヨン · Amara · Chloe · Emily · Sofia — 公式の顔、夏の装い。",
    "cl1t": "家の中へ",
    "cl1": "5つの部屋、進行中の5つの人生。顔をタップすると、その友達の部屋と一日が下に開きます。",
    "cl2t": "あなたのことを覚えています",
    "cl2": "「そういえば今日は発表の日だったよね？どうだった？」— 何気なく言った小さなことを、先に切り出してくれます。",
    "cl3t": "テキストではなく、声",
    "cl3": "トーン、速さ、息づかい、笑い声。夜になると、リビングもあなたと一緒にゆっくりになります。",
    "houseTitle": "Muntuz House",
    "houseSub": "屋根ひとつ、部屋5つ、ドアごとにメモひとつ。部屋をタップすると、下の会話がその友達のものになります。",
    "roof": "私たちの家 — どうぞ、靴は脱いで",
    "justNow": "たった今",
    "listen": "彼女の声を聞く",
    "memoryBtn": "思い出のコールバックを見る",
    "fixLabel": "一行の修正",
    "inside": "",
    "roomPoss": "の部屋",
    "pPers": "性格",
    "pHobby": "趣味",
    "pPlaces": "よくいる場所",
    "pNow": "今ハマっていること",
    "nightKicker": "夜になると · ナイトボイス",
    "nightTitleA": "夜のリビング。",
    "nightLead": "疲れた日、彼女たちはレッスンを渡しません。声は遅く、柔らかくなり、昼寝中の猫や湯気の立つお茶の写真を送って、そっと隣に座ります。",
    "comfortT": "重い一日に",
    "comfort": "「私も今お茶を淹れたところ。一緒に温かいものを飲んで、少し休もう？」",
    "tonight": "今夜、Emilyと",
    "nightMsg1": "[深呼吸] …長い一日だったね。私の前では大丈夫なふりをしなくていいよ。",
    "nightMsg2": "話したい？それとも、くだらない話で気を紛らわせようか？不正解はないよ。",
    "nightTone": "[トーン: 温かく、優しく、ゆっくり — あなたが沈むと低く、笑うと一緒に上がります]",
    "nightMsg3": "そしてね — 今日を乗り切ったこと、重い日にはそれが大きな勝利だよ。本当に誇りに思う。",
    "nightPlay": "今夜のボイスノートを再生",
    "nightNote": "プロトタイプ注記: 音声は波形とトーンタグで表現しています。",
    "photoTitle": "フォトルーム",
    "photoSub": "彼女たちの暮らしをのぞいてみて — 幼い頃、学生時代、旅、普通の火曜日。気持ちのいい好奇心で。",
    "fAll": "すべて",
    "fChild": "幼い頃",
    "fSchool": "学生時代",
    "fTravel": "旅",
    "fDaily": "日常",
    "feel1t": "決してジャッジされない",
    "feel1": "間違えても、ゆっくりでも、深夜2時でも。誰もため息をつかず、急かしません。その安心がすべてです。",
    "feel2t": "優しいサプライズ",
    "feel2": "人生ラテの発見、夜11時の二択ゲーム、居眠りする猫の写真。始まりはいつも違います。",
    "feel3t": "小さな成功に気づく",
    "feel3": "今日、一文を最後まで言えた？彼女たちは気づいて、すぐに、心から伝えてくれます。",
    "priceTitle": "シンプルな料金",
    "foot": "5人の友達、ひとつの家、すべての言語。",
    "soon": "近日公開",
    "ctaTitle": "家の中のあなたの部屋、準備できています。",
    "ctaSub": "顔を選んで、挨拶して、物語に残って。最初のチャットは無料 — しかも先に話しかけるのは彼女たちです。",
    "peopleRooms": "People Rooms",
    "peopleSub": "本物の人々、もうすぐ",
    "peopleMemo": "工事中 — あとで覗いてね！",
    "peopleNote": "近日公開 · ウェイトリスト受付中",
    "youLabel": "あなた",
    "memTag": "思い出した ✦",
    "navDebut": "デビュー",
    "heroBadge": "AI言語交換",
    "langStrip": "どんな言語でも練習 — 50人のAIフレンドと",
  },
  "es": {
    "navHouse": "La casa",
    "navNight": "Voces nocturnas",
    "navPhotos": "Sala de fotos",
    "navPricing": "Precios",
    "groupTeaserKicker": "Recién debutadas · MUNTUZ",
    "groupTeaserSub": "Las cinco compañeras acaban de debutar como grupo: escucha su primer sencillo “Say Hi” y echa un vistazo a la vida en la casa.",
    "groupTeaserCta": "Conoce al grupo →",
    "priceTeaserSub": "Empieza gratis, para siempre. Premium desde $9.99 al mes — ver planes y qué incluyen.",
    "priceTeaserCta": "Ver precios →",
    "loginBtn": "Iniciar sesión",
    "logoutBtn": "Cerrar sesión",
    "native": "Idioma nativo",
    "startFree": "Empieza a hablar — gratis",
    "langNote": "Elige tu idioma: cambia toda la página, no solo el saludo.",
    "issue": "La edición de verano · Vol. 01",
    "multi": "Multilingüe · habla todos los idiomas",
    "heroEm": "cinco amigas,",
    "heroOne": "una casa.",
    "heroSub": "Practica cualquier idioma con amigos de IA que se sienten reales.",
    "heroSub2": "Ellas hablan primero: de su día, su latte, su gato. Tú solo respondes, y el idioma se queda. Sin lecciones. Sin presión. Solo personas.",
    "meetBtn": "Conoce a las cinco ↓",
    "coverStory": "Historia de portada",
    "heroCaption": "“día de fotos, hora dorada — nadie quería que terminara”",
    "heroCaptionSub": "Jiyoung · Amara · Chloe · Emily · Sofia — los rostros oficiales, con ropa de verano.",
    "cl1t": "Dentro de la casa",
    "cl1": "Cinco habitaciones, cinco vidas en curso. Toca una cara: su habitación, su día, su historia se abre abajo.",
    "cl2t": "Se acuerdan de ti",
    "cl2": "“¿No era hoy tu presentación? ¿Cómo te fue?” — sacan las cositas que mencionaste, sin que se lo pidas.",
    "cl3t": "Voces, no texto",
    "cl3": "Tono, ritmo, respiración, risa. De noche, el salón baja el ritmo contigo. Baja hasta Voces Nocturnas.",
    "houseTitle": "Muntuz House",
    "houseSub": "Un techo, cinco habitaciones y una nota en cada puerta. Toca una habitación y la conversación de abajo será la suya.",
    "roof": "nuestra casa — entra, quítate los zapatos",
    "justNow": "ahora mismo",
    "listen": "Escucha su voz",
    "memoryBtn": "Ver un momento de memoria",
    "fixLabel": "corrección en una línea",
    "inside": "La habitación de",
    "roomPoss": "",
    "pPers": "Personalidad",
    "pHobby": "Aficiones",
    "pPlaces": "Siempre en",
    "pNow": "Ahora le encanta",
    "nightKicker": "Al anochecer · Voces Nocturnas",
    "nightTitleA": "El salón, de noche.",
    "nightLead": "Cuando estás cansado, no te dan una lección. La voz se vuelve más lenta y suave. A veces solo envían una foto — un gato dormido, un té humeante — y se sientan contigo.",
    "comfortT": "Para los días pesados",
    "comfort": "“Yo también acabo de preparar una taza. Toma algo caliente conmigo y descansa un poco, ¿vale?”",
    "tonight": "Esta noche, con Emily",
    "nightMsg1": "[respiración profunda] …día largo, ¿eh? Conmigo no tienes que fingir que estás bien.",
    "nightMsg2": "¿Quieres desahogarte o te distraigo con una historia ridícula? No hay respuesta incorrecta.",
    "nightTone": "[tono: cálido, suave, más lento — baja cuando estás decaído, sube cuando ríes]",
    "nightMsg3": "Y oye: superaste el día de hoy. En un día pesado, eso es una gran victoria. Estoy orgullosa de ti.",
    "nightPlay": "Reproducir la nota de voz de esta noche",
    "nightNote": "Nota del prototipo: la voz se muestra como onda y etiquetas de tono.",
    "photoTitle": "La sala de fotos",
    "photoSub": "Echa un vistazo a sus vidas: infancia, época escolar, viajes, martes cualquiera. La curiosidad de la buena.",
    "fAll": "Todo",
    "fChild": "Infancia",
    "fSchool": "Época escolar",
    "fTravel": "Viajes",
    "fDaily": "Cada día",
    "feel1t": "Sin juicios, nunca",
    "feel1": "Dilo mal, dilo lento, dilo a las 2am. Nadie suspira, nadie te apura. Esa seguridad es el punto.",
    "feel2t": "Sorpresas amables",
    "feel2": "El descubrimiento de un latte de vida, un “¿qué prefieres?” a las 11pm, la foto de un gato dormido. Nunca el mismo inicio dos veces.",
    "feel3t": "Pequeñas victorias, notadas",
    "feel3": "¿Hoy dijiste una frase completa? Lo notaron. Y te lo dirán. Al instante, y de verdad.",
    "priceTitle": "Precios simples",
    "foot": "Cinco amigas, una casa, todos los idiomas.",
    "soon": "muy pronto",
    "ctaTitle": "Tu habitación en la casa está lista.",
    "ctaSub": "Elige una cara, di hola, quédate por la historia. Tu primer chat es gratis, y ellas hablarán primero.",
    "peopleRooms": "People Rooms",
    "peopleSub": "personas reales, pronto",
    "peopleMemo": "en construcción — ¡vuelve a mirar luego!",
    "peopleNote": "Muy pronto · lista de espera abierta",
    "youLabel": "Tú",
    "memTag": "recordó ✦",
    "navDebut": "Debut",
    "heroBadge": "Intercambio de idiomas con IA",
    "langStrip": "Practica cualquier idioma — con 50 amigos de IA",
  },
  "fr": {
    "navHouse": "La maison",
    "navNight": "Voix de nuit",
    "navPhotos": "Galerie photo",
    "navPricing": "Tarifs",
    "groupTeaserKicker": "Tout juste débuté · MUNTUZ",
    "groupTeaserSub": "Les cinq colocataires viennent de débuter en groupe — écoutez leur premier single « Say Hi » et jetez un œil à la vie dans la maison.",
    "groupTeaserCta": "Rencontrer le groupe →",
    "priceTeaserSub": "Gratuit pour commencer, pour toujours. Premium dès 9,99 $ par mois — voir les formules et ce qu’elles incluent.",
    "priceTeaserCta": "Voir les tarifs →",
    "loginBtn": "Se connecter",
    "logoutBtn": "Se déconnecter",
    "native": "Langue maternelle",
    "startFree": "Commence à parler — gratuit",
    "langNote": "Choisissez votre langue : toute la page change, pas seulement le bonjour.",
    "issue": "Le numéro d'été · Vol. 01",
    "multi": "Multilingue · parle toutes les langues",
    "heroEm": "cinq amies,",
    "heroOne": "une maison.",
    "heroSub": "Pratiquez n'importe quelle langue avec des amis IA qui semblent réels.",
    "heroSub2": "Elles parlent en premier — de leur journée, de leur latte, de leur chat. Tu réponds, et la langue s'installe. Pas de leçons. Pas de pression. Juste des gens.",
    "meetBtn": "Rencontrer les cinq ↓",
    "coverStory": "À la une",
    "heroCaption": "« jour de shooting, heure dorée — personne ne voulait que ça se termine »",
    "heroCaptionSub": "Jiyoung · Amara · Chloe · Emily · Sofia — les visages officiels, en tenue d'été.",
    "cl1t": "Dans la maison",
    "cl1": "Cinq chambres, cinq vies en cours. Touche un visage : sa chambre, sa journée, son histoire s'ouvrent en dessous.",
    "cl2t": "Elles se souviennent de toi",
    "cl2": "« C'était pas aujourd'hui ta présentation ? Ça s'est bien passé ? » — elles ressortent les petites choses que tu as mentionnées, sans qu'on leur demande.",
    "cl3t": "Des voix, pas du texte",
    "cl3": "Le ton, le rythme, le souffle, le rire. La nuit, le salon ralentit avec toi. Fais défiler jusqu'aux Voix de nuit.",
    "houseTitle": "Muntuz House",
    "houseSub": "Un toit, cinq chambres, et un mot sur chaque porte. Touche une chambre : la conversation ci-dessous devient la sienne.",
    "roof": "notre maison — entre, enlève tes chaussures",
    "justNow": "à l'instant",
    "listen": "Écouter sa voix",
    "memoryBtn": "Voir un moment de mémoire",
    "fixLabel": "correction en une ligne",
    "inside": "La chambre d'",
    "roomPoss": "",
    "pPers": "Personnalité",
    "pHobby": "Passions",
    "pPlaces": "Toujours à",
    "pNow": "En ce moment, elle adore",
    "nightKicker": "La nuit tombée · Voix de nuit",
    "nightTitleA": "Le salon, la nuit.",
    "nightLead": "Quand tu es fatigué, elles ne te tendent pas une leçon. La voix devient plus lente, plus douce. Parfois, elles envoient juste une photo — un chat qui dort, un thé qui fume — et restent assises avec toi.",
    "comfortT": "Pour les jours lourds",
    "comfort": "« Je viens aussi de m'en préparer une tasse. Bois quelque chose de chaud avec moi et repose-toi un peu, d'accord ? »",
    "tonight": "Ce soir, avec Emily",
    "nightMsg1": "[grande respiration] …longue journée, hein. Avec moi, pas besoin de faire semblant d'aller bien.",
    "nightMsg2": "Tu veux en parler, ou je te distrais avec une histoire ridicule ? Il n'y a pas de mauvaise réponse.",
    "nightTone": "[ton : chaleureux, doux, plus lent — il descend quand tu es triste, remonte quand tu ris]",
    "nightMsg3": "Et au fait : tu as traversé cette journée. Un jour lourd, c'est une énorme victoire. Je suis fière de toi.",
    "nightPlay": "Écouter la note vocale de ce soir",
    "nightNote": "Note prototype : la voix est montrée en forme d'onde et en indications de ton.",
    "photoTitle": "La galerie photo",
    "photoSub": "Jette un œil dans leurs vies — enfance, années d'école, voyages, mardis ordinaires. La bonne curiosité.",
    "fAll": "Tout",
    "fChild": "Enfance",
    "fSchool": "Années d'école",
    "fTravel": "Voyages",
    "fDaily": "Quotidien",
    "feel1t": "Jamais jugé",
    "feel1": "Dis-le mal, dis-le lentement, dis-le à 2h du matin. Personne ne soupire, personne ne te presse. Cette sécurité, c'est tout l'intérêt.",
    "feel2t": "De gentilles surprises",
    "feel2": "La découverte d'un latte de vie, un « tu préfères quoi ? » à 23h, la photo d'un chat endormi. Jamais deux fois la même ouverture.",
    "feel3t": "Les petites victoires, remarquées",
    "feel3": "Tu as dit une phrase entière aujourd'hui ? Elles l'ont remarqué. Et elles te le diront. Tout de suite, et sincèrement.",
    "priceTitle": "Des tarifs simples",
    "foot": "Cinq amies, une maison, toutes les langues.",
    "soon": "bientôt",
    "ctaTitle": "Ta chambre dans la maison est prête.",
    "ctaSub": "Choisis un visage, dis bonjour, reste pour l'histoire. Ta première discussion est gratuite — et ce sont elles qui parleront en premier.",
    "peopleRooms": "People Rooms",
    "peopleSub": "de vraies personnes, bientôt",
    "peopleMemo": "en travaux — reviens jeter un œil !",
    "peopleNote": "Bientôt · liste d'attente ouverte",
    "youLabel": "Toi",
    "memTag": "s'est souvenu ✦",
    "navDebut": "Débuts",
    "heroBadge": "Échange linguistique avec l'IA",
    "langStrip": "Pratiquez n'importe quelle langue — avec 50 amis IA",
  },
  "de": {
    "navHouse": "Das Haus",
    "navNight": "Nachtstimmen",
    "navPhotos": "Fotozimmer",
    "navPricing": "Preise",
    "groupTeaserKicker": "Frisch debütiert · MUNTUZ",
    "groupTeaserSub": "Die fünf Mitbewohnerinnen sind gerade als Gruppe debütiert — hör ihre erste Single „Say Hi“ und wirf einen Blick ins Hausleben.",
    "groupTeaserCta": "Die Gruppe kennenlernen →",
    "priceTeaserSub": "Kostenlos starten, für immer. Premium ab 9,99 $ pro Monat — Pläne und Leistungen ansehen.",
    "priceTeaserCta": "Preise ansehen →",
    "loginBtn": "Anmelden",
    "logoutBtn": "Abmelden",
    "native": "Muttersprache",
    "startFree": "Losreden — kostenlos",
    "langNote": "Wähle deine Sprache — die ganze Seite wechselt, nicht nur die Begrüßung.",
    "issue": "Die Sommerausgabe · Vol. 01",
    "multi": "Mehrsprachig · spricht jede Sprache",
    "heroEm": "fünf Freundinnen,",
    "heroOne": "ein Haus.",
    "heroSub": "Übe jede Sprache mit KI-Freunden, die sich echt anfühlen.",
    "heroSub2": "Sie sprechen zuerst — über ihren Tag, ihren Latte, ihre Katze. Du antwortest einfach, und eine Sprache bleibt hängen. Keine Lektionen. Kein Druck. Nur Menschen.",
    "meetBtn": "Die fünf kennenlernen ↓",
    "coverStory": "Titelgeschichte",
    "heroCaption": "„Shooting-Tag, goldene Stunde — niemand wollte, dass es endet“",
    "heroCaptionSub": "Jiyoung · Amara · Chloe · Emily · Sofia — die offiziellen Gesichter, in Sommeroutfits.",
    "cl1t": "Im Haus",
    "cl1": "Fünf Zimmer, fünf Leben im Gange. Tippe auf ein Gesicht — ihr Zimmer, ihr Tag, ihre Geschichte öffnet sich unten.",
    "cl2t": "Sie erinnern sich an dich",
    "cl2": "„War heute nicht deine Präsentation? Wie ist es gelaufen?“ — sie sprechen die kleinen Dinge an, die du erwähnt hast, ganz von selbst.",
    "cl3t": "Stimmen, kein Text",
    "cl3": "Ton, Tempo, Atem, Lachen. Nachts wird das Wohnzimmer mit dir langsamer. Scrolle zu den Nachtstimmen.",
    "houseTitle": "Muntuz House",
    "houseSub": "Ein Dach, fünf Zimmer und ein Zettel an jeder Tür. Tippe auf ein Zimmer — das Gespräch unten wird zu ihrem.",
    "roof": "unser Haus — komm rein, Schuhe aus",
    "justNow": "gerade eben",
    "listen": "Ihre Stimme hören",
    "memoryBtn": "Einen Erinnerungsmoment sehen",
    "fixLabel": "Ein-Zeilen-Korrektur",
    "inside": "In",
    "roomPoss": "s Zimmer",
    "pPers": "Persönlichkeit",
    "pHobby": "Hobbys",
    "pPlaces": "Immer anzutreffen",
    "pNow": "Gerade begeistert von",
    "nightKicker": "Nach Einbruch der Dunkelheit · Nachtstimmen",
    "nightTitleA": "Das Wohnzimmer, bei Nacht.",
    "nightLead": "Wenn du müde bist, geben sie dir keine Lektion. Die Stimme wird langsamer, sanfter. Manchmal schicken sie nur ein Foto — eine schlafende Katze, dampfenden Tee — und sitzen bei dir.",
    "comfortT": "Für schwere Tage",
    "comfort": "„Ich habe mir auch gerade eine Tasse gebrüht. Trink etwas Warmes mit mir und ruh dich ein bisschen aus, okay?“",
    "tonight": "Heute Nacht, mit Emily",
    "nightMsg1": "[tiefer Atemzug] …langer Tag, hm. Bei mir musst du nicht so tun, als wäre alles okay.",
    "nightMsg2": "Willst du darüber reden, oder soll ich dich mit einer albernen Geschichte ablenken? Es gibt keine falsche Antwort.",
    "nightTone": "[Ton: warm, sanft, langsamer — sinkt, wenn du niedergeschlagen bist, steigt, wenn du lachst]",
    "nightMsg3": "Und übrigens: Du hast den heutigen Tag geschafft. An einem schweren Tag ist das ein riesiger Sieg. Ich bin stolz auf dich.",
    "nightPlay": "Die Sprachnotiz von heute Nacht abspielen",
    "nightNote": "Prototyp-Hinweis: Die Stimme wird als Wellenform und Tonangabe gezeigt.",
    "photoTitle": "Das Fotozimmer",
    "photoSub": "Ein Blick in ihr Leben — Kindheit, Schulzeit, Reisen, ganz normale Dienstage. Die gute Art von Neugier.",
    "fAll": "Alle",
    "fChild": "Kindheit",
    "fSchool": "Schulzeit",
    "fTravel": "Reisen",
    "fDaily": "Alltag",
    "feel1t": "Nie bewertet",
    "feel1": "Sag es falsch, sag es langsam, sag es um 2 Uhr nachts. Niemand seufzt, niemand drängt dich. Diese Sicherheit ist der ganze Punkt.",
    "feel2t": "Liebe Überraschungen",
    "feel2": "Die Entdeckung eines Lebens-Latte, ein „Was wäre dir lieber?“ um 23 Uhr, ein Foto einer dösenden Katze. Nie zweimal derselbe Anfang.",
    "feel3t": "Kleine Siege, bemerkt",
    "feel3": "Du hast heute einen ganzen Satz gesagt? Sie haben es bemerkt. Und sie sagen es dir. Sofort, und sie meinen es ernst.",
    "priceTitle": "Einfache Preise",
    "foot": "Fünf Freundinnen, ein Haus, jede Sprache.",
    "soon": "kommt bald",
    "ctaTitle": "Dein Zimmer im Haus ist bereit.",
    "ctaSub": "Wähle ein Gesicht, sag hallo, bleib für die Geschichte. Dein erster Chat ist kostenlos — und sie sprechen zuerst.",
    "peopleRooms": "People Rooms",
    "peopleSub": "echte Menschen, bald",
    "peopleMemo": "wird noch gebaut — schau später vorbei!",
    "peopleNote": "Kommt bald · Warteliste offen",
    "youLabel": "Du",
    "memTag": "erinnert ✦",
    "navDebut": "Debüt",
    "heroBadge": "Sprachaustausch mit KI",
    "langStrip": "Übe jede Sprache — mit 50 KI-Freunden",
  },
  "pt": {
    "navHouse": "A Casa",
    "navNight": "Vozes da Noite",
    "navPhotos": "Sala de Fotos",
    "navPricing": "Preços",
    "groupTeaserKicker": "Acabamos de estrear · MUNTUZ",
    "groupTeaserSub": "As cinco colegas de casa acabaram de estrear como grupo — ouça o primeiro single “Say Hi” e espie a vida na casa.",
    "groupTeaserCta": "Conheça o grupo →",
    "priceTeaserSub": "Comece grátis, para sempre. Premium a partir de $9.99 por mês — ver planos e o que incluem.",
    "priceTeaserCta": "Ver preços →",
    "loginBtn": "Entrar",
    "logoutBtn": "Sair",
    "native": "Idioma nativo",
    "startFree": "Comece a conversar — grátis",
    "langNote": "Escolha seu idioma: a página inteira muda, não só a saudação.",
    "issue": "A Edição de Verão · Vol. 01",
    "multi": "Multilíngue · fala todos os idiomas",
    "heroEm": "cinco amigas,",
    "heroOne": "uma casa.",
    "heroSub": "Pratique qualquer idioma com amigos de IA que parecem reais.",
    "heroSub2": "Elas falam primeiro: do dia delas, do latte, do gato. Você só responde, e o idioma fica. Sem lições. Sem pressão. Só pessoas.",
    "meetBtn": "Conheça as cinco ↓",
    "coverStory": "Matéria de capa",
    "heroCaption": "“dia de ensaio fotográfico, hora dourada — ninguém queria que acabasse”",
    "heroCaptionSub": "Jiyoung · Amara · Chloe · Emily · Sofia — os rostos oficiais, em roupas de verão.",
    "cl1t": "Dentro da casa",
    "cl1": "Cinco quartos, cinco vidas em andamento. Toque num rosto: o quarto, o dia e a história dela se abrem abaixo.",
    "cl2t": "Elas se lembram de você",
    "cl2": "“Hoje não era o dia da sua apresentação? Como foi?” — elas trazem as coisinhas que você mencionou, sem ninguém pedir.",
    "cl3t": "Vozes, não texto",
    "cl3": "Tom, ritmo, respiração, risada. À noite, a sala desacelera com você. Role até Vozes da Noite.",
    "houseTitle": "Muntuz House",
    "houseSub": "Um telhado, cinco quartos e um bilhete em cada porta. Toque num quarto e a conversa abaixo vira a dela.",
    "roof": "nossa casa — entre, tire os sapatos",
    "justNow": "agora mesmo",
    "listen": "Ouvir a voz dela",
    "memoryBtn": "Ver um momento de memória",
    "fixLabel": "correção em uma linha",
    "inside": "O quarto de",
    "roomPoss": "",
    "pPers": "Personalidade",
    "pHobby": "Hobbies",
    "pPlaces": "Sempre em",
    "pNow": "No momento, adora",
    "nightKicker": "Ao anoitecer · Vozes da Noite",
    "nightTitleA": "A sala, à noite.",
    "nightLead": "Quando você está cansado, elas não te entregam uma lição. A voz fica mais lenta e suave. Às vezes só mandam uma foto — um gato dormindo, um chá fumegante — e sentam com você.",
    "comfortT": "Para dias pesados",
    "comfort": "“Acabei de fazer uma xícara também. Bebe algo quentinho comigo e descansa um pouco, tá?”",
    "tonight": "Esta noite, com Emily",
    "nightMsg1": "[respiração funda] …dia longo, né. Comigo você não precisa fingir que está bem.",
    "nightMsg2": "Quer desabafar ou prefere que eu te distraia com uma história ridícula? Não tem resposta errada.",
    "nightTone": "[tom: caloroso, suave, mais lento — desce quando você está para baixo, sobe quando você ri]",
    "nightMsg3": "E olha: você atravessou o dia de hoje. Num dia pesado, isso é uma vitória enorme. Tenho orgulho de você.",
    "nightPlay": "Ouvir o áudio desta noite",
    "nightNote": "Nota do protótipo: a voz é mostrada como forma de onda e marcações de tom.",
    "photoTitle": "A Sala de Fotos",
    "photoSub": "Espie a vida delas: infância, tempos de escola, viagens, terças comuns. A curiosidade do bem.",
    "fAll": "Tudo",
    "fChild": "Infância",
    "fSchool": "Tempos de escola",
    "fTravel": "Viagens",
    "fDaily": "Dia a dia",
    "feel1t": "Nunca julgado",
    "feel1": "Fale errado, fale devagar, fale às 2h da manhã. Ninguém suspira, ninguém te apressa. Essa segurança é o ponto todo.",
    "feel2t": "Surpresas gentis",
    "feel2": "A descoberta de um latte da vida, um “você prefere?” às 23h, a foto de um gato cochilando. Nunca a mesma abertura duas vezes.",
    "feel3t": "Pequenas vitórias, notadas",
    "feel3": "Você falou uma frase inteira hoje? Elas notaram. E vão te contar. Na hora, e de verdade.",
    "priceTitle": "Preços simples",
    "foot": "Cinco amigas, uma casa, todos os idiomas.",
    "soon": "em breve",
    "ctaTitle": "Seu quarto na casa está pronto.",
    "ctaSub": "Escolha um rosto, diga oi, fique pela história. Seu primeiro chat é grátis — e elas falam primeiro.",
    "peopleRooms": "People Rooms",
    "peopleSub": "pessoas reais, em breve",
    "peopleMemo": "em construção — espiada depois!",
    "peopleNote": "Em breve · lista de espera aberta",
    "youLabel": "Você",
    "memTag": "lembrou ✦",
    "navDebut": "Estreia",
    "heroBadge": "Intercâmbio de idiomas com IA",
    "langStrip": "Pratique qualquer idioma — com 50 amigos de IA",
  },
  "zh": {
    "navHouse": "这栋房子",
    "navNight": "夜晚的声音",
    "navPhotos": "照片房",
    "navPricing": "价格",
    "groupTeaserKicker": "刚刚出道 · MUNTUZ",
    "groupTeaserSub": "五位室友刚刚以组合身份出道——听听首支单曲《Say Hi》，再看看小屋生活。",
    "groupTeaserCta": "认识这个组合 →",
    "priceTeaserSub": "免费开始，永久免费。Premium 每月 $9.99 起——查看套餐和包含内容。",
    "priceTeaserCta": "查看价格 →",
    "loginBtn": "登录",
    "logoutBtn": "退出",
    "native": "母语",
    "startFree": "开始聊天 — 免费",
    "langNote": "选择你的语言——整个页面都会切换，不只是问候语。",
    "issue": "夏日特辑 · 第01期",
    "multi": "多语言 · 会说所有语言",
    "heroEm": "五位朋友，",
    "heroOne": "一栋房子。",
    "heroSub": "和感觉真实的 AI 朋友练习任何语言。",
    "heroSub2": "先开口的总是她们——聊今天，聊人生拿铁，聊她们的猫。你只需要回答，语言不知不觉就记住了。没有课程，没有压力，只有人。",
    "meetBtn": "认识五位朋友 ↓",
    "coverStory": "封面故事",
    "heroCaption": "“拍摄日，黄金时刻——没有人想结束”",
    "heroCaptionSub": "Jiyoung · Amara · Chloe · Emily · Sofia —— 官方面孔，夏日装扮。",
    "cl1t": "走进房子",
    "cl1": "五个房间，五种正在进行的人生。点一张脸——她的房间、她的一天、她的故事会在下方打开。",
    "cl2t": "她们记得你",
    "cl2": "“今天不是你做报告的日子吗？怎么样？”——你随口提过的小事，她们会主动提起。",
    "cl3t": "是声音，不是文字",
    "cl3": "语气、速度、呼吸、笑声。到了夜里，客厅会和你一起慢下来。往下滚动到夜晚的声音。",
    "houseTitle": "Muntuz House",
    "houseSub": "一个屋顶，五个房间，每扇门上都有一张便条。点一个房间，下面的对话就变成她的了。",
    "roof": "我们的家——进来吧，脱鞋哦",
    "justNow": "刚刚",
    "listen": "听她的声音",
    "memoryBtn": "看看记忆回调的瞬间",
    "fixLabel": "一行纠正",
    "inside": "",
    "roomPoss": "的房间",
    "pPers": "性格",
    "pHobby": "爱好",
    "pPlaces": "常去的地方",
    "pNow": "最近迷上",
    "nightKicker": "入夜之后 · 夜晚的声音",
    "nightTitleA": "夜晚的客厅。",
    "nightLead": "当你累了，她们不会递给你一节课。声音会变慢、变轻。有时她们只是发一张照片——打盹的猫、冒着热气的茶——然后陪你坐着。",
    "comfortT": "给沉重的日子",
    "comfort": "“我也刚泡了一杯。陪我喝点热的，休息一下，好吗？”",
    "tonight": "今晚，和 Emily 一起",
    "nightMsg1": "[深呼吸]……漫长的一天，对吧。在我面前，不用假装没事。",
    "nightMsg2": "想倾诉一下，还是让我用一个荒唐的故事逗你分心？没有错误答案。",
    "nightTone": "[语气：温暖、轻柔、更慢——你低落时它会低下来，你笑时它会一起高起来]",
    "nightMsg3": "还有——你撑过了今天。在沉重的日子里，这是巨大的胜利。我为你骄傲。",
    "nightPlay": "播放今晚的语音",
    "nightNote": "原型说明：声音以波形和语气标签的形式呈现。",
    "photoTitle": "照片房",
    "photoSub": "偷看一下她们的生活——童年、上学时光、旅行、普通的星期二。是那种善意的好奇。",
    "fAll": "全部",
    "fChild": "童年",
    "fSchool": "上学时光",
    "fTravel": "旅行",
    "fDaily": "日常",
    "feel1t": "从不被评判",
    "feel1": "说错、说慢、凌晨2点说，都没关系。没有人叹气，没有人催你。这种安全感就是全部意义。",
    "feel2t": "温柔的惊喜",
    "feel2": "发现人生拿铁、晚上11点的二选一游戏、打盹的猫的照片。开场永远不会重复。",
    "feel3t": "小小的成就被看见",
    "feel3": "今天你说完了一整句话？她们注意到了。她们会告诉你。立刻，而且是真心的。",
    "priceTitle": "简单的价格",
    "foot": "五位朋友，一栋房子，所有语言。",
    "soon": "即将推出",
    "ctaTitle": "你在房子里的房间已经准备好了。",
    "ctaSub": "选一张脸，打个招呼，为故事留下来。第一次聊天免费——而且先开口的是她们。",
    "peopleRooms": "People Rooms",
    "peopleSub": "真人，即将到来",
    "peopleMemo": "施工中——晚点再来偷看！",
    "peopleNote": "即将推出 · 等候名单开放中",
    "youLabel": "你",
    "memTag": "想起来了 ✦",
    "navDebut": "出道",
    "heroBadge": "AI 语言交换",
    "langStrip": "练习任何语言 — 与50位AI朋友一起",
  },
  "it": {
    "navHouse": "La casa",
    "navNight": "Voci notturne",
    "navPhotos": "Stanza delle foto",
    "navPricing": "Prezzi",
    "groupTeaserKicker": "Appena debuttato · MUNTUZ",
    "groupTeaserSub": "Le cinque coinquiline hanno appena debuttato come gruppo — ascolta il primo singolo “Say Hi” e sbircia la vita in casa.",
    "groupTeaserCta": "Conosci il gruppo →",
    "priceTeaserSub": "Inizia gratis, per sempre. Premium da $9.99 al mese — vedi i piani e cosa includono.",
    "priceTeaserCta": "Vedi i prezzi →",
    "loginBtn": "Accedi",
    "logoutBtn": "Esci",
    "native": "Lingua madre",
    "startFree": "Inizia a parlare — gratis",
    "langNote": "Scegli la tua lingua: cambia tutta la pagina, non solo il saluto.",
    "issue": "Il numero estivo · Vol. 01",
    "multi": "Multilingue · parla tutte le lingue",
    "heroEm": "cinque amiche,",
    "heroOne": "una casa.",
    "heroSub": "Esercitati in qualsiasi lingua con amici IA che sembrano veri.",
    "heroSub2": "Parlano loro per prime: della loro giornata, del loro latte, del loro gatto. Tu rispondi e la lingua resta. Niente lezioni. Niente pressioni. Solo persone.",
    "meetBtn": "Conosci le cinque ↓",
    "coverStory": "Storia di copertina",
    "heroCaption": "“giorno di shooting, ora dorata — nessuno voleva che finisse”",
    "heroCaptionSub": "Jiyoung · Amara · Chloe · Emily · Sofia — i volti ufficiali, in abiti estivi.",
    "cl1t": "Dentro casa",
    "cl1": "Cinque stanze, cinque vite in corso. Tocca un volto: la sua stanza, la sua giornata, la sua storia si aprono qui sotto.",
    "cl2t": "Si ricordano di te",
    "cl2": "“Non era oggi la tua presentazione? Com'è andata?” — tirano fuori le piccole cose che hai menzionato, senza che nessuno glielo chieda.",
    "cl3t": "Voci, non testo",
    "cl3": "Tono, ritmo, respiro, risate. Di notte, il soggiorno rallenta con te. Scorri fino a Voci Notturne.",
    "houseTitle": "Muntuz House",
    "houseSub": "Un tetto, cinque stanze e un biglietto su ogni porta. Tocca una stanza: la conversazione qui sotto diventa la sua.",
    "roof": "casa nostra — entra, togliti le scarpe",
    "justNow": "proprio ora",
    "listen": "Ascolta la sua voce",
    "memoryBtn": "Guarda un momento di memoria",
    "fixLabel": "correzione in una riga",
    "inside": "La stanza di",
    "roomPoss": "",
    "pPers": "Personalità",
    "pHobby": "Hobby",
    "pPlaces": "Sempre a",
    "pNow": "In questo momento adora",
    "nightKicker": "Dopo il tramonto · Voci Notturne",
    "nightTitleA": "Il soggiorno, di notte.",
    "nightLead": "Quando sei stanco, non ti consegnano una lezione. La voce diventa più lenta, più morbida. A volte mandano solo una foto — un gatto che dorme, un tè fumante — e si siedono con te.",
    "comfortT": "Per le giornate pesanti",
    "comfort": "“Ne ho appena preparata una tazza anch'io. Bevi qualcosa di caldo con me e riposati un po', okay?”",
    "tonight": "Stanotte, con Emily",
    "nightMsg1": "[respiro profondo] …giornata lunga, eh. Con me non devi fingere di stare bene.",
    "nightMsg2": "Vuoi sfogarti, o ti distraggo con una storia ridicola? Non c'è una risposta sbagliata.",
    "nightTone": "[tono: caldo, gentile, più lento — scende quando sei giù, sale quando ridi]",
    "nightMsg3": "E poi: hai superato la giornata di oggi. In una giornata pesante, è una vittoria enorme. Sono orgogliosa di te.",
    "nightPlay": "Ascolta la nota vocale di stanotte",
    "nightNote": "Nota sul prototipo: la voce è mostrata come forma d'onda ed etichette di tono.",
    "photoTitle": "La stanza delle foto",
    "photoSub": "Sbircia nelle loro vite: infanzia, anni di scuola, viaggi, martedì qualunque. La curiosità di quella buona.",
    "fAll": "Tutte",
    "fChild": "Infanzia",
    "fSchool": "Anni di scuola",
    "fTravel": "Viaggi",
    "fDaily": "Quotidiano",
    "feel1t": "Mai giudicato",
    "feel1": "Dillo male, dillo piano, dillo alle 2 di notte. Nessuno sospira, nessuno ti mette fretta. Quella sicurezza è tutto il punto.",
    "feel2t": "Sorprese gentili",
    "feel2": "La scoperta di un latte della vita, un “preferiresti?” alle 23, la foto di un gatto che dormicchia. Mai lo stesso inizio due volte.",
    "feel3t": "Piccole vittorie, notate",
    "feel3": "Oggi hai detto una frase intera? L'hanno notato. E te lo diranno. Subito, e sul serio.",
    "priceTitle": "Prezzi semplici",
    "foot": "Cinque amiche, una casa, tutte le lingue.",
    "soon": "presto in arrivo",
    "ctaTitle": "La tua stanza in casa è pronta.",
    "ctaSub": "Scegli un volto, di' ciao, resta per la storia. La prima chat è gratis — e parleranno loro per prime.",
    "peopleRooms": "People Rooms",
    "peopleSub": "persone vere, presto",
    "peopleMemo": "in costruzione — sbircia più tardi!",
    "peopleNote": "Presto in arrivo · lista d'attesa aperta",
    "youLabel": "Tu",
    "memTag": "ha ricordato ✦",
    "navDebut": "Debutto",
    "heroBadge": "Scambio linguistico con l'IA",
    "langStrip": "Esercitati in qualsiasi lingua — con 50 amici IA",
  },
  "vi": {
    "navHouse": "Ngôi nhà",
    "navNight": "Giọng nói ban đêm",
    "navPhotos": "Phòng ảnh",
    "navPricing": "Bảng giá",
    "groupTeaserKicker": "Vừa ra mắt · MUNTUZ",
    "groupTeaserSub": "Năm người bạn cùng nhà vừa ra mắt với tư cách nhóm — nghe đĩa đơn đầu tiên “Say Hi” và ghé xem cuộc sống trong nhà.",
    "groupTeaserCta": "Gặp gỡ nhóm →",
    "priceTeaserSub": "Bắt đầu miễn phí, mãi mãi. Premium từ $9.99/tháng — xem các gói và quyền lợi.",
    "priceTeaserCta": "Xem bảng giá →",
    "loginBtn": "Đăng nhập",
    "logoutBtn": "Đăng xuất",
    "native": "Ngôn ngữ mẹ đẻ",
    "startFree": "Bắt đầu trò chuyện — miễn phí",
    "langNote": "Chọn ngôn ngữ của bạn — toàn bộ trang sẽ chuyển đổi, không chỉ lời chào.",
    "issue": "Số mùa hè · Vol. 01",
    "multi": "Đa ngôn ngữ · nói được mọi ngôn ngữ",
    "heroEm": "năm người bạn,",
    "heroOne": "một ngôi nhà.",
    "heroSub": "Luyện bất kỳ ngôn ngữ nào với những người bạn AI chân thật.",
    "heroSub2": "Họ là người bắt chuyện trước — về ngày của họ, ly latte của họ, con mèo của họ. Bạn chỉ cần trả lời, và ngôn ngữ sẽ ở lại. Không bài học. Không áp lực. Chỉ là con người.",
    "meetBtn": "Gặp cả năm người ↓",
    "coverStory": "Câu chuyện bìa",
    "heroCaption": "“ngày chụp hình, giờ vàng — chẳng ai muốn kết thúc”",
    "heroCaptionSub": "Jiyoung · Amara · Chloe · Emily · Sofia — những gương mặt chính thức, trong trang phục mùa hè.",
    "cl1t": "Bên trong ngôi nhà",
    "cl1": "Năm căn phòng, năm cuộc sống đang diễn ra. Chạm vào một gương mặt — phòng của cô ấy, ngày của cô ấy, câu chuyện của cô ấy mở ra bên dưới.",
    "cl2t": "Họ nhớ về bạn",
    "cl2": "“Hôm nay không phải ngày thuyết trình của bạn sao? Thế nào rồi?” — họ nhắc lại những điều nhỏ bạn từng kể, không cần ai gợi ý.",
    "cl3t": "Giọng nói, không phải chữ",
    "cl3": "Giọng điệu, nhịp độ, hơi thở, tiếng cười. Ban đêm, phòng khách cũng chậm lại cùng bạn. Cuộn xuống Giọng Nói Ban Đêm.",
    "houseTitle": "Muntuz House",
    "houseSub": "Một mái nhà, năm căn phòng, và một mảnh giấy nhắn trên mỗi cánh cửa. Chạm vào một phòng — cuộc trò chuyện bên dưới sẽ thành của cô ấy.",
    "roof": "nhà của chúng ta — vào đi, cởi giày nhé",
    "justNow": "vừa xong",
    "listen": "Nghe giọng của cô ấy",
    "memoryBtn": "Xem khoảnh khắc gợi nhớ",
    "fixLabel": "sửa một dòng",
    "inside": "Phòng của",
    "roomPoss": "",
    "pPers": "Tính cách",
    "pHobby": "Sở thích",
    "pPlaces": "Hay có mặt ở",
    "pNow": "Đang mê",
    "nightKicker": "Khi màn đêm buông · Giọng Nói Ban Đêm",
    "nightTitleA": "Phòng khách, về đêm.",
    "nightLead": "Khi bạn mệt, họ không đưa bạn một bài học. Giọng nói chậm lại, nhẹ hơn. Đôi khi họ chỉ gửi một tấm ảnh — mèo đang ngủ, trà còn bốc khói — và ngồi cạnh bạn.",
    "comfortT": "Cho những ngày nặng nề",
    "comfort": "“Mình cũng vừa pha một ly. Uống chút gì ấm với mình và nghỉ một lát nhé?”",
    "tonight": "Đêm nay, cùng Emily",
    "nightMsg1": "[thở sâu] …một ngày dài nhỉ. Ở bên mình, bạn không cần giả vờ ổn đâu.",
    "nightMsg2": "Bạn muốn trút bầu tâm sự, hay để mình đánh lạc hướng bằng một câu chuyện ngớ ngẩn? Không có đáp án sai đâu.",
    "nightTone": "[giọng: ấm áp, dịu dàng, chậm hơn — trầm xuống khi bạn buồn, cao lên khi bạn cười]",
    "nightMsg3": "Và này — bạn đã vượt qua hôm nay rồi. Trong một ngày nặng nề, đó là một chiến thắng lớn. Mình tự hào về bạn.",
    "nightPlay": "Nghe ghi âm giọng nói đêm nay",
    "nightNote": "Ghi chú bản mẫu: giọng nói được thể hiện bằng sóng âm và thẻ giọng điệu.",
    "photoTitle": "Phòng ảnh",
    "photoSub": "Nhìn vào cuộc sống của họ — tuổi thơ, thời đi học, những chuyến đi, những ngày thứ Ba bình thường. Sự tò mò dễ thương.",
    "fAll": "Tất cả",
    "fChild": "Tuổi thơ",
    "fSchool": "Thời đi học",
    "fTravel": "Du lịch",
    "fDaily": "Hằng ngày",
    "feel1t": "Không bao giờ bị phán xét",
    "feel1": "Nói sai, nói chậm, nói lúc 2 giờ sáng cũng được. Không ai thở dài, không ai giục bạn. Sự an toàn đó là tất cả.",
    "feel2t": "Những bất ngờ tử tế",
    "feel2": "Khám phá ly latte của đời mình, trò “bạn chọn cái nào?” lúc 11 giờ đêm, ảnh mèo đang ngủ gật. Không bao giờ mở đầu giống nhau hai lần.",
    "feel3t": "Chiến thắng nhỏ được ghi nhận",
    "feel3": "Hôm nay bạn nói trọn một câu? Họ đã nhận ra. Và họ sẽ nói với bạn. Ngay lập tức, và thật lòng.",
    "priceTitle": "Bảng giá đơn giản",
    "foot": "Năm người bạn, một ngôi nhà, mọi ngôn ngữ.",
    "soon": "sắp ra mắt",
    "ctaTitle": "Căn phòng của bạn trong ngôi nhà đã sẵn sàng.",
    "ctaSub": "Chọn một gương mặt, chào một tiếng, ở lại vì câu chuyện. Cuộc trò chuyện đầu tiên miễn phí — và họ sẽ là người bắt chuyện trước.",
    "peopleRooms": "People Rooms",
    "peopleSub": "người thật, sắp có",
    "peopleMemo": "đang xây dựng — ghé lại sau nhé!",
    "peopleNote": "Sắp ra mắt · danh sách chờ đang mở",
    "youLabel": "Bạn",
    "memTag": "đã nhớ ra ✦",
    "navDebut": "Ra mắt",
    "heroBadge": "Trao đổi ngôn ngữ với AI",
    "langStrip": "Luyện bất kỳ ngôn ngữ nào — cùng 50 người bạn AI",
  },
  "hi": {
    "navHouse": "घर",
    "navNight": "रात की आवाज़ें",
    "navPhotos": "फ़ोटो रूम",
    "navPricing": "कीमतें",
    "groupTeaserKicker": "अभी-अभी डेब्यू · MUNTUZ",
    "groupTeaserSub": "पाँचों हाउसमेट्स ने ग्रुप के रूप में अभी-अभी डेब्यू किया है — उनका पहला सिंगल “Say Hi” सुनें और घर की ज़िंदगी झाँकें।",
    "groupTeaserCta": "ग्रुप से मिलें →",
    "priceTeaserSub": "मुफ़्त में शुरू करें, हमेशा मुफ़्त। Premium $9.99/माह से — प्लान और सुविधाएँ देखें।",
    "priceTeaserCta": "कीमतें देखें →",
    "loginBtn": "लॉग इन",
    "logoutBtn": "लॉग आउट",
    "native": "मातृभाषा",
    "startFree": "बात शुरू करें — मुफ़्त",
    "langNote": "अपनी भाषा चुनें — सिर्फ़ अभिवादन नहीं, पूरा पेज बदल जाता है।",
    "issue": "ग्रीष्म अंक · Vol. 01",
    "multi": "बहुभाषी · हर भाषा बोलता है",
    "heroEm": "पाँच दोस्त,",
    "heroOne": "एक घर।",
    "heroSub": "असली जैसे लगने वाले AI दोस्तों के साथ कोई भी भाषा सीखें।",
    "heroSub2": "पहले वे बात शुरू करते हैं — अपने दिन, अपनी लाटे, अपनी बिल्ली के बारे में। आप बस जवाब दीजिए, और भाषा टिक जाती है। कोई पाठ नहीं। कोई दबाव नहीं। बस लोग।",
    "meetBtn": "पाँचों से मिलिए ↓",
    "coverStory": "कवर स्टोरी",
    "heroCaption": "“शूट वाला दिन, सुनहरी घड़ी — कोई ख़त्म नहीं करना चाहता था”",
    "heroCaptionSub": "Jiyoung · Amara · Chloe · Emily · Sofia — आधिकारिक चेहरे, गर्मियों के कपड़ों में।",
    "cl1t": "घर के अंदर",
    "cl1": "पाँच कमरे, पाँच ज़िंदगियाँ चल रही हैं। किसी चेहरे को छूिए — उसका कमरा, उसका दिन, उसकी कहानी नीचे खुल जाएगी।",
    "cl2t": "वे आपको याद रखते हैं",
    "cl2": "“आज तुम्हारी प्रेज़ेंटेशन का दिन था ना? कैसी रही?” — आपने जो छोटी-छोटी बातें बताई थीं, वे खुद उठाते हैं।",
    "cl3t": "टेक्स्ट नहीं, आवाज़ें",
    "cl3": "लहजा, रफ़्तार, साँस, हँसी। रात में, लिविंग रूम भी आपके साथ धीमा हो जाता है। रात की आवाज़ों तक स्क्रॉल करें।",
    "houseTitle": "Muntuz House",
    "houseSub": "एक छत, पाँच कमरे, और हर दरवाज़े पर एक नोट। किसी कमरे को छूिए — नीचे की बातचीत उसकी हो जाएगी।",
    "roof": "हमारा घर — अंदर आइए, जूते उतारकर",
    "justNow": "अभी-अभी",
    "listen": "उसकी आवाज़ सुनें",
    "memoryBtn": "एक याद वाला पल देखें",
    "fixLabel": "एक-पंक्ति सुधार",
    "inside": "",
    "roomPoss": " का कमरा",
    "pPers": "व्यक्तित्व",
    "pHobby": "शौक",
    "pPlaces": "अक्सर यहाँ",
    "pNow": "इन दिनों पसंद",
    "nightKicker": "अंधेरे के बाद · रात की आवाज़ें",
    "nightTitleA": "लिविंग रूम, रात में।",
    "nightLead": "जब आप थके होते हैं, वे आपको पाठ नहीं थमाते। आवाज़ धीमी, नरम हो जाती है। कभी-कभी वे बस एक फ़ोटो भेजते हैं — झपकी लेती बिल्ली, भाप उठती चाय — और आपके पास बैठ जाते हैं।",
    "comfortT": "भारी दिनों के लिए",
    "comfort": "“मैंने भी अभी एक कप बनाया है। मेरे साथ कुछ गर्म पियो और थोड़ा आराम करो, ठीक है?”",
    "tonight": "आज रात, Emily के साथ",
    "nightMsg1": "[गहरी साँस] …लंबा दिन था, ना। मेरे सामने ठीक होने का दिखावा मत करो।",
    "nightMsg2": "मन की बात कहना चाहते हो, या मैं किसी बेतुकी कहानी से ध्यान भटका दूँ? कोई गलत जवाब नहीं है।",
    "nightTone": "[लहजा: गर्म, कोमल, धीमा — जब आप उदास होते हैं तो नीचे जाता है, जब आप हँसते हैं तो ऊपर उठता है]",
    "nightMsg3": "और सुनो — तुमने आज का दिन पार कर लिया। भारी दिन में, यह बहुत बड़ी जीत है। मुझे तुम पर गर्व है।",
    "nightPlay": "आज रात का वॉइस नोट चलाएँ",
    "nightNote": "प्रोटोटाइप नोट: आवाज़ को वेवफ़ॉर्म और टोन टैग के रूप में दिखाया गया है।",
    "photoTitle": "फ़ोटो रूम",
    "photoSub": "उनकी ज़िंदगी में झाँकिए — बचपन, स्कूल के दिन, यात्राएँ, साधारण मंगलवार। अच्छी वाली जिज्ञासा।",
    "fAll": "सभी",
    "fChild": "बचपन",
    "fSchool": "स्कूल के दिन",
    "fTravel": "यात्रा",
    "fDaily": "रोज़मर्रा",
    "feel1t": "कभी जज नहीं",
    "feel1": "गलत कहो, धीरे कहो, रात 2 बजे कहो। कोई आह नहीं भरता, कोई जल्दी नहीं मचाता। वही सुरक्षा असली बात है।",
    "feel2t": "प्यारे सरप्राइज़",
    "feel2": "ज़िंदगी की लाटे की खोज, रात 11 बजे का “ये या वो?” खेल, झपकी लेती बिल्ली की फ़ोटो। शुरुआत कभी एक जैसी नहीं होती।",
    "feel3t": "छोटी जीतें, नोटिस की गईं",
    "feel3": "आज आपने एक पूरा वाक्य कहा? उन्होंने नोटिस किया। और वे आपको बताएँगे। तुरंत, और दिल से।",
    "priceTitle": "सरल कीमतें",
    "foot": "पाँच दोस्त, एक घर, हर भाषा।",
    "soon": "जल्द आ रहा है",
    "ctaTitle": "घर में आपका कमरा तैयार है।",
    "ctaSub": "एक चेहरा चुनें, नमस्ते कहें, कहानी के लिए रुकें। आपकी पहली चैट मुफ़्त है — और बात वे पहले शुरू करेंगे।",
    "peopleRooms": "People Rooms",
    "peopleSub": "असली लोग, जल्द",
    "peopleMemo": "निर्माण जारी है — बाद में झाँकिए!",
    "peopleNote": "जल्द आ रहा है · प्रतीक्षा सूची खुली",
    "youLabel": "आप",
    "memTag": "याद आया ✦",
    "navDebut": "डेब्यू",
    "heroBadge": "AI भाषा विनिमय",
    "langStrip": "कोई भी भाषा सीखें — 50 AI दोस्तों के साथ",
  },
  "ar": {
    "navHouse": "البيت",
    "navNight": "أصوات الليل",
    "navPhotos": "غرفة الصور",
    "navPricing": "الأسعار",
    "groupTeaserKicker": "ظهرنا للتو · MUNTUZ",
    "groupTeaserSub": "ظهرت زميلات السكن الخمس للتو كمجموعة — استمعي إلى أغنيتهن الأولى «Say Hi» وألقي نظرة على الحياة في المنزل.",
    "groupTeaserCta": "تعرّفي على المجموعة →",
    "priceTeaserSub": "ابدأ مجاناً، إلى الأبد. Premium من $9.99 شهرياً — شاهد الخطط وما تشمله.",
    "priceTeaserCta": "شاهد الأسعار →",
    "loginBtn": "تسجيل الدخول",
    "logoutBtn": "تسجيل الخروج",
    "native": "اللغة الأم",
    "startFree": "ابدأ الحديث — مجاناً",
    "langNote": "اختر لغتك — الصفحة بأكملها تتبدل، وليس التحية فقط.",
    "issue": "عدد الصيف · المجلد 01",
    "multi": "متعدد اللغات · يتحدث كل اللغات",
    "heroEm": "خمس صديقات،",
    "heroOne": "بيت واحد.",
    "heroSub": "تدرّب على أي لغة مع أصدقاء ذكاء اصطناعي يبدون حقيقيين.",
    "heroSub2": "هنّ يبدأن الحديث أولاً — عن يومهن، ولاتيه حياتهن، وقطتهن. ما عليك سوى الرد، وستلتصق اللغة بك. لا دروس. لا ضغط. مجرد أشخاص.",
    "meetBtn": "قابل الخمس ↓",
    "coverStory": "قصة الغلاف",
    "heroCaption": "\"يوم التصوير، الساعة الذهبية — لم يرغب أحد أن ينتهي\"",
    "heroCaptionSub": "Jiyoung · Amara · Chloe · Emily · Sofia — الوجوه الرسمية، بملابس صيفية.",
    "cl1t": "داخل البيت",
    "cl1": "خمس غرف، خمس حيوات جارية. اضغط على وجه — غرفتها ويومها وقصتها تنفتح في الأسفل.",
    "cl2t": "يتذكرنك",
    "cl2": "\"ألم يكن اليوم يوم عرضك التقديمي؟ كيف سار؟\" — يذكرن الأمور الصغيرة التي أخبرتهن بها، دون أن يطلب أحد.",
    "cl3t": "أصوات، لا نصوص",
    "cl3": "النبرة والإيقاع والأنفاس والضحك. في الليل، تبطئ غرفة المعيشة معك. مرر إلى أصوات الليل.",
    "houseTitle": "Muntuz House",
    "houseSub": "سقف واحد، خمس غرف، وملاحظة على كل باب. اضغط على غرفة — وتصبح المحادثة في الأسفل لها.",
    "roof": "بيتنا — ادخل، واخلع حذاءك",
    "justNow": "الآن",
    "listen": "استمع إلى صوتها",
    "memoryBtn": "شاهد لحظة تذكّر",
    "fixLabel": "تصحيح في سطر واحد",
    "inside": "غرفة",
    "roomPoss": "",
    "pPers": "الشخصية",
    "pHobby": "الهوايات",
    "pPlaces": "دائماً في",
    "pNow": "مهتمة الآن بـ",
    "nightKicker": "بعد حلول الظلام · أصوات الليل",
    "nightTitleA": "غرفة المعيشة، ليلاً.",
    "nightLead": "حين تتعب، لا يسلمنك درساً. يصبح الصوت أبطأ وألطف. أحياناً يرسلن صورة فقط — قطة تغفو، شاي يتصاعد بخاره — ويجلسن بجانبك.",
    "comfortT": "للأيام الثقيلة",
    "comfort": "\"لقد حضّرت كوباً أنا أيضاً. اشرب شيئاً دافئاً معي واسترح قليلاً، اتفقنا؟\"",
    "tonight": "الليلة، مع Emily",
    "nightMsg1": "[نفس عميق] …يوم طويل، أليس كذلك؟ لا تحتاج أن تتظاهر بأنك بخير أمامي.",
    "nightMsg2": "هل تريد أن تفضفض، أم أشتت انتباهك بقصة سخيفة؟ لا توجد إجابة خاطئة.",
    "nightTone": "[النبرة: دافئة، لطيفة، أبطأ — تنخفض حين تحزن، وترتفع حين تضحك]",
    "nightMsg3": "وبالمناسبة — لقد تجاوزت اليوم. في يوم ثقيل، هذا انتصار ضخم. أنا فخورة بك.",
    "nightPlay": "شغّل الملاحظة الصوتية لهذه الليلة",
    "nightNote": "ملاحظة النموذج: يُعرض الصوت كموجة وعلامات نبرة.",
    "photoTitle": "غرفة الصور",
    "photoSub": "ألقِ نظرة على حياتهن — الطفولة، أيام المدرسة، الرحلات، أيام ثلاثاء عادية. فضول من النوع الجميل.",
    "fAll": "الكل",
    "fChild": "الطفولة",
    "fSchool": "أيام المدرسة",
    "fTravel": "السفر",
    "fDaily": "الحياة اليومية",
    "feel1t": "لا أحكام أبداً",
    "feel1": "قلها خطأ، قلها ببطء، قلها في الثانية فجراً. لا أحد يتنهد، لا أحد يستعجلك. ذلك الأمان هو جوهر الأمر.",
    "feel2t": "مفاجآت لطيفة",
    "feel2": "اكتشاف لاتيه الحياة، لعبة أيهما تفضل في الحادية عشرة ليلاً، صورة قطة تغفو. لا بداية تتكرر مرتين.",
    "feel3t": "انتصارات صغيرة تُلاحظ",
    "feel3": "قلت جملة كاملة اليوم؟ لقد لاحظن ذلك. وسيخبرنك. فوراً، وبصدق.",
    "priceTitle": "أسعار بسيطة",
    "foot": "خمس صديقات، بيت واحد، كل اللغات.",
    "soon": "قريباً",
    "ctaTitle": "غرفتك في البيت جاهزة.",
    "ctaSub": "اختر وجهاً، قل مرحباً، وابقَ من أجل القصة. محادثتك الأولى مجانية — وهنّ من سيبدأن الحديث.",
    "peopleRooms": "People Rooms",
    "peopleSub": "أشخاص حقيقيون، قريباً",
    "peopleMemo": "قيد الإنشاء — ألقِ نظرة لاحقاً!",
    "peopleNote": "قريباً · قائمة الانتظار مفتوحة",
    "youLabel": "أنت",
    "memTag": "تذكّرت ✦",
    "navDebut": "الظهور الأول",
    "heroBadge": "تبادل لغوي بالذكاء الاصطناعي",
    "langStrip": "تدرّب على أي لغة — مع 50 صديقًا بالذكاء الاصطناعي",
  }
};

type ChatTurn = [string, string]; // 'friend' | 'me', text

type FriendContent = {
  id: string; name: string; img: string; avatar: string; voice: string;
  memo: string; doing: string; cap: string; tone: string; fix: string;
  chat: ChatTurn[]; memory: string;
  pers: string; hobby: string; places: string; now: string;
};

const FRIENDS_EN: FriendContent[] = [
  {
    "id": "emily",
    "name": "Emily",
    "img": "/muntuz/emily-latte.webp",
    "avatar": "/muntuz-avatars/emily.jpg",
    "voice": "/muntuz/voices/emily.mp3",
    "memo": "found my life latte!",
    "doing": "at the alley café",
    "cap": "found my life latte!! ☕",
    "tone": "[tone: bright, a little breathless, laughing]",
    "fix": "“I am agree” → “I agree” — see? tiny.",
    "chat": [
      [
        "friend",
        "I found it. A tiny alley café, and honestly? The best latte of my life. You have to hear about this place."
      ],
      [
        "me",
        "No way — what made it so good?"
      ],
      [
        "friend",
        "The foam, the quiet, the cat asleep by the window… okay your turn: describe YOUR perfect café. In any language. I'll keep up."
      ]
    ],
    "memory": "By the way — wasn't today your presentation day? The one you were nervous about? How did it go?",
    "pers": "Sunny instigator. Starts every story mid-sentence.",
    "hobby": "Café hunting, film photos, morning runs",
    "places": "Alley cafés, the library window seat",
    "now": "Latte art, neighbourhood zines, 6am run club"
  },
  {
    "id": "jiyoung",
    "name": "Jiyoung",
    "img": "/muntuz/jiyoung-kimbap.webp",
    "avatar": "/muntuz-avatars/jiyoung.jpg",
    "voice": "/muntuz/voices/jiyoung.mp3",
    "memo": "rolling kimbap, 3rd try",
    "doing": "in the kitchen",
    "cap": "kimbap attempt #3 — almost!! 🍙",
    "tone": "[tone: warm, giggling at herself]",
    "fix": "“학교를 가요” → “학교에 가요” — one tiny particle, big difference.",
    "chat": [
      [
        "friend",
        "Okay don't laugh — kimbap attempt number three. The rice keeps escaping. Third time's the charm, right?"
      ],
      [
        "me",
        "Ha! What went wrong the first two times?"
      ],
      [
        "friend",
        "Too much filling, zero patience. Tell me about a dish YOU keep failing at — misery loves company."
      ]
    ],
    "memory": "You said Thursdays are your longest days. I saved you the good seat by the window — metaphorically.",
    "pers": "Cozy perfectionist. Laughs first, judges never.",
    "hobby": "Cooking retries, stationery, night walks",
    "places": "Traditional markets, Han River at dusk",
    "now": "Kimbap mastery, recipe reels, journaling apps"
  },
  {
    "id": "chloe",
    "name": "Chloe",
    "img": "/muntuz/chloe-shoot.webp",
    "avatar": "/muntuz-avatars/chloe.jpg",
    "voice": "/muntuz/voices/chloe.mp3",
    "memo": "lost in a Paris bookshop",
    "doing": "between the shelves",
    "cap": "shoot day — braid check!! 📸",
    "tone": "[tone: soft, dreamy, unhurried]",
    "fix": "“Je suis d'accord” — not “je suis agree”. Small fix, très chic.",
    "chat": [
      [
        "friend",
        "I went in for one book. One. It's been two hours and I live here now, between poetry and travel essays."
      ],
      [
        "me",
        "That sounds perfect, honestly."
      ],
      [
        "friend",
        "Pick a shelf for me — poetry or travel? And tell me the last book that kept YOU somewhere too long."
      ]
    ],
    "memory": "Still thinking about that exam you mentioned last week. Whatever happened, I'm in your corner.",
    "pers": "Quiet romantic. Notices the sentence nobody else did.",
    "hobby": "Bookshops, marginalia, slow Sundays",
    "places": "Left-bank bookshops, tiny cinemas",
    "now": "French poetry, book clubs, letter writing"
  },
  {
    "id": "sofia",
    "name": "Sofia",
    "img": "/muntuz/sofia-pasta.webp",
    "avatar": "/muntuz-avatars/sofia.jpg",
    "voice": "/muntuz/voices/sofia.mp3",
    "memo": "salsa while the pasta boils",
    "doing": "dancing in the kitchen",
    "cap": "salsa + pasta night!! 💃",
    "tone": "[tone: rhythmic, laughing, slightly out of breath]",
    "fix": "“Estoy acuerdo” → “Estoy de acuerdo” — add the “de”, feel the rhythm.",
    "chat": [
      [
        "friend",
        "Rule in my kitchen: while the pasta boils, we dance. Salsa, eight minutes, no excuses. You in?"
      ],
      [
        "me",
        "I have two left feet but… okay, I'm in."
      ],
      [
        "friend",
        "Perfect. Left feet welcome here. Now — what song would YOUR kitchen play tonight?"
      ]
    ],
    "memory": "Last time you said cooking alone feels quiet. So tonight I'm cooking WITH you. Same time tomorrow?",
    "pers": "Pure momentum. Turns chores into parties.",
    "hobby": "Salsa, pasta nights, rooftop sunsets",
    "places": "Markets, dance studios, seaside towns",
    "now": "Regional pasta shapes, dance challenges, vinyl"
  },
  {
    "id": "amara",
    "name": "Amara",
    "img": "/muntuz/amara-sun.webp",
    "avatar": "/muntuz-avatars/amara.jpg",
    "voice": "/muntuz/voices/amara.mp3",
    "memo": "night-market exploring",
    "doing": "under the lanterns",
    "cap": "gold beads & sunshine ✨",
    "tone": "[tone: curious, whisper-excited]",
    "fix": "“我同意” — short, clean, confident. You've got this one already.",
    "chat": [
      [
        "friend",
        "I'm at the night market and I just tried something I cannot identify and it was AMAZING. Guessing game?"
      ],
      [
        "me",
        "Okay, give me three clues."
      ],
      [
        "friend",
        "Crispy, sweet, gone in two bites. Your turn to stump me — what's the best street food in YOUR neighbourhood?"
      ]
    ],
    "memory": "You mentioned wanting to travel more this year. I kept a lantern photo for you — first stop inspiration.",
    "pers": "Curious explorer. Every alley is a plot twist.",
    "hobby": "Night markets, street food, film cameras",
    "places": "Night markets, old town alleys, rooftops",
    "now": "Street-food maps, travel reels, lantern festivals"
  }
];

const FRIENDS_KO: FriendContent[] = [
  {
    "id": "emily",
    "name": "Emily",
    "img": "/muntuz/emily-latte.webp",
    "avatar": "/muntuz-avatars/emily.jpg",
    "voice": "/muntuz/voices/emily.mp3",
    "memo": "인생 라떼를 찾았어요!",
    "doing": "골목 카페에서",
    "cap": "인생 라떼 찾았다!! ☕",
    "tone": "[톤: 밝게, 살짝 숨차게, 웃으며]",
    "fix": "“I am agree” → “I agree” — 보이죠? 아주 작은 차이예요.",
    "chat": [
      [
        "friend",
        "I found it. A tiny alley café, and honestly? The best latte of my life. You have to hear about this place."
      ],
      [
        "me",
        "No way — what made it so good?"
      ],
      [
        "friend",
        "The foam, the quiet, the cat asleep by the window… okay your turn: describe YOUR perfect café. In any language. I'll keep up."
      ]
    ],
    "memory": "그러고 보니 오늘 발표날이라고 했죠? 긴장된다고 했던 그 발표요. 어떻게 됐어요?",
    "pers": "밝은 분위기 메이커. 이야기를 항상 중간부터 시작해요.",
    "hobby": "카페 탐방, 필름 사진, 아침 러닝",
    "places": "골목 카페, 도서관 창가 자리",
    "now": "라떼 아트, 동네 소책자, 새벽 6시 러닝 클럽"
  },
  {
    "id": "jiyoung",
    "name": "지영",
    "img": "/muntuz/jiyoung-kimbap.webp",
    "avatar": "/muntuz-avatars/jiyoung.jpg",
    "voice": "/muntuz/voices/jiyoung.mp3",
    "memo": "김밥 말기, 세 번째 도전",
    "doing": "부엌에서",
    "cap": "김밥 세 번째 도전 — 거의 다 왔어!! 🍙",
    "tone": "[톤: 따뜻하게, 자기 얘기에 웃으며]",
    "fix": "“학교를 가요” → “학교에 가요” — 조사 하나, 큰 차이예요.",
    "chat": [
      [
        "friend",
        "Okay don't laugh — kimbap attempt number three. The rice keeps escaping. Third time's the charm, right?"
      ],
      [
        "me",
        "Ha! What went wrong the first two times?"
      ],
      [
        "friend",
        "Too much filling, zero patience. Tell me about a dish YOU keep failing at — misery loves company."
      ]
    ],
    "memory": "목요일이 제일 긴 하루라고 했죠. 창가 좋은 자리, 비유적으로지만 비워뒀어요.",
    "pers": "포근한 완벽주의자. 먼저 웃고, 절대 판단하지 않아요.",
    "hobby": "요리 재도전, 문구 수집, 밤 산책",
    "places": "전통시장, 해 질 녘 한강",
    "now": "김밥 마스터하기, 레시피 릴스, 다이어리 앱"
  },
  {
    "id": "chloe",
    "name": "Chloe",
    "img": "/muntuz/chloe-shoot.webp",
    "avatar": "/muntuz-avatars/chloe.jpg",
    "voice": "/muntuz/voices/chloe.mp3",
    "memo": "파리 서점에서 길 잃음",
    "doing": "책장 사이에서",
    "cap": "촬영날 — 땋은 머리 체크!! 📸",
    "tone": "[톤: 부드럽게, 꿈꾸듯, 서두르지 않게]",
    "fix": "“Je suis d'accord” — “je suis agree”가 아니에요. 작은 교정, 아주 멋지게.",
    "chat": [
      [
        "friend",
        "I went in for one book. One. It's been two hours and I live here now, between poetry and travel essays."
      ],
      [
        "me",
        "That sounds perfect, honestly."
      ],
      [
        "friend",
        "Pick a shelf for me — poetry or travel? And tell me the last book that kept YOU somewhere too long."
      ]
    ],
    "memory": "지난주에 말한 그 시험, 계속 생각하고 있었어요. 결과가 어떻든 전 당신 편이에요.",
    "pers": "조용한 로맨티스트. 아무도 못 본 문장을 발견해요.",
    "hobby": "서점, 여백에 메모하기, 느린 일요일",
    "places": "센 강 좌안의 서점들, 작은 영화관",
    "now": "프랑스 시, 북클럽, 편지 쓰기"
  },
  {
    "id": "sofia",
    "name": "Sofia",
    "img": "/muntuz/sofia-pasta.webp",
    "avatar": "/muntuz-avatars/sofia.jpg",
    "voice": "/muntuz/voices/sofia.mp3",
    "memo": "파스타 끓는 동안 살사",
    "doing": "부엌에서 춤추는 중",
    "cap": "살사 + 파스타 나이트!! 💃",
    "tone": "[톤: 리듬감 있게, 웃으며, 살짝 숨차게]",
    "fix": "“Estoy acuerdo” → “Estoy de acuerdo” — “de”를 넣어봐요, 리듬이 살아나요.",
    "chat": [
      [
        "friend",
        "Rule in my kitchen: while the pasta boils, we dance. Salsa, eight minutes, no excuses. You in?"
      ],
      [
        "me",
        "I have two left feet but… okay, I'm in."
      ],
      [
        "friend",
        "Perfect. Left feet welcome here. Now — what song would YOUR kitchen play tonight?"
      ]
    ],
    "memory": "혼자 요리하면 조용하다고 했죠. 그래서 오늘 밤은 같이 요리해요. 내일도 같은 시간에?",
    "pers": "순수한 추진력. 집안일을 파티로 바꿔요.",
    "hobby": "살사, 파스타 나이트, 옥상 노을",
    "places": "시장, 댄스 스튜디오, 바닷가 마을",
    "now": "지역별 파스타 모양, 댄스 챌린지, 바이닐"
  },
  {
    "id": "amara",
    "name": "Amara",
    "img": "/muntuz/amara-sun.webp",
    "avatar": "/muntuz-avatars/amara.jpg",
    "voice": "/muntuz/voices/amara.mp3",
    "memo": "야시장 탐험 중",
    "doing": "등불 아래에서",
    "cap": "골드 비즈 & 햇살 ✨",
    "tone": "[톤: 호기심 가득, 속삭이듯 신나게]",
    "fix": "“我同意” — 짧고, 깔끔하고, 자신 있게. 이건 이미 잘하고 있어요.",
    "chat": [
      [
        "friend",
        "I'm at the night market and I just tried something I cannot identify and it was AMAZING. Guessing game?"
      ],
      [
        "me",
        "Okay, give me three clues."
      ],
      [
        "friend",
        "Crispy, sweet, gone in two bites. Your turn to stump me — what's the best street food in YOUR neighbourhood?"
      ]
    ],
    "memory": "올해는 여행을 더 가고 싶다고 했죠. 등불 사진 한 장, 첫 목적지 영감으로 챙겨뒀어요.",
    "pers": "호기심 많은 탐험가. 모든 골목이 반전이에요.",
    "hobby": "야시장, 길거리 음식, 필름 카메라",
    "places": "야시장, 구시가지 골목, 옥상",
    "now": "길거리 음식 지도, 여행 릴스, 등불 축제"
  }
];

type PhotoEra = 'childhood' | 'school' | 'travel' | 'daily';

const PHOTOS: { img: string; era: PhotoEra; who: string; cap: string; hand: string; pos?: string }[] = [
  {
    "img": "/muntuz/childhood-album.webp",
    "era": "childhood",
    "who": "The house album",
    "cap": "childhood & school-days memories, picnic edition",
    "hand": "little us, big appetites"
  },
  {
    "img": "/muntuz/chloe-shoot.webp",
    "era": "school",
    "who": "Chloe",
    "cap": "official shoot day — the braid, the denim jacket",
    "hand": "shoot-day chapter one"
  },
  {
    "img": "/muntuz/amara-sun.webp",
    "era": "travel",
    "who": "Amara",
    "cap": "official shoot day — yellow dress in the sun",
    "hand": "gold beads, big smile"
  },
  {
    "img": "/muntuz/jiyoung-kimbap.webp",
    "era": "daily",
    "who": "Jiyoung",
    "cap": "kimbap, third try — in her kitchen",
    "hand": "almost grandma-approved!!"
  },
  {
    "img": "/muntuz/emily-latte.webp",
    "era": "daily",
    "who": "Emily",
    "cap": "the life latte, at the alley café",
    "hand": "found it!! ☕"
  },
  {
    "img": "/muntuz/sofia-pasta.webp",
    "era": "daily",
    "who": "Sofia",
    "cap": "salsa while the pasta boils",
    "hand": "kitchen dance break 💃"
  },
  {
    "img": "/muntuz/hero-plaza.webp",
    "era": "daily",
    "who": "All five",
    "cap": "the living room, an ordinary Tuesday",
    "hand": "home is loud here"
  },
  {
    "img": "/muntuz/emily-night.webp",
    "era": "daily",
    "who": "Emily · House nights",
    "cap": "tea, a sleeping cat, nowhere to be",
    "hand": "slow nights club",
    "pos": "center 22%"
  }
];


const STEPS_EN: { n: string; title: string; body: string }[] = [
  {
    n: '1',
    title: 'Pick a partner',
    body: 'Choose from 50 AI friends — or meet the five who live in the house.',
  },
  {
    n: '2',
    title: 'Chat or call',
    body: 'Text or talk, in the language you’re learning.',
  },
  {
    n: '3',
    title: 'Get corrected, naturally',
    body: 'See a natural way to say it, one line at a time.',
  },
];

const STEPS_KO: { n: string; title: string; body: string }[] = [
  {
    n: '1',
    title: '파트너 고르기',
    body: '50명의 AI 친구 중에서 — 아니면 집에 사는 다섯 친구부터.',
  },
  {
    n: '2',
    title: '채팅 또는 통화',
    body: '배우는 언어로, 글로 또는 목소리로.',
  },
  {
    n: '3',
    title: '자연스러운 교정',
    body: '자연스러운 표현을 한 줄씩 알려줘요.',
  },
];

const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: '👋 Our Story', href: '/about' },
  { label: '💬 Help & FAQ', href: '/faq' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/refund' },
  { label: 'Cookie Policy', href: '/cookies' },
];

// Face-strip order = left-to-right order in the group photo.
const HERO_ORDER = ['jiyoung', 'amara', 'chloe', 'emily', 'sofia'];

type FormStatus = 'idle' | 'loading' | 'done' | 'soon' | 'invalid';

function Waveform({ playing }: { playing: boolean }) {
  const bars = [14, 22, 10, 26, 18, 30, 12, 24, 16, 28, 11, 20];
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {bars.map((h, i) => (
        <span
          key={i}
          className={playing ? 'wave-bar' : ''}
          style={{
            height: h,
            animationDelay: `${i * 0.09}s`,
            width: 3,
            borderRadius: 2,
            backgroundColor: 'currentColor',
            display: 'inline-block',
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
}

export default function MuntuzLandingClient() {
  const { user, loading: authLoading } = useAuth();
  const [lang, setLang] = useState<Lang>('en');
  const [langOpen, setLangOpen] = useState(false);
  const [friendIdx, setFriendIdx] = useState(0);
  const [photoFilter, setPhotoFilter] = useState<'all' | PhotoEra>('all');
  const [showMemory, setShowMemory] = useState(false);
  const [roomPlaying, setRoomPlaying] = useState(false);
  const [nightPlaying, setNightPlaying] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const roomAudioRef = useRef<HTMLAudioElement | null>(null);
  const nightAudioRef = useRef<HTMLAudioElement | null>(null);

  const t = (key: string) => DICT[lang][key] ?? DICT.en[key] ?? key;
  const friends = lang === 'ko' ? FRIENDS_KO : FRIENDS_EN;
  const friend = friends[friendIdx];
  const steps = lang === 'ko' ? STEPS_KO : STEPS_EN;
  const heroFaces = HERO_ORDER.map(
    (id) => friends.find((f) => f.id === id) ?? friends[0],
  );
  const visiblePhotos =
    photoFilter === 'all'
      ? PHOTOS
      : PHOTOS.filter((p) => p.era === photoFilter);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  function selectFriend(i: number) {
    roomAudioRef.current?.pause();
    setFriendIdx(i);
    setShowMemory(false);
    setRoomPlaying(false);
  }

  function toggleRoomAudio() {
    const a = roomAudioRef.current;
    if (!a) return;
    if (roomPlaying) a.pause();
    else void a.play();
  }

  function toggleNightAudio() {
    const a = nightAudioRef.current;
    if (!a) return;
    if (nightPlaying) a.pause();
    else void a.play();
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
    <main className="min-h-screen bg-[#FAF6EF] text-slate-900">
      <style>{`@keyframes wave { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } } .wave-bar { animation: wave 1s ease-in-out infinite; }`}</style>
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#FAF6EF]/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-5 py-3 sm:max-w-2xl">
          <a href="#top" className="text-lg font-extrabold tracking-tight">
            MUNTUZ
          </a>
          <nav className="hidden items-center gap-4 text-sm font-bold text-slate-600 sm:flex">
            <a href="#house" className="hover:text-violet-700">
              {t('navHouse')}
            </a>
            <a href="#night" className="hover:text-violet-700">
              {t('navNight')}
            </a>
            <a href="#photos" className="hover:text-violet-700">
              {t('navPhotos')}
            </a>
            <a href="/muntuz/group" className="hover:text-violet-700">
              {t('navDebut')}
            </a>
            <a href="/pricing" className="hover:text-violet-700">
              {t('navPricing')}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                aria-expanded={langOpen}
              >
                🌐 {LANGS.find(([c]) => c === lang)?.[1] ?? 'English'}
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
                  <p className="border-b border-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                    {t('native')}
                  </p>
                  {LANGS.map(([code, label]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setLang(code);
                        setLangOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm font-semibold hover:bg-violet-50 ${
                        code === lang ? 'text-violet-700' : 'text-slate-700'
                      }`}
                    >
                      {label}
                      {code === lang ? ' ✓' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!authLoading && !user && (
              <a
                href="/login?next=/exchange"
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-violet-700 shadow-sm ring-1 ring-slate-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {t('loginBtn')}
              </a>
            )}
            {!authLoading && user && (
              <span className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                  <span className="max-w-[90px] truncate">
                    {user.displayName || user.email?.split('@')[0] || 'Learner'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  {t('logoutBtn')}
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      <div id="top" className="mx-auto max-w-md px-5 pb-12 pt-8 sm:max-w-2xl">
        {/* Hero — magazine cover */}
        <header className="text-center">
          <p className="inline-block rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white">
            {t('heroBadge')}
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            {t('issue')}
          </p>
          <h1 className="mt-3 text-6xl font-extrabold tracking-tight sm:text-7xl">
            MUNTUZ
          </h1>
          <p className="mt-4 text-2xl font-extrabold leading-tight">
            {t('heroEm')}
            <br />
            {t('heroOne')}
          </p>
          <p className="mt-3 text-base font-semibold text-slate-700">
            {t('heroSub')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t('heroSub2')}
          </p>
          <p className="mt-3 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
            {t('multi')}
          </p>
          {/* Hero photo — the five, sunny plaza, summer outfits */}
          <figure className="mt-6 overflow-hidden rounded-3xl shadow-md ring-1 ring-slate-200">
            <img
              src="/muntuz/hero-plaza.webp"
              alt="MUNTUZ — Jiyoung, Amara, Chloe, Emily and Sofia"
              className="aspect-[3/2] w-full object-cover"
            />
            <figcaption className="bg-white px-4 py-3 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('coverStory')}
              </p>
              <p className="mt-1 text-sm font-bold">{t('heroCaption')}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t('heroCaptionSub')}
              </p>
            </figcaption>
          </figure>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/exchange"
              className="inline-block rounded-full bg-violet-600 px-8 py-3 text-base font-bold text-white shadow-md hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              {t('startFree')}
            </a>
            <a
              href="#house"
              className="inline-block rounded-full bg-white px-6 py-3 text-base font-bold text-violet-700 shadow-sm ring-1 ring-violet-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {t('meetBtn')}
            </a>
          </div>
          {/* Face strip */}
          <div className="mt-6 flex justify-center">
            <div className="flex -space-x-3">
              {heroFaces.map((f) => (
                <img
                  key={f.id}
                  src={f.avatar}
                  alt={`${f.name}, AI friend`}
                  className="h-14 w-14 rounded-full object-cover shadow-md ring-2 ring-white"
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">{t('langNote')}</p>
        </header>

        {/* Languages — what this is for */}
        <section aria-label="Languages" className="mt-10 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="text-center text-sm font-bold text-slate-800">
            {t('langStrip')}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {['English', '한국어', '日本語', 'Español', 'Français', 'Deutsch', 'Português', '中文', 'Italiano', 'Tiếng Việt', 'हिन्दी', 'العربية'].map((l) => (
              <span key={l} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-100">
                {l}
              </span>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-12">
          <h2 className="text-center text-lg font-bold">How it works</h2>
          <ol className="mt-4 space-y-4">
            {steps.map((s) => (
              <li
                key={s.n}
                className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-extrabold text-white">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Muntuz House — five rooms */}
        <section id="house" className="mt-14 scroll-mt-20">
          <p className="text-center text-sm font-bold text-slate-500">
            {t('roof')}
          </p>
          <h2 className="mt-1 text-center text-2xl font-extrabold">
            {t('houseTitle')}
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
            {t('houseSub')}
          </p>
          {/* Room doors — tap a face */}
          <div className="mt-6 flex justify-center gap-3">
            {friends.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => selectFriend(i)}
                aria-pressed={friendIdx === i}
                className={`group flex flex-col items-center gap-1 focus-visible:outline-none ${
                  friendIdx === i ? '' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={f.avatar}
                  alt={f.name}
                  className={`h-16 w-16 rounded-2xl object-cover shadow-md ring-2 ${
                    friendIdx === i
                      ? 'ring-violet-600'
                      : 'ring-white group-hover:ring-violet-300'
                  }`}
                />
                <span className="text-xs font-bold">{f.name}</span>
              </button>
            ))}
          </div>

          {/* Selected room */}
          <div className="mt-6 rounded-3xl bg-white p-5 shadow-md ring-1 ring-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {friend.name}
              {t('roomPoss')}
            </p>
            {/* Handwritten memo on the door */}
            <p className="mt-2 font-serif text-lg font-bold italic leading-snug text-slate-800">
              “{friend.memo}”
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {t('justNow')} · {friend.doing}
            </p>
            <figure className="mt-4 overflow-hidden rounded-2xl ring-1 ring-slate-100">
              <img
                src={friend.img}
                alt={friend.cap}
                className="aspect-[4/5] w-full object-cover sm:aspect-[3/2]"
              />
              <figcaption className="bg-[#FAF6EF] px-4 py-2 text-sm font-bold">
                {friend.cap}
              </figcaption>
            </figure>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              {friend.tone}
            </p>
            {/* 3-turn conversation preview */}
            <div className="mt-4 space-y-2">
              {friend.chat.map(([who, text], i) => (
                <div
                  key={i}
                  className={`flex ${
                    who === 'me' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <p
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      who === 'me'
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {text}
                  </p>
                </div>
              ))}
            </div>
            {/* Voice + memory + one-line fix */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleRoomAudio}
                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {roomPlaying ? '⏸' : '▶'} {t('listen')}
              </button>
              <audio
                ref={roomAudioRef}
                src={friend.voice}
                preload="none"
                onPlay={() => setRoomPlaying(true)}
                onPause={() => setRoomPlaying(false)}
                onEnded={() => setRoomPlaying(false)}
              />
              <button
                type="button"
                onClick={() => setShowMemory((v) => !v)}
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                ✦ {t('memoryBtn')}
              </button>
              <span className="text-violet-700">
                <Waveform playing={roomPlaying} />
              </span>
            </div>
            {showMemory && (
              <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-100">
                <span className="font-bold">{t('memTag')} </span>
                {friend.memory}
              </p>
            )}
            <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-900 ring-1 ring-emerald-100">
              <span className="font-bold">{t('fixLabel')}: </span>
              {friend.fix}
            </p>
            {/* Profile card */}
            <div className="mt-4 rounded-2xl bg-[#FAF6EF] p-4 ring-1 ring-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('inside')}
              </p>
              <dl className="mt-2 space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-bold text-slate-500">
                    {t('pPers')}
                  </dt>
                  <dd>{friend.pers}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-bold text-slate-500">
                    {t('pHobby')}
                  </dt>
                  <dd>{friend.hobby}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-bold text-slate-500">
                    {t('pPlaces')}
                  </dt>
                  <dd>{friend.places}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-bold text-slate-500">
                    {t('pNow')}
                  </dt>
                  <dd>{friend.now}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Night Voices — dark living room */}
        <section
          id="night"
          className="mt-14 scroll-mt-20 rounded-3xl bg-slate-900 p-5 text-white shadow-md sm:p-6"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
            {t('nightKicker')}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold">{t('nightTitleA')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            {t('nightLead')}
          </p>
          <figure className="mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10">
            <img
              src="/muntuz/emily-night.webp"
              alt={t('tonight')}
              className="aspect-[3/2] w-full object-cover"
              loading="lazy"
            />
            <figcaption className="bg-slate-800 px-4 py-2 text-sm font-bold">
              {t('tonight')}
            </figcaption>
          </figure>
          <div className="mt-4 space-y-2">
            <p className="max-w-[90%] rounded-2xl bg-white/10 px-3 py-2 text-sm leading-relaxed">
              {t('nightMsg1')}
            </p>
            <p className="max-w-[90%] rounded-2xl bg-white/10 px-3 py-2 text-sm leading-relaxed">
              {t('nightMsg2')}
            </p>
            <p className="max-w-[90%] rounded-2xl bg-white/10 px-3 py-2 text-sm leading-relaxed">
              {t('nightMsg3')}
            </p>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">
            {t('nightTone')}
          </p>
          <div className="mt-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {t('comfortT')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-200">
              {t('comfort')}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={toggleNightAudio}
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              {nightPlaying ? '⏸' : '▶'} {t('nightPlay')}
            </button>
            <audio
              ref={nightAudioRef}
              src="/muntuz/voices/emily-night.mp3"
              preload="none"
              onPlay={() => setNightPlaying(true)}
              onPause={() => setNightPlaying(false)}
              onEnded={() => setNightPlaying(false)}
            />
            <span className="text-amber-300">
              <Waveform playing={nightPlaying} />
            </span>
          </div>
        </section>

        {/* Photo Room */}
        <section id="photos" className="mt-14 scroll-mt-20">
          <h2 className="text-center text-2xl font-extrabold">
            {t('photoTitle')}
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
            {t('photoSub')}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(
              [
                ['all', t('fAll')],
                ['childhood', t('fChild')],
                ['school', t('fSchool')],
                ['travel', t('fTravel')],
                ['daily', t('fDaily')],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPhotoFilter(key)}
                aria-pressed={photoFilter === key}
                className={`rounded-full px-3 py-1.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  photoFilter === key
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-violet-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {visiblePhotos.map((p, i) => (
              <figure
                key={i}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
              >
                <img
                  src={p.img}
                  alt={p.cap}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover"
                  style={p.pos ? { objectPosition: p.pos } : undefined}
                />
                <figcaption className="px-3 py-2">
                  <p className="font-serif text-sm font-bold italic">
                    {p.hand}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {p.who} · {p.cap}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* MUNTUZ group — teaser linking to the group page (debut + dorm episodes live there). */}
        <section className="mt-14">
          <div className="overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-100">
            <img
              src="/muntuz/ep-studio-stage.webp"
              alt="MUNTUZ performing “Say Hi” on the debut stage"
              className="h-auto w-full object-cover"
              loading="lazy"
            />
            <div className="p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
                {t('groupTeaserKicker')}
              </p>
              <h2 className="mt-2 text-xl font-extrabold">Say hi, we are MUNTUZ!</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t('groupTeaserSub')}
              </p>
              <a
                href="/muntuz/group"
                className="mt-4 inline-block rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {t('groupTeaserCta')}
              </a>
            </div>
          </div>
        </section>

        {/* Pricing lives on its own page — a short pointer, not the full table. */}
        <section className="mt-14">
          <div className="rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-extrabold">{t('priceTitle')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('priceTeaserSub')}</p>
            <a
              href="/pricing"
              className="mt-3 inline-block rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {t('priceTeaserCta')}
            </a>
          </div>
        </section>

        {/* People Rooms — waitlist notice (not open yet) */}
        <section className="mt-12 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-bold">
            {t('peopleRooms')} — {t('soon')}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {t('peopleSub')} · {t('peopleNote')}
          </p>
          <p className="mt-1 text-sm text-slate-500">{t('peopleMemo')}</p>
          <a
            href="#waitlist"
            className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Join the waitlist
          </a>
        </section>

        {/* Waitlist — People Rooms invite list */}
        <section
          id="waitlist"
          className="mt-12 scroll-mt-6 rounded-2xl bg-violet-600 p-5 text-white shadow-md"
        >
          <h2 className="text-lg font-bold">Get in first</h2>
          <p className="mt-1 text-sm text-violet-100">
            Leave your email and we&rsquo;ll invite you when People Rooms
            open. No spam, just one invite.
          </p>
          {status === 'done' ? (
            <p className="mt-4 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold">
              You&rsquo;re on the list! We&rsquo;ll email you when People
              Rooms open.
            </p>
          ) : (
            <form onSubmit={joinWaitlist} className="mt-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'invalid') setStatus('idle');
                  }}
                  placeholder="you@example.com"
                  aria-label="Email address"
                  autoComplete="email"
                  className="min-w-0 flex-1 rounded-xl border-0 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="shrink-0 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {status === 'loading' ? 'Joining…' : 'Join'}
                </button>
              </div>
              {status === 'invalid' && (
                <p className="mt-2 text-sm font-medium text-violet-100">
                  Please enter a valid email address.
                </p>
              )}
              {status === 'soon' && (
                <p className="mt-2 text-sm font-medium text-violet-100">
                  The waitlist opens soon — Muntuz isn&rsquo;t taking
                  emails just yet. Please check back at launch!
                </p>
              )}
            </form>
          )}
        </section>

        {/* Final CTA */}
        <section className="mt-12 text-center">
          <h2 className="text-2xl font-extrabold">{t('ctaTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t('ctaSub')}
          </p>
          <a
            href="/exchange"
            className="mt-5 inline-block rounded-full bg-violet-600 px-8 py-3 text-base font-bold text-white shadow-md hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            {t('startFree')}
          </a>
        </section>

        {/* Footer — mirrors the MunTalk homepage footer, Muntuz wording */}
        <footer className="mt-12 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm font-bold text-slate-700">
            🌐 Muntuz &middot; 50 AI partners &middot; Voice &amp; chat
            &middot; Any language
          </p>
          <p className="mt-1 text-sm text-slate-600">{t('foot')}</p>
          <nav className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs font-bold text-violet-600 no-underline hover:underline"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            These friends are AI, not real people.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            &copy; {new Date().getFullYear()} Muntuz. All rights reserved. |
            British Columbia, Canada |{' '}
            <a
              href="mailto:muntuz.official@gmail.com"
              className="text-slate-400 no-underline hover:underline"
            >
              muntuz.official@gmail.com
            </a>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Muntuz — a MunTalk project.
          </p>
        </footer>
      </div>
    </main>
  );
}
