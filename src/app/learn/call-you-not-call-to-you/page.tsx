import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "전화할게요 영어로 — \"call to you\"가 아니라 \"call you\"입니다",
  description:
    "\"전화할게요\"는 \"I will call to you\"가 아니라 \"I will call you\"입니다. call은 전화를 거는 사람을 바로 받는 동사라 to가 필요 없습니다.",
  alternates: { canonical: '/learn/call-you-not-call-to-you' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I will call to you”가 아니라 “I will call you”입니다"}
      practice={"I will call you later."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I will call to you later.” — “나중에 전화할게요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “너에게 전화하다”에서 “에게”가 있어 to를 붙이고 싶어지지만, 영어의 call은 전화의 대상을 직접 목적어로 받습니다. 전치사 to를 붙이면 “전화를 걸다”가 아니라 길 건너편에서 “너를 향해 소리치다” 같은 뜻이 됩니다. 전화할 때는 call you, 다시 전화할 때는 call you back이라고 합니다."}</Body>
        <BulletList
          items={[
            <>{"I will call "}<strong>{"you"}</strong>{". (전화할게요.)"}</>,
            <>{"I'll call you "}<strong>{"back"}</strong>{". (다시 전화할게요.)"}</>,
            <>{"I will call "}<strong>{"to"}</strong>{" you from across the street. (길 건너에서 너를 향해 소리칠게요. — 전화가 아님)"}</>,
          ]}
        />
        <Body>{"비슷하게 “call to me”도 전화 의미로는 틀립니다. “전화해 주세요”는 “Please call me.”입니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I will call you later.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I'll call you tomorrow. (내일 전화할게요.)"}</>,
            <>{"I'll give you a call. (전화 한 통 할게요. — 같은 뜻, 더 부드러움)"}</>,
            <>{"Please call me when you arrive. (도착하면 전화해 주세요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I will call you when I arrive. (도착하면 전화할게요.)"}</>,
            <>{"I'll call you back in 10 minutes. (10분 후에 다시 전화할게요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
