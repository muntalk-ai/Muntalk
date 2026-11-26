import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "영어 실력이 부족해요 영어로 — \"My English is short\"가 아니라 \"My English is not good\"",
  description:
    "\"My English is short\"는 한국말을 그대로 옮긴 콩글리시입니다. short는 실력에 쓰지 않습니다. 영어 실력을 말할 때 쓰는 표현을 정리했습니다.",
  alternates: { canonical: '/learn/my-english-is-short-not-good' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“My English is short”가 아니라 “My English is not good”입니다"}
      practice={"My English is not very good."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“My English is short.” — “제 영어 실력이 부족해요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “실력이 짧다”를 그대로 옮기면 “My English is short”가 됩니다. 그런데 영어에서 short는 길이·키가 짧다는 뜻입니다. “My English is short”는 원어민에게 “제 영어가 길이가 짧아요”라는 이상한 말로 들립니다. 실력의 높낮이는 short/long이 아니라 good/bad, poor, not very good으로 말합니다."}</Body>
        <BulletList
          items={[
            <>{"short: 길이가 짧다, 키가 작다 (short hair, a short person)"}</>,
            <>{"실력: good / bad / poor / not very good / not great"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“My English is not very good.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"My English is not good. (제 영어가 안 좋아요.)"}</>,
            <>{"My English is poor. (제 영어 실력이 부족해요.)"}</>,
            <>{"I'm not good at English. (저는 영어를 잘 못해요.)"}</>,
            <>{"I need to improve my English. (영어를 더 잘하고 싶어요. — 더 자연스러운 말)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"My English is not very good, but I'm practicing every day. (제 영어가 아직 별로지만 매일 연습하고 있어요.)"}</>,
            <>{"I'm not good at English yet, so please speak slowly. (영어를 아직 잘 못해서 천천히 말씀해 주세요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
