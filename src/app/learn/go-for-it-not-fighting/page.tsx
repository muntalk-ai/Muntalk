import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '응원할 때 "Fighting!"은 틀렸습니다 — Go for it!',
  description:
    '"Fighting!"은 원어민에겐 "싸워라!"라는 명령으로 들립니다. 영어로 응원할 때는 Go for it!, You\'ve got this!, Good luck!을 씁니다.',
  alternates: { canonical: '/learn/go-for-it-not-fighting' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="응원할 때 “Fighting!”은 틀렸습니다"
      practice="Go for it!"
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“Fighting!” — 응원한다는 뜻으로 외치는 경우</Quote>
        <Body>
          원어민에게는 “싸워라!”라는 명령으로 들립니다. fighting은 ‘싸우는 중’이라는 뜻의 진행형이기
          때문입니다. (They are fighting = 그들은 싸우는 중)
        </Body>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          한국어 “화이팅”은 영어 fighting의 발음에서 온 말이지만, 영어에서 fighting은 응원이 아닙니다. 응원의
          뜻을 가진 표현은 따로 있습니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“Go for it!” — 해봐! 할 수 있어!</Quote>
        <Body>함께 쓰는 응원 표현:</Body>
        <BulletList
          items={[
            <>
              <strong>Go for it!</strong> — 해봐, 도전해봐 (가장 대표적)
            </>,
            <>
              <strong>You've got this!</strong> — 넌 할 수 있어
            </>,
            <>
              <strong>Good luck!</strong> — 행운을 빌어
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>Go for it! You can do it. (해봐! 넌 할 수 있어.)</>,
            <>You've got this! (넌 할 수 있어!)</>,
            <>Good luck on your exam! (시험 잘 봐!)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>발음 포인트</SectionTitle>
        <Body>Go for it!은 끊어서 말하지 말고 한 번에 이어서 말하는 게 포인트입니다.</Body>
      </Card>
    </ArticleShell>
  );
}
