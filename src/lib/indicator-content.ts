export type IndicatorSlug =
  | 'exchange-netflow'
  | 'whale-tracker'
  | 'mempool-fees'
  | 'fear-greed'
  | 'utxo-age';

export interface IndicatorConfig {
  slug: IndicatorSlug;
  kind: 'metric' | 'whale';
  metricName?: 'exchange_netflow' | 'mempool_fees' | 'fear_greed' | 'utxo_age_1y';
  title: string;
  subtitle: string;
  description: string;
  unit: string;
  tone: string;
  source: string;
  related: IndicatorSlug[];
}

export interface GlossaryEntry {
  slug: string;
  title: string;
  summary: string;
  definition: string;
  formula?: string;
  signals: string[];
  cautions: string[];
  related: string[];
}

export const INDICATOR_CONFIGS: IndicatorConfig[] = [
  {
    slug: 'exchange-netflow',
    kind: 'metric',
    metricName: 'exchange_netflow',
    title: '거래소 넷플로우',
    subtitle: '거래소로 들어오거나 나간 BTC의 순량',
    description: '거래소 순유입/순유출 흐름을 통해 단기 매도 압력 가능성을 추적합니다.',
    unit: 'BTC',
    tone: '#34d399',
    source: 'Blockchain.com',
    related: ['utxo-age', 'fear-greed', 'whale-tracker'],
  },
  {
    slug: 'whale-tracker',
    kind: 'whale',
    title: '고래 트랜잭션 추적',
    subtitle: '대형 지갑 이동 이벤트 모니터링',
    description: '고래 규모 트랜잭션의 빈도와 이동 방향을 관찰해 이벤트성 변동 가능성을 확인합니다.',
    unit: 'BTC',
    tone: '#f59e0b',
    source: 'Whale Alert',
    related: ['exchange-netflow', 'mempool-fees', 'fear-greed'],
  },
  {
    slug: 'mempool-fees',
    kind: 'metric',
    metricName: 'mempool_fees',
    title: '멤풀 수수료',
    subtitle: '네트워크 혼잡도와 전송 비용',
    description: '추천 수수료(sat/vB) 추이를 통해 네트워크 수요 급증/완화를 확인합니다.',
    unit: 'sat/vB',
    tone: '#f97316',
    source: 'Mempool.space',
    related: ['exchange-netflow', 'whale-tracker', 'fear-greed'],
  },
  {
    slug: 'fear-greed',
    kind: 'metric',
    metricName: 'fear_greed',
    title: '공포/탐욕 지수',
    subtitle: '시장 심리 온도계',
    description: '시장 심리 지표를 통해 과열/침체 구간을 빠르게 파악합니다.',
    unit: 'index',
    tone: '#fb7185',
    source: 'Alternative.me',
    related: ['exchange-netflow', 'utxo-age', 'mempool-fees'],
  },
  {
    slug: 'utxo-age',
    kind: 'metric',
    metricName: 'utxo_age_1y',
    title: '장기 미이동 UTXO 비율',
    subtitle: '1년 이상 이동하지 않은 코인 비중',
    description: '장기 보유 성향 변화를 보기 위해 장기 미이동 비율의 방향성을 추적합니다.',
    unit: '%',
    tone: '#60a5fa',
    source: 'Blockchain.com',
    related: ['exchange-netflow', 'fear-greed', 'whale-tracker'],
  },
];

