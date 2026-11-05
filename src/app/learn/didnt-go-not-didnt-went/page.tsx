import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"I didn\'t went"는 틀렸습니다 — didn\'t 뒤에는 동사원형이 옵니다',
  description:
    'didn\'t 뒤에는 went가 아니라 go가 옵니다. didn\'t가 이미 과거를 표시하기 때문에 동사는 원형으로 돌아갑니다. 과거 부정문 규칙을 정리했습니다.',
  alternates: { canonical: '/learn/didnt-go-not-didnt-went' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“I didn't went”가 아니라 “I didn't go”입니다"
      practice="I didn't go to work yesterday."
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“I didn't went to work yesterday.” — “어제 일하러 안 갔어”라는 뜻으로 쓰는 경우</Quote>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          didn&apos;t 안에는 이미 did(과거)가 들어 있습니다. 과거 표시는 한 번만 하면 됩니다. didn&apos;t 뒤에
          went처럼 과거형을 또 쓰면 과거를 두 번 표시하는 셈이라 틀립니다. didn&apos;t 뒤의 동사는 항상 원형(base
          form)으로 돌아갑니다.
        </Body>
        <BulletList
          items={[
            <>
              I didn&apos;t <strong>go</strong>. (맞음)
            </>,
            <>
              I didn&apos;t <strong>went</strong>. (틀림 — 과거 두 번)
            </>,
            <>
              She didn&apos;t <strong>watched</strong> the movie. → She didn&apos;t <strong>watch</strong> the
              movie.
            </>,
          ]}
        />
        <Body>
          긍정문에서는 과거형을 씁니다. “I went to work yesterday.”는 맞습니다. 부정문·의문문에서만 did/didn&apos;t가
          과거를 대신 표시합니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“I didn't go to work yesterday.”</Quote>
        <BulletList
          items={[
            <>
              Did you <strong>go</strong> to school yesterday? (어제 학교 갔어? — did 뒤도 원형)
            </>,
            <>
              She didn&apos;t <strong>eat</strong> breakfast this morning. (그녀는 오늘 아침을 안 먹었어.)
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>
              I didn&apos;t go to the party last night. (어젯밤 파티에 안 갔어.)
            </>,
            <>
              We didn&apos;t see him at the meeting. (회의에서 그를 못 봤어.)
            </>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
