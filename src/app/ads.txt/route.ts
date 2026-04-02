import { NextResponse } from 'next/server';
import { getGoogleAdSensePublisherId } from '@/lib/site';

export const dynamic = 'force-dynamic';

export function GET() {
  const publisherId = getGoogleAdSensePublisherId();

  if (!publisherId) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new NextResponse(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
