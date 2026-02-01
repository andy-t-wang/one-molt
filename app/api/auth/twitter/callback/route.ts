// GET /api/auth/twitter/callback
// Handles Twitter OAuth callback, gets username, links to nullifier

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle user denial
    if (error) {
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=denied', request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=missing_params', request.url))
    }

    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=not_configured', request.url))
    }

    const supabase = getSupabaseAdmin()

    // Look up OAuth state
    const { data: oauthState } = await supabase
      .from('twitter_oauth_states')
      .select('*')
      .eq('state', state)
      .single()

    if (!oauthState) {
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=invalid_state', request.url))
    }

    // Check expiration
    if (new Date(oauthState.expires_at) < new Date()) {
      await supabase.from('twitter_oauth_states').delete().eq('state', state)
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=expired', request.url))
    }

    // Exchange code for token
    const baseUrl = request.headers.get('host') || 'onemolt.ai'
    const protocol = baseUrl.includes('localhost') ? 'http' : 'https'
    const redirectUri = `${protocol}://${baseUrl}/api/auth/twitter/callback`

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: oauthState.code_verifier,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=token_failed', request.url))
    }

    const tokenData = await tokenResponse.json()

    // Get user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('User fetch failed:', await userResponse.text())
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=user_failed', request.url))
    }

    const userData = await userResponse.json()
    const twitterHandle = userData.data.username

    // Check if this Twitter handle is already claimed by someone else
    const { data: existingClaim } = await supabase
      .from('twitter_claims')
      .select('nullifier_hash')
      .eq('twitter_handle', twitterHandle.toLowerCase())
      .single()

    if (existingClaim && existingClaim.nullifier_hash !== oauthState.nullifier_hash) {
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=already_claimed', request.url))
    }

    // Save the Twitter claim
    await supabase
      .from('twitter_claims')
      .upsert({
        nullifier_hash: oauthState.nullifier_hash,
        twitter_handle: twitterHandle.toLowerCase(),
        tweet_url: `https://twitter.com/${twitterHandle}`,
        verification_code: 'oauth',
        claimed_at: new Date().toISOString(),
      }, {
        onConflict: 'nullifier_hash'
      })

    // Clean up OAuth state
    await supabase.from('twitter_oauth_states').delete().eq('state', state)

    // Redirect to their swarm page
    return NextResponse.redirect(
      new URL(`/human/${encodeURIComponent(oauthState.nullifier_hash)}?twitter_connected=true`, request.url)
    )
  } catch (error) {
    console.error('Twitter OAuth callback error:', error)
    return NextResponse.redirect(new URL('/leaderboard?twitter_error=internal', request.url))
  }
}
