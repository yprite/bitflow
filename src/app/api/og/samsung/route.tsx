import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const BADGE_DISPLAY: Record<string, { emoji: string; text: string }> = {
  overwhelming_bull: { emoji: '🐂', text: '압도적 강세' },
  overwhelming_bear: { emoji: '🐻', text: '압도적 약세' },
  tight_battle: { emoji: '⚔️', text: '팽팽한 접전' },
  flip: { emoji: '🔄', text: '반전 발생' },
  surge: { emoji: '⚡', text: '급변 감지' },
}

function asNumber(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = parseFloat(value)
  return isNaN(parsed) ? fallback : parsed
}

function asString(value: string | null, fallback: string): string {
  if (!value || value.trim().length === 0) return fallback
  return value
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const bullRatio = asNumber(searchParams.get('bullRatio'), 0.5)
  const totalCount = asNumber(searchParams.get('totalCount'), 0)
  const badge = asString(searchParams.get('badge'), '')

  const bullPercent = Math.round(bullRatio * 100)
  const bearPercent = 100 - bullPercent
  const bullWidth = Math.max(bullPercent, 5)
  const bearWidth = Math.max(bearPercent, 5)

  const badgeInfo = BADGE_DISPLAY[badge] ?? null
  const participantText = totalCount > 0
    ? `${totalCount}명 참여 중`
    : '아직 전장이 열리지 않았습니다'

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
            <div style={{ fontSize: 32, letterSpacing: 2, color: '#94a3b8' }}>
              삼성전자 BULL vs BEAR
            </div>
            {badgeInfo && (
              <div
                style={{
                  fontSize: 28,
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.4)',
                  color: '#e5e7eb',
                  padding: '8px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{badgeInfo.emoji}</span>
                <span>{badgeInfo.text}</span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: 40,
              fontSize: 72,
              fontWeight: 700,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#3b82f6', fontSize: 36 }}>BULL 🐂</span>
              <span style={{ color: '#3b82f6' }}>{bullPercent}%</span>
            </div>
            <div style={{ fontSize: 40, color: '#64748b' }}>vs</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#ef4444', fontSize: 36 }}>BEAR 🐻</span>
              <span style={{ color: '#ef4444' }}>{bearPercent}%</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 48,
              borderRadius: 24,
              overflow: 'hidden',
              marginTop: 36,
              border: '1px solid rgba(148,163,184,0.2)',
            }}
          >
            <div
              style={{
                width: `${bullWidth}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
                display: 'flex',
              }}
            />
            <div
              style={{
                width: `${bearWidth}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ef4444, #b91c1c)',
                display: 'flex',
              }}
            />
          </div>

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 24,
            }}
          >
            <span style={{ color: '#94a3b8' }}>{participantText}</span>
            <span style={{ color: '#cbd5e1', letterSpacing: 1.2 }}>bitflow.kr</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
