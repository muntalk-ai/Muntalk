import type { MetadataRoute } from 'next';

const BASE = 'https://www.muntalk.com';

// Public, indexable pages. App pages behind auth (/lingua/*, /profile)
// and internal routes are intentionally excluded.
// hreflang alternates for the localized landing set (homepage + /ko + pilot 5).
const LOCALE_PATHS = new Set(['', '/ko', '/vi', '/th', '/my', '/es', '/ja']);
const LANG_URLS: Record<string, string> = {
  en: BASE,
  ko: `${BASE}/ko`,
  vi: `${BASE}/vi`,
  th: `${BASE}/th`,
  my: `${BASE}/my`,
  es: `${BASE}/es`,
  ja: `${BASE}/ja`,
  'x-default': BASE,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/ko', priority: 0.9, changeFrequency: 'weekly' },
    // Localized landing pilot (2026-11-14): /vi /th /my /es /ja mirror /ko.
    { path: '/vi', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/th', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/my', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/es', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/ja', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/lingua/microtalk', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
    // SEO pilot: /learn article hub + 10 articles (2026-10-29) + 4 daily drafts (2026-10-31) + 1 RX.01 article (2026-11-02) + 5 daily drafts (2026-11-12).
    { path: '/learn', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/learn/im-bored-not-boring', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/i-have-plans-not-promise', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/go-for-it-not-fighting', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/cell-phone-not-hand-phone', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/on-the-house-not-service', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/cheat-sheet-not-cunning-paper', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/going-home-not-to-home', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/im-interested-not-interesting', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/didnt-go-not-didnt-went', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/what-time-it-is-not-is-it', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/pronunciation-not-pronounce', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/there-are-many-people', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/same-same-vs-its-the-same', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/embarazada-vs-embarrassed', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/window-shopping-not-eye-shopping', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/did-you-eat-rice-vs-have-you-eaten', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/how-about-going-not-how-about-to-go', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/every-day-not-everyday', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/live-in-seoul-not-the-seoul', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/work-at-samsung-not-work-in-samsung', priority: 0.7, changeFrequency: 'monthly' },
    // 63-page expansion (2026-11-26): 43 articles from SEO daily drafts 10/29–11/10.
    { path: '/learn/smarter-not-more-smarter', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/homework-not-homeworks', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/since-present-perfect', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/i-dont-understand-not-i-am-not-understand', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/i-have-a-headache-not-my-head-is-sick', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/look-forward-to-seeing-you', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/my-english-is-short-not-good', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/on-the-bus-not-in-the-bus', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/i-graduated-not-i-am-graduated', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/play-the-piano-not-play-piano', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/what-do-you-think-not-how-do-you-think', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/went-there-not-to-there', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/ten-minutes-late-not-late-for-ten-minutes', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/play-soccer-not-play-a-soccer', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/im-having-fun-not-im-fun', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/i-have-a-cold-not-i-am-cold', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/listen-to-music-not-listen-music', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/call-you-not-call-to-you', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/explain-it-to-you-not-explain-you', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/arrive-in-seoul-not-arrive-to-seoul', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/good-at-studying-not-good-at-study', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/good-cook-not-good-cooker', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/at-home-not-in-home', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/waiting-for-you-not-waiting-you', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/a-vs-an-sound-not-spelling', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/many-friends-not-much-friends', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/go-abroad-not-go-to-abroad', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/it-is-raining-not-it-is-rain', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/repeat-not-repeat-again', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/return-not-return-back', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/used-to-vs-be-used-to', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/i-am-sleepy-not-i-am-sleep', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/in-a-hurry-not-i-am-hurry', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/looking-for-a-job-not-finding-a-job', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/i-am-170cm-tall', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/go-to-school-not-go-to-the-school', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/have-been-to-not-have-gone-to', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/havent-eaten-yet-not-didnt-eat-yet', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/sorry-im-late-not-sorry-for-late', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/student-at-university-not-student-of', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/a-pair-of-shoes-not-a-shoes', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/pc-bang-vs-internet-cafe', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn/mart-vs-supermarket', priority: 0.7, changeFrequency: 'monthly' },
    // Text Adventure + Konglish ER: /watch hub with two tabs (2026-11-06).
    // /konglish redirects to /watch?tab=konglish, so it is not listed
    // separately — a redirect URL does not belong in the sitemap.
    { path: '/watch', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/watch/ep-01', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/watch/ep-02', priority: 0.7, changeFrequency: 'monthly' },
  ];
  const now = new Date();
  return pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
    ...(LOCALE_PATHS.has(p.path) ? { alternates: { languages: LANG_URLS } } : {}),
  }));
}
