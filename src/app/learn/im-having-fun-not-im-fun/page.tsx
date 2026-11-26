import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "재미있어요 영어로 — \"I'm fun\"이 아니라 \"I'm having fun\"입니다",
  description:
    "\"재미있었어요\"를 \"I'm fun\"이라고 하면 \"나는 재미있는 사람\"이 됩니다. 즐거운 시간을 보냈다는 뜻은 \"I'm having fun\"입니다. fun과 funny의 차이를 정리했습니다.",
  alternates: { canonical: '/learn/im-having-fun-not-im-fun' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I'm fun”이 아니라 “I'm having fun”입니다"}
      practice={"I'm having so much fun!"}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I'm fun!” — 여행·파티가 재미있었다는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “재미있다”는 한 단어지만, 영어의 fun과 funny는 다릅니다. fun은 “즐거운 시간·체험”, funny는 “웃긴 것”입니다. “I'm fun”이라고 하면 “나는 함께 있으면 즐거운 사람”이라는 뜻이 되어, “여행이 재미있었어요”라는 말이 되지 않습니다. 즐거운 시간을 보냈다고 말할 때는 have fun을 씁니다."}</Body>
        <BulletList
          items={[
            <>{"fun = 즐거운 (체험·시간): It was so much fun! (정말 재미있었어요!)"}</>,
            <>{"funny = 웃긴 (농담·사람): He's funny. (그는 웃겨요.)"}</>,
            <>{"I'm fun = 나는 재미있는 사람 (자기소개가 됨)"}</>,
          ]}
        />
        <Body>{"“I had funny”도 틀립니다. funny는 형용사라 “funny를 가졌다”는 말이 안 됩니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I'm having fun!” / “I had so much fun!”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I'm having fun! (지금 재미있어요!)"}</>,
            <>{"I had so much fun at the party. (파티에서 정말 재미있었어요.)"}</>,
            <>{"It was a lot of fun. (정말 즐거웠어요.)"}</>,
            <>{"Have fun! (잘 놀다 와! / 좋은 시간 보내!)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"We had so much fun in Busan. (부산에서 정말 재미있었어요.)"}</>,
            <>{"I'm having fun learning English. (영어 배우는 게 재미있어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
