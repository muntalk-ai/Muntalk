import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"서비스예요"는 "service"가 아닙니다 — It\'s on the house',
  description:
    '"service"에는 공짜라는 뜻이 없습니다. 가게에서 공짜로 준다는 뜻은 It\'s on the house입니다. service의 진짜 뜻과 공짜 표현을 정리했습니다.',
  alternates: { canonical: '/learn/on-the-house-not-service' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“서비스예요”는 “service”가 아닙니다"
      practice="It's on the house."
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“It's service.” — “이건 서비스(공짜)예요”라는 뜻으로 쓰는 경우</Quote>
        <Body>
          원어민에게는 공짜라는 뜻으로 들리지 않습니다. service는 ‘서비스업, 봉사, 접객’이라는 뜻이기
          때문입니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          한국어 “서비스”는 “가게에서 공짜로 주는 것”이라는 뜻으로 굳어졌지만, 영어 service에는 그런 뜻이
          없습니다.
        </Body>
        <BulletList
          items={[
            <>
              <strong>service:</strong> 서비스업, 봉사, 접객. Good service = 서비스가 좋아요.
            </>,
            <>
              <strong>공짜:</strong> free, 또는 가게에서 주는 경우 <strong>on the house</strong>.
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“It's on the house.” — (가게에서) 공짜예요.</Quote>
        <BulletList
          items={[
            <>Dessert is on the house. (디저트는 공짜예요.)</>,
            <>This drink is on the house. (이 음료는 서비스예요.)</>,
            <>It's free. (공짜예요 — 일반적인 경우)</>,
          ]}
        />
        <Body>
          “on the house”는 ‘집(가게) 부담’이라는 뜻에서 온 표현으로, 식당·카페에서 음식을 공짜로 줄 때
          씁니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>발음 포인트</SectionTitle>
        <Body>It's on the house도 한 번에 이어서 말하는 게 포인트입니다.</Body>
      </Card>
    </ArticleShell>
  );
}
