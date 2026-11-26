import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "대학생이에요 영어로 — \"student of\"가 아니라 \"student at\"입니다",
  description:
    "\"서울대 학생이에요\"는 \"I am a student of Seoul University\"가 아니라 \"I am a student at Seoul University\"입니다. 다니는 학교·기관을 말할 때는 of가 아니라 at을 씁니다. of는 전공 과목을 말할 때 씁니다.",
  alternates: { canonical: '/learn/student-at-university-not-student-of' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am a student of Seoul University”가 아니라 “I am a student at Seoul University”입니다"}
      practice={"I am a student at Seoul University."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am a student of Seoul University.” — “저는 서울대 학생이에요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “서울대 학생”에서 “의”가 있어 of를 쓰고 싶어지지만, 영어에서 다니는 학교·기관을 말할 때는 at을 씁니다. of는 '소속'이 아니라 '전공 과목'을 말할 때 씁니다. “a student of Seoul University”라고 하면 원어민 귀에는 “서울대학교라는 학문을 공부하는 학생”처럼 들려 어색합니다."}</Body>
        <BulletList
          items={[
            <>{"I am a student "}<strong>{"at"}</strong>{" Seoul University. (저는 서울대 학생이에요.)"}</>,
            <>{"I am a student "}<strong>{"of"}</strong>{" chemistry. (저는 화학을 전공하는 학생이에요. — of 뒤에는 과목)"}</>,
            <>{"I am a student "}<strong>{"of"}</strong>{" Seoul University. ✗ (of 뒤에 학교 이름은 어색함)"}</>,
            <>{"She is a student "}<strong>{"at"}</strong>{" Oxford University. (그녀는 옥스퍼드대 학생이에요.)"}</>,
          ]}
        />
        <Body>{"같은 규칙이 다른 기관에도 적용됩니다. “a teacher at this school”(이 학교 선생님), “a student at Harvard”(하버드 학생), “I work at Samsung”(삼성에서 일해요)처럼 at을 씁니다. “University of Seoul”처럼 학교 공식 이름 안에 들어가는 of는 별개입니다. “I graduated from Seoul University.”(서울대를 졸업했어요.)처럼 졸업할 때는 from을 씁니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am a student at Seoul University.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I am a student at Yonsei University. (저는 연세대 학생이에요.)"}</>,
            <>{"He is a student of economics. (그는 경제학을 전공하는 학생이에요.)"}</>,
            <>{"She works at a hospital in Busan. (그녀는 부산의 병원에서 일해요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I am a student at Seoul University, and I major in English. (저는 서울대 학생이고 영어를 전공해요.)"}</>,
            <>{"My brother is a student at Harvard now. (제 동생은 지금 하버드 학생이에요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
