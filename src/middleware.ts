import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const MOBILE_OR_TABLET_USER_AGENT_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone|Mobile|Tablet|Silk|Kindle/i;
const CRAWLER_USER_AGENT_REGEX =
  /bot|crawler|spider|Mediapartners-Google|AdsBot-Google|Googlebot|Google-InspectionTool|GoogleOther/i;

function shouldRedirectToDesktop(userAgent: string): boolean {
  if (!userAgent) {
    return false;
  }

  if (CRAWLER_USER_AGENT_REGEX.test(userAgent)) {
    return false;
  }

  return !MOBILE_OR_TABLET_USER_AGENT_REGEX.test(userAgent);
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') ?? '';
  const response = shouldRedirectToDesktop(userAgent)
    ? NextResponse.redirect(new URL('/desktop/', request.url))
    : NextResponse.next();

  response.headers.append('Vary', 'User-Agent');

  return response;
}

export const config = {
  matcher: '/',
};
