/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // 빌드 캐시가 저장되는 위치를 아예 랜덤한 새 폴더로 지정합니다.
  distDir: 'build_output_' + Date.now(), 
  webpack: (config) => {
    config.cache = false; // 기존 캐시를 아예 사용하지 않음
    return config;
  },
};

module.exports = nextConfig;