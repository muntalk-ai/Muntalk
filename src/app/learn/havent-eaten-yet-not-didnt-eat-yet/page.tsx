import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "아직 안 먹었어요 영어로 — \"I didn't eat yet\"이 아니라 \"I haven't eaten yet\"",
  description:
    "\"아직 안 먹었어요\"는 \"I didn't eat yet\"이 아니라 \"I haven't eaten yet\"입니다. yet은 현재완료의 신호라 표준 영어에서는 have + 과거분사를 씁니다. already·ever·just도 같은 규칙입니다.",
  alternates: { canonical: '/learn/havent-eaten-yet-not-didnt-eat-yet' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I didn't eat yet”이 아니라 “I haven't eaten yet”입니다"}
      practice={"I haven't eaten yet."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I didn't eat yet.” — “아직 안 먹었어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “아직 안 먹었어요”는 과거형으로 들리지만, 영어에서 yet(아직)은 현재완료와 짝을 이루는 신호 단어입니다. “아직 안 했다”는 '지금 이 순간까지 안 한 상태'라 현재와 연결되므로 현재완료(have + 과거분사)를 써야 합니다. “I didn't eat yet”은 미국 구어체에서는 들리기도 하지만, 표준 영어·시험에서는 틀린 것으로 보므로 정답은 “I haven't eaten yet”입니다."}</Body>
        <BulletList
          items={[
            <>{"I "}<strong>{"haven't eaten"}</strong>{" yet. (아직 안 먹었어요.)"}</>,
            <>{"I "}<strong>{"didn't eat"}</strong>{" yesterday. (어제 안 먹었어요. — 끝난 시점이라 과거형)"}</>,
            <>{"I "}<strong>{"didn't eat"}</strong>{" yet. ✗ (표준 영어에서는 틀림 — yet이 있으면 현재완료)"}</>,
            <><strong>{"Have you eaten"}</strong>{" yet? (아직 안 먹었어요? / 벌써 먹었어요?)"}</>,
          ]}
        />
        <Body>{"yet은 부정문과 의문문에서 현재완료와 함께 씁니다. “She hasn't finished her homework yet.”(그녀는 아직 숙제를 안 끝냈어요.), “Have you finished yet?”(아직 안 끝냈어요?)처럼 씁니다. already·ever·just도 같은 계열입니다. “I have already eaten.”(벌써 먹었어요.), “Have you ever eaten sushi?”(스시를 먹어 본 적 있어요?), “I have just arrived.”(방금 도착했어요.)처럼 씁니다. 반대로 어제·지난주처럼 끝난 시점이 있으면 과거형을 씁니다. “I didn't eat breakfast yesterday.”(어제 아침을 안 먹었어요.)"}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I haven't eaten yet.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I haven't eaten lunch yet. (아직 점심을 안 먹었어요.)"}</>,
            <>{"She hasn't called me yet. (그녀는 아직 저한테 전화 안 했어요.)"}</>,
            <>{"Have you done your homework yet? (숙제 다 했어요?)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I haven't eaten yet, so I'm quite hungry. (아직 안 먹어서 너무 배고파요.)"}</>,
            <>{"I didn't eat breakfast this morning, but I have eaten lunch already. (오늘 아침은 안 먹었지만 점심은 벌써 먹었어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
