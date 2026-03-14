import { NextRequest, NextResponse } from 'next/server';
import { hasSupabaseServiceConfig, createServiceClient } from '@/lib/supabase';

function normalizeSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim().replace(/^['"]+|['"]+$/g, '') || null;
}

function isAuthorized(req: NextRequest): boolean {
  const expected = normalizeSecret(process.env.ADMIN_SECRET);
  const token = normalizeSecret(
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  );

  if (!expected || !token) return false;
  return token === expected;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasSupabaseServiceConfig()) {
    return NextResponse.json({ error: 'No database configured' }, { status: 503 });
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const days = Math.min(Number(searchParams.get('days') || '30'), 90);
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  // Run all queries in parallel
  const [
    dailyPageviews,
    growthOverview,
    landingPageBreakdown,
    acquisitionBreakdown,
    pageBreakdown,
    referrerBreakdown,
    deviceBreakdown,
    browserBreakdown,
    featureUsage,
    utmBreakdown,
    recentSessions,
    totalCounts,
  ] = await Promise.all([
    // 1. Daily pageview counts
    supabase.rpc('get_daily_pageviews', { since_date: since }).then((r) => r.data || []),

    // 2. Session-level growth overview
    supabase.rpc('get_growth_overview', { since_date: since }).then((r) => r.data?.[0] || null),

    // 3. Landing page performance
    supabase.rpc('get_landing_page_breakdown', { since_date: since }).then((r) => r.data || []),

    // 4. Acquisition channel performance
    supabase.rpc('get_acquisition_breakdown', { since_date: since }).then((r) => r.data || []),

    // 5. Page breakdown
    supabase.rpc('get_page_breakdown', { since_date: since }).then((r) => r.data || []),

    // 6. Top referrers
    supabase.rpc('get_referrer_breakdown', { since_date: since }).then((r) => r.data || []),

    // 7. Device breakdown
    supabase.rpc('get_device_breakdown', { since_date: since }).then((r) => r.data || []),

    // 8. Browser breakdown
    supabase.rpc('get_browser_breakdown', { since_date: since }).then((r) => r.data || []),

    // 9. Feature usage (non-pageview events)
    supabase.rpc('get_feature_usage', { since_date: since }).then((r) => r.data || []),

    // 10. UTM source breakdown
    supabase.rpc('get_utm_breakdown', { since_date: since }).then((r) => r.data || []),

    // 11. Recent unique sessions (last 24h)
    supabase
      .from('events')
      .select('session_id, page, device_type, browser, created_at')
      .gte('created_at', new Date(Date.now() - 86400_000).toISOString())
      .eq('event_type', 'pageview')
      .order('created_at', { ascending: false })
      .limit(100)
      .then((r) => r.data || []),

    // 12. Total counts
    supabase.rpc('get_event_totals', { since_date: since }).then((r) => r.data?.[0] || null),
  ]);

  return NextResponse.json({
    period: { days, since },
    totals: totalCounts,
    dailyPageviews,
    growthOverview,
    landingPageBreakdown,
    acquisitionBreakdown,
    pageBreakdown,
    referrerBreakdown,
    deviceBreakdown,
    browserBreakdown,
    featureUsage,
    utmBreakdown,
    recentSessions,
  });
}
