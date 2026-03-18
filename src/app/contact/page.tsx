import type { Metadata } from 'next';
import PageHeader from '@/components/page-header';
import { SITE_BASE_URL, SITE_CONTACT_EMAIL, SITE_CONTACT_URL, SITE_REPO_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: '문의',
  description:
    '비트코인 기상청의 데이터 오류 제보, 기능 제안, 운영 문의 채널 안내.',
};

const baseChannels = [
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

const operationFacts = [
  {
    label: '공식 도메인',
    value: SITE_BASE_URL.replace(/^https?:\/\//, ''),
    href: SITE_BASE_URL,
  },
  {
    label: '공개 저장소',
    value: 'github.com/yprite/bitflow',
    href: SITE_REPO_URL,
  },
  {
    label: '공식 문의 채널',
    value: 'GitHub Issues',
    href: SITE_CONTACT_URL,
  },
] as const;

export default function ContactPage() {
  const channels = [...baseChannels];

  if (SITE_CONTACT_EMAIL) {
    channels.push({
      title: '광고 및 정책 문의',
      body: '광고, 개인정보처리방침, 권리 행사 요청처럼 운영 정책과 직접 관련된 문의에 사용할 수 있습니다.',
      href: `mailto:${SITE_CONTACT_EMAIL}`,
      label: SITE_CONTACT_EMAIL,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        variant="card"
        eyebrow="문의"
        title="문의 및 제보"
        description={(
          <>
            현재 가장 빠른 공식 문의 채널은 GitHub Issues입니다.
            데이터 오류, 기능 요청, 사이트 운영 관련 문의는 아래 채널을 이용해주세요.
          </>
        )}
      />

      <section className={`grid gap-3 ${channels.length > 3 ? 'lg:grid-cols-4 sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
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
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">운영 식별 정보</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {operationFacts.map((item) => (
            <article key={item.label} className="border border-dot-border/60 p-4 dot-grid-sparse">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">{item.label}</p>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-xs font-medium text-dot-accent hover:underline"
              >
                {item.value}
              </a>
            </article>
          ))}
        </div>
        <p className="text-xs text-dot-sub leading-relaxed">
          데이터 오류, 운영 문의, 광고 또는 개인정보 관련 문의는 위의 공식 채널로 접수할 수 있습니다.
          공개 가능한 운영 정보는 이 페이지와 정책 페이지에서 지속적으로 업데이트합니다.
        </p>
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
