import Link from 'next/link';
import { DarkSection } from './dark-section';

interface FooterLink {
  label: string;
  sublabel: string;
  href: string;
}

interface MagazineFooterProps {
  links: FooterLink[];
}

export function MagazineFooter({ links }: MagazineFooterProps) {
  return (
    <DarkSection>
      <div className="flex justify-center items-center gap-8 py-4">
        {links.map((link, i) => (
          <div key={link.href} className="flex items-center gap-8">
            {i > 0 && <div className="w-px h-8 bg-white/10" />}
            <Link
              href={link.href}
              className="text-center group"
            >
              <div className="text-xs text-dot-muted">{link.sublabel}</div>
              <div className="text-base font-bold text-dot-bg group-hover:underline underline-offset-4">
                {link.label}
              </div>
            </Link>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-6 mt-8 text-[10px] text-dot-muted/50">
        <Link href="/desktop/about" className="hover:text-dot-muted">소개</Link>
        <Link href="/desktop/contact" className="hover:text-dot-muted">문의</Link>
        <Link href="/desktop/disclaimer" className="hover:text-dot-muted">면책</Link>
        <Link href="/desktop/privacy" className="hover:text-dot-muted">개인정보</Link>
      </div>
    </DarkSection>
  );
}
