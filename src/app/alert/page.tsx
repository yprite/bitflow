import AlertBotCta from '@/components/alert-bot-cta';
import GuideCard from '@/components/guide-card';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import PageHeader from '@/components/page-header';

const GUIDE_STORAGE_KEY = 'bitflow:alert-guide-seen';

const setupSteps = [
  {
    title: '봇 추가',
    body: '텔레그램에서 @btcfloww_bot을 검색한 뒤 /start로 대화를 시작합니다.',
  },
  {
    title: '임계값 설정',
    body: '/alert 3.0 같은 명령으로 원하는 김프 기준을 등록합니다.',
  },
  {
    title: '상태 확인',
    body: '/status로 현재 알림 상태를 확인하고, /alert off로 언제든 끌 수 있습니다.',
  },
];

const primaryCommands = [
  { command: '/alert 3.0', description: '김프가 3.0% 이상이면 알림을 받습니다.' },
  { command: '/alert 5.0', description: '김프가 5.0% 이상이면 알림을 받습니다.' },
  { command: '/alert off', description: '알림을 해제합니다.' },
];

const utilityCommands = [
  { command: '/kimp', description: '현재 김프를 즉시 조회합니다.' },
  { command: '/status', description: '내 알림 설정 현황을 확인합니다.' },
];

export default function AlertPage() {
  return (
    <div className="space-y-3 sm:space-y-5">
      <DotAssemblyReveal delay={0} duration={520} density="low">
        <PageHeader
          variant="card"
          eyebrow="텔레그램 알림"
          title="알림"
          description="김치프리미엄이 설정한 임계값을 넘으면 텔레그램으로 즉시 알림을 받을 수 있습니다."
          backHref="/"
          action={<AlertBotCta />}
        />
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={80} duration={680}>
        <GuideCard
          title="알림 시작 가이드"
          storageKey={GUIDE_STORAGE_KEY}
          maxHeight={520}
          intro="봇 검색부터 임계값 설정, 현재 상태 확인까지 한 카드에서 빠르게 확인할 수 있습니다."
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {setupSteps.map((step, index) => (
              <div key={step.title} className="border border-dot-border/60 p-3 dot-grid-sparse">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold bg-dot-accent text-white rounded-sm">
                    {index + 1}
                  </span>
                  <p className="text-[10px] text-dot-muted uppercase tracking-wider">{step.title}</p>
                </div>
                <p className="text-[11px] text-dot-sub mt-2 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </GuideCard>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={170} duration={700}>
        <section className="dot-card p-5 sm:p-6 space-y-4">
          <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">주요 명령어</h2>
          <div className="space-y-2">
            {primaryCommands.map((item) => (
              <div key={item.command} className="flex items-start gap-3 p-3 border border-dot-border/60 dot-grid-sparse hover:border-dot-muted transition-colors">
                <code className="text-dot-green shrink-0 font-mono font-medium text-xs">{item.command}</code>
                <span className="text-dot-sub text-xs">{item.description}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {utilityCommands.map((item) => (
              <div key={item.command} className="flex items-start gap-3 p-3 border border-dot-border/60 dot-grid-sparse hover:border-dot-muted transition-colors">
                <code className="text-dot-green shrink-0 font-mono font-medium text-xs">{item.command}</code>
                <span className="text-dot-sub text-xs">{item.description}</span>
              </div>
            ))}
          </div>
        </section>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={270} duration={640} density="low">
        <section className="dot-card p-5 sm:p-6 space-y-3">
          <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">알림은 어떻게 동작하나요?</h2>
          <ul className="space-y-1.5 text-xs text-dot-sub ml-1">
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/40 mt-px">·</span>
              서버에서 1분마다 김프를 체크합니다.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/40 mt-px">·</span>
              김프가 설정한 임계값 이상이면 텔레그램 메시지를 보냅니다.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted/40 mt-px">·</span>
              음수 김프(역프)도 절대값 기준으로 알림이 동작합니다.
            </li>
          </ul>
        </section>
      </DotAssemblyReveal>
    </div>
  );
}
