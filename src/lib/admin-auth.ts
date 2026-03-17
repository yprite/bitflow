import type { NextRequest } from 'next/server';

function normalizeSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim().replace(/^['"]+|['"]+$/g, '') || null;
}

export function isAuthorizedAdminRequest(req: NextRequest): boolean {
  const expected = normalizeSecret(process.env.ADMIN_SECRET);
  const token = normalizeSecret(
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  );

  if (!expected || !token) return false;
  return token === expected;
}
