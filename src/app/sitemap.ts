import type { MetadataRoute } from 'next';
import { fetchWeeklyReportArchive } from '@/lib/weekly-reports';
import { getBaseUrl } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();
  const highPriorityRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  }> = [
    { path: '', priority: 1, changeFrequency: 'always' as const },
    { path: '/realtime', priority: 0.9, changeFrequency: 'always' as const },
    { path: '/weekly', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/indicators', priority: 0.9, changeFrequency: 'always' as const },
    { path: '/tools', priority: 0.8, changeFrequency: 'always' as const },
    { path: '/alert', priority: 0.6, changeFrequency: 'monthly' as const },
  ];
  const trustRoutes = [
    { path: '/about', priority: 0.7 },
    { path: '/contact', priority: 0.6 },
    { path: '/privacy', priority: 0.5 },
    { path: '/disclaimer', priority: 0.5 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of highPriorityRoutes) {
    entries.push({
      url: `${baseUrl}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  for (const route of trustRoutes) {
    entries.push({
      url: `${baseUrl}${route.path}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: route.priority,
    });
  }

  const weeklyArchive = await fetchWeeklyReportArchive(52).catch(() => []);
  for (const item of weeklyArchive) {
    const lastModified = new Date(item.publishedAt);
    entries.push({
      url: `${baseUrl}/weekly/${item.slug}`,
      lastModified: Number.isNaN(lastModified.getTime()) ? now : lastModified,
      changeFrequency: 'weekly',
      priority: 0.65,
    });
  }

  return entries;
}
