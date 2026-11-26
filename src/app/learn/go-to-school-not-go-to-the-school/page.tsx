import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "학교에 가요 영어로 — \"go to the school\"이 아니라 \"go to school\"",
  description:
    "\"학교에 가요\"는 \"I go to the school\"이 아니라 \"I go to school\"입니다. 학생으로 다니는 본래 목적일 때는 the를 빼고, 건물에 방문할 때만 the를 붙입니다. hospital·church도 같은 규칙입니다.",
  alternates: { canonical: '/learn/go-to-school-not-go-to-the-school' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I go to the school”이 아니라 “I go to school”입니다"}
      practice={"I go to school every day."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I go to the school every day.” — “매일 학교에 가요”라는 뜻으로 학생이 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “학교에 가다”에는 the에 해당하는 말이 없어 the를 붙여야 할지 말아야 할지 헷갈리지만, 영어에서는 학교·병원·교회 같은 기관을 '본래 목적'으로 갈 때 the를 빼는 규칙이 있습니다. 학생이 공부하러 학교에 갈 때는 “go to school”이고, the를 붙이면 “그 건물에 방문한다”는 뜻이 되어 버립니다."}</Body>
        <BulletList
          items={[
            <>{"I go to "}<strong>{"school"}</strong>{" every day. (매일 학교에 가요. — 학생으로 다님)"}</>,
            <>{"I go to "}<strong>{"the school"}</strong>{" to meet my son's teacher. (아들 선생님을 만나러 그 학교에 가요. — 건물 방문)"}</>,
            <>{"I go to "}<strong>{"the school"}</strong>{" every day. ✗ (학생이 매일 학교에 다닌다는 뜻으로는 어색함)"}</>,
            <>{"My children go to "}<strong>{"school"}</strong>{" every day. (제 아이들은 매일 학교에 가요.)"}</>,
          ]}
        />
        <Body>{"같은 규칙이 다른 기관에도 적용됩니다. “go to hospital”(병원에 입원하러 가다, 영국식) vs “go to the hospital”(병원 건물에 방문하러 가다), “go to church”(예배드리러 가다) vs “go to the church”(교회 건물에 가다), “go to university”(대학에 다니다) vs “go to the university”(대학 건물에 가다). 단, “go to the cinema”(영화관에 가다)는 the를 붙이는 것이 맞습니다. cinema는 본래 목적 규칙에 들어가지 않기 때문입니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I go to school every day.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"She goes to school by bus. (그녀는 버스를 타고 학교에 가요.)"}</>,
            <>{"He went to the hospital to visit his friend. (그는 친구를 병문안하러 병원에 갔어요.)"}</>,
            <>{"They go to church every Sunday. (그들은 매주 일요일 교회에 가요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I go to school at 8 in the morning. (저는 아침 8시에 학교에 가요.)"}</>,
            <>{"My mother went to the school for parent-teacher night. (엄마는 학부모 상담회 때문에 학교에 가셨어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
