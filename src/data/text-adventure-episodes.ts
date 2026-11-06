// Text Adventure — episode → language → YouTube video ID mapping.
// One source of truth for /watch. New episode = one entry here;
// new language version = one videoId line. No video files in the repo —
// every video is an unlisted YouTube upload, embedded via youtube-nocookie.
//
// Public rule (Jay 2026-11-04): an episode goes Public when the NEXT episode
// goes live on the site (Ep1 → Public when Ep2 goes live, Ep2 → Public when
// Ep3 goes live). `publicDate` records that date; never change a video's
// visibility from code — flip it in YouTube Studio and update the date here.
//
// Video IDs (Ep1, 2026-11-04, @Muntalk_official, unlisted):
//   ko lzMweQ2eu7k · vi YW7kVv3eij0 · ja 3acrup801sI · zh qoEwn-CL0gM
//   th lCLo7pgUoSY · id yAhcBMHek1A · hi Yxzh3k5Ozvc · es n_sMEvAnyxo
//   pt gJJjkM6GWmI · fr FQM4oTaBRMo
// Ep1 ru 8RPaaqO3Wi8 (@Ralsim.muntalk, unlisted, 2026-11-04).
// Ep1 de cHqWniJ6A-c · ar 250RB35Jmno (@Muntalk_official, unlisted, 2026-11-05).
// Ep1 new 9 langs (2026-11-05, unlisted, language channels):
//   my z57dE5eqWN8 (muntalk-my) · fil Y2Hlv5eNGXc (muntalk-fil)
//   ms EdoSCTGsKOM (muntalk-ms) · mn aT4Tr-Ka7BE (muntalk-mn)
//   tk biNTpg2JIvc · tg rYQPA2kuZg8 · ky 0xZ8AlX-hKg · uz _hiz1LfsDNk · kk DHRSGinzdV8 (muntalk-stan).
// Ep2 has no YouTube IDs yet (renders exist for ko/vi/hi/zh, uploads pending).

export type Lang =
  | 'ko' | 'vi' | 'es' | 'ja' | 'th' | 'zh' | 'id' | 'hi' | 'pt' | 'fr' | 'de' | 'ar' | 'ru'
  | 'my' | 'fil' | 'ms' | 'mn' | 'tk' | 'tg' | 'ky' | 'uz' | 'kk';

export const LANGS: { code: Lang; name: string; native: string }[] = [
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'my', name: 'Burmese', native: 'မြန်မာဘာသာ' },
  { code: 'fil', name: 'Tagalog', native: 'Tagalog' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
  { code: 'mn', name: 'Mongolian', native: 'Монгол' },
  { code: 'tk', name: 'Turkmen', native: 'Türkmençe' },
  { code: 'tg', name: 'Tajik', native: 'Тоҷикӣ' },
  { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча' },
  { code: 'uz', name: 'Uzbek', native: 'Oʻzbekcha' },
  { code: 'kk', name: 'Kazakh', native: 'Қазақша' },
];

export type Episode = {
  ep: number;
  slug: string; // 'ep-01'
  title: string;
  summary: string;
  choiceA: string;
  choiceB: string;
  voteQuestion: string;
  videos: Partial<Record<Lang, string>>; // language -> YouTube video ID (unlisted)
  siteDate: string; // site publish date (planned until merged)
  publicDate?: string; // Public transition date (set when the next episode goes live)
};

export const EPISODES: Episode[] = [
  {
    ep: 1,
    slug: 'ep-01',
    title: "Mia's Café Choice",
    summary:
      'Mia is stuck in a rainy London café: hot chocolate or iced Americano? You choose — and the story continues in the next episode.',
    choiceA: '☕ Hot chocolate',
    choiceB: '🧊 Iced Americano',
    voteQuestion: 'What did you choose?',
    videos: {
      ko: 'lzMweQ2eu7k',
      vi: 'YW7kVv3eij0',
      ja: '3acrup801sI',
      zh: 'qoEwn-CL0gM',
      th: 'lCLo7pgUoSY',
      id: 'yAhcBMHek1A',
      hi: 'Yxzh3k5Ozvc',
      es: 'n_sMEvAnyxo',
      pt: 'gJJjkM6GWmI',
      fr: 'FQM4oTaBRMo',
      ru: '8RPaaqO3Wi8',
      de: 'cHqWniJ6A-c',
      ar: '250RB35Jmno',
      my: 'z57dE5eqWN8',
      fil: 'Y2Hlv5eNGXc',
      ms: 'EdoSCTGsKOM',
      mn: 'aT4Tr-Ka7BE',
      tk: 'biNTpg2JIvc',
      tg: 'rYQPA2kuZg8',
      ky: '0xZ8AlX-hKg',
      uz: '_hiz1LfsDNk',
      kk: 'DHRSGinzdV8',
    },
    siteDate: '2026-11-05',
    // Planned: goes Public when Ep2 goes live on the site (this PR).
    publicDate: '2026-11-05',
  },
  {
    ep: 2,
    slug: 'ep-02',
    title: 'The Choice After',
    summary:
      'Mia picked her drink in Episode 1. Warm hands, warm heart — or iced coffee in the rain? Here is what happened next.',
    choiceA: '☕ Warm hands, warm heart',
    choiceB: '🧊 Iced coffee in the rain',
    voteQuestion: 'Which ending did you like?',
    videos: {
      // No YouTube IDs yet — ko/vi/hi/zh renders exist, uploads pending.
      // Add videoId lines here as each language is uploaded; the language
      // selector lights up automatically.
    },
    siteDate: '2026-11-05',
    // Goes Public when Ep3 goes live on the site — set the date then.
  },
];

export function getEpisode(slug: string): Episode | undefined {
  return EPISODES.find((e) => e.slug === slug);
}

export function availableLangs(ep: Episode): Lang[] {
  return LANGS.filter((l) => ep.videos[l.code]).map((l) => l.code);
}
