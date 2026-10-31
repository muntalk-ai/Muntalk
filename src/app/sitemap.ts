import type { MetadataRoute } from 'next';

const BASE = 'https://www.muntalk.com';

// Public, indexable pages. App pages behind auth (/lingua/*, /profile)
// and internal routes are intentionally excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/ko', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/lingua/microtalk', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
    // SEO pilot: /learn article hub + 10 articles (2026-10-29) + 4 daily drafts (2026-10-31).
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
  ];
  const now = new Date();
  return pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
