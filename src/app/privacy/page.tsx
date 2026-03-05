import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보처리방침 | Bitflow',
  description: 'Bitflow 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400/80">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">개인정보처리방침</h1>
        <p className="mt-2 text-xs text-slate-500">최종 수정일: 2026-03-03</p>
      </header>

      <section className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm leading-7 text-slate-300">
        <div>
          <h2 className="text-lg font-semibold text-white">1. 수집하는 개인정보</h2>
          <p className="mt-2">
            Bitflow는 서비스 제공을 위해 직접 수집하는 개인정보가 없습니다.
            다만, 다음과 같은 제3자 서비스를 통해 자동으로 정보가 수집될 수 있습니다.
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Google AdSense: 광고 제공을 위한 쿠키 및 사용자 행동 데이터</li>
            <li>Vercel Analytics: 페이지 방문 통계 (IP 주소는 익명화 처리)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">2. 쿠키 사용</h2>
          <p className="mt-2">
            본 사이트는 Google AdSense 광고를 위해 쿠키를 사용합니다.
            쿠키는 사용자의 관심사에 기반한 광고를 제공하기 위해 Google이 수집하는 데이터입니다.
          </p>
          <p className="mt-2">
            사용자는 브라우저 설정에서 쿠키를 차단할 수 있으나, 일부 기능이 제한될 수 있습니다.
            Google의 광고 개인화를 거부하려면{' '}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline underline-offset-4 hover:text-blue-300"
            >
              Google 광고 설정
            </a>
            에서 설정할 수 있습니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">3. 제3자 제공</h2>
          <p className="mt-2">
            수집된 정보는 광고 제공 목적 외에 제3자에게 제공되지 않습니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">4. 데이터 출처</h2>
          <p className="mt-2">
            본 사이트에 표시되는 데이터는 다음 공개 API에서 수집됩니다:
            CoinGecko, Alternative.me, Blockchain.com, Mempool.space, Whale Alert.
            모든 데이터는 참고용이며 투자 조언이 아닙니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">5. 문의</h2>
          <p className="mt-2">
            개인정보 관련 문의는 사이트 운영자에게 이메일로 연락해 주세요.
          </p>
        </div>
      </section>

      <Link
        href="/"
        className="inline-flex rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-slate-300 transition hover:border-[var(--border-light)] hover:text-white"
      >
        ← 대시보드로 돌아가기
      </Link>
    </main>
  );
}
