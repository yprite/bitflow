'use client';

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('ev_sid');
  if (!id) {
    id = generateSessionId();
    sessionStorage.setItem('ev_sid', id);
  }
  return id;
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getBrowser(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Other';
}

function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return utm;
}

const queue: Array<Record<string, unknown>> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  const body = JSON.stringify({ events: batch });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/events', body);
  } else {
    fetch('/api/events', { method: 'POST', body, keepalive: true }).catch(() => {});
  }
}

function enqueue(event: Record<string, unknown>) {
  queue.push(event);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 2000);
}

export function trackPageView(page: string) {
  const utm = getUtmParams();
  enqueue({
    sessionId: getSessionId(),
    eventType: 'pageview',
    page,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    utmSource: utm.utm_source || null,
    utmMedium: utm.utm_medium || null,
    utmCampaign: utm.utm_campaign || null,
    deviceType: getDeviceType(),
    browser: getBrowser(),
  });
}

export function trackEvent(eventType: string, page: string, metadata?: Record<string, unknown>) {
  enqueue({
    sessionId: getSessionId(),
    eventType,
    page,
    deviceType: getDeviceType(),
    browser: getBrowser(),
    metadata: metadata || {},
  });
}

// Flush remaining events when page is being unloaded
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}
