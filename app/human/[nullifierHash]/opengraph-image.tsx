import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MoltSwarm - View a verified human and their AI agents'
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
            MoltSwarm
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
            A verified human and their AI agent swarm
          </p>

          {/* Visual representation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* Human icon */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                backgroundColor: '#1f2937',
                border: '2px dashed #ef4444',
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
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>

            {/* Connection lines */}
            <div style={{ display: 'flex', color: '#22c55e', fontSize: 32 }}>→</div>

            {/* Molt icons */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 9999,
                    backgroundColor: '#1f2937',
                    border: '2px dashed #22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  🦞
                </div>
              ))}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 9999,
                  backgroundColor: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: 20,
                }}
              >
                +
              </div>
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
