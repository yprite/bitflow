import { getTagsForTheme } from '@/lib/home-preferences';

export interface SparklinePoint {
  collectedAt: string;
  value: number;
}

export type MarketDirection = 'up' | 'down' | 'flat';

export interface PulseStat {
  label: string;
  value: string;
  caption: string;
  cta: string;
  href?: string;
}

export interface PulseData {
  eyebrow: string;
  title: string;
  summary: string;
  stats: PulseStat[];
  tickers: string[];
}

export interface MarketIndexCard {
  name: string;
  level: string;
  change: string;
  direction: MarketDirection;
  note: string;
  tone: string;
  points: SparklinePoint[];
}

export interface SpotlightTheme {
  badge: string;
  title: string;
  summary: string;
  momentum: string;
  flow: string;
  relatedTickers: string[];
  cta: string;
  accent: 'signal' | 'heat' | 'calendar';
  tags: string[];
}

export interface RankingItem {
  rank: number;
  name: string;
  price: string;
  change: string;
  direction: MarketDirection;
  reason: string;
  signal: string;
  href?: string;
  tags?: string[];
}

export interface RankingTab {
  label: string;
  summary: string;
  items: RankingItem[];
}

export interface ThemeCard {
  name: string;
  badge: string;
  averageReturn: string;
  turnover: string;
  summary: string;
  nextCatalyst: string;
  tickers: string[];
  direction: MarketDirection;
  tags: string[];
}

export interface ScheduleItem {
  time: string;
  category: string;
  title: string;
  summary: string;
  tags?: string[];
}

export interface AnalysisCard {
  category: string;
  title: string;
  blurb: string;
  readingTime: string;
}

export interface MarketHomeContent {
  liveStamp: string;
  pulse: PulseData;
  indices: MarketIndexCard[];
  spotlightThemes: SpotlightTheme[];
  rankingTabs: RankingTab[];
  briefing: string;
  themes: ThemeCard[];
  schedule: ScheduleItem[];
  analysis: AnalysisCard[];
  followTags: string[];
}

function buildSeries(values: number[]): SparklinePoint[] {
  const base = Date.UTC(2026, 2, 8, 0, 0, 0);

  return values.map((value, index) => ({
    collectedAt: new Date(base + index * 15 * 60 * 1000).toISOString(),
    value,
  }));
}

