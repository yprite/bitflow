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
        className={`absolute -left-[25px] top-[5px] w-2 h-2 rounded-full ${
          isFirst ? 'bg-dot-text' : 'bg-dot-border'
        }`}
      />
      <Link href={href} className="flex justify-between items-baseline group">
        <div>
          <div className="text-[13px] font-semibold text-dot-text group-hover:underline">
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
