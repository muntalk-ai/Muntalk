import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "look forward to 뒤에는 -ing? — \"to see you\"가 아니라 \"to seeing you\"",
  description:
    "look forward to의 to는 전치사라 뒤에 동사원형이 아니라 -ing가 옵니다. I look forward to seeing you가 맞는 이유를 정리했습니다. (글로벌 영문 주제)",
  alternates: { canonical: '/learn/look-forward-to-seeing-you' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I look forward to see you”가 아니라 “I look forward to seeing you”입니다"}
      practice={"I look forward to seeing you."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I look forward to see you.” — “만나길 기대해요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"to 뒤에는 보통 동사원형이 오지만, look forward to의 to는 전치사입니다. 전치사 뒤에는 명사나 동명사(-ing)가 옵니다. 그래서 see가 아니라 seeing이 맞습니다. 같은 패턴: be used to + -ing, be interested in + -ing, be good at + -ing."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I look forward to seeing you.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I look forward to meeting you. (만나길 기대해요.)"}</>,
            <>{"I look forward to your reply. (답장 기다릴게요.)"}</>,
            <>{"I'm looking forward to the weekend. (주말이 기대돼요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I look forward to seeing you next week. (다음 주에 만나길 기대해요.)"}</>,
            <>{"We look forward to working with you. (함께 일하게 되길 기대합니다.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
