export const metadata = {
  title: 'Muntalk AI',
  description: 'Gemini AI Chatbot',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}