'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface GuideModalProps {
  title: string;
  intro?: ReactNode;
  children?: ReactNode;
  triggerLabel?: string;
  eyebrow?: string;
  maxWidthClassName?: string;
  showTrigger?: boolean;
  showDismissAction?: boolean;
  triggerClassName?: string;
}

export default function GuideModal({
  title,
  intro,
  children,
  triggerLabel,
  eyebrow,
  maxWidthClassName = 'max-w-4xl',
  showTrigger = true,
  showDismissAction = false,
  triggerClassName,
}: GuideModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleDismissPermanently = () => {
    setOpen(false);
  };

  return (
    <>
      {showTrigger ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={triggerClassName ?? 'inline-flex rounded-sm border border-dot-border/60 bg-white/75 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-dot-sub transition hover:border-dot-accent/50 hover:text-dot-accent'}
          >
            {triggerLabel ?? title}
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-3 py-5 backdrop-blur-[2px]"
          onClick={handleClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`dot-card relative max-h-[calc(100vh-2.5rem)] w-full overflow-hidden ${maxWidthClassName}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-dot-border/60 bg-white/90 px-5 py-4">
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-dot-muted">
                  {eyebrow ?? title}
                </p>
                <h2 className="text-sm font-semibold tracking-tight text-dot-accent">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-[11px] font-mono text-dot-muted transition hover:text-dot-accent"
              >
                닫기
              </button>
            </div>

            <div className="max-h-[calc(100vh-6rem)] overflow-y-auto px-5 py-5">
              <div className="space-y-5">
                {intro ? <div className="text-xs leading-relaxed text-dot-sub">{intro}</div> : null}
                {children}

                <div className="flex items-center justify-end gap-2 border-t border-dot-border/60 pt-4">
                  {showDismissAction ? (
                    <button
                      type="button"
                      onClick={handleDismissPermanently}
                      className="inline-flex rounded-sm border border-dot-border/70 px-3 py-2 text-[11px] font-mono text-dot-sub transition hover:border-dot-accent/40 hover:text-dot-accent"
                    >
                      다시보지않기
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex rounded-sm border border-dot-accent bg-dot-accent px-3 py-2 text-[11px] font-mono text-white transition hover:opacity-90"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
