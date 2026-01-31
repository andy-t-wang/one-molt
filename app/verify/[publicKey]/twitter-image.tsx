import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Verified Molt on OneMolt'
export const size = {
  width: 1200,
  height: 600,
}
export const contentType = 'image/png'

interface Props {
  params: Promise<{ publicKey: string }>
}

export default async function Image({ params }: Props) {
  const { publicKey } = await params
  const decodedKey = decodeURIComponent(publicKey)

  // Fetch molt data to get swarm info
  let swarmCount = 1
  let verificationLevel = 'orb'
  let isVerified = false

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const response = await fetch(
      `${baseUrl}/api/v1/molt/${encodeURIComponent(decodedKey)}`,
      { cache: 'no-store' }
    )
    const moltData = await response.json()

    if (moltData.verified && moltData.worldId?.verified) {
      isVerified = true
      verificationLevel = moltData.worldId.verificationLevel || 'orb'

      // Fetch swarm count if we have nullifier hash
      if (moltData.worldId.nullifierHash) {
        const swarmResponse = await fetch(
          `${baseUrl}/api/v1/molt/${encodeURIComponent(moltData.worldId.nullifierHash)}`,
          { cache: 'no-store' }
        )
        const swarmData = await swarmResponse.json()
        if (swarmData.queryType === 'nullifier_hash' && swarmData.molts) {
          swarmCount = swarmData.molts.length
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch molt data for Twitter image:', error)
  }

  const truncatedKey = decodedKey.length > 24
    ? `${decodedKey.slice(0, 12)}...${decodedKey.slice(-12)}`
    : decodedKey

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
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
              }}
            />
          </div>
          <span style={{ fontSize: '40px', fontWeight: 'bold', color: '#ffffff' }}>
            One<span style={{ color: '#ef4444' }}>Molt</span>
          </span>
        </div>

        {isVerified ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Verified check */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffffff' }}>
                Verified Molt
              </span>
            </div>

            <div style={{ fontSize: '24px', color: '#9ca3af', marginBottom: '40px' }}>
              Operated by a verified unique human
            </div>

            {/* Stats row */}
            <div
              style={{
                display: 'flex',
                gap: '32px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 32px',
                  backgroundColor: '#1f2937',
                  borderRadius: '12px',
                  border: '2px solid #374151',
                }}
              >
                <span style={{ fontSize: '20px', color: '#9ca3af' }}>Level:</span>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: verificationLevel === 'orb' ? '#22c55e' : '#3b82f6',
                    textTransform: 'capitalize',
                  }}
                >
                  {verificationLevel}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 32px',
                  backgroundColor: '#1f2937',
                  borderRadius: '12px',
                  border: '2px solid #374151',
                }}
              >
                <span style={{ fontSize: '20px', color: '#9ca3af' }}>Swarm:</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {swarmCount} {swarmCount === 1 ? 'molt' : 'molts'}
                </span>
              </div>
            </div>

            {/* Public key */}
            <div
              style={{
                marginTop: '32px',
                fontSize: '16px',
                color: '#6b7280',
                fontFamily: 'monospace',
              }}
            >
              {truncatedKey}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '16px' }}>
              Not Verified
            </div>
            <div style={{ fontSize: '24px', color: '#9ca3af' }}>
              This molt is not registered with OneMolt
            </div>
          </div>
        )}
      </div>
    ),
    {
      ...size,
    }
  )
}
