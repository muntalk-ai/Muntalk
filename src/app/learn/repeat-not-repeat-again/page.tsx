import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "다시 말해 주세요 영어로 — \"repeat again\"은 중복입니다",
  description:
    "\"다시 말해 주세요\"는 \"Please repeat again\"이 아니라 \"Please repeat what you said\"입니다. repeat 안에 이미 '다시'의 뜻이 들어 있어 again은 불필요합니다. return back 같은 중복 표현도 함께 정리했습니다.",
  alternates: { canonical: '/learn/repeat-not-repeat-again' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“Please repeat again”이 아니라 “Please repeat what you said”입니다"}
      practice={"Please repeat what you said."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“Please repeat again what you said.” — “말씀하신 걸 다시 한 번 말씀해 주세요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “다시 반복해 주세요”를 직역하면 repeat + again이 되지만, 영어의 repeat은 그 자체로 “다시 하다·다시 말하다”라는 뜻을 품고 있습니다. again을 붙이면 “한 번 더, 한 번 더”를 두 번 말하는 셈이 되어 중복 표현이 됩니다. 틀려서 못 알아듣는 말은 아니지만, 원어민 귀에는 어색하고 시험·이력서 같은 공식적인 자리에서는 감점 요소가 됩니다."}</Body>
        <BulletList
          items={[
            <>{"Please "}<strong>{"repeat"}</strong>{" what you said. (말씀하신 걸 다시 말씀해 주세요.)"}</>,
            <>{"Could you "}<strong>{"say that again"}</strong>{"? (그걸 다시 말씀해 주시겠어요?)"}</>,
            <>{"Please repeat "}<strong>{"again"}</strong>{" what you said. ✗ (중복)"}</>,
          ]}
        />
        <Body>{"“say that again”은 괜찮습니다. say에는 '다시'의 뜻이 없어 again이 필요하기 때문입니다. “repeat it again”도 같은 이유로 피하는 게 좋습니다. 다만 “repeat again and again”(몇 번이고 되풀이하다)처럼 여러 번의 반복을 강조할 때는 again이 의미를 더하므로 예외로 씁니다."}</Body>
        <Body>{"같은 중복 표현: “return back”(return에 이미 '돌아가다'의 뜻이 있음 → return), “revert back”(→ revert), “combine together”(→ combine). “Please repeat again”을 고치면 이 패턴이 한 번에 정리됩니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“Please repeat what you said.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I didn't catch that. Could you repeat it, please? (못 들었어요. 다시 말씀해 주시겠어요?)"}</>,
            <>{"Could you say that again, please? (다시 한 번 말씀해 주시겠어요?)"}</>,
            <>{"Let me repeat the question. (질문을 다시 말씀드릴게요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"Sorry, could you please repeat what you said? (죄송해요. 말씀하신 걸 다시 말씀해 주시겠어요?)"}</>,
            <>{"Please repeat the instructions slowly. (지시 사항을 천천히 다시 말씀해 주세요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
