interface ChromeExtension {
  name: string;
  eyebrow: string;
  description: string;
  repo: string;
  /** Chrome Web Store URL — null이면 GitHub 수동 설치 안내 */
  webStoreUrl: string | null;
  features: string[];
}

const EXTENSIONS: ChromeExtension[] = [
  {
    name: 'sat2krw',
    eyebrow: 'Satoshi → KRW',
    description:
      '웹 페이지에서 사토시(sats) 금액을 실시간 원화로 자동 변환해주는 크롬 익스텐션입니다. BTC 관련 글을 읽을 때 금액 감각을 바로 잡아줍니다.',
    repo: 'https://github.com/yprite/sat2krw',
    webStoreUrl: null,
    features: [
      '페이지 내 sats 금액 자동 감지 및 원화 변환',
      '실시간 BTC/KRW 환율 반영',
      '팝업에서 빠른 수동 변환 지원',
    ],
  },
];

const ExternalLinkIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const ChromeIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="21.17" y1="8" x2="12" y2="8" />
    <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
    <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
  </svg>
);

function ExtensionItem({ ext }: { ext: ChromeExtension }) {
  const installHref = ext.webStoreUrl ?? ext.repo;
  const installLabel = ext.webStoreUrl ? 'Chrome에 추가' : '소스에서 설치';

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

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href={installHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-sm border border-dot-accent bg-dot-accent px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-white transition hover:bg-dot-accent/90"
          >
            <ChromeIcon />
            {installLabel}
          </a>
          {ext.webStoreUrl ? (
            <a
              href={ext.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm border border-dot-border/60 bg-white/70 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-dot-sub transition hover:border-dot-accent/50 hover:text-dot-accent"
            >
              GitHub
              <ExternalLinkIcon />
            </a>
          ) : (
            <span className="text-[10px] font-mono tracking-wide text-dot-muted">
              Web Store 등록 준비 중
            </span>
          )}
        </div>

        {!ext.webStoreUrl && (
          <div className="space-y-2.5 rounded-sm border border-dot-border/40 bg-white/50 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-amber-400/60 bg-amber-50 text-[8px]">
                !
              </span>
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-dot-sub">
                Chrome은 Web Store 외 익스텐션을 개발자 모드로만 설치할 수 있습니다
              </p>
            </div>
            <ol className="space-y-1.5 text-[11px] leading-relaxed text-dot-sub">
              <li className="flex items-start gap-2">
                <span className="font-mono text-dot-muted/60">1.</span>
                <span>
                  위 버튼으로 GitHub에서{' '}
                  <code className="rounded bg-dot-border/30 px-1 py-0.5 text-[10px]">Code → Download ZIP</code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-dot-muted/60">2.</span>
                <span>
                  Chrome 주소창에{' '}
                  <code className="rounded bg-dot-border/30 px-1 py-0.5 text-[10px]">
                    chrome://extensions
                  </code>{' '}
                  입력
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-dot-muted/60">3.</span>
                <span>
                  우측 상단{' '}
                  <code className="rounded bg-dot-border/30 px-1 py-0.5 text-[10px]">개발자 모드</code>{' '}
                  토글 ON
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-dot-muted/60">4.</span>
                <span>
                  <code className="rounded bg-dot-border/30 px-1 py-0.5 text-[10px]">압축해제된 확장 프로그램을 로드합니다</code>{' '}
                  → ZIP 해제한 폴더 선택
                </span>
              </li>
            </ol>
          </div>
        )}
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
