import type { Metadata } from 'next';
import DataProvider from '@/components/data-provider';
import MagazineLayout from '@/components/desktop/magazine/magazine-layout';
import EventTracker from '@/components/event-tracker';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} Desktop`,
    template: `%s | ${SITE_NAME} Desktop`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MagazineLayout>
      <EventTracker />
      <DataProvider>{children}</DataProvider>
    </MagazineLayout>
  );
}
