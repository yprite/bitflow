export const SITE_NAME = '비트코인 기상청';
export const SITE_ALTERNATE_NAME = 'BitFlow';
export const SITE_REPO_URL = 'https://github.com/yprite/bitflow';
export const SITE_CONTACT_URL = `${SITE_REPO_URL}/issues`;

export function getBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'https://bitflow.kr';

  return configured.startsWith('http') ? configured : `https://${configured}`;
}
