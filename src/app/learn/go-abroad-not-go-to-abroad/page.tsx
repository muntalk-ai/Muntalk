import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "해외에 가요 영어로 — \"go to abroad\"가 아니라 \"go abroad\"입니다",
  description:
    "\"해외에 가요\"는 \"go to abroad\"가 아니라 \"go abroad\"입니다. abroad는 부사라 앞에 to를 붙이지 않습니다. go home·go there와 같은 규칙을 함께 정리했습니다.",
  alternates: { canonical: '/learn/go-abroad-not-go-to-abroad' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I will go to abroad”가 아니라 “I will go abroad”입니다"}
      practice={"I will go abroad next year."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I will go to abroad next year.” — “내년에 해외에 갈 거예요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “해외에 가다”에서 “에”가 있어 to를 붙이고 싶어지지만, abroad는 명사가 아니라 부사입니다. 부사는 동사 뒤에 바로 붙습니다. “go to Seoul”에서 Seoul은 명사라 to가 필요하지만, abroad는 “해외로”라는 뜻 자체를 품고 있어 to가 들어갈 자리가 없습니다. 같은 이유로 “go to home”도 틀리고 “go home”이 맞습니다."}</Body>
        <BulletList
          items={[
            <>{"I will go "}<strong>{"abroad"}</strong>{" next year. (내년에 해외에 갈 거예요.)"}</>,
            <>{"I will go "}<strong>{"to"}</strong>{" Seoul next year. (내년에 서울에 갈 거예요. — Seoul은 명사)"}</>,
            <>{"I will go to "}<strong>{"abroad"}</strong>{". ✗ / I am going to "}<strong>{"the"}</strong>{" abroad. ✗ (둘 다 틀림)"}</>,
          ]}
        />
        <Body>{"같은 규칙: go home(집에 가다), go there(거기 가다), go here(여기 오다), come back home(집으로 돌아오다) — 전부 to 없이 씁니다. 반대로 “go to a foreign country”(외국에 가다)는 foreign country가 명사라 to가 맞습니다. “live abroad”(해외에 살다), “study abroad”(해외에서 공부하다)도 같은 패턴입니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I will go abroad next year.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I want to go abroad someday. (언젠가 해외에 가고 싶어요.)"}</>,
            <>{"She went abroad to study English. (그녀는 영어를 공부하러 해외에 갔어요.)"}</>,
            <>{"He lives abroad now. (그는 지금 해외에 살고 있어요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I will go abroad next year for work. (내년에 일 때문에 해외에 갈 거예요.)"}</>,
            <>{"Have you ever been abroad? (해외에 가 본 적 있어요?)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
