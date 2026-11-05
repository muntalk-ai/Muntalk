import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"약속 있어요"는 "I have a promise"가 아닙니다 — I have plans',
  description:
    '"I have a promise"라고 하면 원어민에겐 "맹세한 게 있다"로 들립니다. 약속이 있다는 영어는 I have plans입니다. promise와 plans의 차이를 정리했습니다.',
  alternates: { canonical: '/learn/i-have-plans-not-promise' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“약속 있어요”는 “I have a promise”가 아닙니다"
      practice="I have plans tonight."
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“I have a promise.” — “나 약속 있어”라는 뜻으로 쓰는 경우</Quote>
        <Body>
          원어민에게는 “저 맹세한 거 있어요”로 들립니다. promise는 명사로 쓰면 ‘맹세, 다짐’이라는 뜻이기
          때문입니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>한국어 “약속”이 영어에서 두 단어로 갈리기 때문입니다.</Body>
        <BulletList
          items={[
            <>
              <strong>promise:</strong> 맹세, 다짐. “I promise”처럼 동사로 쓸 때만 “약속할게”라는 뜻이 됩니다.
            </>,
            <>
              <strong>plans:</strong> 잡혀 있는 약속, 일정. 친구와의 만남, 저녁 식사 같은 일상적인 약속은 전부
              plans입니다.
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“I have plans.” — 나 약속 있어.</Quote>
        <BulletList
          items={[
            <>I have plans tonight. (오늘 밤 약속 있어.)</>,
            <>I have plans this weekend. (이번 주말에 약속 있어.)</>,
            <>Sorry, I have plans already. (미안, 이미 약속이 있어.)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>promise를 쓰는 경우</SectionTitle>
        <BulletList
          items={[
            <>I promise I'll be there. (꼭 갈게, 약속할게.)</>,
            <>I promised my friend. (친구에게 약속했어.)</>,
          ]}
        />
        <Body>
          즉, <strong>누군가에게 무엇을 하겠다고 다짐할 때</strong>만 promise입니다. 이미 잡힌 일정은 plans입니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>발음 포인트</SectionTitle>
        <Body>끝소리가 포인트입니다. plans 끝의 ‘z’ 소리를 살려서 말해보세요.</Body>
      </Card>
    </ArticleShell>
  );
}
