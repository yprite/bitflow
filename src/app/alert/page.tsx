export default function AlertPage() {
  return (
    <div className="space-y-6">
      <div className="dot-entrance" style={{ '--entrance-delay': '0ms' } as React.CSSProperties}>
        <div className="dot-card p-5 sm:p-6 dot-grid-sparse">
          <h1 className="text-sm font-semibold text-dot-accent uppercase tracking-wider mb-2">
            텔레그램 알림 설정
          </h1>
          <p className="text-xs text-dot-sub leading-relaxed">
            김치프리미엄이 설정한 임계값을 넘으면 텔레그램으로 즉시 알림을 받을 수 있습니다.
          </p>
        </div>
      </div>

      {/* 봇 연동 안내 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '80ms' } as React.CSSProperties}>
        <section className="dot-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold bg-dot-accent text-white rounded-sm">1</span>
            <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">봇 추가하기</h2>
          </div>
          <ol className="list-none text-dot-text space-y-2.5 text-sm ml-7">
            <li className="flex items-start gap-2">
              <span className="text-dot-muted text-[10px] mt-0.5 font-mono">01</span>
              <span>텔레그램에서 <code className="text-dot-green bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 font-mono text-xs">@btcfloww_bot</code>을 검색합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted text-[10px] mt-0.5 font-mono">02</span>
              <span><code className="text-dot-green bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 font-mono text-xs">/start</code>를 입력해 봇을 시작합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dot-muted text-[10px] mt-0.5 font-mono">03</span>
              <span>봇이 사용법을 안내해줍니다.</span>
            </li>
          </ol>
        </section>
      </div>

      {/* 알림 설정 방법 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '160ms' } as React.CSSProperties}>
        <section className="dot-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold bg-dot-accent text-white rounded-sm">2</span>
            <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">알림 설정하기</h2>
          </div>
          <div className="space-y-2 text-sm ml-7">
            <div className="flex items-start gap-3 p-3 border border-dot-border/60 dot-grid-sparse hover:border-dot-muted transition-colors">
              <code className="text-dot-green shrink-0 font-mono font-medium text-xs">/alert 3.0</code>
              <span className="text-dot-sub text-xs">김프가 3.0% 이상이면 알림을 받습니다.</span>
            </div>
            <div className="flex items-start gap-3 p-3 border border-dot-border/60 dot-grid-sparse hover:border-dot-muted transition-colors">
              <code className="text-dot-green shrink-0 font-mono font-medium text-xs">/alert 5.0</code>
              <span className="text-dot-sub text-xs">김프가 5.0% 이상이면 알림을 받습니다.</span>
            </div>
            <div className="flex items-start gap-3 p-3 border border-dot-border/60 dot-grid-sparse hover:border-dot-muted transition-colors">
              <code className="text-dot-green shrink-0 font-mono font-medium text-xs">/alert off</code>
              <span className="text-dot-sub text-xs">알림을 해제합니다.</span>
            </div>
          </div>
        </section>
      </div>

      {/* 기타 명령어 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '240ms' } as React.CSSProperties}>
        <section className="dot-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold bg-dot-accent text-white rounded-sm">3</span>
            <h2 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">기타 명령어</h2>
          </div>
          <div className="space-y-2 text-sm ml-7">
            <div className="flex items-start gap-3 p-3 border border-dot-border/60 dot-grid-sparse hover:border-dot-muted transition-colors">
              <code className="text-dot-green shrink-0 font-mono font-medium text-xs">/kimp</code>
              <span className="text-dot-sub text-xs">현재 김프를 즉시 조회합니다.</span>
            </div>
            <div className="flex items-start gap-3 p-3 border border-dot-border/60 dot-grid-sparse hover:border-dot-muted transition-colors">
              <code className="text-dot-green shrink-0 font-mono font-medium text-xs">/status</code>
              <span className="text-dot-sub text-xs">내 알림 설정 현황을 확인합니다.</span>
            </div>
          </div>
        </section>
      </div>

      {/* 알림 동작 설명 */}
      <div className="dot-entrance" style={{ '--entrance-delay': '320ms' } as React.CSSProperties}>
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
      </div>
    </div>
  );
}
