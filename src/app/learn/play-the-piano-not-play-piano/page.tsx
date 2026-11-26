import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "피아노 쳐요 영어로 — \"play piano\"일까 \"play the piano\"일까?",
  description:
    "악기를 연주한다고 말할 때는 the piano처럼 정관사 the를 붙입니다. \"I play the piano\"가 맞는 이유와 악기·운동 표현 규칙을 정리했습니다.",
  alternates: { canonical: '/learn/play-the-piano-not-play-piano' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I play piano”가 아니라 “I play the piano”입니다"}
      practice={"I play the piano."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I play piano.” — “피아노를 쳐요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “피아노를 쳐요”에는 관사가 없어 the를 빼먹기 쉽습니다. 그런데 영어에서 악기를 연주한다고 말할 때는 악기 이름 앞에 the를 붙이는 것이 규칙입니다. 악기를 “연주하는 활동”으로 말하기 때문입니다."}</Body>
        <BulletList
          items={[
            <><strong>{"악기 (the 붙임):"}</strong>{" play the piano, play the guitar, play the violin, play the drums"}</>,
            <><strong>{"운동 (관사 없음):"}</strong>{" play soccer, play tennis, play basketball, play golf"}</>,
          ]}
        />
        <Body>{"악기와 운동을 반대로 쓰지 않도록 주의합니다. “I play the soccer”도 틀리고, “I play guitar”도 표준 영어에서는 the가 빠진 것으로 봅니다. (단, 구어에서는 “I play piano”처럼 the를 생략하는 경우도 있지만, 표준적인 형태는 the를 붙인 것입니다.)"}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I play the piano.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I play the guitar. (기타를 쳐요.)"}</>,
            <>{"She plays the violin. (그녀는 바이올린을 켜요.)"}</>,
            <>{"I play soccer on weekends. (주말에 축구를 해요. — 운동은 the 없음)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I play the piano every day. (매일 피아노를 쳐요.)"}</>,
            <>{"Can you play the guitar? (기타 칠 수 있어요?)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
