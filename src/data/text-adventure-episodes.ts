// Text Adventure — episode → language → YouTube video ID mapping.
// One source of truth for /watch. New episode = one entry here;
// new language version = one videoId line. No video files in the repo —
// every video is an unlisted YouTube upload, embedded via youtube-nocookie.

import type { GateStatus } from '@/lib/early-access';
//
// Public rule (Jay 2026-11-06, supersedes the 2026-11-04 "next episode"
// rule): episodes go Public in order — Ep1 → Public, then Ep2 uploads
// → Public, then Ep3. `publicDate` records that date; never change a
// video's visibility from code — flip it in YouTube Studio and update
// the date here. An episode is free on the site once its publicDate has
// passed; before that, its Unlisted videos are members-only early access.
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
// Ep1 went Public 2026-11-06 (all 22, verified in Studio).
// Ep2 Unlisted IDs (2026-11-06, verified in Studio; 15/15 — the last 6
// hi/es/pt/fr/de/ar landed on the 22:40 retry after the official-channel
// daily limit; id confirmed Unlisted, no longer Pending):
//   ru 4KwNXVAJQ6c (Ralsim) · mn 4l5QuTmL460 (muntalk-mn) · my RtNdcUgOUQE (muntalk-my)
//   ko hEKGsYmSG2k · vi hVGasbJdgfw · ja 4xeN6hF6sjE · zh NIYtSy6_pWk · th jQKQ9VSLkcA · id tdCeWY4QGh8
//   hi YF9YHVnczik · es UnY0no7cnvE · pt l9EsB8sSdaM · fr SQmO6NuJ6mk · de oK_v1sY7oXk · ar WSPqXG2Kr5c
//   (@Muntalk_official).
// Ep2 went Public 2026-11-06 (all 15 languages; Studio flip with this PR).
//
// Early-access rule (Jay 2026-11-06, shared with Konglish ER — see
// src/lib/early-access.ts): a released episode (publicDate past) is free
// for everyone; the next episode (Unlisted videos exist, not public yet)
// is members-only early access; an episode with no videos yet is coming
// soon. Never change a video's visibility from code — flip it in YouTube
// Studio and set publicDate here.

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
    // Went Public 2026-11-06 (all 22 languages, verified in Studio).
    publicDate: '2026-11-06',
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
      // All 15 Unlisted IDs (2026-11-06) — see header comment.
      ru: '4KwNXVAJQ6c',
      mn: '4l5QuTmL460',
      my: 'RtNdcUgOUQE',
      ko: 'hEKGsYmSG2k',
      vi: 'hVGasbJdgfw',
      ja: '4xeN6hF6sjE',
      zh: 'NIYtSy6_pWk',
      th: 'jQKQ9VSLkcA',
      id: 'tdCeWY4QGh8',
      hi: 'YF9YHVnczik',
      es: 'UnY0no7cnvE',
      pt: 'l9EsB8sSdaM',
      fr: 'SQmO6NuJ6mk',
      de: 'oK_v1sY7oXk',
      ar: 'WSPqXG2Kr5c',
    },
    siteDate: '2026-11-05',
    // Went Public 2026-11-06 (all 15 languages; Studio flip with this PR).
    publicDate: '2026-11-06',
  },
  {
    ep: 3,
    slug: 'ep-03',
    title: 'The Missing Wallet',
    summary:
      'Mia finished dinner. The bill is £21.38 — and her wallet is gone. What would you do?',
    choiceA: '💳 Pay by card',
    choiceB: '👛 I can\'t find my wallet!',
    voteQuestion: 'What would you do?',
    videos: {
      // No Unlisted uploads yet — renders as COMING SOON (see header comment).
      // Renders done 22/22 (2026-11-06), Jay render confirmation pending;
      // add the Unlisted video IDs here when they land (Ep2 goes Public first).
    },
    siteDate: '2026-11-06',
    // Goes Public after Ep2 — set publicDate then and the episode turns
    // free automatically.
  },
];

export function getEpisode(slug: string): Episode | undefined {
  return EPISODES.find((e) => e.slug === slug);
}

export function availableLangs(ep: Episode): Lang[] {
  return LANGS.filter((l) => ep.videos[l.code]).map((l) => l.code);
}

// Gate status for a text-adventure episode (shared GateStatus, see
// src/lib/early-access.ts). Released = publicDate is set and past.
// Early = not public yet but at least one Unlisted video exists — the
// members-only early-access window. Upcoming = no videos yet.
export function textAdventureStatus(ep: Episode, now: number = Date.now()): GateStatus {
  if (ep.publicDate && Date.parse(ep.publicDate) <= now) return 'released';
  if (availableLangs(ep).length > 0) return 'early';
  return 'upcoming';
}
