import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "used to와 be used to 차이는? — \"예전에 했어요\" vs \"익숙해요\"",
  description:
    "\"I used to live in Seoul\"은 예전에 살았다는 뜻, \"I am used to living in Seoul\"은 사는 데 익숙하다는 뜻입니다. used to + 동사원형과 be used to + -ing의 차이를 정리했습니다.",
  alternates: { canonical: '/learn/used-to-vs-be-used-to' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I used to live in Seoul”과 “I am used to living in Seoul”은 뜻이 다릅니다"}
      practice={"I am used to living in Seoul."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am used to live in Seoul.” — “서울에 사는 데 익숙해요”라는 뜻으로 쓰려다 틀린 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"used to와 be used to는 생김새가 비슷하지만 뜻과 뒤에 오는 형태가 완전히 다릅니다. 한국어로 둘 다 “익숙하다·하곤 했다”로 뭉뚱그려 외우면 뒤에 동사원형을 쓸지 -ing를 쓸지 헷갈립니다."}</Body>
        <BulletList
          items={[
            <><strong>{"used to + 동사원형"}</strong>{" = 예전에는 그랬지만 지금은 아님 (과거 습관·상태)"}</>,
            <>{"· I "}<strong>{"used to live"}</strong>{" in Seoul. (예전에 서울에 살았어요. — 지금은 안 살아요.)"}</>,
            <>{"· She "}<strong>{"used to smoke"}</strong>{". (그녀는 예전에 담배를 피웠어요. — 지금은 안 피워요.)"}</>,
            <><strong>{"be used to + 명사/-ing"}</strong>{" = ~에 익숙하다 (현재 상태)"}</>,
            <>{"· I "}<strong>{"am used to living"}</strong>{" in Seoul. (서울에 사는 데 익숙해요.)"}</>,
            <>{"· She "}<strong>{"is used to"}</strong>{" the cold weather. (그녀는 추운 날씨에 익숙해요.)"}</>,
            <>{"I am used to "}<strong>{"live"}</strong>{" in Seoul. ✗ (be used to 뒤에는 -ing 또는 명사가 와야 함)"}</>,
            <>{"I "}<strong>{"am used to lived"}</strong>{" in Seoul. ✗ (같은 실수)"}</>,
          ]}
        />
        <Body>{"뒤 형태만 보면 구분할 수 있습니다. used to 뒤는 동사원형(live), be used to 뒤는 -ing(living) 또는 명사(the cold weather)입니다. “get used to + -ing”(~에 익숙해지는 중)도 같은 계열입니다. “I am getting used to living alone.”(혼자 사는 데 익숙해져 가고 있어요.)"}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am used to living in Seoul.”"}</strong>{" (서울에 사는 데 익숙해요.) "}<strong>{"“I used to live in Seoul.”"}</strong>{" (예전에 서울에 살았어요.)"}</Quote>
        <BulletList
          items={[
            <>{"I used to play soccer every weekend. (예전에는 매주 주말마다 축구를 했어요.)"}</>,
            <>{"I am used to waking up early. (일찍 일어나는 데 익숙해요.)"}</>,
            <>{"Are you used to driving on the left? (왼쪽 통행 운전에 익숙하세요?)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I used to live in Busan, but now I live in Seoul. (예전에는 부산에 살았지만 지금은 서울에 살아요.)"}</>,
            <>{"I am used to living alone now. (이제는 혼자 사는 데 익숙해요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
