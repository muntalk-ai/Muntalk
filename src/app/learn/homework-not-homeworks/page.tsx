import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "숙제 영어로 복수형은? — \"homeworks\"가 아니라 \"homework\"입니다",
  description:
    "homework는 셀 수 없는 명사라 -s를 붙이지 않습니다. many homeworks가 틀린 이유와 수량 표현 방법을 정리했습니다.",
  alternates: { canonical: '/learn/homework-not-homeworks' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“homeworks”가 아니라 “homework”입니다"}
      practice={"I have a lot of homework."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I have many homeworks.” — “숙제가 많아”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"homework는 셀 수 없는 명사(uncountable noun)입니다. 한국어 “숙제들”처럼 복수형을 만들지 않습니다. 같은 부류: information, advice, furniture, money — 전부 -s가 없습니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I have a lot of homework.”"}</strong></Quote>
        <Body>{"수량을 말하고 싶으면 이렇게 바꿉니다."}</Body>
        <BulletList
          items={[
            <>{"a lot of homework (숙제가 많다)"}</>,
            <>{"a piece of homework (숙제 한 개 — 과제 하나를 셀 때)"}</>,
            <>{"two assignments (과제 두 개 — 셀 수 있는 말로 바꿀 때)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I have a lot of homework today. (오늘 숙제가 많아.)"}</>,
            <>{"Did you finish your homework? (숙제 끝냈어?)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
