/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization ON: `images.unoptimized` was a leftover from the
  // old static-export (`output: 'export'`) setup, which this config no
  // longer uses — the site runs on Vercel as a server build, and the
  // Exchange page relies on the optimizer for partner thumbnails
  // (see src/app/exchange/page.tsx). Do not re-add `unoptimized: true`
  // without also fixing the Exchange thumbnails.
  // UX-infra #12: 정적 미디어 장기 캐싱 (public/ 하위 /videos, /images)
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

module.exports = nextConfig;
