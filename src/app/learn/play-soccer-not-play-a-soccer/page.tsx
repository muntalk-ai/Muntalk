import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "축구해요 영어로 — \"play a soccer\"가 아니라 \"play soccer\"입니다",
  description:
    "축구·농구·테니스 같은 운동 이름 앞에는 a/the를 붙이지 않습니다. \"I play soccer\"가 맞는 이유와 운동·악기의 관사 규칙을 정리했습니다.",
  alternates: { canonical: '/learn/play-soccer-not-play-a-soccer' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I like to play a soccer”가 아니라 “I like to play soccer”입니다"}
      practice={"I like to play soccer."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I like to play a soccer.” — “축구하는 걸 좋아해요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “축구를 하다”에는 “를”이 있어 a를 붙이고 싶어지지만, 영어에서 운동·게임 이름은 관사 없이 씁니다. soccer, basketball, tennis, golf 같은 스포츠 이름 앞에는 a도 the도 붙이지 않습니다. 반대로 악기 이름 앞에는 the를 붙입니다. (2026-11-02 초안 “I play the piano”와 짝을 이루는 규칙입니다.)"}</Body>
        <BulletList
          items={[
            <>{"운동: I play "}<strong>{"soccer"}</strong>{". / She plays "}<strong>{"tennis"}</strong>{". (관사 없음)"}</>,
            <>{"악기: I play "}<strong>{"the piano"}</strong>{". / He plays "}<strong>{"the guitar"}</strong>{". (the 있음)"}</>,
            <>{"I like to play a soccer. ✗ / I play the soccer. ✗ (둘 다 틀림)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I like to play soccer.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I play soccer on weekends. (주말에 축구를 해요.)"}</>,
            <>{"She plays basketball every day. (그녀는 매일 농구를 해요.)"}</>,
            <>{"Do you play tennis? (테니스 쳐요?)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I like to play soccer with my friends. (친구들과 축구하는 걸 좋아해요.)"}</>,
            <>{"He plays golf on Sundays. (그는 일요일마다 골프를 쳐요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
