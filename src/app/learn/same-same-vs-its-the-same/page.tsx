import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"Same Same" Is Tinglish, Not English — Say "It\'s the Same"',
  description:
    '"Same same" comes from Thai เหมือนกัน (same) and is understood in Thailand, but it is not standard English. The standard phrase is "It\'s the same."',
  alternates: { canonical: '/learn/same-same-vs-its-the-same' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="en"
      kicker="✚ TINGLISH ER"
      title={'"Same Same" Is Tinglish, Not English'}
      practice="It's the same."
    >
      <Card>
        <SectionTitle>The phrase</SectionTitle>
        <Quote>“same same” — used to mean “it's the same”</Quote>
        <Body>
          In Thailand, everyone understands it. It comes from the Thai word เหมือนกัน (mǔean gan, “the same”),
          repeated the way Thai often repeats words. Tourists even know the joke “same same, but different.”
        </Body>
        <Body>
          But outside Thailand, native English speakers may not understand it — or may hear it as broken
          English. It is Tinglish: Thai-style English, not standard English.
        </Body>
      </Card>

      <Card>
        <SectionTitle>Why it doesn't work in standard English</SectionTitle>
        <Body>
          English does not repeat adjectives for emphasis this way. “Same same” sounds like a word is missing.
          The standard form carries the full sentence:
        </Body>
        <Quote>“It's the same.” — มันเหมือนกัน / It's the same thing.</Quote>
      </Card>

      <Card>
        <SectionTitle>Examples</SectionTitle>
        <BulletList
          items={[
            <>It's the same as yesterday. (어제랑 똑같아.)</>,
            <>These two are the same. (이 두 개는 똑같아.)</>,
            <>It's the same thing. (똑같은 거야.)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>Pronunciation tip</SectionTitle>
        <Body>
          The final <strong>‘m’</strong> in “same” matters. Close your lips to finish the word — Thai speakers
          often weaken final consonants, which makes “same” sound unfinished.
        </Body>
      </Card>
    </ArticleShell>
  );
}
