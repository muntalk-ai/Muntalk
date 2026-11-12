import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '매일 영어로 — "I study English everyday"가 아니라 "I study English every day"입니다',
  description:
    '"매일 영어 공부해요"는 "I study English everyday"가 아니라 "I study English every day"입니다. everyday는 "일상적인"이라는 형용사라 동사 뒤에 쓸 수 없고, "매일"이라는 부사는 every day라고 띄어 씁니다.',
  alternates: { canonical: '/learn/every-day-not-everyday' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“I study English everyday”가 아니라 “I study English every day”입니다"
      practice="I study English every day."
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“I study English everyday.” — “매일 영어 공부해요”라는 뜻으로 쓰는 경우</Quote>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          everyday와 every day는 발음이 똑같지만 품사와 뜻이 완전히 다릅니다. everyday(붙여 쓰기)는
          “일상적인·평범한”이라는 뜻의 형용사라 명사 앞에서만 씁니다. “everyday clothes”(평상복), “everyday
          life”(일상생활)처럼 말합니다. “매일”이라는 뜻의 부사는 every day(띄어 쓰기)입니다. 동사 뒤에 “매일”을
          붙일 때는 everyday가 아니라 every day를 써야 합니다.
        </Body>
        <BulletList
          items={[
            <>
              I study English <strong>every day</strong>. (매일 영어 공부해요. — 부사구)
            </>,
            <>
              I go to the gym <strong>every day</strong>. (매일 헬스장에 가요.)
            </>,
            <>
              I study English <strong>everyday</strong>. ✗ (everyday는 형용사라 동사 뒤에 쓸 수 없음)
            </>,
            <>
              These are my <strong>every day</strong> shoes. ✗ (“매일의 신발”이 아니라 “일상적인 신발”이라 everyday
              shoes가 정답)
            </>,
          ]}
        />
        <Body>
          구분하는 요령이 있습니다. ordinary(평범한)로 바꿔도 말이 되면 붙여 쓰는 everyday, each day(매일)로 바꿔도
          말이 되면 띄어 쓰는 every day입니다. “everyday life”는 “ordinary life”로 바꿀 수 있어 붙여 쓰고, “I study
          every day”는 “I study each day”로 바꿀 수 있어 띄어 씁니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“I study English every day.”</Quote>
        <BulletList
          items={[
            <>I study English every day, even on weekends. (주말에도 매일 영어 공부해요.)</>,
            <>She practices the piano every day. (그녀는 매일 피아노를 연습해요.)</>,
            <>These are my everyday shoes. I wear them every day. (이건 제 평상복 신발이에요. 매일 신어요.)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>I read a book every day before bed. (잠자기 전에 매일 책을 읽어요.)</>,
            <>He goes for a run every day in the morning. (그는 매일 아침에 달리기를 해요.)</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
