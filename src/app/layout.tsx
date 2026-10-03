import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import GlobalOverlays from '@/components/GlobalOverlays';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.muntalk.com'),
  title: 'MunTalk — Learn Languages with AI',
  description: 'Master any language with AI-powered lessons, spaced repetition, and live tutors.',
  openGraph: {
    type: 'website',
    siteName: 'MunTalk',
    title: 'MunTalk — Learn Languages with AI',
    description: 'Master any language with AI-powered lessons, spaced repetition, and live tutors.',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MunTalk — Learn Languages with AI',
    description: 'Master any language with AI-powered lessons, spaced repetition, and live tutors.',
    images: ['/logo.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MunTalk',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // UX-infra #7: 핀치줌 허용 (WCAG 1.4.4)
  viewportFit: 'cover', // iPhone notch 대응
  interactiveWidget: 'resizes-content', // UX-infra #8: 키보드 표시 시 하단 입력창이 가려지지 않도록
  themeColor: '#0F172A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Syne:wght@700;800&family=DM+Sans:wght@400;600&family=Noto+Sans+Arabic:wght@400;600;700&family=Noto+Sans+Hebrew:wght@400;600;700&family=Noto+Sans+Thai:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Sans+SC:wght@400;700&family=Noto+Sans+Bengali:wght@400;600;700&family=Noto+Sans+Tamil:wght@400;600;700&family=Noto+Sans+Telugu:wght@400;600;700&family=Noto+Sans+Kannada:wght@400;600;700&family=Noto+Sans+Malayalam:wght@400;600;700&family=Noto+Sans+Gujarati:wght@400;600;700&family=Noto+Sans+Gurmukhi:wght@400;600;700&family=Noto+Sans+Sinhala:wght@400;600;700&family=Noto+Sans+Myanmar:wght@400;600;700&family=Noto+Sans+Lao:wght@400;600;700&family=Noto+Sans+Khmer:wght@400;600;700&family=Noto+Sans+Armenian:wght@400;600;700&family=Noto+Sans+Ethiopic:wght@400;600;700&family=Noto+Serif+Georgian:wght@400;600;700&display=swap"
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
        <GlobalOverlays />
      </body>
    </html>
  );
}
