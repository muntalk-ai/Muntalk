import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '핸드폰 영어는 "hand phone"이 아닙니다 — cell phone',
  description:
    '"hand phone"은 영어에 없는 말입니다. 원어민은 못 알아듣습니다. 미국식은 cell phone, 영국식은 mobile phone입니다.',
  alternates: { canonical: '/learn/cell-phone-not-hand-phone' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="핸드폰 영어는 “hand phone”이 아닙니다"
      practice="my cell phone"
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“I lost my hand phone.” — “내 핸드폰을 잃어버렸어”라는 뜻으로 쓰는 경우</Quote>
        <Body>
          원어민은 못 알아듣습니다. hand phone은 ‘손 + 전화’를 직역한 말로, 영어에는 존재하지 않습니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          한국어 “핸드폰”이 영어 hand + phone의 합성어처럼 보이지만, 실제 영어 단어가 아니기 때문입니다.
          일본식·한국식 조어에 가깝습니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“cell phone” (미국식) / “mobile phone” (영국식)</Quote>
        <BulletList
          items={[
            <>I lost my cell phone. (내 폰을 잃어버렸어.)</>,
            <>Can I use your cell phone? (네 폰 좀 써도 돼?)</>,
            <>My mobile phone is out of battery. (내 폰 배터리가 나갔어.)</>,
          ]}
        />
        <Body>
          미국에서는 cell phone이 기본값입니다. 영국에서는 mobile phone을 씁니다. 둘 다 맞고, 상황만
          다릅니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>발음 포인트</SectionTitle>
        <Body>
          강세가 포인트입니다. 첫 단어에 힘을 주세요: <strong>CELL</strong> phone.
        </Body>
      </Card>
    </ArticleShell>
  );
}
