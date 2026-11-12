import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '삼성 다녀요 영어로 — "I work in Samsung"이 아니라 "I work at Samsung"입니다',
  description:
    '"삼성 다녀요"는 "I work in Samsung"이 아니라 "I work at Samsung"입니다. 회사 이름 앞에는 at이나 for를 쓰고, in은 IT·마케팅 같은 분야나 부서 앞에 씁니다.',
  alternates: { canonical: '/learn/work-at-samsung-not-work-in-samsung' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“I work in Samsung”이 아니라 “I work at Samsung”입니다"
      practice="I work at Samsung."
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“I work in Samsung.” — “삼성 다녀요”라는 뜻으로 쓰는 경우</Quote>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          한국어 “삼성에 다녀요”에서 “에”가 있어 in을 쓰고 싶어지지만, 영어에서 회사 이름 앞에는 at이나 for를 씁니다.
          “I work at Samsung.”(삼성 다녀요.), “I work for Samsung.”(삼성에 고용돼 있어요.)처럼 말합니다. in은 회사
          이름이 아니라 분야·부서·업종 앞에 씁니다. “I work in IT.”(IT 분야에서 일해요.), “I work in
          marketing.”(마케팅 부서에서 일해요.)처럼 말합니다.
        </Body>
        <BulletList
          items={[
            <>
              I work <strong>at Samsung</strong>. (삼성 다녀요. — 회사 이름 앞에는 at)
            </>,
            <>
              I work <strong>for Samsung</strong>. (삼성에 고용돼 있어요. — 고용 관계는 for)
            </>,
            <>
              I work <strong>in IT</strong>. (IT 분야에서 일해요. — 분야 앞에는 in)
            </>,
            <>
              I work <strong>in Samsung</strong>. △ (회사 이름을 분야처럼 말하게 돼서 어색함 — at/for가 표준)
            </>,
            <>
              I work <strong>in marketing</strong>. (마케팅 부서에서 일해요. — 부서 앞에는 in이 정답)
            </>,
          ]}
        />
        <Body>
          “work in a school”처럼 학교·병원 같은 장소를 말할 때는 in도 쓸 수 있지만, 회사 이름을 직접 말할 때는
          “work at/for + 회사 이름”이 표준입니다. “I work at Google.”(구글 다녀요.), “She works for Apple.”(그녀는
          애플에 다녀요.)처럼 말합니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“I work at Samsung.”</Quote>
        <BulletList
          items={[
            <>I work at Samsung in the marketing team. (삼성 마케팅팀에서 일해요.)</>,
            <>He works for Google in California. (그는 캘리포니아에서 구글에 다녀요.)</>,
            <>I work in finance, but I work at a small bank. (금융 분야에서 일하지만 작은 은행에 다녀요.)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>I work at Samsung. What about you? (삼성 다녀요. 당신은요?)</>,
            <>My brother works for Hyundai. (제 동생은 현대에 다녀요.)</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
