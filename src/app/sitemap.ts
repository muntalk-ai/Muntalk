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
  ];
  const now = new Date();
  return pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
