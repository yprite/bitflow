import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { CookieBanner } from "@/components/cookie-banner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: 'Bitflow',
  description: '한국 비트코인 투자자를 위한 온체인 데이터 대시보드',
  verification: {
    google: 'ga_lYXtcIceKKBYQ5XW4keFIrEg-MNnNg99PkRWRcr0',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8082243736281483"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
