import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "급해요 영어로 — \"I am hurry\"가 아니라 \"I am in a hurry\"입니다",
  description:
    "\"급해요\"는 \"I am hurry\"가 아니라 \"I am in a hurry\"입니다. hurry는 동사라 be동사 뒤에 바로 쓸 수 없고, 서두르는 상태는 \"in a hurry\"라는 고정 표현으로 말합니다.",
  alternates: { canonical: '/learn/in-a-hurry-not-i-am-hurry' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am hurry”가 아니라 “I am in a hurry”입니다"}
      practice={"I am in a hurry."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am hurry now.” — “지금 급해요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “급하다”는 형용사라 hurry를 형용사처럼 be동사 뒤에 붙이고 싶어지지만, hurry는 동사(서두르다)와 명사(서두름)입니다. “I am hurry”는 “나는 서두름이다”가 되어 버립니다. 서두르는 '상태'는 “in a hurry”라는 고정된 관용 표현으로 말해야 하고, a를 빼면 안 됩니다."}</Body>
        <BulletList
          items={[
            <>{"I am "}<strong>{"in a hurry"}</strong>{". (급해요.)"}</>,
            <>{"I need to "}<strong>{"hurry"}</strong>{". (서둘러야 해요. — hurry를 동사로 쓴 경우)"}</>,
            <>{"I am "}<strong>{"hurry"}</strong>{" now. ✗ / I am "}<strong>{"in hurry"}</strong>{" now. ✗ (a를 빼도 틀림)"}</>,
            <>{"I am "}<strong>{"in a rush"}</strong>{". (급해요. — 같은 뜻의 다른 표현, a도 필요)"}</>,
          ]}
        />
        <Body>{"“hurry up”(빨리 해요)도 자주 씁니다. “Hurry up, we are late!”(빨리 해요, 늦었어요!)처럼 명령형으로 씁니다. “There is no hurry.”(급할 거 없어요.)는 반대로 여유가 있다는 뜻입니다. “I am in a hurry to catch the train.”(기차를 타려고 급해요.)처럼 to 뒤에 목적을 붙일 수 있습니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am in a hurry.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I am in a hurry right now. (지금 급해요.)"}</>,
            <>{"Sorry, I can't talk. I am in a hurry. (죄송해요. 지금 급해서 얘기할 수 없어요.)"}</>,
            <>{"She was in a hurry to leave. (그녀는 떠나려고 서두르고 있었어요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I am in a hurry, so I will call you later. (지금 급해서 나중에 전화할게요.)"}</>,
            <>{"Don't worry, there is no hurry. (걱정 마세요. 급할 거 없어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