const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    slug: 'mvrv',
    title: 'MVRV 비율이란?',
    summary: '시가총액 대비 실현가치 비율로 과열/저평가를 보는 온체인 밸류에이션 지표.',
    definition: 'MVRV는 Market Value(시가총액)를 Realized Value(실현가치)로 나눈 값입니다.',
    formula: 'MVRV = Market Cap / Realized Cap',
    signals: ['1 미만은 저평가 구간으로 해석되는 경우가 많습니다.', '고점 국면에서는 MVRV가 과열 레벨로 급등하는 경향이 있습니다.'],
    cautions: ['실현가치 계산은 데이터 소스마다 차이가 큽니다.', '단독 매수/매도 신호로 사용하면 오탐이 많습니다.'],
    related: ['nvt', 'sopr', 'exchange-netflow'],
  },
  {
    slug: 'nvt',
    title: 'NVT Ratio 뜻',
    summary: '네트워크 가치(시총)와 온체인 전송량의 비율.',
    definition: 'NVT는 시가총액을 온체인 전송량(USD)으로 나누어 네트워크 가치 대비 사용량을 측정합니다.',
    formula: 'NVT = Market Cap / On-chain Transaction Volume',
    signals: ['높은 NVT는 사용량 대비 가치가 비싸다는 해석이 가능합니다.', '낮은 NVT는 사용량 대비 저평가로 해석되기도 합니다.'],
    cautions: ['거래소 거래량과 온체인 전송량은 다른 데이터입니다.', '체인 혼잡/수수료 정책 변화가 분모를 크게 흔들 수 있습니다.'],
    related: ['mvrv', 'mempool-fees', 'exchange-netflow'],
  },
  {
    slug: 'sopr',
    title: 'SOPR 지표 뜻',
    summary: '코인이 이동될 때 실현 손익 비율을 나타내는 지표.',
    definition: 'SOPR은 소비된 코인의 매도 가치와 취득 가치를 비교해 실현 손익을 측정합니다.',
    formula: 'SOPR = Realized Value / Value at Creation',
    signals: ['1 이상이면 이익 실현 거래가 우세합니다.', '1 이하이면 손절/본전 부근 매도가 우세한 구간입니다.'],
    cautions: ['단기 노이즈가 커서 평균화가 필요합니다.', '시장 구조 변화 시 과거 임계값이 무력화될 수 있습니다.'],
    related: ['mvrv', 'fear-greed', 'utxo-age'],
  },
  {
    slug: 'exchange-netflow',
    title: '거래소 넷플로우 의미',
    summary: '거래소 입출금 순량으로 단기 공급 압력을 추정.',
    definition: '순유입은 거래소 유입이 유출보다 큰 상태, 순유출은 그 반대 상태입니다.',
    signals: ['순유입 확대는 매도 대기 물량 증가 신호로 해석됩니다.', '순유출 확대는 장기 보관 전환으로 보는 시각이 있습니다.'],
    cautions: ['OTC/파생 거래는 반영되지 않을 수 있습니다.', '거래소 라벨링 정확도에 따라 해석이 달라집니다.'],
    related: ['whale-transaction', 'mempool-fees', 'fear-greed'],
  },
  {
    slug: 'fear-greed',
    title: '공포/탐욕 지수란?',
    summary: '시장 심리를 0~100으로 정량화한 지표.',
    definition: '극도의 공포(낮은 값)와 극도의 탐욕(높은 값) 사이에서 현재 심리 위치를 표현합니다.',
    signals: ['낮은 값은 과도한 공포 국면 가능성을 시사합니다.', '높은 값은 과열/추격 매수 위험 신호가 될 수 있습니다.'],
    cautions: ['심리 지표 특성상 추세장에서는 극단값이 오래 지속될 수 있습니다.', '가격 자체보다 후행하는 경우가 많습니다.'],
    related: ['exchange-netflow', 'mvrv', 'sopr'],
  },
  {
    slug: 'utxo-age',
    title: 'UTXO 연령 분포란?',
    summary: '코인이 마지막 이동 이후 얼마나 오래 보관됐는지의 분포.',
    definition: 'UTXO 연령은 장기 보유자 비중 변화를 간접 추적하는 데 사용됩니다.',
    signals: ['장기 구간 비중 증가 시 보유 성향 강화로 해석됩니다.', '장기 구간 비중 감소 시 분배(매도) 가능성을 점검합니다.'],
    cautions: ['분실 코인과 실제 장기 보유를 구분하기 어렵습니다.', '체인 내부 이동도 연령을 초기화할 수 있습니다.'],
    related: ['lth', 'exchange-netflow', 'sopr'],
  },
  {
    slug: 'mempool-fees',
    title: '멤풀 수수료가 말해주는 것',
    summary: '수수료 급등은 블록 공간 경쟁 심화를 의미.',
    definition: '멤풀 추천 수수료는 현재 네트워크 혼잡을 반영하는 실시간 지표입니다.',
    signals: ['수수료 급등은 거래 수요 급증/패닉 상황에서 자주 발생합니다.', '수수료 안정화는 단기 과열 완화 신호로 볼 수 있습니다.'],
    cautions: ['수수료는 구조적 요인(블록 크기, 정책 변화) 영향도 큽니다.', '가격 방향과 항상 일치하지는 않습니다.'],
    related: ['exchange-netflow', 'whale-transaction', 'fear-greed'],
  },
  {
    slug: 'realized-cap',
    title: 'Realized Cap이란?',
    summary: '각 코인을 마지막 이동 가격으로 평가한 시가총액 대체 개념.',
    definition: 'Realized Cap은 온체인 이전 시점 가격을 기준으로 총 가치를 계산합니다.',
    signals: ['실현가치 상승은 네트워크 내 자본 유입 누적을 시사합니다.', 'MVRV 등 밸류에이션 지표의 핵심 분모로 사용됩니다.'],
    cautions: ['정확한 계산에는 고품질 온체인 데이터가 필요합니다.', '체인 해석 방식에 따라 값 차이가 발생할 수 있습니다.'],
    related: ['mvrv', 'sopr', 'utxo-age'],
  },
  {
    slug: 'whale-transaction',
    title: '고래 트랜잭션 해석법',
    summary: '대규모 온체인 이동 이벤트의 맥락을 읽는 방법.',
    definition: '고래 트랜잭션은 큰 규모의 지갑 간 이전을 의미하며 이벤트성 변동을 유발할 수 있습니다.',
    signals: ['거래소 유입 대형 이체는 단기 매도 압력 우려를 키웁니다.', '거래소 유출 대형 이체는 보관 전환 신호로 해석되기도 합니다.'],
    cautions: ['내부 지갑 재배치일 수도 있어 단정 금지.', '단일 이벤트보다 연속 패턴이 더 중요합니다.'],
    related: ['exchange-netflow', 'mempool-fees', 'fear-greed'],
  },
  {
    slug: 'lth',
    title: 'LTH(장기보유자)란?',
    summary: '일정 기간 이상 코인을 보유한 투자자 집단 지표.',
    definition: 'LTH는 일반적으로 155일 이상 보유 집단을 가리키며 공급 구조 분석에 활용됩니다.',
    signals: ['LTH 보유량 증가 시 공급 잠김 효과가 커질 수 있습니다.', 'LTH 분배는 사이클 후반 신호로 자주 언급됩니다.'],
    cautions: ['정의 임계값은 제공자마다 다를 수 있습니다.', '파생/거래소 내부 이동은 포착이 어렵습니다.'],
    related: ['utxo-age', 'mvrv', 'sopr'],
  },
];

export function getIndicatorBySlug(slug: string): IndicatorConfig | null {
  return INDICATOR_CONFIGS.find((config) => config.slug === slug) ?? null;
}

export function getGlossaryBySlug(slug: string): GlossaryEntry | null {
  return GLOSSARY_ENTRIES.find((entry) => entry.slug === slug) ?? null;
}

export function getIndicatorSlugs(): IndicatorSlug[] {
  return INDICATOR_CONFIGS.map((config) => config.slug);
}

export function getGlossarySlugs(): string[] {
  return GLOSSARY_ENTRIES.map((entry) => entry.slug);
}

export function getGlossaryEntries(): GlossaryEntry[] {
  return GLOSSARY_ENTRIES;
}
