import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "10분 늦었어요 영어로 — \"late for 10 minutes\"가 아니라 \"10 minutes late\"",
  description:
    "\"10분 늦었어요\"는 \"I am late for 10 minutes\"가 아닙니다. 시간은 late 앞에 둡니다. \"I am 10 minutes late\"와 late for의 올바른 쓰임을 정리했습니다.",
  alternates: { canonical: '/learn/ten-minutes-late-not-late-for-ten-minutes' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am late for 10 minutes”가 아니라 “I am 10 minutes late”입니다"}
      practice={"I am 10 minutes late."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am late for 10 minutes.” — “10분 늦었어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"late for 뒤에는 약속·모임·수업 같은 "}<strong>{"일정"}</strong>{"이 오고, 시간(10 minutes)이 오지 않습니다. “얼마나 늦었는지”는 late "}<strong>{"앞에"}</strong>{" 시간을 붙여서 말합니다. 한국어 “10분 늦었어요”의 어순을 그대로 옮기면 틀립니다."}</Body>
        <BulletList
          items={[
            <>{"I am late "}<strong>{"for"}</strong>{" the meeting. (회의에 늦었어요 — for 뒤는 일정)"}</>,
            <>{"I am "}<strong>{"10 minutes"}</strong>{" late. (10분 늦었어요 — 시간은 late 앞)"}</>,
            <>{"I am late for 10 minutes. ✗ (for 뒤에 시간이 오면 안 됨)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am 10 minutes late.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I'm running late. (늦고 있어요. — 가장 자연스러운 표현)"}</>,
            <>{"I'm going to be about 10 minutes late. (10분 정도 늦을 것 같아요.)"}</>,
            <>{"Sorry I'm late — the traffic was terrible. (늦어서 죄송해요, 교통이 너무 막혔어요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I'm sorry, I'm 10 minutes late for the meeting. (죄송해요, 회의에 10분 늦었어요.)"}</>,
            <>{"The train is 15 minutes late today. (오늘 기차가 15분 늦었어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
