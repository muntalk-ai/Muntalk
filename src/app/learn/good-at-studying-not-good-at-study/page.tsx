import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "공부를 잘해요 영어로 — \"good at study\"가 아니라 \"good at studying\"",
  description:
    "\"영어 공부 잘해요\"는 \"I am good at study English\"가 아니라 \"I am good at studying English\"입니다. 전치사 뒤에는 동사 원형이 아니라 -ing가 옵니다.",
  alternates: { canonical: '/learn/good-at-studying-not-good-at-study' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am good at study English”가 아니라 “I am good at studying English”입니다"}
      practice={"I am good at studying English."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am good at study English.” — “영어 공부 잘해요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “공부 잘하다”를 그대로 옮기면 study를 원형 그대로 쓰고 싶어지지만, 영어에서 전치사(at, in, on, for, about, without 등) 뒤에 동사가 오면 반드시 "}<strong>{"-ing"}</strong>{" 형태가 됩니다. “good at”의 at은 전치사라서, 뒤에 오는 동사는 studying·cooking·playing처럼 -ing로 바꿔야 합니다. 동사 원형이나 to부정사는 전치사 뒤에 올 수 없습니다."}</Body>
        <BulletList
          items={[
            <>{"I am good at "}<strong>{"studying"}</strong>{" English. (영어 공부 잘해요.)"}</>,
            <>{"I am good at "}<strong>{"study"}</strong>{" English. ✗ (전치사 뒤에 원형 불가)"}</>,
            <>{"She is good at "}<strong>{"cooking"}</strong>{". / He is good at "}<strong>{"playing"}</strong>{" soccer. (같은 규칙)"}</>,
          ]}
        />
        <Body>{"명사는 -ing 없이 그대로 쓸 수 있습니다. “I am good at English.”(영어를 잘해요.) / “I am good at math.”(수학을 잘해요.)처럼 말합니다. 같은 규칙이 “interested in studying”, “look forward to seeing you”(10-30 초안)에도 적용됩니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am good at studying English.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"She is good at cooking. (그녀는 요리를 잘해요.)"}</>,
            <>{"He is good at playing the piano. (그는 피아노를 잘 쳐요.)"}</>,
            <>{"I'm not very good at singing. (저는 노래를 잘 못해요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I am good at studying English, but bad at speaking. (영어 공부는 잘하는데 말하기는 못해요.)"}</>,
            <>{"My friend is good at drawing. (제 친구는 그림을 잘 그려요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
