import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "졸려요 영어로 — \"I am sleep\"이 아니라 \"I am sleepy\"입니다",
  description:
    "\"졸려요\"는 \"I am sleep\"이 아니라 \"I am sleepy\"입니다. sleep은 동사·명사라 be동사 뒤에 쓸 수 없고, 졸린 '상태'는 형용사 sleepy로 말합니다. I am sleeping과의 차이도 함께 정리했습니다.",
  alternates: { canonical: '/learn/i-am-sleepy-not-i-am-sleep' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am sleep”이 아니라 “I am sleepy”입니다"}
      practice={"I am sleepy."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am sleep now.” — “지금 졸려요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “졸리다”는 하나의 동사라 sleep이라는 단어 하나만 떠오르지만, 영어에서 sleep은 동사(자다)와 명사(잠)이고 형용사가 아닙니다. be동사(am/is/are) 뒤에는 형용사가 와야 하므로 “I am sleep”은 “나는 잠이다”라는 이상한 문장이 됩니다. 졸린 '상태'를 말할 때는 형용사 sleepy를 써야 합니다."}</Body>
        <BulletList
          items={[
            <>{"I am "}<strong>{"sleepy"}</strong>{". (졸려요. — 지금 졸린 상태)"}</>,
            <>{"I am "}<strong>{"sleeping"}</strong>{". (자고 있어요. — 지금 자는 행동 중)"}</>,
            <>{"I am "}<strong>{"sleep"}</strong>{" now. ✗ / I am "}<strong>{"sleeping"}</strong>{" now because I'm tired. (두 번째는 맞지만 뜻이 다름 — “피곤해서 자고 있어요”)"}</>,
          ]}
        />
        <Body>{"“sleepy”와 “sleeping”은 둘 다 맞지만 뜻이 다릅니다. “I am sleepy”는 '졸리다'(아직 안 자고 졸린 상태), “I am sleeping”은 '자고 있다'(이미 잠든 상태)입니다. “I feel sleepy”도 맞고, “I am sleepy”보다 느낌을 강조합니다. 반대로 “I am asleep”은 '잠들어 있다'는 뜻으로 “I am sleeping”과 비슷하게 씁니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am sleepy.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I am so sleepy. (너무 졸려요.)"}</>,
            <>{"I feel sleepy after lunch. (점심 먹고 나면 졸려요.)"}</>,
            <>{"He is asleep now. (그는 지금 자고 있어요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I am sleepy, so I am going to bed early tonight. (졸려서 오늘은 일찍 잘 거예요.)"}</>,
            <>{"I was so sleepy during the meeting. (회의 중에 너무 졸렸어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
