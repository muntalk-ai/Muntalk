import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 이 부분이 핵심입니다! 변수와 클래스명을 연결합니다.
        archivo: ["var(--font-archivo)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;