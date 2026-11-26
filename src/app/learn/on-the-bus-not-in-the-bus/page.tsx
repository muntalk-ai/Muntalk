import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "버스 안에서 영어로 — \"in the bus\"가 아니라 \"on the bus\"입니다",
  description:
    "버스·지하철·기차·비행기에서는 in이 아니라 on을 씁니다. \"I am on the bus\"가 맞는 이유와 교통수단 전치사 규칙을 정리했습니다.",
  alternates: { canonical: '/learn/on-the-bus-not-in-the-bus' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am in the bus”가 아니라 “I am on the bus”입니다"}
      practice={"I am on the bus now."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am in the bus now.” — “지금 버스 안에 있어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “버스 안에”를 그대로 옮기면 in the bus가 되지만, 영어에서 대중교통은 “위에 올라타 있다”는 느낌으로 on을 씁니다. 서서 돌아다닐 수 있는 큰 교통수단(버스·지하철·기차·비행기·배)은 on, 앉아서 타는 작은 교통수단(차·택시)은 in입니다."}</Body>
        <BulletList
          items={[
            <><strong>{"on:"}</strong>{" on the bus, on the subway, on the train, on the plane, on the boat"}</>,
            <><strong>{"in:"}</strong>{" in the car, in a taxi"}</>,
          ]}
        />
        <Body>{"기억하는 방법: 내릴 때 “get "}<strong>{"off"}</strong>{"”라고 하면 on, “get "}<strong>{"out"}</strong>{"”이라고 하면 in입니다. 버스에서는 get off the bus, 차에서는 get out of the car라고 합니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am on the bus now.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I'm on the subway. (지하철 안에 있어요.)"}</>,
            <>{"She's on the train to Busan. (그녀는 부산행 기차 안에 있어요.)"}</>,
            <>{"I'm in the car. (차 안에 있어요. — car는 in이 맞습니다.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I was on the bus when you called. (네가 전화했을 때 나는 버스 안에 있었어.)"}</>,
            <>{"I'll call you back when I get off the bus. (버스에서 내리면 다시 전화할게.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
