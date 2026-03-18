import type { Metadata } from 'next';
import PageHeader from '@/components/page-header';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description:
    '비트코인 기상청이 수집하는 접속 데이터, 분석 정보, 선택 기능 사용 정보에 대한 안내.',
};

const lastUpdated = '2026-03-18';
const googlePartnerSitesUrl = 'https://policies.google.com/technologies/partner-sites';
const googleAdSettingsUrl = 'https://myadcenter.google.com/';

export default function PrivacyPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        variant="card"
        eyebrow="개인정보"
        title="개인정보처리방침"
        description={(
          <>
            <p className="text-xs text-dot-sub leading-relaxed">최종 업데이트: {lastUpdated}</p>
            <p>
              비트코인 기상청은 서비스 품질 개선과 기본 통계 분석을 위해 최소한의 접속 정보를 수집합니다.
              회원가입 기반 서비스가 아니므로 이름, 주민등록번호 같은 민감한 개인정보를 요구하지 않습니다.
            </p>
          </>
        )}
      />

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">수집하는 정보</h2>
        <ul className="space-y-2 text-xs text-dot-sub leading-relaxed">
          <li>페이지 방문 경로와 페이지 주소</li>
          <li>세션 식별을 위한 브라우저 세션 ID</li>
          <li>브라우저 종류, 기기 유형, 유입 referrer, UTM 파라미터</li>
          <li>선택 기능 사용 시 텔레그램 chat ID와 알림 임계값</li>
        </ul>
      </section>

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">수집 목적</h2>
        <ul className="space-y-2 text-xs text-dot-sub leading-relaxed">
          <li>방문 통계 분석과 인기 페이지 파악</li>
          <li>사이트 오류, 깨진 경로, 성능 문제 진단</li>
          <li>텔레그램 알림 기능 제공 및 알림 설정 저장</li>
          <li>신규 기능 우선순위와 콘텐츠 개선 방향 판단</li>
        </ul>
      </section>

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">보관 위치와 제3자 서비스</h2>
        <p className="text-xs text-dot-sub leading-relaxed">
          방문 이벤트와 일부 서비스 데이터는 Supabase에 저장될 수 있으며, 사이트 호스팅과 서버 로그는 Vercel 인프라를 사용합니다.
          텔레그램 알림을 사용하는 경우 Telegram 플랫폼을 통해 메시지가 전송됩니다.
        </p>
        <p className="text-xs text-dot-sub leading-relaxed">
          사이트 운영자는 수집한 정보를 광고주나 외부 데이터 중개업체에 판매하지 않습니다.
        </p>
      </section>

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">쿠키 및 세션 정보</h2>
        <p className="text-xs text-dot-sub leading-relaxed">
          비트코인 기상청은 자체 로그인 쿠키를 사용하지 않습니다.
          다만 페이지뷰 집계를 위해 브라우저의 sessionStorage에 임시 세션 식별자 하나를 저장할 수 있습니다.
          이 값은 브라우저 세션이 종료되면 사라질 수 있습니다.
        </p>
      </section>

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">Google 광고 및 제3자 기술</h2>
        <p className="text-xs text-dot-sub leading-relaxed">
          비트코인 기상청은 현재 또는 향후 Google AdSense 등 Google 게시자 제품을 사용할 수 있습니다.
          광고 기능이 활성화되면 Google 및 제3자 파트너는 광고 제공, 노출 빈도 제한, 성과 측정, 사기 방지,
          개인화 또는 비개인화 광고 제공을 위해 쿠키, 웹 비콘, IP 주소, 브라우저 또는 기기 식별자 같은 기술을 사용할 수 있습니다.
        </p>
        <p className="text-xs text-dot-sub leading-relaxed">
          이 과정에서 제3자가 사용자의 브라우저에 정보를 저장하거나 읽을 수 있습니다.
          Google이 파트너 사이트에서 데이터를 사용하는 방식은
          {' '}
          <a href={googlePartnerSitesUrl} target="_blank" rel="noreferrer" className="text-dot-accent hover:underline">
            Google 안내 문서
          </a>
          에서 확인할 수 있습니다.
        </p>
      </section>

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">사용자 선택권</h2>
        <p className="text-xs text-dot-sub leading-relaxed">
          사용자는 브라우저 설정에서 쿠키 저장을 제한하거나 기존 쿠키를 삭제할 수 있습니다.
          Google 광고 개인화 설정은
          {' '}
          <a href={googleAdSettingsUrl} target="_blank" rel="noreferrer" className="text-dot-accent hover:underline">
            My Ad Center
          </a>
          에서 조정할 수 있습니다.
        </p>
        <p className="text-xs text-dot-sub leading-relaxed">
          개인정보, 광고, 데이터 처리 방식에 대한 문의는 사이트의 문의 페이지에 안내된 공식 채널로 접수할 수 있습니다.
        </p>
      </section>
    </div>
  );
}
