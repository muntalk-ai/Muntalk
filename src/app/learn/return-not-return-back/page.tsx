import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "돌아올게요 영어로 — \"return back\"은 중복입니다",
  description:
    "\"돌아올게요\"는 \"I will return back\"이 아니라 \"I will return\"입니다. return 안에 이미 '돌아가다'의 뜻이 있어 back은 불필요합니다. come back과의 차이도 함께 정리했습니다.",
  alternates: { canonical: '/learn/return-not-return-back' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I will return back”이 아니라 “I will return”입니다"}
      practice={"I will return soon."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I will return back soon.” — “곧 돌아올게요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “돌아오다”를 영어로 옮기면 return + back이 떠오르지만, return은 그 자체로 “돌아가다·돌아오다”라는 뜻을 품고 있습니다. back을 붙이면 “돌아가서 돌아가다”처럼 같은 뜻을 두 번 말하는 중복 표현이 됩니다. 3편 “repeat again”과 같은 패턴입니다."}</Body>
        <BulletList
          items={[
            <>{"I will "}<strong>{"return"}</strong>{" soon. (곧 돌아올게요.)"}</>,
            <>{"I will "}<strong>{"come back"}</strong>{" soon. (곧 돌아올게요. — come에는 '돌아오다'의 뜻이 없어 back이 필요)"}</>,
            <>{"I will return "}<strong>{"back"}</strong>{" soon. ✗ (중복)"}</>,
          ]}
        />
        <Body>{"“come back”은 괜찮습니다. come만으로는 방향이 정해지지 않아 back이 의미를 더하기 때문입니다. “go back”(돌아가다)도 같은 이유로 자연스럽습니다. “return to Seoul”(서울로 돌아가다)처럼 return 뒤에는 장소가 바로 오고, back은 들어가지 않습니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I will return soon.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"She will return tomorrow. (그녀는 내일 돌아올 거예요.)"}</>,
            <>{"I returned home late last night. (어젯밤 늦게 집에 돌아왔어요.)"}</>,
            <>{"He returned the book to the library. (그는 책을 도서관에 반납했어요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I will return soon. Please wait here. (곧 돌아올게요. 여기서 기다려 주세요.)"}</>,
            <>{"When will you return from your trip? (여행에서 언제 돌아오세요?)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
