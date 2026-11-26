import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "이해 못 했어요 영어로 — \"I am not understand\"가 아니라 \"I don't understand\"",
  description:
    "understand는 동사라 be동사(am)와 같이 쓰지 않습니다. I am not understand가 틀린 이유와 \"I don't understand\"를 정리했습니다.",
  alternates: { canonical: '/learn/i-dont-understand-not-i-am-not-understand' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am not understand”가 아니라 “I don't understand”입니다"}
      practice={"I don't understand."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am not understand.” — “이해 못 했어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “이해 못 해요”를 직역하면 “I am + not + understand”처럼 보이지만, 영어에서 understand는 동사입니다. 동사 앞에는 be동사(am/is/are)가 아니라 do동사(do/don't)를 씁니다. am은 형용사·명사 앞에만 옵니다."}</Body>
        <BulletList
          items={[
            <>{"I am happy. (형용사 — 맞음)"}</>,
            <>{"I am a student. (명사 — 맞음)"}</>,
            <>{"I am understand. (동사 — 틀림)"}</>,
          ]}
        />
        <Body>{"같은 실수: I am not know → I don't know, I am not like → I don't like."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I don't understand.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I don't understand what you mean. (무슨 뜻인지 모르겠어요.)"}</>,
            <>{"I don't know. (몰라요.)"}</>,
            <>{"I don't like spicy food. (매운 음식 안 좋아해요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"Sorry, I don't understand. Could you say it again? (죄송해요, 잘 모르겠어요. 다시 말씀해 주시겠어요?)"}</>,
            <>{"I don't understand this question. (이 질문이 이해가 안 돼요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
