// GET /api/v1/claim-twitter
// Check if a nullifier has claimed a Twitter handle

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Check existing claim status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nullifierHash = searchParams.get('nullifier')

    if (!nullifierHash) {
      return NextResponse.json(
        { error: 'Missing nullifier parameter' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check for existing claim
    const { data: claim } = await supabase
      .from('twitter_claims')
      .select('twitter_handle, claimed_at')
      .eq('nullifier_hash', nullifierHash)
      .single()

    if (claim) {
      return NextResponse.json({
        claimed: true,
        twitterHandle: claim.twitter_handle,
        claimedAt: claim.claimed_at,
      })
    }

    return NextResponse.json({
      claimed: false,
    })
  } catch (error) {
    console.error('Twitter claim GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
