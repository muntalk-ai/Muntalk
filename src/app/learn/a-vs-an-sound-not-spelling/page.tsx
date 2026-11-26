import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "a university일까 an university일까? — a/an은 소리로 정합니다",
  description:
    "\"a university\"가 맞고 \"an university\"는 틀립니다. a와 an은 첫 글자가 아니라 첫 소리로 정합니다. an hour·an honest person·a European 같은 함정 단어까지 정리했습니다.",
  alternates: { canonical: '/learn/a-vs-an-sound-not-spelling' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“an university”가 아니라 “a university” — a/an은 철자가 아니라 소리로 정합니다"}
      practice={"She goes to a university in Seoul."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“She goes to an university in Seoul.” — “그녀는 서울의 한 대학교에 다녀요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"“모음 앞에는 an”이라는 규칙을 글자로 외우면 university가 u로 시작하니까 an을 붙이고 싶어집니다. 그런데 a와 an의 기준은 "}<strong>{"첫 글자가 아니라 첫 소리"}</strong>{"입니다. university는 첫소리가 /j/(y)라는 자음 소리(“유”)라 a를 씁니다. 반대로 hour는 h가 발음되지 않아 첫소리가 모음이라 an hour가 맞습니다."}</Body>
        <BulletList
          items={[
            <><strong>{"a"}</strong>{" + 자음 소리: a university (유-), a European (유-), a one-way ticket (원-)"}</>,
            <><strong>{"an"}</strong>{" + 모음 소리: an hour (아워, h 무음), an honest person (아너스트, h 무음), an apple, an umbrella (엄-)"}</>,
            <>{"an university ✗ / a hour ✗ (둘 다 틀림)"}</>,
          ]}
        />
        <Body>{"같은 u로 시작해도 발음이 다르면 관사가 달라집니다. a university(유-)와 an umbrella(엄-)를 짝으로 외우면 헷갈리지 않습니다. 형용사가 사이에 와도 기준은 관사 바로 뒤 단어의 첫소리입니다. “an interesting university”처럼 말합니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“She goes to a university in Seoul.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I go to a university in Busan. (부산의 한 대학교에 다녀요.)"}</>,
            <>{"Wait an hour, please. (한 시간만 기다려 주세요.)"}</>,
            <>{"He is an honest man. (그는 정직한 사람이에요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"She goes to a university in Seoul. (그녀는 서울의 한 대학교에 다녀요.)"}</>,
            <>{"I waited for an hour at the station. (역에서 한 시간을 기다렸어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
