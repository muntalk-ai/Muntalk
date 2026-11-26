import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "마트 영어로 — \"mart\"가 아니라 \"supermarket\"입니다",
  description:
    "\"마트에 가요\"는 \"I will go to the mart\"가 아니라 \"I will go to the supermarket\"입니다. mart는 Kmart·Walmart 같은 고유명사 안에만 있고 일반 명사가 아니라, 미국에서는 grocery store, 영국에서는 supermarket이라고 합니다.",
  alternates: { canonical: '/learn/mart-vs-supermarket' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I will go to the mart”가 아니라 “I will go to the supermarket”입니다"}
      practice={"I will go to the supermarket."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I will go to the mart to buy some milk.” — “우유 사러 마트에 가요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “마트”는 supermarket을 줄인 말이라 영어에서도 “mart”를 쓰면 될 것 같지만, 영어에서 mart는 일반 명사가 아닙니다. Kmart·Walmart처럼 가게 이름 안에만 들어 있을 뿐, “I will go to the mart”라고 하면 원어민은 어느 가게인지 알 수 없습니다. 식료품·생활용품을 파는 큰 가게는 “supermarket”이라고 하고, 미국 일상 대화에서는 “grocery store”를 더 많이 씁니다."}</Body>
        <BulletList
          items={[
            <>{"I will go to "}<strong>{"the supermarket"}</strong>{". (마트에 가요. — 영국·국제적으로 가장 일반적)"}</>,
            <>{"I will go to "}<strong>{"the grocery store"}</strong>{". (마트에 가요. — 미국 일상 표현)"}</>,
            <>{"I will go to "}<strong>{"the mart"}</strong>{". ✗ (일반 명사가 아님 — 가게 이름에만 쓰임)"}</>,
            <>{"I am going "}<strong>{"grocery shopping"}</strong>{". (장 보러 가요. — “마트 간다”는 뜻의 자연한 표현)"}</>,
          ]}
        />
        <Body>{"“market”은 재래시장·농산물 시장 같은 뜻이라 “I will go to the market”이라고 하면 마트가 아니라 시장으로 들립니다. 반대로 대형마트 이름이 “E-mart”처럼 mart로 끝나면 고유명사로 그대로 말하면 됩니다. “I will go to E-mart.”(이마트에 가요.)는 맞습니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I will go to the supermarket.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I will go to the supermarket to buy some milk. (우유 사러 마트에 가요.)"}</>,
            <>{"I am going grocery shopping this afternoon. (오늘 오후에 장 보러 가요.)"}</>,
            <>{"I will go to E-mart after work. (퇴근 후에 이마트에 가요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I will go to the supermarket after work. There is a sale today. (퇴근 후에 마트에 갈 거예요. 오늘 세일해요.)"}</>,
            <>{"Let's go to the grocery store and buy some fruit. (마트에 가서 과일 좀 사요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
