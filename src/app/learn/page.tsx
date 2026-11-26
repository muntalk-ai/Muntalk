import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn English from Real Mistakes — MunTalk',
  description:
    'Common English mistakes learners actually make — and the natural correction. From the Konglish ER series, written by the developer of MunTalk.',
  alternates: { canonical: '/learn' },
};

const FONT =
  "'Nunito','Noto Sans Arabic','Noto Sans Hebrew','Noto Sans Thai','Noto Sans Devanagari','Noto Sans KR','Noto Sans SC',sans-serif";

const KO_ARTICLES = [
  { slug: 'im-bored-not-boring', wrong: "I'm boring", right: "I'm bored", desc: '지루하다고 말할 때 — -ed와 -ing의 차이' },
  { slug: 'i-have-plans-not-promise', wrong: 'I have a promise', right: 'I have plans', desc: '약속이 있다는 영어 — promise는 맹세' },
  { slug: 'go-for-it-not-fighting', wrong: 'Fighting!', right: 'Go for it!', desc: '응원할 때 — fighting은 싸우는 중' },
  { slug: 'cell-phone-not-hand-phone', wrong: 'hand phone', right: 'cell phone', desc: '핸드폰 영어 — hand phone은 없는 말' },
  { slug: 'on-the-house-not-service', wrong: 'service', right: "It's on the house", desc: '공짜라는 뜻 — service에는 공짜 뜻이 없음' },
  { slug: 'cheat-sheet-not-cunning-paper', wrong: 'cunning paper', right: 'cheat sheet', desc: '컨닝 페이퍼 — cunning은 교활한' },
  { slug: 'going-home-not-to-home', wrong: "I'm going to home", right: "I'm going home", desc: '집에 가요 — home 앞에는 to 없음' },
  { slug: 'im-interested-not-interesting', wrong: "I'm interesting", right: "I'm interested", desc: '관심 있어요 — -ed/-ing 2탄' },
  { slug: 'didnt-go-not-didnt-went', wrong: "I didn't went", right: "I didn't go", desc: "didn't 뒤에는 동사원형 — 과거 두 번 표시 금지" },
  { slug: 'what-time-it-is-not-is-it', wrong: 'Do you know what time is it?', right: 'Do you know what time it is?', desc: '간접의문문 — 어순은 안 바뀐다' },
  { slug: 'pronunciation-not-pronounce', wrong: 'My pronounce is bad', right: 'My pronunciation is bad', desc: '발음은 명사 pronunciation — pronounce는 동사' },
  { slug: 'there-are-many-people', wrong: 'There is many people', right: 'There are many people', desc: 'there is/are — 뒤 명사에 맞추다' },
  { slug: 'window-shopping-not-eye-shopping', wrong: 'eye shopping', right: 'window shopping', desc: '구경만 하는 쇼핑 — eye shopping은 없는 말' },
  { slug: 'did-you-eat-rice-vs-have-you-eaten', wrong: 'Did you eat rice?', right: 'Have you eaten?', desc: '밥 먹었어? — rice는 쌀이라는 음식' },
  { slug: 'how-about-going-not-how-about-to-go', wrong: 'How about to go?', right: 'How about going?', desc: 'how about 뒤에는 -ing — to + 동사는 안 됨' },
  { slug: 'every-day-not-everyday', wrong: 'I study English everyday', right: 'I study English every day', desc: '매일 — everyday는 형용사, every day는 부사' },
  { slug: 'live-in-seoul-not-the-seoul', wrong: 'I live in the Seoul', right: 'I live in Seoul', desc: '도시 이름 앞에는 the 없음' },
  { slug: 'work-at-samsung-not-work-in-samsung', wrong: 'I work in Samsung', right: 'I work at Samsung', desc: '회사 이름 앞에는 at/for — in은 분야·부서 앞' },
  { slug: "smarter-not-more-smarter", wrong: "more smarter", right: "smarter", desc: "비교급에는 more를 붙이지 않아요" },
  { slug: "homework-not-homeworks", wrong: "homeworks", right: "homework", desc: "숙제 영어로 복수형은?" },
  { slug: "since-present-perfect", wrong: "I am living in Seoul since 2020", right: "I have lived in Seoul since 2020", desc: "since 뒤에는 무슨 시제?" },
  { slug: "i-dont-understand-not-i-am-not-understand", wrong: "I am not understand", right: "I don't understand", desc: "이해 못 했어요 영어로" },
  { slug: "i-have-a-headache-not-my-head-is-sick", wrong: "My head is sick", right: "I have a headache", desc: "머리 아파요 영어로" },
  { slug: "look-forward-to-seeing-you", wrong: "I look forward to see you", right: "I look forward to seeing you", desc: "look forward to 뒤에는 -ing?" },
  { slug: "my-english-is-short-not-good", wrong: "My English is short", right: "My English is not good", desc: "영어 실력이 부족해요 영어로" },
  { slug: "on-the-bus-not-in-the-bus", wrong: "I am in the bus", right: "I am on the bus", desc: "버스 안에서 영어로" },
  { slug: "i-graduated-not-i-am-graduated", wrong: "I am graduated", right: "I graduated", desc: "졸업했어요 영어로" },
  { slug: "play-the-piano-not-play-piano", wrong: "I play piano", right: "I play the piano", desc: "피아노 쳐요 영어로" },
  { slug: "what-do-you-think-not-how-do-you-think", wrong: "How do you think?", right: "What do you think?", desc: "어떻게 생각해요 영어로" },
  { slug: "went-there-not-to-there", wrong: "I went to there", right: "I went there", desc: "거기 갔어요 영어로" },
  { slug: "ten-minutes-late-not-late-for-ten-minutes", wrong: "I am late for 10 minutes", right: "I am 10 minutes late", desc: "10분 늦었어요 영어로" },
  { slug: "play-soccer-not-play-a-soccer", wrong: "I like to play a soccer", right: "I like to play soccer", desc: "축구해요 영어로" },
  { slug: "im-having-fun-not-im-fun", wrong: "I'm fun", right: "I'm having fun", desc: "재미있어요 영어로" },
  { slug: "i-have-a-cold-not-i-am-cold", wrong: "I am cold", right: "I have a cold", desc: "감기 걸렸어요 영어로" },
  { slug: "listen-to-music-not-listen-music", wrong: "I listen music", right: "I listen to music", desc: "음악 들어요 영어로" },
  { slug: "call-you-not-call-to-you", wrong: "I will call to you", right: "I will call you", desc: "전화할게요 영어로" },
  { slug: "explain-it-to-you-not-explain-you", wrong: "I will explain you", right: "I will explain it to you", desc: "설명해 줄게요 영어로" },
  { slug: "arrive-in-seoul-not-arrive-to-seoul", wrong: "I will arrive to Seoul", right: "I will arrive in Seoul", desc: "서울에 도착해요 영어로" },
  { slug: "good-at-studying-not-good-at-study", wrong: "I am good at study English", right: "I am good at studying English", desc: "공부를 잘해요 영어로" },
  { slug: "good-cook-not-good-cooker", wrong: "He is a good cooker", right: "He is a good cook", desc: "요리를 잘해요 영어로" },
  { slug: "at-home-not-in-home", wrong: "I am in home", right: "I am at home", desc: "집에 있어요 영어로" },
  { slug: "waiting-for-you-not-waiting-you", wrong: "I am waiting you", right: "I am waiting for you", desc: "기다리고 있어요 영어로" },
  { slug: "a-vs-an-sound-not-spelling", wrong: "an university", right: "a university", desc: "a university일까 an university일까?" },
  { slug: "many-friends-not-much-friends", wrong: "I have much friends", right: "I have many friends", desc: "친구가 많아요 영어로" },
  { slug: "go-abroad-not-go-to-abroad", wrong: "I will go to abroad", right: "I will go abroad", desc: "해외에 가요 영어로" },
  { slug: "it-is-raining-not-it-is-rain", wrong: "It is rain today", right: "It is raining today", desc: "비가 와요 영어로" },
  { slug: "repeat-not-repeat-again", wrong: "Please repeat again", right: "Please repeat what you said", desc: "다시 말해 주세요 영어로" },
  { slug: "return-not-return-back", wrong: "I will return back", right: "I will return", desc: "돌아올게요 영어로" },
  { slug: "used-to-vs-be-used-to", wrong: "I am used to live in Seoul", right: "I am used to living in Seoul", desc: "used to와 be used to 차이는?" },
  { slug: "i-am-sleepy-not-i-am-sleep", wrong: "I am sleep", right: "I am sleepy", desc: "졸려요 영어로" },
  { slug: "in-a-hurry-not-i-am-hurry", wrong: "I am hurry", right: "I am in a hurry", desc: "급해요 영어로" },
  { slug: "looking-for-a-job-not-finding-a-job", wrong: "I am finding a job", right: "I am looking for a job", desc: "일자리 찾고 있어요 영어로" },
  { slug: "i-am-170cm-tall", wrong: "I am 170cm", right: "I am 170cm tall", desc: "키가 170cm 영어로" },
  { slug: "go-to-school-not-go-to-the-school", wrong: "I go to the school", right: "I go to school", desc: "학교에 가요 영어로" },
  { slug: "have-been-to-not-have-gone-to", wrong: "Have you ever gone to Seoul?", right: "Have you ever been to Seoul?", desc: "가 본 적 있어요 영어로" },
  { slug: "havent-eaten-yet-not-didnt-eat-yet", wrong: "I didn't eat yet", right: "I haven't eaten yet", desc: "아직 안 먹었어요 영어로" },
  { slug: "sorry-im-late-not-sorry-for-late", wrong: "Sorry for late", right: "Sorry I'm late", desc: "늦어서 죄송해요 영어로" },
  { slug: "student-at-university-not-student-of", wrong: "I am a student of Seoul University", right: "I am a student at Seoul University", desc: "대학생이에요 영어로" },
  { slug: "a-pair-of-shoes-not-a-shoes", wrong: "I bought a shoes", right: "I bought a pair of shoes", desc: "신발 한 켤레 영어로" },
  { slug: "pc-bang-vs-internet-cafe", wrong: "I am going to PC bang", right: "I am going to an internet café", desc: "피시방 영어로" },
  { slug: "mart-vs-supermarket", wrong: "I will go to the mart", right: "I will go to the supermarket", desc: "마트 영어로" },
];

