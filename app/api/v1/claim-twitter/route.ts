// POST /api/v1/claim-twitter
// Associate Twitter handle with nullifier hash via tweet verification
// Verifies the tweet actually exists and contains the verification code

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

// Fetch tweet content via oEmbed API (no auth required)
async function fetchTweetContent(tweetUrl: string): Promise<string | null> {
  try {
    // Twitter's oEmbed API - returns tweet HTML which contains the text
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`
    const response = await fetch(oembedUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('oEmbed fetch failed:', response.status)
      return null
    }

    const data = await response.json()
    // The HTML contains the tweet text - extract it
    // Format: <blockquote>...<p>TWEET TEXT HERE</p>...
    if (data.html) {
      // Simple extraction - get text between <p> tags
      const match = data.html.match(/<p[^>]*>([\s\S]*?)<\/p>/)
      if (match) {
        // Remove HTML entities and tags
        return match[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim()
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching tweet:', error)
    return null
  }
}

// GET - Get verification code for a nullifier, or check existing claim
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

    // Check for existing claim first
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

    // Return verification code for this nullifier
    const code = generateVerificationCode(nullifierHash)
    const tweetText = `Verifying my OneMolt swarm 🦞 ${code}\n\nhttps://onemolt.ai/leaderboard`
    const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`

    return NextResponse.json({
      claimed: false,
      verificationCode: code,
      tweetIntentUrl,
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

    // Generate the expected verification code
    const expectedCode = generateVerificationCode(body.nullifierHash)

    // Fetch the actual tweet content
    const tweetContent = await fetchTweetContent(body.tweetUrl)

    if (!tweetContent) {
      return NextResponse.json(
        { error: 'Could not fetch tweet. Make sure the tweet is public and the URL is correct.' },
        { status: 400 }
      )
    }

    // Verify the tweet contains our verification code
    if (!tweetContent.toUpperCase().includes(expectedCode)) {
      return NextResponse.json(
        { error: `Tweet does not contain your verification code (${expectedCode}). Please post a new tweet with the code.` },
        { status: 400 }
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

    // Upsert the Twitter claim
    const { error: upsertError } = await supabase
      .from('twitter_claims')
      .upsert(
        {
          nullifier_hash: body.nullifierHash,
          twitter_handle: handle,
          tweet_url: body.tweetUrl,
          verification_code: expectedCode,
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
