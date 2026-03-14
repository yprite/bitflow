import type { Metadata } from 'next';
import PageHeader from '@/components/page-header';

export const metadata: Metadata = {
  title: '면책 및 이용안내',
  description:
    '비트코인 기상청의 데이터 이용 범위, 투자 판단 책임, 외부 API 의존성에 대한 안내.',
};

const riskNotes = [
  '비트코인 기상청의 정보는 교육 및 참고 목적이며 투자 자문, 매수 추천, 법률 또는 세무 자문이 아닙니다.',
  '표시되는 가격, 환율, 프리미엄, 지표는 외부 API 응답 지연이나 장애로 인해 실제 시장과 차이가 날 수 있습니다.',
  '재정거래 계산 결과는 슬리피지, 입출금 제한, 체인 혼선, 세금, 수수료를 완전하게 반영하지 않습니다.',
  '텔레그램 알림은 네트워크 상태와 외부 플랫폼 정책에 따라 지연되거나 누락될 수 있습니다.',
];

export default function DisclaimerPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        variant="card"
        eyebrow="면책 안내"
        title="면책 및 이용안내"
        description={(
          <>
            비트코인 기상청은 한국 투자자가 시장을 빠르게 읽을 수 있도록 돕는 관측 도구입니다.
            사이트의 지표와 브리핑은 참고 정보이며, 실제 투자 판단과 결과에 대한 책임은 사용자에게 있습니다.
          </>
        )}
      />

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">이용 전 확인사항</h2>
        <ul className="space-y-2 text-xs text-dot-sub leading-relaxed">
          {riskNotes.map((note, index) => (
            <li key={note} className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">{String(index + 1).padStart(2, '0')}</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="dot-card p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">광고와 제휴 관련 안내</h2>
        <p className="text-xs text-dot-sub leading-relaxed">
          사이트에는 향후 광고 또는 제휴 링크가 포함될 수 있습니다.
          광고가 표시되더라도 데이터 계산 기준과 콘텐츠 방향은 광고주 영향과 분리해 운영하는 것을 원칙으로 합니다.
        </p>
      </section>
    </div>
  );
}
