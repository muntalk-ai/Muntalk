import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "신발 한 켤레 영어로 — \"a shoes\"가 아니라 \"a pair of shoes\"",
  description:
    "\"신발 한 켤레 샀어요\"는 \"I bought a shoes\"가 아니라 \"I bought a pair of shoes\"입니다. shoes는 복수 명사라 단수 관사 a를 붙일 수 없고, 한 켤레를 말할 때는 a pair of를 씁니다. glasses·jeans·scissors도 같은 규칙입니다.",
  alternates: { canonical: '/learn/a-pair-of-shoes-not-a-shoes' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I bought a shoes”가 아니라 “I bought a pair of shoes”입니다"}
      practice={"I bought a pair of shoes."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I bought a shoes yesterday.” — “어제 신발 한 켤레 샀어요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “신발 한 켤레”에서 “한”이 있어 a를 붙이고 싶어지지만, shoes는 복수 명사라 단수 관사 a를 바로 붙일 수 없습니다. a는 '하나'라는 뜻이라 복수 명사와는 어울리지 않습니다. 신발은 양쪽 한 쌍으로 세기 때문에 한 켤레를 말할 때는 “a pair of shoes”라는 고정 표현을 써야 합니다."}</Body>
        <BulletList
          items={[
            <>{"I bought "}<strong>{"a pair of"}</strong>{" shoes. (신발 한 켤레 샀어요.)"}</>,
            <>{"I bought "}<strong>{"new shoes"}</strong>{". (새 신발 샀어요. — a 없이 복수 그대로)"}</>,
            <>{"I bought "}<strong>{"a shoes"}</strong>{". ✗ (a + 복수 명사는 틀림)"}</>,
            <>{"I need "}<strong>{"a new pair of"}</strong>{" glasses. (새 안경이 필요해요. — glasses도 같은 규칙)"}</>,
          ]}
        />
        <Body>{"같은 규칙이 두 부분으로 된 물건에 적용됩니다. glasses(안경), jeans(청바지), trousers(바지), scissors(가위), sunglasses(선글라스)는 전부 복수 형태라 a를 붙일 수 없고 “a pair of”를 씁니다. “a pair of jeans”(청바지 한 벌), “three pairs of scissors”(가위 세 자루)처럼 씁니다. 단, 한쪽만 말할 때는 단수를 씁니다. “I lost one shoe.”(신발 한 짝을 잃어버렸어요.)"}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I bought a pair of shoes.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I bought a new pair of shoes for my friend's wedding. (친구 결혼식 때문에 새 신발 한 켤레 샀어요.)"}</>,
            <>{"She has three pairs of shoes. (그녀는 신발이 세 켤레 있어요.)"}</>,
            <>{"I need a pair of sunglasses. (선글라스 한 개가 필요해요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I bought a pair of shoes yesterday, and they are very comfortable. (어제 신발 한 켤레 샀는데 정말 편해요.)"}</>,
            <>{"How many pairs of shoes do you have? (신발이 몇 켤레 있어요?)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
