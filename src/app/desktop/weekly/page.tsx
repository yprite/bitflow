import DesktopWeeklyMagazine from '@/components/desktop/desktop-weekly-magazine';
import { fetchLatestWeeklyReport, fetchWeeklyReportArchive } from '@/lib/weekly-reports';

export default async function DesktopWeeklyPage() {
  const [report, archive] = await Promise.all([
    fetchLatestWeeklyReport(),
    fetchWeeklyReportArchive(12),
  ]);

  return <DesktopWeeklyMagazine report={report} archive={archive} />;
}
