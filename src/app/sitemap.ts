import type { MetadataRoute } from 'next';
import { getGlossarySlugs, getIndicatorSlugs } from '@/lib/indicator-content';
import { getSiteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const indicatorUrls: MetadataRoute.Sitemap = getIndicatorSlugs().map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: now,
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  const glossaryUrls: MetadataRoute.Sitemap = getGlossarySlugs().map((slug) => ({
    url: `${baseUrl}/glossary/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticUrls, ...indicatorUrls, ...glossaryUrls];
}
