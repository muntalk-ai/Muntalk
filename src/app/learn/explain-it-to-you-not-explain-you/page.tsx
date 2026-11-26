import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "설명해 줄게요 영어로 — \"explain you\"가 아니라 \"explain it to you\"",
  description:
    "\"설명해 드릴게요\"는 \"I will explain you\"가 아니라 \"I will explain it to you\"입니다. explain은 사람을 직접 받지 못하고 설명할 '것'을 먼저 말합니다. give·tell과의 차이도 정리했습니다.",
  alternates: { canonical: '/learn/explain-it-to-you-not-explain-you' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I will explain you”가 아니라 “I will explain it to you”입니다"}
      practice={"Let me explain it to you."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I will explain you the rule.” — “규칙을 설명해 드릴게요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “너에게 설명하다”에서 “에게”가 있어 you를 explain 바로 뒤에 붙이고 싶어지지만, 영어의 explain은 설명할 "}<strong>{"것"}</strong>{"(규칙·문제·이유)을 직접 목적어로 받습니다. 사람을 바로 받으면 “너라는 사람을 설명하겠다”는 뜻이 되어 버립니다. 설명받는 사람은 to를 붙여 뒤에 말합니다. give나 tell은 “give me the book”처럼 사람을 바로 받을 수 있지만, explain은 안 됩니다."}</Body>
        <BulletList
          items={[
            <>{"I will explain "}<strong>{"it to you"}</strong>{". (설명해 드릴게요. — 설명할 것 + to + 사람)"}</>,
            <>{"I will explain "}<strong>{"you"}</strong>{" the rule. ✗ (너를 설명하겠다는 뜻이 됨)"}</>,
            <>{"Let me explain "}<strong>{"the problem to him"}</strong>{". (그에게 문제를 설명해 드릴게요.)"}</>,
          ]}
        />
        <Body>{"“Explain yourself”(네 입장을 설명해 봐)처럼 explain 뒤에 사람이 오는 경우는 있지만, 이때 yourself는 “네 이유·사정”이라는 설명할 '것'이라서 예외입니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I will explain it to you.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"Let me explain the rule to you. (규칙을 설명해 드릴게요.)"}</>,
            <>{"Can you explain this to me? (이걸 설명해 주시겠어요?)"}</>,
            <>{"She explained it to me very clearly. (그녀가 아주 명확하게 설명해 줬어요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I will explain it to you after class. (수업 끝나고 설명해 드릴게요.)"}</>,
            <>{"Could you explain how this works to me? (이게 어떻게 작동하는지 설명해 주시겠어요?)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
