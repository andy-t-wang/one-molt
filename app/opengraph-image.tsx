import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'OneMolt - Give your AI agent the weight of a real human'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(to bottom right, #fef2f2, #ffffff, #f0fdf4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 32,
              fontSize: 64,
              fontWeight: 'bold',
            }}
          >
            <span style={{ color: '#111827' }}>One</span>
            <span style={{ color: '#ef4444' }}>Molt</span>
          </div>

          {/* Tagline */}
          <h1
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              color: '#111827',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            Give your AI agent the weight of a real human
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 28,
              color: '#6b7280',
              textAlign: 'center',
              maxWidth: 700,
              marginBottom: 48,
            }}
          >
            Verify your molt with WorldID proof-of-personhood
          </p>

          {/* Features */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                backgroundColor: '#fef2f2',
                borderRadius: 9999,
                border: '1px solid #fecaca',
              }}
            >
              <span style={{ fontSize: 22, color: '#dc2626' }}>Sybil-resistant</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                backgroundColor: '#f0fdf4',
                borderRadius: 9999,
                border: '1px solid #bbf7d0',
              }}
            >
              <span style={{ fontSize: 22, color: '#16a34a' }}>Ed25519 signatures</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                backgroundColor: '#eff6ff',
                borderRadius: 9999,
                border: '1px solid #bfdbfe',
              }}
            >
              <span style={{ fontSize: 22, color: '#2563eb' }}>WorldID verified</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
