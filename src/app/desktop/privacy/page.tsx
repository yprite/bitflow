import { DesktopBulletList, DesktopHero, DesktopSectionHeader, DesktopSurface } from '@/components/desktop/desktop-ui';

const lastUpdated = '2026-03-18';
const googlePartnerSitesUrl = 'https://policies.google.com/technologies/partner-sites';
const googleAdSettingsUrl = 'https://myadcenter.google.com/';

export default function DesktopPrivacyPage() {
  return (
    <div className="space-y-6">
      <DesktopHero
        eyebrow="Privacy"
        title="개인정보처리방침"
        description={(
          <>
            <p className="text-[14px] leading-7 text-dot-sub">최종 업데이트: {lastUpdated}</p>
            <p>
              비트코인 기상청은 서비스 품질 개선과 기본 통계 분석을 위해 최소한의 접속 정보를 수집합니다.
              회원가입 기반 서비스가 아니므로 이름, 주민등록번호 같은 민감한 개인정보를 요구하지 않습니다.
            </p>
          </>
        )}
      />

      <DesktopSurface className="p-6">
        <DesktopSectionHeader eyebrow="Collected Data" title="수집하는 정보" />
        <div className="mt-6">
          <DesktopBulletList
            items={[
              '페이지 방문 경로와 페이지 주소',
              '세션 식별을 위한 브라우저 세션 ID',
              '브라우저 종류, 기기 유형, 유입 referrer, UTM 파라미터',
              '선택 기능 사용 시 텔레그램 chat ID와 알림 임계값',
            ]}
          />
        </div>
      </DesktopSurface>

      <DesktopSurface className="p-6">
        <DesktopSectionHeader eyebrow="Purpose" title="수집 목적" />
        <div className="mt-6">
          <DesktopBulletList
            items={[
              '방문 통계 분석과 인기 페이지 파악',
              '사이트 오류, 깨진 경로, 성능 문제 진단',
              '텔레그램 알림 기능 제공 및 알림 설정 저장',
              '신규 기능 우선순위와 콘텐츠 개선 방향 판단',
            ]}
          />
        </div>
      </DesktopSurface>

      <DesktopSurface className="p-6">
        <DesktopSectionHeader eyebrow="3rd Party" title="보관 위치와 제3자 서비스" />
        <div className="mt-6 space-y-4 text-[13px] leading-7 text-dot-sub">
          <p>
            방문 이벤트와 일부 서비스 데이터는 Supabase에 저장될 수 있으며, 사이트 호스팅과 서버 로그는 Vercel 인프라를 사용합니다.
            텔레그램 알림을 사용하는 경우 Telegram 플랫폼을 통해 메시지가 전송됩니다.
          </p>
          <p>사이트 운영자는 수집한 정보를 광고주나 외부 데이터 중개업체에 판매하지 않습니다.</p>
        </div>
      </DesktopSurface>

      <DesktopSurface className="p-6">
        <DesktopSectionHeader eyebrow="Ads" title="Google 광고 및 제3자 기술" />
        <div className="mt-6 space-y-4 text-[13px] leading-7 text-dot-sub">
          <p>
            비트코인 기상청은 현재 또는 향후 Google AdSense 등 Google 게시자 제품을 사용할 수 있습니다.
            광고 기능이 활성화되면 Google 및 제3자 파트너는 광고 제공, 노출 빈도 제한, 성과 측정, 사기 방지,
            개인화 또는 비개인화 광고 제공을 위해 쿠키, 웹 비콘, IP 주소, 브라우저 또는 기기 식별자 같은 기술을 사용할 수 있습니다.
          </p>
          <p>
            Google이 파트너 사이트에서 데이터를 사용하는 방식은
            {' '}
            <a href={googlePartnerSitesUrl} target="_blank" rel="noreferrer" className="text-dot-accent hover:underline">
              Google 안내 문서
            </a>
            에서 확인할 수 있습니다.
          </p>
          <p>
            Google 광고 개인화 설정은
            {' '}
            <a href={googleAdSettingsUrl} target="_blank" rel="noreferrer" className="text-dot-accent hover:underline">
              My Ad Center
            </a>
            에서 조정할 수 있습니다.
          </p>
        </div>
      </DesktopSurface>
    </div>
  );
}
