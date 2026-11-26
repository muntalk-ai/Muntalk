import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "어떻게 생각해요 영어로 — \"How do you think?\"가 아니라 \"What do you think?\"",
  description:
    "\"How do you think?\"는 \"어떻게 생각해요?\"가 아닙니다. 의견을 물을 때는 \"What do you think?\"입니다. how와 what의 쓰임 차이를 정리했습니다.",
  alternates: { canonical: '/learn/what-do-you-think-not-how-do-you-think' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“How do you think?”가 아니라 “What do you think?”입니다"}
      practice={"What do you think about this movie?"}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“How do you think about this movie?” — “이 영화 어떻게 생각해요?”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “어떻게 생각해요?”를 그대로 옮기면 “How do you think?”가 됩니다. 그런데 영어에서 how는 “어떤 방법으로”를 묻습니다. “How do you think?”라고 물으면 원어민은 “머리로 생각해요”라는 대답이 먼저 떠오릅니다. 의견을 물을 때는 “무엇을” 묻는 what을 써야 합니다."}</Body>
        <BulletList
          items={[
            <>{"how = 어떤 방법으로 (How do you think? → “머리로요.”)"}</>,
            <>{"what = 무엇을, 어떤 의견으로 (What do you think? → “좋은 것 같아요.”)"}</>,
          ]}
        />
        <Body>{"“How do you think about this movie?”는 문법적으로 불가능한 문장은 아니지만, 의견을 묻는 뜻으로는 쓰지 않습니다. 느낌을 물을 때는 “How do you "}<strong>{"feel"}</strong>{" about this movie?”라고 합니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“What do you think about this movie?”"}</strong></Quote>
        <BulletList
          items={[
            <>{"What do you think? (어떻게 생각해요? — 가장 흔한 표현)"}</>,
            <>{"What do you think of this idea? (이 아이디어 어떻게 생각해요?)"}</>,
            <>{"How do you feel about this movie? (이 영화 어떻게 느껴요? — 느낌을 물을 때)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"What do you think about my new shoes? (제 새 신발 어떻게 생각해요?)"}</>,
            <>{"What do you think of the new restaurant? (새 식당 어떻게 생각해요?)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