export const marketHomeContent: MarketHomeContent = {
  liveStamp: '2026.03.08 09:12 KST',
  pulse: {
    eyebrow: '30-SECOND MARKET RADAR',
    title: '오늘 시장에서 붙는 테마와 내일까지 볼 이벤트를 한 번에 보는 화면',
    summary:
      '첫 화면에서 지금 뜨는 종목, 왜 움직이는지, 내일까지 이어질 일정까지 빠르게 훑게 만드는 설명형 시장 레이더입니다.',
    stats: [
      {
        label: '지금 가장 센 종목',
        value: '한미반도체 +14.2%',
        caption: 'HBM 후공정 증설 기대가 붙으며 급등 랭킹 1위로 바로 올라온 구간입니다.',
        cta: '왜 오르는지 보기',
        href: '/stocks/hanmi-semiconductor',
      },
      {
        label: '지금 돈이 붙는 종목',
        value: 'SK하이닉스 1.8조',
        caption: '외국인 반도체 복귀가 거래대금으로 확인되는 구간이라 수급 설명력이 가장 높습니다.',
        cta: '수급 포인트 보기',
        href: '/stocks/sk-hynix',
      },
      {
        label: '내일까지 볼 이벤트',
        value: 'KB금융 주총 10:00',
        caption: '배당과 자사주 코멘트가 금융주 전반으로 확산될 수 있어 일정 확인 우선순위가 높습니다.',
        cta: '일정 먼저 보기',
        href: '#schedule',
      },
    ],
    tickers: ['HBM', '조선/방산', '자사주 소각', '코스닥 레버리지', '전력 인프라', '배당 캘린더'],
  },
  indices: [
    {
      name: 'KOSPI',
      level: '2,742.18',
      change: '+0.84%',
      direction: 'up',
      note: '외국인 반도체 순매수 지속',
      tone: '#F97316',
      points: buildSeries([2688, 2694, 2701, 2698, 2710, 2721, 2728, 2734, 2731, 2738, 2740, 2742]),
    },
    {
      name: 'KOSDAQ',
      level: '878.64',
      change: '+1.37%',
      direction: 'up',
      note: '레버리지 ETF와 2차전지 반등',
      tone: '#14B8A6',
      points: buildSeries([852, 855, 858, 861, 864, 866, 870, 872, 874, 875, 877, 879]),
    },
    {
      name: 'USD/KRW',
      level: '1,318.40',
      change: '-0.22%',
      direction: 'down',
      note: '원화 강세로 수급 심리 완화',
      tone: '#60A5FA',
      points: buildSeries([1326, 1325, 1324, 1323, 1322, 1321, 1320, 1319.8, 1319.2, 1318.9, 1318.6, 1318.4]),
    },
  ],
  spotlightThemes: [
    {
      badge: 'LIVE',
      title: 'HBM / 반도체',
      summary: '외국인 순매수와 AI 서버 기대가 다시 같은 방향으로 붙었습니다.',
      momentum: '평균 +4.2%',
      flow: '거래대금 1.2조',
      relatedTickers: ['SK하이닉스', '한미반도체', 'ISC'],
      cta: '5분 요약 보기',
      accent: 'signal',
      tags: getTagsForTheme('HBM / 반도체'),
    },
    {
      badge: 'HOT',
      title: '조선 · 방산',
      summary: '유럽 수주 기대와 지정학 재료가 겹치면서 하루 종일 토론량이 유지됩니다.',
      momentum: '평균 +3.6%',
      flow: '토론 급증 218%',
      relatedTickers: ['한화에어로', 'HD현대중공업', 'LIG넥스원'],
      cta: '관련주 보기',
      accent: 'heat',
      tags: getTagsForTheme('조선 · 방산'),
    },
    {
      badge: 'D-2',
      title: '자사주 소각 / 주총',
      summary: '3월 주총 시즌이 가까워질수록 저PBR과 금융주 재료가 다시 살아납니다.',
      momentum: '평균 +2.1%',
      flow: '캘린더 11건',
      relatedTickers: ['KB금융', '하나금융지주', '삼성물산'],
      cta: '일정 체크하기',
      accent: 'calendar',
      tags: getTagsForTheme('자사주 소각'),
    },
  ],
  rankingTabs: [
    {
      label: '왜 오름',
      summary: '단순 상승률보다, 왜 붙는지 바로 설명되는 종목부터 보는 탭입니다.',
      items: [
        { rank: 1, name: '한미반도체', price: '127,800원', change: '+14.2%', direction: 'up', reason: 'HBM 후공정 증설 기대', signal: '왜 오름?', tags: getTagsForTheme('HBM') },
        { rank: 2, name: '한화에어로', price: '298,500원', change: '+11.8%', direction: 'up', reason: '방산 수주 기대 + 신고가', signal: '수급 강세', tags: getTagsForTheme('조선 · 방산') },
        { rank: 3, name: '두산에너빌리티', price: '24,850원', change: '+10.5%', direction: 'up', reason: '원전 / 전력 인프라 동반 강세', signal: '테마 확산', tags: getTagsForTheme('전력 인프라') },
        { rank: 4, name: '에코프로비엠', price: '262,000원', change: '+9.7%', direction: 'up', reason: '2차전지 숏커버링 유입', signal: '거래 폭발', tags: getTagsForTheme('코스닥 레버리지') },
        { rank: 5, name: '삼성물산', price: '171,200원', change: '+8.9%', direction: 'up', reason: '주주환원 기대 재점화', signal: '이벤트 임박', tags: getTagsForTheme('자사주 소각') },
      ],
    },
    {
      label: '돈 붙는 곳',
      summary: '거래대금이 실제로 붙는 종목은 장중에 한 번 더 확인할 이유를 만듭니다.',
      items: [
        { rank: 1, name: 'SK하이닉스', price: '214,000원', change: '+5.8%', direction: 'up', reason: '외국인 매수 전환', signal: '1.8조', tags: getTagsForTheme('HBM') },
        { rank: 2, name: '삼성전자', price: '82,500원', change: '+2.2%', direction: 'up', reason: '반도체 대장주 동반 상승', signal: '1.4조', tags: getTagsForTheme('HBM') },
        { rank: 3, name: '에코프로비엠', price: '262,000원', change: '+9.7%', direction: 'up', reason: '레버리지 수급 집중', signal: '9,200억', tags: getTagsForTheme('코스닥 레버리지') },
        { rank: 4, name: '한화에어로', price: '298,500원', change: '+11.8%', direction: 'up', reason: '조선/방산 섹터 견인', signal: '8,600억', tags: getTagsForTheme('조선 · 방산') },
        { rank: 5, name: 'KB금융', price: '88,300원', change: '+3.1%', direction: 'up', reason: '밸류업 기대 유지', signal: '6,800억', tags: getTagsForTheme('배당 · 금융') },
      ],
    },
    {
      label: '내일도 볼 이유',
      summary: '오늘 강했던 흐름 중에서도 다음 일정이나 촉매가 남아 있는 종목을 먼저 추립니다.',
      items: [
        { rank: 1, name: '삼성물산', price: '171,200원', change: '+8.9%', direction: 'up', reason: '주주환원 기대가 실제 공시 확인 국면으로 넘어가는 자리', signal: '주총 체크', href: '/stocks/samsung-ct', tags: getTagsForTheme('자사주 소각') },
        { rank: 2, name: 'KB금융', price: '88,300원', change: '+3.1%', direction: 'up', reason: '배당과 자사주 코멘트가 금융주 전체로 번질 수 있는 일정', signal: '10:00 주총', href: '/stocks/kb-financial', tags: getTagsForTheme('배당 · 금융') },
        { rank: 3, name: '한미반도체', price: '127,800원', change: '+14.2%', direction: 'up', reason: 'HBM 후공정 코멘트가 다시 나오면 섹터 확산이 한 번 더 붙을 수 있음', signal: '13:40 코멘트', href: '/stocks/hanmi-semiconductor', tags: getTagsForTheme('HBM') },
        { rank: 4, name: '한화에어로', price: '298,500원', change: '+11.8%', direction: 'up', reason: '방산 수주 기대는 하루짜리 반응보다 멀티데이 추세로 이어지기 쉬움', signal: '수주 대기', href: '/stocks/hanwha-aerospace', tags: getTagsForTheme('조선 · 방산') },
        { rank: 5, name: '두산에너빌리티', price: '24,850원', change: '+10.5%', direction: 'up', reason: '전력 인프라와 원전 서사가 기관 추적으로 이어지는지 확인할 구간', signal: '정책 체크', href: '/stocks/doosan-enerbility', tags: getTagsForTheme('전력 인프라') },
      ],
    },
  ],
  briefing:
    '외국인은 반도체, 개인은 코스닥 레버리지에 몰리고 있습니다. BitFlow는 숫자를 더 쌓기보다, 지금 붙는 이유와 내일 이어질 이벤트를 먼저 보여주는 데 집중합니다.',
  themes: [
    {
      name: 'HBM',
      badge: '실시간',
      averageReturn: '+4.2%',
      turnover: '1.2조',
      summary: 'AI 메모리 수요 기대가 유지되며 장중 눌림마다 수급이 다시 붙습니다.',
      nextCatalyst: '메모리 CAPEX 코멘트',
      tickers: ['SK하이닉스', '한미반도체', 'ISC'],
      direction: 'up',
      tags: getTagsForTheme('HBM'),
    },
    {
      name: '조선 · 방산',
      badge: '토론 폭발',
      averageReturn: '+3.6%',
      turnover: '9,800억',
      summary: '수주 재료가 붙으면 하루 이상 이어질 가능성이 높은 전형적인 도파민 섹터입니다.',
      nextCatalyst: '중동 / 유럽 수주 뉴스',
      tickers: ['한화에어로', 'HD현대중공업', '한화오션'],
      direction: 'up',
      tags: getTagsForTheme('조선 · 방산'),
    },
    {
      name: '자사주 소각',
      badge: 'D-2',
      averageReturn: '+2.1%',
      turnover: '4,300억',
      summary: '3월 주총 시즌에는 실제 공시보다 기대감이 먼저 움직이는 경우가 많습니다.',
      nextCatalyst: '주총 안건 확정 공시',
      tickers: ['KB금융', '하나금융지주', '삼성물산'],
      direction: 'up',
      tags: getTagsForTheme('자사주 소각'),
    },
    {
      name: '코스닥 레버리지',
      badge: '개인 집중',
      averageReturn: '+5.8%',
      turnover: '1.6조',
      summary: '개인 투자자의 위험 선호가 강할 때 가장 빠르게 클릭과 토론이 붙는 구간입니다.',
      nextCatalyst: '장중 변동성 확대',
      tickers: ['코스닥150 ETF', '에코프로비엠', '에코프로머티'],
      direction: 'up',
      tags: getTagsForTheme('코스닥 레버리지'),
    },
    {
      name: '전력 인프라',
      badge: '기관 추적',
      averageReturn: '+2.8%',
      turnover: '5,100억',
      summary: '원전과 전력기기가 같은 서사로 묶이면서 중장기 성장 스토리가 붙습니다.',
      nextCatalyst: '해외 전력망 투자 발표',
      tickers: ['효성중공업', '두산에너빌리티', 'LS ELECTRIC'],
      direction: 'up',
      tags: getTagsForTheme('전력 인프라'),
    },
    {
      name: '배당 · 금융',
      badge: '캘린더',
      averageReturn: '+1.9%',
      turnover: '6,200억',
      summary: '도파민은 강하지 않지만 체류시간과 신뢰를 확보하는 안정적인 트래픽 축입니다.',
      nextCatalyst: '배당 기준일 / 주주환원 발표',
      tickers: ['KB금융', '신한지주', '하나금융지주'],
      direction: 'up',
      tags: getTagsForTheme('배당 · 금융'),
    },
  ],
  schedule: [
    {
      time: '08:30',
      category: '공시',
      title: '삼성물산 주주환원 계획 업데이트',
      summary: '자사주 소각 규모와 향후 배당 정책 언급 여부가 핵심입니다.',
      tags: getTagsForTheme('자사주 소각'),
    },
    {
      time: '10:00',
      category: '주총',
      title: 'KB금융 정기 주주총회',
      summary: '배당, 자사주 매입, 밸류업 코멘트가 가장 큰 체크포인트입니다.',
      tags: getTagsForTheme('배당 · 금융'),
    },
    {
      time: '13:40',
      category: '실적',
      title: '한미반도체 장비 수주 코멘트',
      summary: 'HBM 후공정 장비 수주 가이던스가 뜨면 섹터 전체로 확산됩니다.',
      tags: getTagsForTheme('HBM'),
    },
    {
      time: '20:00',
      category: '체크리스트',
      title: '내일 일정 브리핑 발행',
      summary: '보호예수 해제, 배당락, 공시 예정 종목을 한 장으로 요약합니다.',
      tags: [],
    },
  ],
  analysis: [
    {
      category: '반도체',
      title: 'SK하이닉스 지금 들어가도 되는가',
      blurb: '외국인 순매수 복귀가 단기 반등인지, 추세 전환인지 숫자로 분리합니다.',
      readingTime: '4분',
    },
    {
      category: '주총 시즌',
      title: '이번 주 자사주 소각 기대주 7선',
      blurb: '저PBR, 현금흐름, 과거 주주환원 패턴을 같이 봐야 낚이지 않습니다.',
      readingTime: '5분',
    },
    {
      category: '코스닥',
      title: '삼천닥 기대, 이번에는 무엇이 다른가',
      blurb: '개인 수급, ETF 레버리지, 거래대금 회복이 동시에 붙는지 확인합니다.',
      readingTime: '6분',
    },
  ],
  followTags: ['반도체', '조선', '방산', '배당', '코스닥', '전력 인프라'],
};
