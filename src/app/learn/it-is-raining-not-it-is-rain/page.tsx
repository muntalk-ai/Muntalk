import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "비가 와요 영어로 — \"It is rain\"이 아니라 \"It is raining\"입니다",
  description:
    "\"비가 와요\"는 \"It is rain\"이 아니라 \"It is raining\"입니다. rain은 명사이자 동사라, 지금 비가 오는 상황에는 -ing가 필요합니다. it rains와의 차이도 함께 정리했습니다.",
  alternates: { canonical: '/learn/it-is-raining-not-it-is-rain' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“It is rain today”가 아니라 “It is raining today”입니다"}
      practice={"It is raining today."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“It is rain today.” — “오늘 비가 와요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “비가 오다”를 직역하면 rain이라는 단어가 먼저 떠오르지만, 영어에서 rain은 명사(비)와 동사(비가 오다)를 겸합니다. “It is rain”은 문법적으로 “그것은 비이다”가 되어 버립니다. 지금 비가 내리고 있다는 뜻을 전하려면 동사 rain에 -ing를 붙여 “It is raining”으로 써야 합니다."}</Body>
        <BulletList
          items={[
            <>{"It "}<strong>{"is raining"}</strong>{" today. (오늘 비가 와요. — 지금 내리는 중)"}</>,
            <>{"It "}<strong>{"rains"}</strong>{" a lot in summer. (여름에는 비가 많이 와요. — 일반적인 사실)"}</>,
            <>{"It is "}<strong>{"rain"}</strong>{" today. ✗ / It "}<strong>{"rain"}</strong>{" today. ✗ (둘 다 틀림)"}</>,
          ]}
        />
        <Body>{"“It rains”와 “It is raining”은 둘 다 맞지만 쓰임이 다릅니다. “It rains”는 습관·일반적 사실(“이 지역은 비가 자주 와요”), “It is raining”은 지금 이 순간의 상황(“지금 비가 오고 있어요”)입니다. 눈도 같습니다. “It is snow”가 아니라 “It is snowing”입니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“It is raining today.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"It is raining now. (지금 비가 오고 있어요.)"}</>,
            <>{"It rains a lot here in July. (여기는 7월에 비가 많이 와요.)"}</>,
            <>{"It was raining all day yesterday. (어제 하루 종일 비가 왔어요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"It is raining today, so take an umbrella. (오늘 비가 와요. 우산 챙기세요.)"}</>,
            <>{"Is it raining outside? (밖에 비가 오고 있어요?)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
