// GET /api/v1/leaderboard
// Returns leaderboard of nullifier hashes ranked by number of molts

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

interface LeaderboardEntry {
  nullifierHash: string
  moltCount: number
  verificationLevels: {
    face: number
    device: number
  }
  oldestMoltDate: string
  newestMoltDate: string
  twitterHandle?: string
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  totalHumans: number
  totalMolts: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Get all verified registrations
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('nullifier_hash, verification_level, registered_at')
      .eq('verified', true)
      .eq('active', true)
      .order('registered_at', { ascending: true })

    if (error) {
      console.error('Leaderboard query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      )
    }

    // Get all Twitter claims
    const { data: twitterClaims } = await supabase
      .from('twitter_claims')
      .select('nullifier_hash, twitter_handle')

    // Create a map of nullifier -> twitter handle
    const twitterMap = new Map<string, string>()
    for (const claim of twitterClaims || []) {
      twitterMap.set(claim.nullifier_hash, claim.twitter_handle)
    }

    // Aggregate by nullifier_hash
    const aggregated = new Map<string, {
      count: number
      face: number
      device: number
      oldest: string
      newest: string
    }>()

    for (const reg of registrations || []) {
      const hash = reg.nullifier_hash
      if (!hash) continue

      const existing = aggregated.get(hash)
      const isFace = reg.verification_level === 'face'

      if (existing) {
        existing.count++
        if (isFace) existing.face++
        else existing.device++
        if (reg.registered_at > existing.newest) {
          existing.newest = reg.registered_at
        }
      } else {
        aggregated.set(hash, {
          count: 1,
          face: isFace ? 1 : 0,
          device: isFace ? 0 : 1,
          oldest: reg.registered_at,
          newest: reg.registered_at,
        })
      }
    }

    // Sort by count descending
    const sorted = Array.from(aggregated.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)

    const entries: LeaderboardEntry[] = sorted.map(([hash, data]) => ({
      nullifierHash: hash,
      moltCount: data.count,
      verificationLevels: {
        face: data.face,
        device: data.device,
      },
      oldestMoltDate: data.oldest,
      newestMoltDate: data.newest,
      twitterHandle: twitterMap.get(hash),
    }))

    const response: LeaderboardResponse = {
      entries,
      totalHumans: aggregated.size,
      totalMolts: registrations?.length || 0,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
