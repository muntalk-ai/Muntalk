import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/profile', '/local-test', '/test'],
      },
    ],
    sitemap: 'https://www.muntalk.com/sitemap.xml',
  };
}
