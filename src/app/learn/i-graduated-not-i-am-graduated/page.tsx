import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "졸업했어요 영어로 — \"I am graduated\"가 아니라 \"I graduated\"입니다",
  description:
    "graduate는 수동태로 쓰지 않습니다. \"I am graduated\"가 틀린 이유와 졸업했다고 말할 때 쓰는 표현을 정리했습니다.",
  alternates: { canonical: '/learn/i-graduated-not-i-am-graduated' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am graduated”가 아니라 “I graduated”입니다"}
      practice={"I graduated from university last year."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am graduated from Seoul National University.” — “서울대 졸업했어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “졸업했다”는 완료된 상태를 말하는 것처럼 느껴져 am을 붙이고 싶어지지만, 영어에서 graduate는 “졸업하다”라는 동작 동사입니다. 동작은 be동사(am/is/are) + 과거분사로 만들지 않습니다. “I am graduated”는 “나는 졸업당했다”는 수동태처럼 들려 틀립니다. 졸업은 내가 한 일이라 능동태로 말합니다."}</Body>
        <BulletList
          items={[
            <>{"I "}<strong>{"graduated"}</strong>{" from university last year. (작년에 대학을 졸업했어요. — 맞음)"}</>,
            <>{"I "}<strong>{"am graduated"}</strong>{" from university. (틀림 — 수동태처럼 들림)"}</>,
          ]}
        />
        <Body>{"최근 졸업이라면 현재완료도 맞습니다. “I have graduated from university.” (대학교를 졸업했어요. — 방금 졸업한 느낌)"}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I graduated from Seoul National University.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I graduated from high school in 2020. (2020년에 고등학교를 졸업했어요.)"}</>,
            <>{"I have a degree in economics. (경제학 학위가 있어요. — 학위를 말할 때)"}</>,
            <>{"I'm a university graduate. (저는 대졸이에요. — 사람을 말할 때)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I graduated from college last year. (작년에 대학을 졸업했어요.)"}</>,
            <>{"She graduated from Seoul National University in 2019. (그녀는 2019년에 서울대를 졸업했어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
