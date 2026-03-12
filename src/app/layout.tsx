import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'MunTalk — Learn Languages with AI',
  description: 'Master any language with AI-powered lessons, spaced repetition, and live tutors.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MunTalk',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // iPhone notch 대응
  themeColor: '#0F172A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Syne:wght@700;800&family=DM+Sans:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { box-sizing: border-box; }
          html, body {
            margin: 0; padding: 0;
            -webkit-text-size-adjust: 100%;
            -webkit-tap-highlight-color: transparent;
          }
          /* 모바일 스크롤 부드럽게 */
          body { -webkit-overflow-scrolling: touch; }
          /* 버튼 터치 영역 최소 44px (Apple HIG 기준) */
          button { min-height: 44px; touch-action: manipulation; }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
