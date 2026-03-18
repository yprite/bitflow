import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getPublisherId(): string {
  const raw = (
    process.env.GOOGLE_ADSENSE_PUBLISHER_ID ??
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID ??
    ''
  ).trim();

  if (!raw) {
    return '';
  }

  return raw.startsWith('pub-') ? raw : `pub-${raw}`;
}

export function GET() {
  const publisherId = getPublisherId();

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
