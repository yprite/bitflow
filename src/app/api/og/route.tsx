import { ImageResponse } from 'next/og';

export const runtime = 'edge';

function asString(value: string | null, fallback: string): string {
  if (!value || value.trim().length === 0) return fallback;
  return value;
}

function statusColor(status: string): string {
  if (status === 'accumulation') return '#10b981';
  if (status === 'caution') return '#ef4444';
  if (status === 'neutral') return '#f59e0b';
  return '#94a3b8';
}

function statusLabel(status: string): string {
  if (status === 'accumulation') return '축적 국면';
  if (status === 'caution') return '주의 구간';
  if (status === 'neutral') return '중립';
  return '데이터 부족';
}

function statusEmoji(status: string): string {
  if (status === 'accumulation') return '🟢';
  if (status === 'caution') return '🔴';
  if (status === 'neutral') return '🟡';
  return '⚪';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const status = asString(searchParams.get('status'), 'neutral');
  const netflow = asString(searchParams.get('netflow'), 'N/A');
  const utxo = asString(searchParams.get('utxo'), 'N/A');
  const mempool = asString(searchParams.get('mempool'), 'N/A');
  const fearGreed = asString(searchParams.get('fearGreed'), 'N/A');
  const updatedAt = asString(searchParams.get('updatedAt'), 'N/A');

  const color = statusColor(status);
  const label = statusLabel(status);
  const emoji = statusEmoji(status);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          background:
            'radial-gradient(circle at 0% 0%, rgba(37,99,235,0.35), transparent 40%), radial-gradient(circle at 100% 0%, rgba(234,88,12,0.3), transparent 45%), linear-gradient(180deg, #0b1220 0%, #111827 100%)',
          color: '#e5e7eb',
          padding: '52px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '26px',
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'rgba(15,23,42,0.65)',
            display: 'flex',
            flexDirection: 'column',
            padding: '34px 38px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 28, letterSpacing: 2, color: '#94a3b8' }}>BITFLOW MARKET SNAPSHOT</div>
            <div
              style={{
                fontSize: 34,
                borderRadius: 999,
                border: `1px solid ${color}`,
                color,
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 38, fontSize: 44, fontWeight: 700 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>거래소 넷플로우</span>
              <span>{netflow}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>장기 미이동 비율(7d)</span>
              <span>{utxo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>멤풀 수수료</span>
              <span>{mempool}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>공포/탐욕</span>
              <span>{fearGreed}</span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24 }}>
            <span style={{ color: '#94a3b8' }}>업데이트: {updatedAt}</span>
            <span style={{ color: '#cbd5e1', letterSpacing: 1.2 }}>bitflow.kr</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
