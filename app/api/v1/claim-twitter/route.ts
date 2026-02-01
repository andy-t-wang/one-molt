// POST /api/v1/claim-twitter
// Associate Twitter handle with nullifier hash via tweet verification

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

interface ClaimRequest {
  nullifierHash: string
  tweetUrl: string
}

// Generate verification code from nullifier (8 char hex)
function generateVerificationCode(nullifierHash: string): string {
  const secret = process.env.TWITTER_CLAIM_SECRET || 'onemolt-twitter-claim'
  const hash = crypto
    .createHmac('sha256', secret)
    .update(nullifierHash)
    .digest('hex')
  return hash.slice(0, 8).toUpperCase()
}

// Extract Twitter handle from tweet URL
function extractHandleFromUrl(url: string): string | null {
  // Matches: twitter.com/HANDLE/status/... or x.com/HANDLE/status/...
  const match = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/\d+/)
  return match ? match[1].toLowerCase() : null
}

// GET - Get verification code for a nullifier, or check existing claim
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nullifierHash = searchParams.get('nullifier')
    const getCode = searchParams.get('code') === 'true'

    if (!nullifierHash) {
      return NextResponse.json(
        { error: 'Missing nullifier parameter' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify this nullifier exists in registrations
    const { data: registration } = await supabase
      .from('registrations')
      .select('nullifier_hash')
      .eq('nullifier_hash', nullifierHash)
      .eq('verified', true)
      .eq('active', true)
      .limit(1)
      .single()

    if (!registration) {
      return NextResponse.json(
        { error: 'Nullifier not found - you must register with OneMolt first' },
        { status: 404 }
      )
    }

    // If requesting verification code, generate it
    if (getCode) {
      const code = generateVerificationCode(nullifierHash)
      const tweetText = `Verifying my OneMolt swarm 🦞 ${code}\n\nhttps://onemolt.ai/leaderboard`
      const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`

      return NextResponse.json({
        verificationCode: code,
        tweetIntentUrl,
      })
    }

    // Otherwise, check for existing claim
    const { data: claim, error } = await supabase
      .from('twitter_claims')
      .select('twitter_handle, claimed_at')
      .eq('nullifier_hash', nullifierHash)
      .single()

    if (error || !claim) {
      return NextResponse.json({ claimed: false })
    }

    return NextResponse.json({
      claimed: true,
      twitterHandle: claim.twitter_handle,
      claimedAt: claim.claimed_at,
    })
  } catch (error) {
    console.error('Twitter claim GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Claim Twitter handle by submitting tweet URL
export async function POST(request: NextRequest) {
  try {
    const body: ClaimRequest = await request.json()

    // Validate request
    if (!body.nullifierHash || !body.tweetUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: nullifierHash, tweetUrl' },
        { status: 400 }
      )
    }

    // Extract handle from tweet URL
    const handle = extractHandleFromUrl(body.tweetUrl)
    if (!handle) {
      return NextResponse.json(
        { error: 'Invalid tweet URL format. Please paste the full URL of your verification tweet.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify this nullifier exists in registrations
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('nullifier_hash')
      .eq('nullifier_hash', body.nullifierHash)
      .eq('verified', true)
      .eq('active', true)
      .limit(1)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Nullifier not found - you must register with OneMolt first' },
        { status: 403 }
      )
    }

    // Check if this Twitter handle is already claimed by someone else
    const { data: existingClaim } = await supabase
      .from('twitter_claims')
      .select('nullifier_hash')
      .eq('twitter_handle', handle)
      .single()

    if (existingClaim && existingClaim.nullifier_hash !== body.nullifierHash) {
      return NextResponse.json(
        { error: 'This Twitter handle is already claimed by another human' },
        { status: 409 }
      )
    }

    // Store the verification code for reference
    const verificationCode = generateVerificationCode(body.nullifierHash)

    // Upsert the Twitter claim
    const { error: upsertError } = await supabase
      .from('twitter_claims')
      .upsert(
        {
          nullifier_hash: body.nullifierHash,
          twitter_handle: handle,
          tweet_url: body.tweetUrl,
          verification_code: verificationCode,
          claimed_at: new Date().toISOString(),
        },
        {
          onConflict: 'nullifier_hash',
        }
      )

    if (upsertError) {
      console.error('Error upserting Twitter claim:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save Twitter claim' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      twitterHandle: handle,
      nullifierHash: body.nullifierHash,
    })
  } catch (error) {
    console.error('Twitter claim POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
