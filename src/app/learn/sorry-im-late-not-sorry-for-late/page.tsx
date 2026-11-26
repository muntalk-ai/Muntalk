import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "늦어서 죄송해요 영어로 — \"Sorry for late\"가 아니라 \"Sorry I'm late\"",
  description:
    "\"늦어서 죄송해요\"는 \"Sorry for late\"가 아니라 \"Sorry I'm late\"입니다. late는 형용사라 for 뒤에 바로 쓸 수 없고, sorry 뒤에는 \"I'm late\"라는 완전한 문장이나 \"for being late\"를 씁니다.",
  alternates: { canonical: '/learn/sorry-im-late-not-sorry-for-late' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“Sorry for late”가 아니라 “Sorry I'm late”입니다"}
      practice={"Sorry I'm late."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“Sorry for late.” — “늦어서 죄송해요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “늦어서 죄송해요”를 직역하면 sorry + for + late가 되지만, late는 형용사라 for(전치사) 뒤에 바로 올 수 없습니다. for 뒤에는 명사나 -ing 형태가 와야 합니다. “Sorry for late”는 문장이 불완전해서 틀리고, 정답은 “Sorry I'm late.”(늦어서 죄송해요.) 또는 “Sorry for being late.”(늦어서 죄송해요.)입니다."}</Body>
        <BulletList
          items={[
            <><strong>{"Sorry I'm late."}</strong>{" (늦어서 죄송해요. — 가장 흔한 표현)"}</>,
            <><strong>{"Sorry for being late."}</strong>{" (늦어서 죄송해요. — being을 붙여 -ing 형태로 만든 경우)"}</>,
            <>{"Sorry for "}<strong>{"late"}</strong>{". ✗ (late는 형용사라 for 뒤에 올 수 없음)"}</>,
            <>{"I'm sorry "}<strong>{"I was late"}</strong>{" this morning. (오늘 아침에 늦어서 죄송해요. — 이미 지난 일)"}</>,
          ]}
        />
        <Body>{"“Sorry I'm late”는 도착한 직후에 가장 많이 씁니다. “Sorry I'm late — the traffic was terrible.”(늦어서 죄송해요. 교통이 너무 막혔어요.)처럼 이유를 붙일 수 있습니다. 메일처럼 나중에 사과할 때는 “I'm sorry I was late this morning.”(오늘 아침에 늦어서 죄송합니다.)처럼 과거형을 씁니다. “Sorry for the delay.”(지연돼서 죄송합니다.)도 같은 뜻의 격식 있는 표현입니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“Sorry I'm late.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"Sorry I'm late. I got held up at work. (늦어서 죄송해요. 일 때문에 발이 묶였어요.)"}</>,
            <>{"I'm sorry for being late to the meeting. (회의에 늦어서 죄송합니다.)"}</>,
            <>{"Sorry for the delay in responding. (답장이 늦어서 죄송합니다.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"Sorry I'm late — thank you for waiting. (늦어서 죄송해요. 기다려 주셔서 감사해요.)"}</>,
            <>{"I'm sorry I was late yesterday. It won't happen again. (어제 늦어서 죄송합니다. 다시는 안 그럴게요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
