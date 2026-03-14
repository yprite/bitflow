import { NextRequest, NextResponse } from 'next/server';
import { hasSupabaseServiceConfig, createServiceClient } from '@/lib/supabase';

interface IncomingEvent {
  sessionId: string;
  eventType: string;
  page: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType?: string;
  browser?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  if (!hasSupabaseServiceConfig()) {
    return NextResponse.json({ ok: true }); // silently skip if no DB
  }

  try {
    const body = await req.text();
    const { events } = JSON.parse(body) as { events: IncomingEvent[] };

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ ok: true });
    }

    // Limit batch size
    const batch = events.slice(0, 50);

    const rows = batch.map((e) => ({
      session_id: String(e.sessionId || '').slice(0, 100),
      event_type: String(e.eventType || 'unknown').slice(0, 50),
      page: String(e.page || '/').slice(0, 200),
      referrer: e.referrer ? String(e.referrer).slice(0, 500) : null,
      utm_source: e.utmSource ? String(e.utmSource).slice(0, 100) : null,
      utm_medium: e.utmMedium ? String(e.utmMedium).slice(0, 100) : null,
      utm_campaign: e.utmCampaign ? String(e.utmCampaign).slice(0, 100) : null,
      device_type: e.deviceType ? String(e.deviceType).slice(0, 20) : null,
      browser: e.browser ? String(e.browser).slice(0, 50) : null,
      metadata: e.metadata || {},
    }));

    const supabase = createServiceClient();
    await supabase.from('events').insert(rows);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never fail the client
  }
}
