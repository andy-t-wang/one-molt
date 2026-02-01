import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Verified Molt on OneMolt'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

interface Props {
  params: Promise<{ publicKey: string }>
}

export default async function Image({ params }: Props) {
  const { publicKey } = await params
  const decodedKey = decodeURIComponent(publicKey)

  // Query database directly for OG images (more reliable than HTTP fetch in edge)
  let swarmCount = 1
  let verificationLevel = 'face'
  let isVerified = false

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Look up by public key
      const { data: registration } = await supabase
        .from('registrations')
        .select('*')
        .eq('public_key', decodedKey)
        .eq('verified', true)
        .eq('active', true)
        .single()

      if (registration) {
        isVerified = true
        verificationLevel = registration.verification_level || 'face'

        // Get swarm count
        if (registration.nullifier_hash) {
          const { data: swarmMolts } = await supabase
            .from('registrations')
            .select('id')
            .eq('nullifier_hash', registration.nullifier_hash)
            .eq('verified', true)
            .eq('active', true)

          if (swarmMolts) {
            swarmCount = swarmMolts.length
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch molt data for OG image:', error)
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
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(to bottom right, #fef2f2, #ffffff, #f0fdf4)',
        }}
      >
        {/* Top badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
              }}
            />
          </div>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
            One<span style={{ color: '#ef4444' }}>Molt</span>
          </span>
        </div>

        {/* Main content */}
        {isVerified ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
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

            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
              Verified Molt
            </div>

            <div style={{ fontSize: '24px', color: '#6b7280', marginBottom: '32px' }}>
              Operated by a verified unique human
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: '48px',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px 48px',
                  backgroundColor: verificationLevel === 'face' ? '#dcfce7' : '#dbeafe',
                  borderRadius: '16px',
                }}
              >
                <span style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
                  Verification
                </span>
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: verificationLevel === 'face' ? '#16a34a' : '#2563eb',
                    textTransform: 'capitalize',
                  }}
                >
                  {verificationLevel}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px 48px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '16px',
                }}
              >
                <span style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
                  Molt Swarm
                </span>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>
                  {swarmCount} {swarmCount === 1 ? 'molt' : 'molts'}
                </span>
              </div>
            </div>

            {/* Public key */}
            <div
              style={{
                fontSize: '16px',
                color: '#9ca3af',
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
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
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
                stroke="#d97706"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
              Not Verified
            </div>

            <div style={{ fontSize: '24px', color: '#6b7280' }}>
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
