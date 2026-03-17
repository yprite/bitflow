import GuideCard from '@/components/guide-card';

const GUIDE_STORAGE_KEY = 'bitflow:onchain-guide-seen';

const readingSteps = [
  {
    title: '1. 먼저 Briefing',
    body: '페이지 맨 위 요약입니다. 지금 온체인을 한 줄로 어떻게 읽어야 하는지 먼저 정리해줍니다.',
  },
  {
    title: '2. 다음은 Regime / Whale',
    body: '큰 코인 이동이 최근 24시간 어디에 몰렸는지 봅니다. 한 번에 큰 이동이 몰리면 단기 변동성이 커질 수 있습니다.',
  },
  {
    title: '3. 그다음 Dormancy / Flow',
    body: '장기 보유 코인이 다시 움직이는지, 라벨 엔티티 기준 자금이 안으로 들어오는지 밖으로 나가는지 확인합니다.',
  },
  {
    title: '4. 마지막 Fee / Tempo',
    body: '수수료 경쟁과 블록 속도는 지금 네트워크가 바쁜지 보여줍니다. 가격보다 참여 강도를 읽는 데 유용합니다.',
  },
];

const signalGuides = [
  {
    title: 'On-chain Regime',
    body: '확장이라면 활동과 이동이 살아나는 쪽, 위축이라면 네트워크 참여가 줄어드는 쪽으로 해석합니다.',
  },
  {
    title: 'Whale Summary',
    body: '대형 이동은 관심 신호이지 곧바로 매도 신호는 아닙니다. 거래소 입금인지, 휴면 재활성인지 함께 봐야 합니다.',
  },
  {
    title: 'Mempool / Fee Pressure',
    body: '높을수록 급한 거래가 많다는 뜻입니다. 네트워크가 혼잡하다는 의미이지, 방향성 자체를 말해주지는 않습니다.',
  },
  {
    title: 'Dormancy Pulse',
    body: '오랫동안 잠자던 코인이 다시 움직이는지 보여줍니다. 급증이 며칠 이어질수록 해석 강도가 높아집니다.',
  },
  {
    title: 'Flow Pressure',
    body: '상위 라벨 엔티티의 순유입/순유출입니다. 거래소 라벨 비중이 높을수록 매도 압력 해석력이 좋아집니다.',
  },
  {
    title: 'Fee Regime History',
    body: '지금 수수료 한 점보다 최근 블록들에서 fee 경쟁이 올라오는지 완화되는지를 보여줍니다.',
  },
  {
    title: 'Entity Flow',
    body: '라벨된 거래소나 커스터디 지갑의 순유입/순유출입니다. 거래소 순유입은 잠재 매도 압력으로 자주 해석합니다.',
  },
];

const cautions = [
  '온체인은 가격 예측기가 아니라 네트워크 관측 도구입니다. 단일 카드 하나만 보고 결론 내리면 오판하기 쉽습니다.',
  '큰 이동 1건이 바로 시장 매도라는 뜻은 아닙니다. 내부 지갑 재배치나 커스터디 이동일 수도 있습니다.',
  '가장 신뢰도 높은 건 한 번의 숫자보다 며칠간 이어지는 추세입니다. 스파크라인과 24시간 분포를 같이 보세요.',
];

export default function OnchainGuideCard() {
  return (
    <GuideCard
      title="온체인 읽는 법"
      storageKey={GUIDE_STORAGE_KEY}
      maxHeight={760}
      intro={(
        <>
          온체인 데이터는 가격처럼 직관적이지 않습니다. 이 페이지는 거래량 자체보다
          <span className="font-medium text-dot-accent"> 네트워크 참여 강도, 대형 자금 이동, 수수료 혼잡도</span>
          를 읽기 위한 화면입니다.
        </>
      )}
    >
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {readingSteps.map((step) => (
          <div key={step.title} className="border border-dot-border/60 p-3 dot-grid-sparse">
            <p className="text-[10px] text-dot-muted uppercase tracking-wider">{step.title}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-dot-sub">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {signalGuides.map((guide) => (
          <div key={guide.title} className="border border-dot-border/60 p-3 dot-grid-sparse">
            <p className="text-[10px] text-dot-muted uppercase tracking-wider">{guide.title}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-dot-sub">{guide.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-sm border border-dot-border/40 bg-white/70 p-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-dot-accent">
          해석할 때 주의할 점
        </h3>
        <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-dot-sub">
          {cautions.map((item, index) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-dot-muted/50 font-mono">{String(index + 1).padStart(2, '0')}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </GuideCard>
  );
}
