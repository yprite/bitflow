import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '김치프리미엄 트래커',
  description: '실시간 김치프리미엄, 펀딩비, 공포탐욕지수를 한눈에',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-black">
        <header className="border-b border-gray-800">
          <nav className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-white">
              🇰🇷 김프 트래커
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/" className="text-gray-400 hover:text-white transition">
                대시보드
              </a>
              <a href="/alert" className="text-gray-400 hover:text-white transition">
                알림 설정
              </a>
            </div>
          </nav>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-gray-800 mt-12">
          <div className="max-w-3xl mx-auto px-4 py-6 text-center text-xs text-gray-600">
            실시간 데이터는 업비트, 바이낸스, alternative.me에서 제공됩니다.
          </div>
        </footer>
      </body>
    </html>
  );
}
