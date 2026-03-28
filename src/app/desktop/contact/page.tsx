import Link from 'next/link';
import { DesktopBulletList, DesktopHero, DesktopSectionHeader, DesktopSurface, DesktopTextCard } from '@/components/desktop/desktop-ui';
import { SITE_CONTACT_EMAIL, SITE_CONTACT_URL, SITE_REPO_URL } from '@/lib/site';

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

if (SITE_CONTACT_EMAIL) {
  channels.push({
    title: '광고 및 정책 문의',
    body: '광고, 개인정보처리방침, 권리 행사 요청처럼 운영 정책과 직접 관련된 문의에 사용할 수 있습니다.',
    href: `mailto:${SITE_CONTACT_EMAIL}`,
    label: SITE_CONTACT_EMAIL,
  });
}

export default function DesktopContactPage() {
  return (
    <div className="magazine-content pt-20 pb-16">
      <Link href="/desktop" className="mb-6 inline-flex text-[10px] uppercase tracking-[0.02em] text-dot-muted hover:text-dot-accent">개요</Link>
    <div className="space-y-6">
      <DesktopHero
        eyebrow="Contact"
        title="문의 및 제보"
        description={(
          <>
            현재 가장 빠른 공식 문의 채널은 GitHub Issues입니다.
            데이터 오류, 기능 요청, 사이트 운영 관련 문의는 아래 채널을 이용해주세요.
          </>
        )}
      />

      <DesktopSurface className="p-6">
        <DesktopSectionHeader eyebrow="Channels" title="공식 문의 채널" />
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {channels.map((channel) => (
            <a
              key={channel.title}
              href={channel.href}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <DesktopTextCard label={channel.label} title={channel.title} body={channel.body} />
            </a>
          ))}
        </div>
      </DesktopSurface>

      <DesktopSurface className="p-6">
        <DesktopSectionHeader eyebrow="Tips" title="문의 시 함께 보내주면 좋은 정보" />
        <div className="mt-6">
          <DesktopBulletList
            numbered
            items={[
              '문제가 발생한 페이지 주소와 발생 시각',
              '브라우저 종류와 모바일/데스크톱 여부',
              '가능하면 오류 스크린샷 또는 콘솔 메시지',
            ]}
          />
        </div>
      </DesktopSurface>
    </div>
    </div>
  );
}
