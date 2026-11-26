import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: "서울에 도착해요 영어로 — \"arrive to\"가 아니라 \"arrive in\"입니다",
  description:
    "\"서울에 도착할 거예요\"는 \"I will arrive to Seoul\"이 아니라 \"I will arrive in Seoul\"입니다. arrive는 in(도시·나라)이나 at(건물·장소)을 쓰고 to는 절대 안 씁니다.",
  alternates: { canonical: '/learn/arrive-in-seoul-not-arrive-to-seoul' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title={"“I will arrive to Seoul”가 아니라 “I will arrive in Seoul”입니다"}
      practice={"I will arrive in Seoul tomorrow."}
    >
      <Card>
        <SectionTitle>{"틀린 표현"}</SectionTitle>
        <Quote>{"“I will arrive to Seoul tomorrow.” — “내일 서울에 도착할 거예요”라는 뜻으로 쓰는 경우"}</Quote>
      </Card>

      <Card>
        <SectionTitle>{"왜 틀릴까"}</SectionTitle>
        <Body>{"한국어 “서울에 도착하다”에서 “에”가 있어 to를 붙이고 싶어지지만, 영어의 arrive는 to와 함께 쓰지 않습니다. “가는 방향”을 말할 때는 go to·travel to처럼 to를 쓰지만, “도착했다”는 도착한 "}<strong>{"위치"}</strong>{"를 말하는 거라 in이나 at을 씁니다. 도착지가 도시·나라처럼 넓은 곳이면 in, 공항·호텔·회사처럼 특정 지점이면 at입니다."}</Body>
        <BulletList
          items={[
            <>{"I will arrive "}<strong>{"in"}</strong>{" Seoul. (도시·나라 → in)"}</>,
            <>{"I will arrive "}<strong>{"at"}</strong>{" the airport. (공항·건물 → at)"}</>,
            <>{"I will arrive "}<strong>{"to"}</strong>{" Seoul. ✗ (arrive 뒤에 to는 안 씀)"}</>,
            <>{"I will "}<strong>{"go to"}</strong>{" Seoul. (가는 방향 → go 뒤에는 to가 맞음)"}</>,
          ]}
        />
        <Body>{"“get to”는 arrive와 달리 to를 씁니다. “What time will you get to Seoul?”이 가장 구어체에 가깝습니다. 집에 도착할 때는 “arrive home”처럼 전치사 자체를 빼는 점은 07편 “going home”과 같은 규칙입니다."}</Body>
      </Card>

      <Card>
        <SectionTitle>{"맞는 표현"}</SectionTitle>
        <Quote><strong>{"“I will arrive in Seoul tomorrow.”"}</strong></Quote>
        <BulletList
          items={[
            <>{"We arrived in Korea last night. (어젯밤 한국에 도착했어요.)"}</>,
            <>{"What time will you arrive at the station? (역에 몇 시에 도착해요?)"}</>,
            <>{"I'll arrive at the office by 9. (9시까지 사무실에 도착할 거예요.)"}</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{"예문"}</SectionTitle>
        <BulletList
          items={[
            <>{"I will arrive in Seoul at 6 p.m. (오후 6시에 서울에 도착할 거예요.)"}</>,
            <>{"She arrived at the airport early. (그녀는 공항에 일찍 도착했어요.)"}</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
