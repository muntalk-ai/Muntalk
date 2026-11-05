import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"There is many people"는 틀렸습니다 — 뒤에 오는 명사를 보고 is/are를 고릅니다',
  description:
    'there is/are는 there가 아니라 뒤에 오는 명사에 맞춥니다. "There are many people"이 맞는 이유와 there is/are 규칙을 정리했습니다.',
  alternates: { canonical: '/learn/there-are-many-people' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“There is many people”가 아니라 “There are many people”입니다"
      practice="There are many people at the party."
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“There is many people at the party.” — “파티에 사람이 많아”라는 뜻으로 쓰는 경우</Quote>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          there is/are 문장에서 there는 자리만 차지하는 말이고, 진짜 주어는 뒤에 오는 명사입니다. 명사가 복수(people)면
          are, 단수(a person)나 셀 수 없는 명사면 is를 씁니다. there가 단수처럼 보여도 is를 고정으로 쓰면 안 됩니다.
        </Body>
        <BulletList
          items={[
            <>
              There <strong>is a person</strong> in the room. (방에 사람이 한 명 있어요. — 단수)
            </>,
            <>
              There <strong>are many people</strong> at the party. (파티에 사람이 많아요. — 복수)
            </>,
            <>
              There <strong>is a lot of traffic</strong> today. (오늘 차가 많이 막혀요. — 셀 수 없음)
            </>,
          ]}
        />
        <Body>
          원어민도 구어에서는 “There&apos;s many people”처럼 줄여 쓰기도 하지만, 문법적으로 맞는 형태는 “There are many
          people”입니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“There are many people at the party.”</Quote>
        <BulletList
          items={[
            <>
              There are three restaurants on this street. (이 거리에는 식당이 세 개 있어요.)
            </>,
            <>
              There is a new cafe near my house. (우리 집 근처에 새 카페가 있어요.)
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>
              There are many people waiting outside. (밖에 기다리는 사람이 많아요.)
            </>,
            <>
              There is a problem with my phone. (제 폰에 문제가 있어요.)
            </>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
