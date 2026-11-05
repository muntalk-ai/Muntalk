import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"Do you know what time is it?"는 틀렸습니다 — 간접의문문은 어순이 안 바뀝니다',
  description:
    'Do you know 뒤에 오는 질문은 어순을 바꾸지 않습니다. "Do you know what time it is?"가 맞는 이유와 간접의문문 규칙을 정리했습니다.',
  alternates: { canonical: '/learn/what-time-it-is-not-is-it' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“Do you know what time is it?”가 아니라 “Do you know what time it is?”입니다"
      practice="Do you know what time it is?"
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“Do you know what time is it?” — “지금 몇 시인지 알아요?”라는 뜻으로 쓰는 경우</Quote>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          “What time is it?”은 직접 질문이라 is가 it 앞으로 나옵니다(도치). 그런데 “Do you know...?” 뒤에 붙으면 질문이
          문장 안에 들어가는 간접의문문이 됩니다. 간접의문문 안에서는 평서문 어순(주어 + 동사)으로 돌아가야 합니다. is it이
          아니라 it is가 맞습니다.
        </Body>
        <BulletList
          items={[
            <>
              직접 질문: What time <strong>is it</strong>? (도치 — 맞음)
            </>,
            <>
              간접 질문: Do you know what time <strong>it is</strong>? (평서문 어순 — 맞음)
            </>,
            <>
              Can you tell me where <strong>the bathroom is</strong>? (where is the bathroom이 아님)
            </>,
          ]}
        />
        <Body>
          do/does/did도 간접의문문 안에서는 사라집니다. “Do you know what time does the bank open?”이 아니라 “Do you
          know what time the bank opens?”입니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“Do you know what time it is?”</Quote>
        <BulletList
          items={[
            <>
              Could you tell me where the station is? (역이 어디인지 알려 주시겠어요?)
            </>,
            <>
              I wonder why he was late. (왜 그가 늦었는지 궁금해요.)
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>
              Do you know what time it is? (지금 몇 시인지 알아요?)
            </>,
            <>
              Can you tell me where the bank is? (은행이 어디인지 알려 주시겠어요?)
            </>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
