import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '컨닝 페이퍼 영어는 "cunning paper"가 아닙니다 — cheat sheet',
  description:
    '"cunning paper"는 "교활한 종이"라는 뜻이 됩니다. 컨닝 페이퍼, 시험 요약본의 영어는 cheat sheet입니다.',
  alternates: { canonical: '/learn/cheat-sheet-not-cunning-paper' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="컨닝 페이퍼 영어는 “cunning paper”가 아닙니다"
      practice="cheat sheet"
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“cunning paper” — 컨닝 페이퍼라는 뜻으로 쓰는 경우</Quote>
        <Body>
          원어민에게는 “교활한 종이”로 들립니다. cunning은 ‘교활한, 속이는’이라는 뜻이기 때문입니다. (a
          cunning plan = 교활한 계획)
        </Body>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          한국어 “컨닝”의 발음이 영어 cunning과 비슷해서 생긴 오류입니다. 발음은 비슷하지만 뜻이 전혀
          다릅니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“cheat sheet” — 시험 요약본, 컨닝 노트</Quote>
        <BulletList
          items={[
            <>I made a cheat sheet. (요약본을 만들었어.)</>,
            <>Can I use a cheat sheet? (요약본 써도 돼?)</>,
          ]}
        />
        <Body>
          비슷한 말로 crib sheet도 있습니다. 둘 다 “시험 때 참고하는 요약본”이라는 뜻입니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>발음 포인트</SectionTitle>
        <Body>‘ch’ 소리가 포인트입니다. ‘sh’가 아니라 또렷한 ‘ch’로 말해보세요.</Body>
      </Card>
    </ArticleShell>
  );
}
