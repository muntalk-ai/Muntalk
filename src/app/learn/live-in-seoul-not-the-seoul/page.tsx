import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '서울에 살아요 영어로 — "I live in the Seoul"이 아니라 "I live in Seoul"입니다',
  description:
    '"서울에 살아요"는 "I live in the Seoul"이 아니라 "I live in Seoul"입니다. 서울·도쿄·런던 같은 도시 이름 앞에는 the를 붙이지 않습니다. the는 강·바다·산맥 같은 지형 이름이나 the United States 같은 나라 이름에만 붙습니다.',
  alternates: { canonical: '/learn/live-in-seoul-not-the-seoul' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“I live in the Seoul”이 아니라 “I live in Seoul”입니다"
      practice="I live in Seoul."
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“I live in the Seoul.” — “서울에 살아요”라는 뜻으로 쓰는 경우</Quote>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          한국어에는 관사가 없어 “서울” 앞에 the를 붙여야 할지 말아야 할지 헷갈리지만, 영어에서 도시·국가·대륙 같은
          고유명사 앞에는 관사를 붙이지 않습니다. “I live in Seoul.”(서울에 살아요.), “I visited Tokyo.”(도쿄에
          갔어요.), “She lives in Canada.”(그녀는 캐나다에 살아요.)처럼 말합니다. “I live in the Seoul.”이라고 하면
          원어민 귀에는 “그 서울”이라는 이상한 말이 됩니다.
        </Body>
        <BulletList
          items={[
            <>
              I live in <strong>Seoul</strong>. (서울에 살아요. — 도시 이름 앞에는 the 없음)
            </>,
            <>
              I am from <strong>Korea</strong>. (한국에서 왔어요. — 국가 이름 앞에도 the 없음)
            </>,
            <>
              I visited <strong>London</strong> last year. (작년에 런던에 갔어요.)
            </>,
            <>
              I live in <strong>the Seoul</strong>. ✗ (도시 이름 앞에는 the를 붙이지 않음)
            </>,
            <>
              I visited <strong>the Tokyo</strong>. ✗ (같은 규칙 — Tokyo가 정답)
            </>,
          ]}
        />
        <Body>
          예외가 있습니다. 이름에 복수형이나 “합중국·왕국·공화국” 같은 보통명사가 들어간 나라 이름 앞에는 the를
          붙입니다. “the United States”(미국), “the United Kingdom”(영국), “the Netherlands”(네덜란드)처럼
          말합니다. 강·바다·사막·산맥 앞에도 the를 붙입니다. “the Han River”(한강), “the Pacific Ocean”(태평양)처럼
          말합니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“I live in Seoul.”</Quote>
        <BulletList
          items={[
            <>I live in Seoul, but I was born in Busan. (서울에 살지만 부산에서 태어났어요.)</>,
            <>She lives in New York now. (그녀는 지금 뉴욕에 살아요.)</>,
            <>I visited the United States last year. (작년에 미국에 갔어요. — States가 들어간 나라 이름이라 the를 붙임)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>I live in Seoul with my family. (가족이랑 서울에 살아요.)</>,
            <>He moved to Tokyo last month. (그는 지난달에 도쿄로 이사했어요.)</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
