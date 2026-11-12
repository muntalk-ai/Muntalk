import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '밥 먹었어 영어로 — "Did you eat rice?"가 아니라 "Have you eaten?"입니다',
  description:
    '"밥 먹었어?"는 "Did you eat rice?"가 아니라 "Have you eaten?"입니다. 한국어 "밥"은 식사 자체를 뜻하지만 영어 rice는 쌀·밥이라는 음식이라, "Did you eat rice?"라고 하면 밥(쌀)을 먹었냐는 뜻이 됩니다.',
  alternates: { canonical: '/learn/did-you-eat-rice-vs-have-you-eaten' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“Did you eat rice?”가 아니라 “Have you eaten?”입니다"
      practice="Have you eaten yet?"
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“Did you eat rice?” — “밥 먹었어?”라는 뜻으로 쓰는 경우</Quote>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          한국어에서 “밥”은 쌀로 지은 음식이자 “식사” 자체를 뜻합니다. 그래서 “밥 먹었어?”를 그대로 옮기면 “Did
          you eat rice?”가 되지만, 영어에서 rice는 쌀·밥이라는 음식 이름이라 “Did you eat rice?”라고 하면 “밥(쌀)을
          먹었어?”라는 뜻이 됩니다. 상대가 빵이나 면을 먹었으면 “No, I ate noodles.”라고 답할 수밖에 없습니다. 영어에서
          식사 여부를 물을 때는 먹는 대상을 말하지 않고 “Have you eaten?”(밥 먹었어?)이라고 합니다.
        </Body>
        <BulletList
          items={[
            <>
              <strong>Have you eaten?</strong> (밥 먹었어? — 가장 자연한 표현)
            </>,
            <>
              <strong>Did you eat?</strong> (밥 먹었어? — 조금 전에 먹었는지 물을 때)
            </>,
            <>
              <strong>Have you eaten yet?</strong> (벌써 밥 먹었어?)
            </>,
            <>
              Did you eat <strong>rice</strong>? ✗ (“밥(쌀)을 먹었어?”라는 뜻이 됨)
            </>,
            <>
              Did you eat <strong>lunch</strong>? △ (점심을 먹었냐는 뜻 — 식사 자체를 물을 때는 lunch를 붙이지 않음)
            </>,
          ]}
        />
        <Body>
          끼니를 지정해서 묻고 싶으면 식사 이름을 붙입니다. “Have you had lunch?”(점심 먹었어?), “Did you have
          breakfast?”(아침 먹었어?)처럼 말합니다. “Have you eaten?”은 아침·점심·저녁을 가리지 않고 “식사했어?”라는
          안부로 쓰입니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“Have you eaten?”</Quote>
        <BulletList
          items={[
            <>Have you eaten yet? I am starving. (밥 먹었어? 나 배고파 죽겠어.)</>,
            <>Did you eat lunch? — Yes, I had lunch an hour ago. (점심 먹었어? — 응, 한 시간 전에 먹었어.)</>,
            <>Want to grab a bite? (뭐 좀 먹으러 갈래?)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>예문</SectionTitle>
        <BulletList
          items={[
            <>Have you eaten? If not, let&apos;s order something. (밥 먹었어? 안 먹었으면 뭐 좀 시키자.)</>,
            <>Did you eat yet? You look hungry. (벌써 밥 먹었어? 배고파 보여.)</>,
          ]}
        />
      </Card>

      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
        이 글은 muntalk 개발자가 직접 작성했습니다. 네이티브 검수 없음.
      </p>
    </ArticleShell>
  );
}
