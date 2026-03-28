import Link from 'next/link';

interface TimelineItemProps {
  href: string;
  title: string;
  subtitle: string;
  isFirst?: boolean;
}

export function TimelineItem({ href, title, subtitle, isFirst = false }: TimelineItemProps) {
  return (
    <div className="relative">
      <div
        className={`absolute -left-[22px] top-[6px] h-[5px] w-[5px] ${
          isFirst ? 'bg-dot-text' : 'bg-dot-border'
        }`}
      />
      <Link href={href} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 group">
        <div>
          <div className="text-[13px] font-semibold text-dot-text transition-colors group-hover:text-dot-accent">
            {title}
          </div>
          <div className="text-[11px] text-dot-sub">{subtitle}</div>
        </div>
        <div className="text-[11px] text-dot-muted group-hover:text-dot-text transition-colors">
          읽기 →
        </div>
      </Link>
    </div>
  );
}
