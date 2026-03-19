import AlertBotCta from '@/components/alert-bot-cta';
import DotAssemblyReveal from '@/components/motion/transitions/DotAssemblyReveal';
import { DesktopBulletList, DesktopHero, DesktopSectionHeader, DesktopStatCard, DesktopSurface } from '@/components/desktop/desktop-ui';

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

export default function DesktopAlertPage() {
  return (
    <div className="space-y-6">
      <DotAssemblyReveal delay={0} duration={520} density="low">
        <DesktopHero
          eyebrow="Telegram Alert"
          title="알림"
          description={(
            <>
              김치프리미엄이 설정한 임계값을 넘으면 텔레그램으로 즉시 알림을 받을 수 있습니다.
              PC 화면에서는 설정 흐름과 명령어를 한눈에 보이도록 재정리했습니다.
            </>
          )}
          action={<AlertBotCta />}
          sidebar={(
            <div className="space-y-4">
              <DesktopStatCard label="봇" value="@btcfloww_bot" tone="neutral" />
              <DesktopStatCard label="체크 주기" value="1분" tone="neutral" />
              <DesktopStatCard label="임계값 예시" value="/alert 3.0" tone="neutral" />
            </div>
          )}
        />
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={100} duration={680}>
        <DesktopSurface className="p-6">
          <DesktopSectionHeader
            eyebrow="Setup"
            title="알림 시작 순서"
            description="PC에서 먼저 설정 흐름을 확인하고 바로 봇으로 이동할 수 있게 분리했습니다."
          />
          <div className="mt-6 grid grid-cols-3 gap-4">
            {setupSteps.map((step, index) => (
              <DesktopStatCard
                key={step.title}
                label={`STEP ${index + 1}`}
                value={step.title}
                detail={step.body}
              />
            ))}
          </div>
        </DesktopSurface>
      </DotAssemblyReveal>

      <DotAssemblyReveal delay={200} duration={700}>
        <DesktopSurface className="p-6">
          <DesktopSectionHeader
            eyebrow="Commands"
            title="주요 명령어"
            description="자주 쓰는 명령어를 구간별로 나눴습니다."
          />
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="space-y-3 border border-dot-border/60 bg-white/72 p-5">
              <p className="desktop-kicker">Primary</p>
              <DesktopBulletList
                items={[
                  '/alert 3.0: 김프가 3.0% 이상이면 알림을 받습니다.',
                  '/alert 5.0: 더 높은 임계값으로 알림을 받습니다.',
                  '/alert off: 알림을 해제합니다.',
                ]}
              />
            </div>
            <div className="space-y-3 border border-dot-border/60 bg-white/72 p-5">
              <p className="desktop-kicker">Utility</p>
              <DesktopBulletList
                items={[
                  '/kimp: 현재 김프를 즉시 조회합니다.',
                  '/status: 내 알림 설정 현황을 확인합니다.',
                  '역프도 절대값 기준으로 동작하므로 음수 구간도 감지할 수 있습니다.',
                ]}
              />
            </div>
          </div>
        </DesktopSurface>
      </DotAssemblyReveal>
    </div>
  );
}
