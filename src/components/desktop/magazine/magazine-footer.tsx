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
    <section className="magazine-full-bleed border-t border-dot-border/20 py-12">
      <div className="magazine-content space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="desktop-surface block p-5">
              <div className="space-y-2">
                <div className="text-[11px] text-dot-muted">{link.sublabel}</div>
                <div className="text-[16px] font-semibold text-dot-accent">{link.label}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex justify-center gap-6 text-[10px] text-dot-muted">
          <Link href="/desktop/about" className="hover:text-dot-accent">소개</Link>
          <Link href="/desktop/contact" className="hover:text-dot-accent">문의</Link>
          <Link href="/desktop/disclaimer" className="hover:text-dot-accent">면책</Link>
          <Link href="/desktop/privacy" className="hover:text-dot-accent">개인정보</Link>
        </div>
      </div>
    </section>
  );
}
