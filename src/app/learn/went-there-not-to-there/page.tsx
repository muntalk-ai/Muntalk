import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "거기 갔어요 영어로 — \"I went to there\"가 아니라 \"I went there\"",
  description:
    "there는 장소 이름이 아니라 장소 부사라 to를 붙이지 않습니다. \"I went there\"가 맞는 이유와 here/there 규칙을 정리했습니다.",
  alternates: { canonical: '/learn/went-there-not-to-there' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I went to there”가 아니라 “I went there”입니다"}
      practice={"I went there yesterday."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I went to there yesterday.” — “어제 거기 갔어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “거기에 갔다”에서 “에”가 있어 to를 붙이고 싶어지지만, 영어의 there는 이미 “거기에, 거기로”라는 뜻을 가진 부사입니다. 부사 앞에는 전치사(to, at, in, on)를 붙이지 않습니다. 장소 이름 앞에만 to를 씁니다."}</Body>
        <BulletList
          items={[
            <>{"I went "}<strong>{"to"}</strong>{" Seoul. (장소 이름 앞에는 to)"}</>,
            <>{"I went "}<strong>{"there"}</strong>{". (there 자체가 “거기로”라 to 불필요)"}</>,
            <>{"I went "}<strong>{"to"}</strong>{" the park. / I went "}<strong>{"there"}</strong>{". (같은 뜻, 둘 다 맞음)"}</>,
          ]}
        />
        <Body>{"here도 마찬가지입니다. “Come to here”가 아니라 “Come here”입니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I went there yesterday.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I went there last week. (지난주에 거기 갔어요.)"}</>,
            <>{"Have you ever been there? (거기 가 본 적 있어요?)"}</>,
            <>{"I'll go there tomorrow. (내일 거기 갈 거예요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I went there to meet my friend. (친구를 만나러 거기 갔어요.)"}</>,
            <>{"We went there last summer. (작년 여름에 거기 갔어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
