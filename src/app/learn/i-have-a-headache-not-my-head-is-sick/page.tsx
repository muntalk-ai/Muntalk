import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "머리 아파요 영어로 — \"My head is sick\"가 아니라 \"I have a headache\"",
  description:
    "머리 아파요는 My head is sick이 아니라 I have a headache입니다. 몸이 아플 때 쓰는 have a + 증상 표현을 정리했습니다.",
  alternates: { canonical: '/learn/i-have-a-headache-not-my-head-is-sick' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“My head is sick”가 아니라 “I have a headache”입니다"}
      practice={"I have a headache."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“My head is sick.” — “머리 아파요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “머리가 아프다”를 그대로 옮기면 “My head is sick”이 되지만, 영어에서 sick은 사람 전체가 아픈 상태를 말합니다. 머리·배·치아처럼 몸의 한 부분이 아플 때는 “I have a + 증상” 구조를 씁니다. 원어민에게 “My head is sick”은 “내 머리가 병들었다”는 이상한 말로 들립니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I have a headache.”"}</strong></Quote>
        <Body>{"증상별로 바꿔 쓰면 됩니다."}</Body>
        <BulletList
          items={[
            <>{"I have a headache. (머리 아파요.)"}</>,
            <>{"I have a stomachache. (배 아파요.)"}</>,
            <>{"I have a toothache. (이 아파요.)"}</>,
            <>{"I have a cold. (감기 걸렸어요.)"}</>,
            <>{"I have a fever. (열이 나요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I have a headache. I need some rest. (머리가 아파요. 좀 쉬어야겠어요.)"}</>,
            <>{"She has a stomachache, so she went home early. (그녀는 배가 아파서 일찍 집에 갔어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
