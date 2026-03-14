import type { Metadata } from 'next';
import { SITE_CONTACT_URL, SITE_REPO_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: '문의',
  description:
    '비트코인 기상청의 데이터 오류 제보, 기능 제안, 운영 문의 채널 안내.',
};

const channels = [
  {
    title: '데이터 오류 제보',
    body: '가격 이상치, 깨진 차트, 잘못된 문구를 발견하면 재현 경로와 함께 남겨주세요.',
    href: `${SITE_CONTACT_URL}/new`,
    label: '이슈 등록',
  },
  {
    title: '기능 제안',
    body: '새 지표, 히스토리 확장, 한국 시장 특화 기능에 대한 제안을 받습니다.',
    href: `${SITE_CONTACT_URL}/new`,
    label: '기능 제안 보내기',
  },
  {
    title: '운영 정보',
    body: '프로젝트 공개 저장소와 최근 변경 내역은 GitHub에서 확인할 수 있습니다.',
    href: SITE_REPO_URL,
    label: '저장소 보기',
  },
];

export default function ContactPage() {
  return (
    <div className="space-y-5">
      <section className="dot-card p-5 sm:p-6 space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-dot-muted">Contact</p>
        <h1 className="text-base sm:text-lg font-semibold text-dot-accent tracking-tight">문의 및 제보</h1>
        <p className="text-sm text-dot-sub leading-relaxed">
          현재 가장 빠른 공식 문의 채널은 GitHub Issues입니다.
          데이터 오류, 기능 요청, 사이트 운영 관련 문의는 아래 채널을 이용해주세요.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {channels.map((channel) => (
          <article key={channel.title} className="dot-card p-5 space-y-3">
            <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">{channel.title}</h2>
            <p className="text-xs text-dot-sub leading-relaxed">{channel.body}</p>
            <a
              href={channel.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-xs font-medium text-dot-accent hover:underline"
            >
              {channel.label}
            </a>
          </article>
        ))}
      </section>

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">문의 시 함께 보내주면 좋은 정보</h2>
        <ul className="space-y-2 text-xs text-dot-sub leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-dot-muted/50 font-mono">01</span>
            <span>문제가 발생한 페이지 주소와 발생 시각</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-dot-muted/50 font-mono">02</span>
            <span>브라우저 종류와 모바일/데스크톱 여부</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-dot-muted/50 font-mono">03</span>
            <span>가능하면 오류 스크린샷 또는 콘솔 메시지</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
