import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "음악 들어요 영어로 — \"listen music\"이 아니라 \"listen to music\"",
  description:
    "\"음악을 들어요\"는 \"I listen music\"이 아니라 \"I listen to music\"입니다. listen은 목적어를 직접 못 받는 동사라 to가 필요합니다. listen과 hear의 차이도 정리했습니다.",
  alternates: { canonical: '/learn/listen-to-music-not-listen-music' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I listen music”이 아니라 “I listen to music”입니다"}
      practice={"I listen to music every day."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I listen music every day.” — “매일 음악을 들어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “음악을 듣다”에는 목적격 “을”이 있어 listen 뒤에 music을 바로 붙이고 싶어지지만, 영어의 listen은 자동사라 목적어를 직접 받지 못합니다. 듣는 대상을 붙이려면 전치사 to가 반드시 필요합니다. “listen to”를 하나의 덩어리로 외우는 것이 가장 확실합니다."}</Body>
        <BulletList
          items={[
            <>{"I listen "}<strong>{"to"}</strong>{" music. (음악을 들어요.)"}</>,
            <>{"I listen "}<strong>{"to"}</strong>{" the radio. (라디오를 들어요.)"}</>,
            <>{"Please listen "}<strong>{"to"}</strong>{" me. (제 말을 들어 주세요.)"}</>,
            <>{"I listen music. ✗ / I listen to music. ○"}</>,
          ]}
        />
        <Body>{"반대로 hear는 타동사라 to 없이 목적어를 바로 받습니다. hear는 “우연히 들리다”, listen은 “주의를 기울여 듣다”라는 뜻 차이도 있습니다."}</Body>
        <BulletList
          items={[
            <>{"I heard a strange noise. (이상한 소리가 들렸어요. — 우연히)"}</>,
            <>{"I listened to the song carefully. (노래를 주의 깊게 들었어요. — 의도적으로)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I listen to music every day.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I like to listen to music. (음악 듣는 걸 좋아해요.)"}</>,
            <>{"I listen to K-pop every morning. (매일 아침 케이팝을 들어요.)"}</>,
            <>{"Listen to this song! (이 노래 들어 봐!)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I listen to music when I study. (공부할 때 음악을 들어요.)"}</>,
            <>{"She listens to podcasts on the bus. (그녀는 버스에서 팟캐스트를 들어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
