/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⨯ 에러의 원인: output: 'export'가 있다면 반드시 삭제하거나 주석 처리하세요.
  // output: 'export', 

  reactStrictMode: true,
  // 만약 영상이나 이미지를 외부에서 가져온다면 아래 설정을 추가할 수 있습니다.
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig