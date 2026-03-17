'use client';

interface AdminLoginPanelProps {
  title: string;
  error?: string;
  secret: string;
  onSecretChange: (value: string) => void;
  onSubmit: () => void;
}

interface AdminLoadingPanelProps {
  title: string;
  description: string;
}

export function AdminLoginPanel({
  title,
  error,
  secret,
  onSecretChange,
  onSubmit,
}: AdminLoginPanelProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="dot-card p-6 w-full max-w-xs space-y-4 dot-entrance dot-grid-sparse">
        <h1 className="text-xs font-semibold text-dot-accent uppercase tracking-wider text-center">
          {title}
        </h1>
        {error ? <p className="text-dot-red text-xs text-center">{error}</p> : null}
        <input
          type="password"
          value={secret}
          onChange={(event) => onSecretChange(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onSubmit()}
          placeholder="관리자 비밀키"
          className="w-full border border-dot-border px-3 py-2 text-xs focus:border-dot-accent outline-none font-mono bg-white"
        />
        <button
          onClick={onSubmit}
          className="w-full bg-dot-accent text-white py-2 text-xs font-semibold hover:bg-dot-accent/90 transition font-mono uppercase tracking-wider"
        >
          로그인
        </button>
      </div>
    </div>
  );
}

export function AdminLoadingPanel({
  title,
  description,
}: AdminLoadingPanelProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="dot-card p-6 w-full max-w-xs space-y-4 dot-entrance dot-grid-sparse text-center">
        <h1 className="text-xs font-semibold text-dot-accent uppercase tracking-wider">
          {title}
        </h1>
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-dot-sub">
          <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-dot-accent" />
          Session Check
        </div>
        <p className="text-xs leading-relaxed text-dot-muted">{description}</p>
      </div>
    </div>
  );
}
