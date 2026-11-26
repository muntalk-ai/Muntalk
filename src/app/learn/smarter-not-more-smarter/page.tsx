import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "\"more smarter\" 맞나요? — 비교급에는 more를 붙이지 않아요",
  description:
    "smarter처럼 -er이 붙은 비교급에는 more를 붙이지 않습니다. more smarter가 틀린 이유와 비교급 규칙을 정리했습니다.",
  alternates: { canonical: '/learn/smarter-not-more-smarter' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“more smarter”가 아니라 “smarter”입니다"}
      practice={"He is smarter than me."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“He is more smarter than me.” — “그가 나보다 더 똑똑해”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"영어 비교급은 두 가지 방식 중 하나만 씁니다. 둘을 동시에 쓰면 틀립니다."}</Body>
        <BulletList
          items={[
            <><strong>{"짧은 형용사:"}</strong>{" -er을 붙인다. smart → smarter, big → bigger, fast → faster"}</>,
            <><strong>{"긴 형용사:"}</strong>{" more를 붙인다. beautiful → more beautiful, interesting → more interesting"}</>,
          ]}
        />
        <Body>{"smarter는 이미 -er 비교급이라 more를 또 붙이면 중복입니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“He is smarter than me.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"She is taller than me. (그녀가 나보다 키가 커.)"}</>,
            <>{"This book is more interesting than that one. (이 책이 저것보다 더 흥미로워.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"He is smarter than his brother. (그는 동생보다 똑똑해.)"}</>,
            <>{"This phone is cheaper than that one. (이 폰이 저것보다 싸.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
