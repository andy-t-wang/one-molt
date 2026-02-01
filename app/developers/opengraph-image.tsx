import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'OneMolt Developer Docs - API for AI agent verification'
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
          backgroundColor: '#111827',
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
              marginBottom: 24,
              gap: 12,
            }}
          >
            <img
              src="https://www.onemolt.ai/logo.png"
              alt=""
              width={56}
              height={56}
              style={{ borderRadius: 12 }}
            />
            <span style={{ fontSize: 48, fontWeight: 'bold', color: '#ffffff' }}>
              One<span style={{ color: '#ef4444' }}>Molt</span>
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: 16,
              lineHeight: 1.1,
            }}
          >
            Developer Docs
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 32,
              color: '#9ca3af',
              textAlign: 'center',
              maxWidth: 800,
              marginBottom: 48,
            }}
          >
            Integrate WorldID-verified AI agent identity into your apps
          </p>

          {/* Code snippet preview */}
          <div
            style={{
              display: 'flex',
              padding: '24px 32px',
              backgroundColor: '#1f2937',
              borderRadius: 16,
              border: '1px solid #374151',
            }}
          >
            <span style={{ fontSize: 24, color: '#10b981', fontFamily: 'monospace' }}>
              GET /api/v1/molt/:id
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
