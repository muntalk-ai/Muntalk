import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "가 본 적 있어요 영어로 — \"have gone to\"가 아니라 \"have been to\"",
  description:
    "\"서울에 가 본 적 있어요\"는 \"Have you ever gone to Seoul?\"이 아니라 \"Have you ever been to Seoul?\"입니다. been to는 다녀온 경험, gone to는 아직 안 돌아왔다는 뜻이라 경험·횟수를 물을 때는 been to를 씁니다.",
  alternates: { canonical: '/learn/have-been-to-not-have-gone-to' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“Have you ever gone to Seoul?”이 아니라 “Have you ever been to Seoul?”입니다"}
      practice={"Have you ever been to Seoul?"}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“Have you ever gone to Seoul?” — “서울에 가 본 적 있어요?”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “가 본 적 있어요”를 직역하면 go의 과거분사 gone이 먼저 떠오르지만, 경험·방문 횟수를 물을 때는 been to가 정답입니다. have been to는 '다녀온 경험'(갔다가 돌아옴), have gone to는 '가서 아직 안 돌아옴'(지금 그곳에 있음)이라는 뜻이라, “가 본 적 있어요?”라는 질문에 gone to를 쓰면 “가서 아직 안 돌아온 적 있어요?”라는 이상한 질문이 됩니다."}</Body>
        <BulletList
          items={[
            <><strong>{"Have you ever been to"}</strong>{" Seoul? (서울에 가 본 적 있어요? — 다녀온 경험)"}</>,
            <><strong>{"She has gone to"}</strong>{" Seoul. (그녀는 서울에 갔어요. — 지금 서울에 있고 아직 안 돌아옴)"}</>,
            <>{"Have you ever "}<strong>{"gone to"}</strong>{" Seoul? ✗ (경험을 묻는 질문으로는 어색함)"}</>,
            <>{"I "}<strong>{"have been to"}</strong>{" Jeju three times. (제주에 세 번 가 봤어요. — 횟수를 셀 때도 been to)"}</>,
          ]}
        />
        <Body>{"been to는 횟수와 잘 어울립니다. “I have been to Busan twice.”(부산에 두 번 가 봤어요.)처럼 말하고, gone to는 횟수와 어울리지 않습니다. “I have gone to Seoul many times.”는 “여러 번 가서 아직 안 돌아왔다”는 모순이 되기 때문입니다. 특정 시점을 말할 때는 과거형으로 돌아갑니다. “I went to Seoul last year.”(작년에 서울에 갔어요.)처럼 말하고, 시점이 없을 때만 현재완료를 씁니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“Have you ever been to Seoul?”"}</strong></Quote>
        <BulletList
          items={[
            <>{"Have you ever been to Japan? (일본에 가 본 적 있어요?)"}</>,
            <>{"I have never been to Paris. (파리에 가 본 적 없어요.)"}</>,
            <>{"She has gone to the store. (그녀는 가게에 갔어요. — 아직 안 돌아옴, 지금 그곳에 있음)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"Have you ever been to Seoul? — Yes, I have been there twice. (서울에 가 본 적 있어요? — 네, 두 번 가 봤어요.)"}</>,
            <>{"Where is Mina? — She has gone to the library. (미나 어디 있어요? — 도서관에 갔어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
