import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

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

  // Query database directly for Twitter images (more reliable than HTTP fetch in edge)
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
                    color: verificationLevel === 'face' ? '#22c55e' : '#3b82f6',
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
