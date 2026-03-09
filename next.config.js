/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Google OAuth Popup이 작동하려면 COOP를 same-origin-allow-popups로 설정
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
