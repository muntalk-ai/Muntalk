import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"How about to go?"는 틀렸습니다 — "How about going?"이 정답입니다',
  description:
    '"영화 보러 갈래?"는 "How about to go to the cinema?"가 아니라 "How about going to the cinema?"입니다. how about 뒤에는 to + 동사가 아니라 -ing 형태가 옵니다.',
  alternates: { canonical: '/learn/how-about-going-not-how-about-to-go' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“How about to go?”가 아니라 “How about going?”입니다"
      practice="How about going to the cinema?"
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“How about to go to the cinema?” — “영화 보러 갈래?”라는 뜻으로 쓰는 경우</Quote>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          한국어 “갈래?”를 영어로 옮기면 to go가 먼저 떠오르지만, how about 뒤에는 to + 동사가 오지 않습니다. how
          about 뒤에는 명사나 -ing 형태(동명사)가 옵니다. “How about to go?”는 틀리고 “How about going?”이 정답입니다.
          how about은 제안을 할 때 쓰는 고정 표현이라 뒤에 오는 동사는 -ing로 바꿔야 합니다.
        </Body>
        <BulletList
          items={[
            <>
              How about <strong>going</strong> to the cinema? (영화 보러 갈래?)
            </>,
            <>
              How about <strong>a walk</strong> after dinner? (저녁 먹고 산책할래?)
            </>,
            <>
              How about <strong>ordering</strong> a pizza tonight? (오늘 밤에 피자 시킬래?)
            </>,
            <>
              How about <strong>to go</strong> to the cinema? ✗ (how about 뒤에 to + 동사는 오지 않음)
            </>,
            <>
              How about <strong>to eat</strong> out tonight? ✗ (같은 규칙 — How about eating out이 정답)
            </>,
          ]}
        />
        <Body>
          같은 규칙이 what about에도 적용됩니다. “What about going to the beach?”(해변에 갈래?)처럼 -ing를 씁니다.
          “How about we go to the cinema?”(우리 영화 보러 갈래?)처럼 주어 + 동사 원형을 붙이는 말도 가능하지만,
          학습자에게는 how about + -ing가 더 안전합니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“How about going to the cinema?”</Quote>
        <BulletList
          items={[
            <>How about going for a walk after dinner? (저녁 먹고 산책할래?)</>,
            <>What about having lunch together tomorrow? (내일 같이 점심 먹을래?)</>,
            <>How about a cup of coffee? (커피 한 잔 할래?)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>How about going to the movies this weekend? (이번 주말에 영화 보러 갈래?)</>,
            <>It is a nice day. How about going for a walk? (날씨가 좋네. 산책할래?)</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
