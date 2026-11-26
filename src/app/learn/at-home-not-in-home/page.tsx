import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "집에 있어요 영어로 — \"in home\"이 아니라 \"at home\"입니다",
  description:
    "\"집에 있어요\"는 \"I am in home\"이 아니라 \"I am at home\"입니다. home은 장소의 '점'이라 at을 쓰고, the도 붙이지 않습니다. at work·at school 같은 고정 표현도 함께 정리했습니다.",
  alternates: { canonical: '/learn/at-home-not-in-home' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am in home”이 아니라 “I am at home”입니다"}
      practice={"I am at home now."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am in home now.” — “지금 집에 있어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “집에 있다”에서 “에”가 있어 in을 붙이고 싶어지지만, 영어의 home은 집이라는 '장소의 점'으로 취급합니다. at은 지도 위의 한 점, in은 안이 있는 공간을 말합니다. 집에 있다는 건 건물 안에 갇혀 있다는 뜻이 아니라 “내가 사는 장소에 있다”는 뜻이라 at home이 맞습니다. the도 붙이지 않습니다. “at the home”도 틀립니다."}</Body>
        <BulletList
          items={[
            <>{"I am "}<strong>{"at home"}</strong>{". (집에 있어요. — 장소의 점)"}</>,
            <>{"I am "}<strong>{"in"}</strong>{" the house. (집 건물 안에 있어요. — 안에 있음이 중요할 때만)"}</>,
            <>{"I am "}<strong>{"in home"}</strong>{". ✗ / I am at "}<strong>{"the"}</strong>{" home. ✗ (둘 다 틀림)"}</>,
          ]}
        />
        <Body>{"같은 규칙으로 at work(직장에 있어요), at school(학교에 있어요)도 고정 표현입니다. “I am in work”가 아니라 “I am at work”라고 합니다. 07편 “going home”은 방향이라 전치사 자체가 없고, 이 편은 위치라 at을 쓴다는 점이 다릅니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am at home now.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I'm at home today. (오늘 집에 있어요.)"}</>,
            <>{"She is at home right now. (그녀는 지금 집에 있어요.)"}</>,
            <>{"I'll stay at home this weekend. (이번 주말은 집에 있을 거예요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I am at home now. Call me later. (지금 집에 있어요. 나중에 전화해 주세요.)"}</>,
            <>{"Are you at home? I want to visit you. (집에 있어요? 놀러 가고 싶어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
