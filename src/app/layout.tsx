import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import GlobalOverlays from '@/components/GlobalOverlays';
import InAppNavTracker from '@/components/InAppNavTracker';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.muntalk.com'),
  // Brand homepage title — the definitive result for the "muntalk" query
  // (2026-11-13 SEO: the old generic title was shared by 4 legal pages,
  // so Google ranked /about and /terms above the homepage).
  title: 'MunTalk — AI Language Tutor | Learn Languages by Speaking',
  description: 'Learn to speak 90+ languages with 150+ AI tutors. Real conversations from day one — free to start.',
  openGraph: {
    type: 'website',
    siteName: 'MunTalk',
    title: 'MunTalk — AI Language Tutor | Learn Languages by Speaking',
    description: 'Learn to speak 90+ languages with 150+ AI tutors. Real conversations from day one — free to start.',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MunTalk — AI Language Tutor | Learn Languages by Speaking',
    description: 'Learn to speak 90+ languages with 150+ AI tutors. Real conversations from day one — free to start.',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
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
        {/* Brand entity for Google: Organization + WebSite (2026-11-13 SEO) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  name: 'MunTalk',
                  url: 'https://www.muntalk.com/',
                  logo: 'https://www.muntalk.com/logo.png',
                  sameAs: [
                    'https://www.youtube.com/@Muntalk_official',
                    'https://www.instagram.com/muntalk.global/',
                    'https://www.tiktok.com/@muntakasia',
                  ],
                },
                { '@type': 'WebSite', name: 'MunTalk', url: 'https://www.muntalk.com/' },
              ],
            }),
          }}
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
        <InAppNavTracker />
        <GlobalOverlays />
      </body>
    </html>
  );
}
