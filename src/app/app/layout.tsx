// app/layout.tsx
import { Archivo_Black } from "next/font/google";
import "./globals.css";

const archivo = Archivo_Black({
  subsets: ["latin"],
  weight: "400", // Archivo Black은 400 자체가 이미 Black(가장 굵음)입니다.
  variable: "--font-archivo",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* font-archivo 클래스를 body에 미리 선언해두면 하위 요소들이 다 가져다 씁니다 */}
      <body className={`${archivo.variable} font-archivo antialiased bg-[#0b101a]`}>
        {children}
      </body>
    </html>
  );
}