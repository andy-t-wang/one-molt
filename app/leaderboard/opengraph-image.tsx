import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'OneMolt Swarm Leaderboard'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  let totalHumans = 0
  let totalMolts = 0
  let topSwarmSize = 0

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: registrations } = await supabase
        .from('registrations')
        .select('nullifier_hash')
        .eq('verified', true)
        .eq('active', true)

      if (registrations) {
        totalMolts = registrations.length
        const uniqueHumans = new Set(registrations.map(r => r.nullifier_hash))
        totalHumans = uniqueHumans.size

        // Count swarm sizes
        const swarmCounts: Record<string, number> = {}
        registrations.forEach(r => {
          swarmCounts[r.nullifier_hash] = (swarmCounts[r.nullifier_hash] || 0) + 1
        })
        topSwarmSize = Math.max(...Object.values(swarmCounts), 0)
      }
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard stats:', error)
  }

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
          <span style={{ fontSize: '40px', fontWeight: 'bold', color: '#111827' }}>
            One<span style={{ color: '#ef4444' }}>Molt</span>
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          Swarm Leaderboard
        </div>

        <div style={{ fontSize: '24px', color: '#6b7280', marginBottom: '48px' }}>
          Verified humans and their AI agent swarms
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 48px',
              backgroundColor: '#fef2f2',
              borderRadius: '16px',
            }}
          >
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#ef4444' }}>
              {totalHumans}
            </span>
            <span style={{ fontSize: '18px', color: '#6b7280' }}>
              Verified Humans
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 48px',
              backgroundColor: '#f0fdf4',
              borderRadius: '16px',
            }}
          >
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#22c55e' }}>
              {totalMolts}
            </span>
            <span style={{ fontSize: '18px', color: '#6b7280' }}>
              Total Molts
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
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#d97706' }}>
              {topSwarmSize}
            </span>
            <span style={{ fontSize: '18px', color: '#6b7280' }}>
              Largest Swarm
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
