import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"I\'m interesting"이 아니라 "I\'m interested"입니다 — 관심 있어요 영어로',
  description:
    '"I\'m interesting"이라고 하면 "나는 재미있는 사람"이 됩니다. 관심이 있다는 뜻은 I\'m interested입니다. 1화 bored/boring 규칙의 2탄입니다.',
  alternates: { canonical: '/learn/im-interested-not-interesting' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“I'm interesting”이 아니라 “I'm interested”입니다"
      practice="I'm interested in English."
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“I'm interesting.” — “나 관심 있어”라는 뜻으로 쓰는 경우</Quote>
        <Body>
          원어민에게는 “나는 재미있는(흥미로운) 사람이다”로 들립니다. 1화의 bored/boring과 똑같은
          규칙입니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>규칙 복습 (1화와 동일)</SectionTitle>
        <BulletList
          items={[
            <>
              <strong>-ed (interested, bored):</strong> 감정을 <strong>느끼는</strong> 쪽
            </>,
            <>
              <strong>-ing (interesting, boring):</strong> 감정을 <strong>일으키는</strong> 쪽
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“I'm interested.” — 나 관심 있어.</Quote>
        <BulletList
          items={[
            <>
              내가 관심이 있을 때 → <strong>I'm interested.</strong>
            </>,
            <>
              그 주제가 흥미로울 때 → <strong>This topic is interesting.</strong>
            </>,
            <>
              그 사람이 재미있을 때 → <strong>He is interesting.</strong>
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>I'm interested in English. (영어에 관심이 있어.)</>,
            <>I'm interested in this job. (이 일에 관심이 있어.)</>,
            <>This book is interesting. (이 책은 흥미로워.)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>주의할 쌍</SectionTitle>
        <BulletList
          items={[
            <>
              I'm interested in ~ (관심 있다) — 뒤에 in이 옵니다
            </>,
            <>
              interesting ~ (흥미로운 ~) — 사람을 수식하면 “재미있는 사람”이 됩니다
            </>,
          ]}
        />
        <Body>
          “I am interesting”을 말하고 싶다면, 정말로 “나는 재미있는 사람”이라고 자랑하는 경우에만 맞습니다.
        </Body>
      </Card>
    </ArticleShell>
  );
}
