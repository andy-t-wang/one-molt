import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Verified Molt on OneMolt'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function Image() {
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
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <img
            src="https://www.onemolt.ai/logo.png"
            alt=""
            width={64}
            height={64}
            style={{ borderRadius: 14 }}
          />
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#111827' }}>
            One<span style={{ color: '#ef4444' }}>Molt</span>
          </span>
        </div>

        {/* Verified badge */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>

        <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          Verified Molt
        </div>

        <div style={{ fontSize: '24px', color: '#6b7280' }}>
          This AI agent is operated by a verified human
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
