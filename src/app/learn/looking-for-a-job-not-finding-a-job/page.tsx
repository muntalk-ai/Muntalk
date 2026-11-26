import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "일자리 찾고 있어요 영어로 — \"finding a job\"이 아니라 \"looking for a job\"",
  description:
    "\"일자리를 찾고 있어요\"는 \"I am finding a job\"이 아니라 \"I am looking for a job\"입니다. find는 '발견하다', look for는 '찾고 있다'는 뜻이라 아직 찾는 중일 때는 look for를 씁니다.",
  alternates: { canonical: '/learn/looking-for-a-job-not-finding-a-job' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am finding a job”이 아니라 “I am looking for a job”입니다"}
      practice={"I am looking for a job."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am finding a job these days.” — “요즘 일자리를 찾고 있어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “찾다”는 find와 look for를 둘 다 포괄하지만, 영어에서는 역할이 다릅니다. find는 '발견하다·찾아내다'(이미 찾은 결과), look for는 '찾고 있다'(아직 찾는 과정)입니다. 일자리를 아직 찾는 중이라면 과정이므로 look for를 써야 하고, find를 쓰면 “이미 찾아냈다”는 뜻이 되어 버립니다."}</Body>
        <BulletList
          items={[
            <>{"I am "}<strong>{"looking for"}</strong>{" a job. (일자리를 찾고 있어요. — 아직 찾는 중)"}</>,
            <>{"I "}<strong>{"found"}</strong>{" a job! (일자리를 찾았어요! — 이미 찾음)"}</>,
            <>{"I am "}<strong>{"finding"}</strong>{" a job these days. ✗ (원어민 귀에는 “찾아내는 중”이라는 어색한 표현)"}</>,
            <>{"I am looking for my keys. (열쇠를 찾고 있어요.) / I found my keys! (열쇠를 찾았어요!)"}</>,
          ]}
        />
        <Body>{"같은 규칙이 다른 물건에도 적용됩니다. “I am finding my phone.”이 아니라 “I am looking for my phone.”이 맞고, 찾았을 때 “I found my phone.”이라고 합니다. “search for a job”(일자리를 샅샅이 찾다)도 맞지만 look for보다 더 적극적이고 집중적인 뉘앙스입니다. “seek a job”은 격식 있는 표현으로 이력서·공식 문서에서 씁니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am looking for a job.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I am looking for a part-time job. (아르바이트 자리를 찾고 있어요.)"}</>,
            <>{"She is looking for a new apartment. (그녀는 새 아파트를 찾고 있어요.)"}</>,
            <>{"He found a good job last month. (그는 지난달에 좋은 일자리를 찾았어요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I am looking for a job in Vancouver. (밴쿠버에서 일자리를 찾고 있어요.)"}</>,
            <>{"I have been looking for a job for three months. (3개월째 일자리를 찾고 있어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
