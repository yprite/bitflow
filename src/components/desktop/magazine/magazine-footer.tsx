import Link from 'next/link';

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
    <section className="magazine-full-bleed border-t border-dot-border py-12">
      <div className="magazine-content space-y-8">
        <div className="flex gap-8">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="group">
              <div className="text-[11px] text-dot-muted">{link.sublabel}</div>
              <div className="text-[14px] font-bold text-dot-text group-hover:text-dot-accent">
                {link.label}
              </div>
            </Link>
          ))}
        </div>
        <div className="flex gap-6 text-[11px] text-dot-muted">
          <Link href="/desktop/about" className="hover:text-dot-text">소개</Link>
          <Link href="/desktop/contact" className="hover:text-dot-text">문의</Link>
          <Link href="/desktop/disclaimer" className="hover:text-dot-text">면책</Link>
          <Link href="/desktop/privacy" className="hover:text-dot-text">개인정보</Link>
        </div>
      </div>
    </section>
  );
}
