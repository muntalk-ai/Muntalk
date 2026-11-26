import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "키가 170cm 영어로 — \"I am 170cm\"가 아니라 \"I am 170cm tall\"입니다",
  description:
    "\"키가 170cm예요\"는 \"I am 170cm\"이 아니라 \"I am 170cm tall\"입니다. 숫자 뒤에 tall을 빼면 어색하고, 키를 물을 때는 \"How tall are you?\"라고 합니다. 미국식 피트·인치 표현도 함께 정리했습니다.",
  alternates: { canonical: '/learn/i-am-170cm-tall' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am 170cm”가 아니라 “I am 170cm tall”입니다"}
      practice={"I am 170cm tall."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am 170cm.” — “키가 170cm예요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “키가 170cm입니다”를 직역하면 숫자만 남지만, 영어에서 키를 말할 때는 숫자 뒤에 tall을 붙이는 것이 기본 패턴입니다. “I am 170cm”은 뜻은 통하지만 원어민이 잘 쓰지 않는 어색한 표현이고, “I am 170cm tall”이 자연스럽습니다. tall은 키가 크다는 형용사로, 숫자만큼 크다는 뜻을 완성합니다."}</Body>
        <BulletList
          items={[
            <>{"I am "}<strong>{"170cm tall"}</strong>{". (키가 170cm예요.)"}</>,
            <>{"I am "}<strong>{"six feet tall"}</strong>{". (키가 6피트예요. — 미국식 표현)"}</>,
            <>{"I am "}<strong>{"170cm"}</strong>{". (뜻은 통하지만 어색함 — tall을 붙이는 것이 자연스러움)"}</>,
            <><strong>{"How tall"}</strong>{" are you? (키가 얼마나 돼요?) / "}<strong>{"How long"}</strong>{" are you? ✗ (long은 길이를 물을 때 쓰지, 키를 물을 때는 tall)"}</>,
          ]}
        />
        <Body>{"키를 물을 때는 “How tall are you?”라고 하고, “What is your height?”도 맞습니다. “How long are you?”는 학습자들이 자주 하는 실수인데, long은 사람의 키가 아니라 물건의 길이에 쓰는 말이라 틀립니다. 미국에서는 피트·인치를 쓰므로 “I am five feet seven inches tall.”(키가 5피트 7인치예요.)처럼 말하고, “My height is 170cm.”(제 키는 170cm입니다.)도 자연스럽습니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am 170cm tall.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I am 180cm tall. (키가 180cm예요.)"}</>,
            <>{"How tall are you? — I am 165cm tall. (키가 얼마나 돼요? — 165cm예요.)"}</>,
            <>{"She is taller than me. (그녀는 저보다 키가 커요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I am 170cm tall, and my brother is 185cm tall. (저는 키가 170cm이고, 제 동생은 185cm예요.)"}</>,
            <>{"How tall is he? — He is six feet tall. (그분 키가 얼마나 돼요? — 6피트예요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
