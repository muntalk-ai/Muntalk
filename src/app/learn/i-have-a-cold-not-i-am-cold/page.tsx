import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "감기 걸렸어요 영어로 — \"I am cold\"가 아니라 \"I have a cold\"",
  description:
    "\"감기 걸렸어요\"를 \"I am cold\"라고 하면 \"추워요\"가 됩니다. 감기는 \"I have a cold\"입니다. cold의 두 가지 뜻과 have·catch 구분을 정리했습니다.",
  alternates: { canonical: '/learn/i-have-a-cold-not-i-am-cold' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am cold”가 아니라 “I have a cold”입니다"}
      practice={"I have a cold."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am cold.” — “감기 걸렸어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"cold는 형용사로 “춥다”이기도 하고, 명사로 “감기”이기도 합니다. “I am cold”는 “나는 춥다”는 뜻입니다. 감기에 걸렸다는 상태는 have로 말합니다. 한국어 “감기 걸렸다”를 be동사로 옮기면 뜻이 완전히 바뀝니다."}</Body>
        <BulletList
          items={[
            <>{"I am cold. = 춥다 (날씨·체감 온도)"}</>,
            <>{"I have a cold. = 감기에 걸렸다 (병 상태)"}</>,
            <>{"I caught a cold. = 감기에 걸렸다 (방금 걸린 일, 과거형)"}</>,
          ]}
        />
        <Body>{"감기에 “걸렸다”는 사건 자체는 catch로, 걸려 있는 상태는 have로 말하는 것이 자연스럽습니다. “I caught a cold yesterday.” / “I have a cold now.”처럼 씁니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I have a cold.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I have a cold. (감기 걸렸어요.)"}</>,
            <>{"I think I caught a cold. (감기 걸린 것 같아요.)"}</>,
            <>{"I came down with a cold. (감기에 걸렸어요. — 구어체)"}</>,
            <>{"I have a bad cold. (감기가 심해요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I can't come today. I have a cold. (오늘 못 가요. 감기 걸렸어요.)"}</>,
            <>{"I caught a cold last week. (지난주에 감기 걸렸어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
