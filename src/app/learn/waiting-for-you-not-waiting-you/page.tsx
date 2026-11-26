import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "기다리고 있어요 영어로 — \"waiting you\"가 아니라 \"waiting for you\"",
  description:
    "\"기다리고 있어요\"는 \"I am waiting you\"가 아니라 \"I am waiting for you\"입니다. wait는 목적어를 직접 못 받는 동사라 for가 필요합니다. wait for·wait on·await의 차이도 정리했습니다.",
  alternates: { canonical: '/learn/waiting-for-you-not-waiting-you' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am waiting you”가 아니라 “I am waiting for you”입니다"}
      practice={"I am waiting for you."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am waiting you outside.” — “밖에서 기다리고 있어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “너를 기다리다”에는 목적격 “를”이 있어 wait 뒤에 you를 바로 붙이고 싶어지지만, 영어의 wait는 목적어를 직접 받지 못합니다. 기다리는 대상을 붙이려면 전치사 for가 반드시 필요합니다. “wait for”를 하나의 덩어리로 외우는 것이 가장 확실합니다. 11-04 초안 “listen to music”과 같은 전치사 누락 유형입니다."}</Body>
        <BulletList
          items={[
            <>{"I am waiting "}<strong>{"for"}</strong>{" you. (너를 기다리고 있어요.)"}</>,
            <>{"I am waiting "}<strong>{"for"}</strong>{" the bus. (버스를 기다리고 있어요.)"}</>,
            <>{"I am waiting you. ✗ / Wait me! ✗ (둘 다 틀림)"}</>,
          ]}
        />
        <Body>{"“wait on”은 “서빙하다(식당에서)”라는 다른 뜻이라, 기다린다는 뜻으로는 쓰지 않습니다. 격식체로는 await를 쓰는데, await는 for 없이 목적어를 바로 받습니다. “We are awaiting your reply.”(답장을 기다리고 있습니다.)처럼 씁니다. 단, await 뒤에는 보통 사물이 오고 사람을 기다린다고는 잘 안 씁니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am waiting for you outside.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I'm waiting for you at the station. (역에서 기다리고 있어요.)"}</>,
            <>{"Please wait for me. (저를 기다려 주세요.)"}</>,
            <>{"I've been waiting for your call. (전화를 기다리고 있었어요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I am waiting for you outside the cafe. (카페 밖에서 기다리고 있어요.)"}</>,
            <>{"She is waiting for the train. (그녀는 기차를 기다리고 있어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
