export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://bitflow-tawny.vercel.app';
}
