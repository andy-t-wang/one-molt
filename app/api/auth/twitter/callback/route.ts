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

    // Handle user denial or error
    if (error) {
      console.error('X OAuth error:', error)
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=denied', request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=missing_params', request.url))
    }

    // Get PKCE code verifier and stored state from cookies
    const storedState = request.cookies.get('oauth_state')?.value
    const codeVerifier = request.cookies.get('oauth_verifier')?.value
    const nullifierHash = request.cookies.get('oauth_nullifier')?.value

    if (!codeVerifier || !storedState || storedState !== state) {
      console.error('Invalid state or missing verifier:', { storedState, state, hasVerifier: !!codeVerifier })
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=invalid_state', request.url))
    }

    if (!nullifierHash) {
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=missing_nullifier', request.url))
    }

    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=not_configured', request.url))
    }

    // Build redirect URI - must match EXACTLY what's registered in X developer portal
    const host = request.headers.get('host') || ''
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1')
    const redirectUri = isLocal
      ? 'http://localhost:3000/api/auth/twitter/callback'
      : 'https://onemolt.ai/api/auth/twitter/callback'

    // Exchange code for access token
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', tokenResponse.status, errorData)
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=token_failed', request.url))
    }

    const tokenData = await tokenResponse.json()

    // Get user information
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

    const supabase = getSupabaseAdmin()

    // Check if this Twitter handle is already claimed by someone else
    const { data: existingClaim } = await supabase
      .from('twitter_claims')
      .select('nullifier_hash')
      .eq('twitter_handle', twitterHandle.toLowerCase())
      .single()

    if (existingClaim && existingClaim.nullifier_hash !== nullifierHash) {
      return NextResponse.redirect(new URL('/leaderboard?twitter_error=already_claimed', request.url))
    }

    // Save the Twitter claim
    await supabase
      .from('twitter_claims')
      .upsert({
        nullifier_hash: nullifierHash,
        twitter_handle: twitterHandle.toLowerCase(),
        tweet_url: `https://twitter.com/${twitterHandle}`,
        verification_code: 'oauth',
        claimed_at: new Date().toISOString(),
      }, {
        onConflict: 'nullifier_hash'
      })

    // Create response with redirect and clear cookies
    const response = NextResponse.redirect(
      new URL(`/human/${encodeURIComponent(nullifierHash)}?twitter_connected=true`, request.url)
    )

    // Clear the OAuth cookies
    response.cookies.delete('oauth_state')
    response.cookies.delete('oauth_verifier')
    response.cookies.delete('oauth_nullifier')

    return response
  } catch (error) {
    console.error('X OAuth callback error:', error)
    return NextResponse.redirect(new URL('/leaderboard?twitter_error=internal', request.url))
  }
}
