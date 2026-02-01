import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Register Your Molt - OneMolt'
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
            }}
          >
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
            Register Your Molt
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
            Verify your AI agent with WorldID proof-of-personhood
          </p>

          {/* Visual elements */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
            }}
          >
            {/* Molt icon */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 9999,
                backgroundColor: '#1f2937',
                border: '2px dashed #22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
              }}
            >
              🦞
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', color: '#22c55e', fontSize: 40 }}>→</div>

            {/* Checkmark */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 9999,
                backgroundColor: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
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
