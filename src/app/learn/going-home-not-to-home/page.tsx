import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"I\'m going to home"은 틀렸습니다 — I\'m going home',
  description:
    'home 앞에는 to를 붙이지 않습니다. I\'m going home이 맞습니다. home이 부사처럼 쓰이는 이유와 home / house 구분을 정리했습니다.',
  alternates: { canonical: '/learn/going-home-not-to-home' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“I'm going to home”은 틀렸습니다"
      practice="I'm going home."
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“I'm going to home.” — “집에 가요”라는 뜻으로 쓰는 경우</Quote>
        <Body>원어민에게는 어색합니다. home 앞에는 to를 붙이지 않기 때문입니다.</Body>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          home은 이 문장에서 장소 명사가 아니라 <strong>방향을 나타내는 부사</strong>처럼 쓰이기 때문입니다.
          부사 앞에는 전치사가 오지 않습니다.
        </Body>
        <BulletList
          items={[
            <>
              I'm going home. (집에 가요.) — 맞음
            </>,
            <>
              I'm going to school. (학교에 가요.) — school은 명사라 to가 필요
            </>,
            <>
              I'm going to the store. (가게에 가요.) — store도 명사라 to가 필요
            </>,
          ]}
        />
        <Body>
          즉, home만 예외입니다. “집으로”라는 방향 자체가 home 안에 들어 있기 때문입니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“I'm going home.”</Quote>
        <BulletList
          items={[
            <>I'm going home now. (지금 집에 가요.)</>,
            <>Let's go home. (집에 가자.)</>,
            <>I want to go home. (집에 가고 싶어.)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>home vs house</SectionTitle>
        <BulletList
          items={[
            <>
              <strong>home:</strong> 내가 사는 곳, 정서적 의미의 ‘집’. I'm going home.
            </>,
            <>
              <strong>house:</strong> 건물로서의 ‘집’. I bought a house. (집 한 채를 샀어.)
            </>,
          ]}
        />
        <Body>
          “집에 간다”는 말은 home입니다. house에 to를 붙이는 문장(“I'm going to the house”)은 특정 건물을
          가리킬 때만 씁니다.
        </Body>
      </Card>
    </ArticleShell>
  );
}
