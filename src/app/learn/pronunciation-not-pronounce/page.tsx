import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"My pronounce is bad"는 틀렸습니다 — 발음은 pronunciation입니다',
  description:
    'pronounce는 동사, pronunciation은 명사입니다. "My pronounce is bad"가 틀린 이유와 발음 관련 표현을 정리했습니다.',
  alternates: { canonical: '/learn/pronunciation-not-pronounce' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“My pronounce is bad”가 아니라 “My pronunciation is bad”입니다"
      practice="My pronunciation is bad."
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“My pronounce is bad.” — “내 발음이 안 좋아”라는 뜻으로 쓰는 경우</Quote>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          한국어 “발음”은 명사 하나지만, 영어에서는 동사와 명사가 따로 있습니다. pronounce는 “발음하다”라는{' '}
          <strong>동사</strong>이고, “발음(명사)”은 <strong>pronunciation</strong>입니다. “My pronounce”는 “나의
          발음하다”라는 말이 되어 틀립니다.
        </Body>
        <BulletList
          items={[
            <>
              pronounce (동사): Please <strong>pronounce</strong> this word. (이 단어를 발음해 보세요.)
            </>,
            <>
              pronunciation (명사): My <strong>pronunciation</strong> is bad. (내 발음이 안 좋아요.)
            </>,
          ]}
        />
        <Body>
          비슷한 쌍: spell(동사, 철자를 말하다) → spelling(명사), mean(동사, ~을 뜻하다) → meaning(명사).
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“My pronunciation is bad.”</Quote>
        <BulletList
          items={[
            <>
              How do you pronounce this word? (이 단어 어떻게 발음해요?)
            </>,
            <>
              Her pronunciation is very clear. (그녀 발음이 아주 또렷해요.)
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>
              My pronunciation is bad, so I practice every day. (발음이 안 좋아서 매일 연습해요.)
            </>,
            <>
              Can you check my pronunciation? (제 발음 좀 봐 주시겠어요?)
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
