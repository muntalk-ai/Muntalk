/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',      // ✅ 이게 있어야 'out' 폴더가 생깁니다!
  images: {
    unoptimized: true,   // ✅ 앱 빌드 시 필수 설정입니다.
  },
};

module.exports = nextConfig;