const EN_ARTICLES = [
  { slug: 'same-same-vs-its-the-same', wrong: 'same same', right: "It's the same", desc: 'Tinglish — Thai-style English, not standard English' },
  { slug: 'embarazada-vs-embarrassed', wrong: 'Estoy embarazada', right: "I'm embarrassed", desc: 'Spanglish false friend — embarazada means pregnant' },
];

function ArticleList({ items }: { items: typeof KO_ARTICLES }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((a) => (
        <a
          key={a.slug}
          href={`/learn/${a.slug}`}
          style={{
            display: 'block',
            background: '#fff',
            borderRadius: 20,
            padding: '22px 26px',
            border: '1.5px solid #F1F5F9',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.5, marginBottom: 4 }}>
            <span style={{ color: '#DC2626', textDecoration: 'line-through', textDecorationThickness: 2 }}>
              {a.wrong}
            </span>{' '}
            → <span style={{ color: '#059669' }}>{a.right}</span>
          </div>
          <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, lineHeight: 1.6 }}>{a.desc}</div>
        </a>
      ))}
    </div>
  );
}

export default function LearnIndexPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', fontFamily: FONT, color: '#0F172A' }}>
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #F1F5F9',
          height: 62,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 200,
        }}
      >
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <img src="/logo.png" alt="MunTalk" style={{ width: 36, height: 36, borderRadius: 12 }} />
          <span style={{ fontWeight: 900, fontSize: 19, letterSpacing: '-0.5px' }}>MunTalk</span>
          <span style={{ background: '#EFF6FF', color: '#0284C7', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
            BETA
          </span>
        </a>
        <a href="/signup" style={{ color: '#6366F1', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
          Start Free
        </a>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 8px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#EEF2FF',
            border: '1px solid #C7D2FE',
            color: '#6366F1',
            fontSize: 11,
            fontWeight: 800,
            borderRadius: 20,
            padding: '6px 16px',
            marginBottom: 20,
            letterSpacing: 0.8,
          }}
        >
          📚 LEARN FROM REAL MISTAKES
        </div>
        <h1 style={{ fontSize: 'clamp(26px,4.5vw,38px)', fontWeight: 900, lineHeight: 1.3, margin: '0 0 12px', letterSpacing: -0.5 }}>
          English mistakes, corrected.
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.8, fontWeight: 600, margin: '0 0 32px' }}>
          The mistakes learners actually make — and what native speakers really say. From the Konglish ER
          series, written by the developer of MunTalk.
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 16px' }}>한국어 시리즈 — 콩글리시 응급실</h2>
        <ArticleList items={KO_ARTICLES} />

        <h2 style={{ fontSize: 20, fontWeight: 900, margin: '32px 0 16px' }}>English series — Global pilot</h2>
        <ArticleList items={EN_ARTICLES} />

        <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: '32px 0 0', textAlign: 'center' }}>
          Written by the developer of muntalk. The video features an original AI-generated character story.
        </p>
      </div>

      <footer style={{ textAlign: 'center', padding: 28, color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff', marginTop: 48 }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <a href="/" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>🏠 Home</a>
          <a href="/about" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>About</a>
          <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💎 Pricing</a>
          <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>💬 Help &amp; FAQ</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>&copy; {new Date().getFullYear()} MunTalk. All rights reserved.</div>
      </footer>
    </div>
  );
}
