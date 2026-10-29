import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"I\'m boring"이 아니라 "I\'m bored"입니다 — 지루하다고 말할 때',
  description:
    '"I\'m boring"이라고 하면 "나는 지루한 사람"이 됩니다. -ed와 -ing의 차이, I\'m bored / I\'m boring 구분법과 예문을 정리했습니다.',
  alternates: { canonical: '/learn/im-bored-not-boring' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“I'm boring”이 아니라 “I'm bored”입니다"
      practice="I'm bored."
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“I'm boring.” — “나 지루해”라는 뜻으로 쓰는 경우</Quote>
        <Body>
          원어민에게는 “나는 지루한 사람이다”로 들립니다. 상대방이 “아, 네가 지루한 사람이구나”라고 이해할 수 있어요.
        </Body>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>-ed와 -ing의 역할이 반대이기 때문입니다.</Body>
        <BulletList
          items={[
            <>
              <strong>-ed (bored, interested, tired):</strong> 감정을 <strong>느끼는</strong> 쪽. “내가 ~한 상태다”
            </>,
            <>
              <strong>-ing (boring, interesting, tiring):</strong> 감정을 <strong>일으키는</strong> 쪽. “저것이 나를 ~하게
              만든다”
            </>,
          ]}
        />
        <Body>그래서 “I'm boring”은 “내가 남을 지루하게 만든다”는 뜻이 됩니다.</Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“I'm bored.” — 나 지루해.</Quote>
        <BulletList
          items={[
            <>
              내가 지루함을 느낄 때 → <strong>I'm bored.</strong>
            </>,
            <>
              영화가 나를 지루하게 만들 때 → <strong>The movie is boring.</strong>
            </>,
            <>
              그 사람이 지루한 사람일 때 → <strong>He is boring.</strong>
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>
              I'm so bored today. (오늘 너무 지루해.)
            </>,
            <>
              This lecture is boring. (이 강의는 지루해.)
            </>,
            <>
              Are you bored? (지루해?)
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>헷갈리기 쉬운 쌍</SectionTitle>
        <BulletList
          items={[
            <>
              I'm interested (내가 관심이 있다) vs This is interesting (이건 흥미롭다)
            </>,
            <>
              I'm tired (내가 피곤하다) vs This work is tiring (이 일은 사람을 피곤하게 한다)
            </>,
          ]}
        />
        <Body>
          규칙은 하나입니다. <strong>내 감정이면 -ed, 대상의 성질이면 -ing.</strong>
        </Body>
      </Card>
    </ArticleShell>
  );
}
