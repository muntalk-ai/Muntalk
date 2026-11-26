import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "친구가 많아요 영어로 — \"much friends\"가 아니라 \"many friends\"",
  description:
    "\"친구가 많아요\"는 \"I have much friends\"가 아니라 \"I have many friends\"입니다. 셀 수 있는 명사는 many, 셀 수 없는 명사는 much를 씁니다. how many·how much 질문도 함께 정리했습니다.",
  alternates: { canonical: '/learn/many-friends-not-much-friends' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I have much friends”가 아니라 “I have many friends”입니다"}
      practice={"I have many friends."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I have much friends.” — “친구가 많아요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “많다”는 하나라 much와 many를 구분하지 않고 쓰고 싶어지지만, 영어에서는 명사가 셀 수 있는지 없는지를 먼저 봐야 합니다. 친구(friends)는 하나, 둘 셀 수 있으니까 many, 시간(time)·물(water)·돈(money)처럼 셀 수 없는 것은 much를 씁니다. 10-29 초안 “homeworks”는 복수 -s 규칙이었고, 이 편은 수량사 선택 규칙이라 포인트가 다릅니다."}</Body>
        <BulletList
          items={[
            <><strong>{"many"}</strong>{" + 셀 수 있는 복수 명사: many friends, many books, many people"}</>,
            <><strong>{"much"}</strong>{" + 셀 수 없는 명사: much time, much water, much money"}</>,
            <>{"I have much friends. ✗ / I don't have many time. ✗ (둘 다 틀림)"}</>,
          ]}
        />
        <Body>{"질문할 때도 같습니다. “How many friends do you have?”(친구가 몇 명이에요?), “How much time do you have?”(시간이 얼마나 있어요?)처럼 씁니다. 헷갈릴 때는 “a lot of”를 쓰면 둘 다 피해 갈 수 있습니다. “I have a lot of friends.”(친구가 많아요.)는 긍정문에서 가장 자연스러운 표현입니다. 참고로 긍정문에서 much는 “I have much time.”처럼 딱딱하게 들릴 때가 많아, 일상에서는 a lot of를 더 자주 씁니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I have many friends.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I have many friends in Seoul. (서울에 친구가 많아요.)"}</>,
            <>{"She doesn't have much time today. (그녀는 오늘 시간이 별로 없어요.)"}</>,
            <>{"How many books did you read? (책을 몇 권 읽었어요?)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I have many friends from university. (대학교 때 친구가 많아요.)"}</>,
            <>{"We don't have much money for the trip. (여행할 돈이 별로 없어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
