import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "피시방 영어로 — \"PC bang\"이 아니라 \"internet café\"입니다",
  description:
    "\"피시방 가요\"는 \"I am going to PC bang\"이 아니라 \"I am going to an internet café\"입니다. PC bang은 한국 문화를 아는 사람에게만 통하는 고유어이고, 일반적인 영어 표현은 internet café(게임 중심이면 gaming café)입니다.",
  alternates: { canonical: '/learn/pc-bang-vs-internet-cafe' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I am going to PC bang”이 아니라 “I am going to an internet café”입니다"}
      practice={"I am going to an internet café."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I am going to PC bang after school.” — “방과 후에 피시방에 가요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “피시방”은 PC + 방의 합성어라 영어에서도 “PC bang”이나 “PC room”이라고 하면 될 것 같지만, “PC bang”은 위키백과에 등재된 한국 문화 고유어로, 한국 문화를 아는 사람에게만 통합니다. 모르는 사람에게는 “PC 방”이 무슨 곳인지 전달되지 않습니다. 영어에서 같은 장소를 가리키는 일반 명사는 “internet café”이고, 게임이 중심인 곳이면 “gaming café”라고 합니다."}</Body>
        <BulletList
          items={[
            <>{"I am going to "}<strong>{"an internet café"}</strong>{". (피시방에 가요. — 가장 일반적인 표현)"}</>,
            <>{"I am going to "}<strong>{"a gaming café"}</strong>{". (게임하러 피시방에 가요. — 게임 중심인 곳)"}</>,
            <>{"I am going to "}<strong>{"PC bang"}</strong>{". △ (한국 문화를 아는 사람에게만 통함 — 일반 표현 아님)"}</>,
            <>{"I am going to "}<strong>{"PC room"}</strong>{". ✗ (방을 직역한 표현 — 영어에 없음)"}</>,
          ]}
        />
        <Body>{"“PC bang”이 완전히 틀린 말은 아닙니다. 해외 매체에서도 한국 피시방을 소개할 때 “PC bang”이라는 단어를 씁니다. 다만 그건 “한국의 PC방”이라는 고유 개념을 설명할 때이고, 일상 대화에서 “피시방에 간다”고 말할 때는 “internet café”가 정답입니다. “I played games at a PC bang in Seoul.”(서울 피시방에서 게임했어요.)처럼 한국을 소개하는 문장에서는 PC bang을 써도 됩니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I am going to an internet café.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"I am going to an internet café after school. (방과 후에 피시방에 가요.)"}</>,
            <>{"Let's meet at the gaming café near school. (학교 근처 게임 카페에서 만나요.)"}</>,
            <>{"I played games at a PC bang in Seoul. (서울 피시방에서 게임했어요. — 한국 소개 맥락)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I am going to an internet café with my friends after school. (방과 후에 친구들이랑 피시방에 가요.)"}</>,
            <>{"There is a gaming café on the second floor of this building. (이 건물 2층에 게임 카페가 있어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
