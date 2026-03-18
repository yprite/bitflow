export const SITE_NAME = '비트코인 기상청';
export const SITE_ALTERNATE_NAME = 'BitFlow';
export const SITE_PRIMARY_DOMAIN = 'bitcoin-weather.com';
export const SITE_BASE_URL = `https://${SITE_PRIMARY_DOMAIN}`;
export const SITE_REPO_URL = 'https://github.com/yprite/bitflow';
export const SITE_CONTACT_URL = `${SITE_REPO_URL}/issues`;
export const SITE_CONTACT_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '').trim();
export const SITE_NAVER_SITE_VERIFICATION = (
  process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ?? ''
).trim();

export function getBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_BASE_URL ?? '').trim();
  const resolved = configured || SITE_BASE_URL;
  const normalized = resolved.startsWith('http') ? resolved : `https://${resolved}`;

  return normalized.replace(/\/+$/, '');
}
