import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const revalidate = 3600; // ISR: 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const metricName = searchParams.get('metric');
  const days = parseInt(searchParams.get('days') || '7', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '168', 10), 1000);

  try {
    const supabase = createServiceClient();

    const since = new Date();
    since.setDate(since.getDate() - days);

    let query = supabase
      .from('onchain_metrics')
      .select('collected_at, metric_name, value, resolution, metadata')
      .gte('collected_at', since.toISOString())
      .order('collected_at', { ascending: false })
      .limit(limit);

    if (metricName) {
      query = query.eq('metric_name', metricName);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      meta: {
        count: data?.length || 0,
        since: since.toISOString(),
        fetched_at: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
