import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"Eye Shopping"이 아니라 "Window Shopping"입니다 — 구경만 할 때',
  description:
    '"eye shopping"은 없는 말입니다. 구경만 하는 쇼핑은 영어로 "window shopping"이라고 합니다. 왜 eye shopping이 안 통하는지, window shopping의 뜻과 예문을 정리했습니다.',
  alternates: { canonical: '/learn/window-shopping-not-eye-shopping' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="ko"
      kicker="✚ 콩글리시 응급실"
      title="“Eye Shopping”이 아니라 “Window Shopping”입니다"
      practice="window shopping."
      videoHref="https://www.youtube.com/shorts/uQ2G-8rzoDg"
    >
      <Card>
        <SectionTitle>틀린 표현</SectionTitle>
        <Quote>“eye shopping” — “구경만 하는 쇼핑”이라는 뜻으로 쓰는 경우</Quote>
        <Body>
          “I went eye shopping.”이라고 하면 원어민은 못 알아듣습니다. eye(눈) + shopping(쇼핑)을 직역한 말이라
          영어에 없는 표현입니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>왜 틀릴까</SectionTitle>
        <Body>
          영어에서 구경만 하는 쇼핑은 <strong>“window shopping”</strong>이라는 관용 표현으로 굳어 있습니다. 상점의
          진열장(window)을 보며 구경한다는 뜻에서 온 말입니다.
        </Body>
        <Body>
          “eye shopping”은 단어를 직역한 콩글리시라, 원어민에게는 “눈으로 쇼핑한다”는 이상한 말로 들립니다.
        </Body>
      </Card>

      <Card>
        <SectionTitle>맞는 표현</SectionTitle>
        <Quote>“window shopping” — 사지 않고 구경만 하는 쇼핑.</Quote>
        <BulletList
          items={[
            <>I went window shopping. (구경하러 갔어요.)</>,
            <>I was just window shopping. (그냥 구경만 하고 있었어요.)</>,
            <>I like window shopping on weekends. (주말에 윈도우 쇼핑하는 걸 좋아해요.)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>헷갈리기 쉬운 쌍</SectionTitle>
        <BulletList
          items={[
            <>
              window shopping (구경만 하는 쇼핑) vs online shopping (온라인 쇼핑) vs shopping around (여기저기
              둘러보며 가격·물건을 비교하는 쇼핑)
            </>,
            <>
              “eye”가 들어가는 진짜 표현: eye candy (눈요깃거리, 볼만한 것) — 쇼핑과는 전혀 다른 뜻입니다.
            </>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>발음 연습</SectionTitle>
        <Body>영상 속에서는 첫 단어 window의 강세가 포인트였습니다 (72점 → 95점).</Body>
      </Card>
    </ArticleShell>
  );
}
