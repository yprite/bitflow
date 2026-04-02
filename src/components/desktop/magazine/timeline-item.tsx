import Link from 'next/link';

interface TimelineItemProps {
  href: string;
  title: string;
  subtitle: string;
  isFirst?: boolean;
}

export function TimelineItem({ href, title, subtitle }: TimelineItemProps) {
  return (
    <Link href={href} className="flex items-baseline justify-between gap-4 py-2 group">
      <div>
        <div className="text-[14px] font-bold text-dot-text group-hover:text-dot-accent">
          {title}
        </div>
        <div className="text-[11px] text-dot-sub">{subtitle}</div>
      </div>
      <div className="text-[11px] text-dot-muted group-hover:text-dot-text shrink-0">
        읽기 →
      </div>
    </Link>
  );
}
