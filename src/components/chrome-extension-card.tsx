interface ChromeExtension {
  name: string;
  eyebrow: string;
  description: string;
  repo: string;
  features: string[];
}

const EXTENSIONS: ChromeExtension[] = [
  {
    name: 'sat2krw',
    eyebrow: 'Satoshi → KRW',
    description:
      '웹 페이지에서 사토시(sats) 금액을 실시간 원화로 자동 변환해주는 크롬 익스텐션입니다. BTC 관련 글을 읽을 때 금액 감각을 바로 잡아줍니다.',
    repo: 'https://github.com/yprite/sat2krw',
    features: [
      '페이지 내 sats 금액 자동 감지 및 원화 변환',
      '실시간 BTC/KRW 환율 반영',
      '팝업에서 빠른 수동 변환 지원',
    ],
  },
];

function ExtensionItem({ ext }: { ext: ChromeExtension }) {
  return (
    <article className="dot-card h-full p-4 sm:p-5">
      <div className="dot-card-inner space-y-4">
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">
            {ext.eyebrow}
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-dot-accent">
            {ext.name}
          </h2>
          <p className="text-xs leading-relaxed text-dot-sub">
            {ext.description}
          </p>
        </div>

        <ul className="space-y-1.5">
          {ext.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-[11px] leading-relaxed text-dot-sub"
            >
              <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-dot-accent/50" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="pt-1">
          <a
            href={ext.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-sm border border-dot-border/60 bg-white/70 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-dot-sub transition hover:border-dot-accent/50 hover:text-dot-accent"
          >
            GitHub
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ChromeExtensionCard() {
  return (
    <>
      {EXTENSIONS.map((ext) => (
        <ExtensionItem key={ext.name} ext={ext} />
      ))}
    </>
  );
}
