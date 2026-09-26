/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
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
