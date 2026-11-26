import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "요리를 잘해요 영어로 — \"good cooker\"가 아니라 \"good cook\"입니다",
  description:
    "\"그는 요리를 잘해요\"는 \"He is a good cooker\"가 아니라 \"He is a good cook\"입니다. cooker는 요리사가 아니라 조리기구(가스레인지)입니다. cook·chef의 차이도 정리했습니다.",
  alternates: { canonical: '/learn/good-cook-not-good-cooker' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“He is a good cooker”가 아니라 “He is a good cook”입니다"}
      practice={"He is a good cook."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“He is a good cooker.” — “그는 요리를 잘해요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"teacher(가르치다+er), player(놀다+er)처럼 동사에 -er를 붙이면 “그 일을 하는 사람”이 되는 패턴이 있어, cook에 -er를 붙여 cooker라고 하고 싶어집니다. 그런데 cooker는 예외입니다. cooker는 사람을 뜻하지 않고 "}<strong>{"조리 기구"}</strong>{"(가스레인지·오븐)를 뜻합니다. “He is a good cooker.”라고 하면 원어민에게는 “그는 좋은 가스레인지예요”로 들립니다. 요리하는 사람은 cook이고, 동사 cook(요리하다)과 명사 cook(요리사)이 같은 단어입니다."}</Body>
        <BulletList
          items={[
            <>{"He is a "}<strong>{"good cook"}</strong>{". (그는 요리를 잘해요. — 사람)"}</>,
            <>{"He is a good "}<strong>{"cooker"}</strong>{". ✗ (그는 좋은 가스레인지예요. — 기구)"}</>,
            <>{"My mom is a great "}<strong>{"cook"}</strong>{". (우리 엄마는 요리를 정말 잘하세요.)"}</>,
          ]}
        />
        <Body>{"식당 주방장처럼 전문 요리사는 chef라고 합니다. chef는 고급 레스토랑의 훈련받은 요리사, cook은 집이나 일반 식당에서 요리하는 사람이라는 뉘앙스 차이입니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“He is a good cook.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"She is an excellent cook. (그녀는 요리를 정말 잘해요.)"}</>,
            <>{"My dad is a good cook. (우리 아빠는 요리를 잘하세요.)"}</>,
            <>{"Are you a good cook? (요리 잘하세요?)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"He is a good cook, so his friends love his food. (그는 요리를 잘해서 친구들이 그의 음식을 좋아해요.)"}</>,
            <>{"I want to be a good cook like my mom. (엄마처럼 요리를 잘하고 싶어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
