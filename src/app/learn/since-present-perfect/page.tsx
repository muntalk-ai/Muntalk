import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "since 뒤에는 무슨 시제? — \"I have lived in Seoul since 2020\"이 맞습니다",
  description:
    "since 2020처럼 과거 시작점이 나오면 현재완료를 씁니다. I am living since가 틀린 이유와 since/for 구분을 정리했습니다.",
  alternates: { canonical: '/learn/since-present-perfect' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am living in Seoul since 2020”이 아니라 “I have lived in Seoul since 2020”입니다"}
      practice={"I have lived in Seoul since 2020."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am living in Seoul since 2020.” — “2020년부터 서울에 살아”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"since + 과거 시점은 “그때부터 지금까지 이어지고 있다”는 뜻이라 현재완료(present perfect)와 짝을 이룹니다. 현재진행형(am living)은 “지금 하고 있는 중”이라는 뜻이라 since와 어울리지 않습니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I have lived in Seoul since 2020.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I have worked here since 2019. (2019년부터 여기서 일하고 있어.)"}</>,
            <>{"She has known him since high school. (그녀는 고등학교 때부터 그를 알아.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"since vs for"}</SectionTitle>
        <BulletList
          items={[
            <><strong>{"since + 시작 시점:"}</strong>{" since 2020, since Monday, since I was ten"}</>,
            <><strong>{"for + 기간:"}</strong>{" for 5 years, for a week, for a long time"}</>,
          ]}
        />
        <Body>{"“I have lived here for 5 years”도 맞습니다. 시작점을 말하면 since, 기간을 말하면 for입니다."}</Body>
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
