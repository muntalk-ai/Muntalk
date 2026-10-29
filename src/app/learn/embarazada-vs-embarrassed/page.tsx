import type { Metadata } from 'next';
import ArticleShell, { Card, SectionTitle, Body, Quote, BulletList } from '../article-shell';

export const metadata: Metadata = {
  title: '"Estoy embarazada" Means "I\'m Pregnant," Not "I\'m Embarrassed"',
  description:
    'The classic Spanish-English false friend: embarazada means pregnant, not embarrassed. If you are embarrassed, say "I\'m embarrassed."',
  alternates: { canonical: '/learn/embarazada-vs-embarrassed' },
};

export default function Page() {
  return (
    <ArticleShell
      lang="en"
      kicker="✚ SPANGLISH ER"
      title={'"Estoy embarazada" Does NOT Mean "I\'m Embarrassed"'}
      practice="I'm embarrassed."
      videoHref="https://www.youtube.com/shorts/IMmd6Y5wF8o"
    >
      <Card>
        <SectionTitle>The mistake</SectionTitle>
        <Quote>“¡Estoy embarazada!” — said to mean “I'm so embarrassed!”</Quote>
        <Body>
          A native English speaker who knows a little Spanish will hear: “I'm pregnant!” This is one of the
          most classic false friends between Spanish and English — two words that look alike but mean
          completely different things.
        </Body>
      </Card>

      <Card>
        <SectionTitle>Why it happens</SectionTitle>
        <BulletList
          items={[
            <>
              <strong>embarazada:</strong> pregnant. <em>Estoy embarazada</em> = “I'm pregnant.”
            </>,
            <>
              <strong>embarrassed:</strong> avergonzado/a — feeling shame or awkwardness.
            </>,
          ]}
        />
        <Body>
          They share Latin roots, but their meanings went in opposite directions centuries ago.
        </Body>
      </Card>

      <Card>
        <SectionTitle>The correct phrase</SectionTitle>
        <Quote>“I'm embarrassed.” — Estoy avergonzado/a.</Quote>
        <BulletList
          items={[
            <>I'm so embarrassed! (¡Qué vergüenza! / 너무 민망해!)</>,
            <>I was embarrassed in front of everyone. (모두 앞에서 민망했어.)</>,
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>More false friends to watch</SectionTitle>
        <BulletList
          items={[
            <>
              <em>actualmente</em> ≠ actually — it means “currently”
            </>,
            <>
              <em>asistir</em> ≠ assist — it means “to attend”
            </>,
            <>
              <em>sensible</em> ≠ sensible — it means “sensitive”
            </>,
          ]}
        />
        <Body>
          False friends are the fastest way to say the opposite of what you mean — which is exactly why they
          make good search topics and good lessons.
        </Body>
      </Card>

      <Card>
        <SectionTitle>Pronunciation tip</SectionTitle>
        <Body>
          The stress goes in the middle: em-<strong>BARR</strong>-assed. Get the stress right and the word is
          instantly clear.
        </Body>
      </Card>
    </ArticleShell>
  );
}
