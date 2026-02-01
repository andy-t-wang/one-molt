// GET /api/auth/twitter
// Initiates Twitter OAuth 2.0 flow with PKCE

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Generate PKCE code verifier and challenge
function generateCodeChallenge() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  return { codeVerifier, codeChallenge }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nullifierHash = searchParams.get('nullifier')

    if (!nullifierHash) {
      return NextResponse.redirect(new URL('/?error=missing_nullifier', request.url))
    }

    const clientId = process.env.TWITTER_CLIENT_ID
    if (!clientId) {
      return NextResponse.redirect(new URL('/?error=twitter_not_configured', request.url))
    }

    // Generate PKCE codes
    const { codeVerifier, codeChallenge } = generateCodeChallenge()
    const state = crypto.randomBytes(32).toString('hex')

    // Build redirect URI - must match EXACTLY what's registered in X developer portal
    const host = request.headers.get('host') || ''
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1')
    const redirectUri = isLocal
      ? 'http://localhost:3000/api/auth/twitter/callback'
      : 'https://onemolt.ai/api/auth/twitter/callback'

    // Twitter OAuth 2.0 authorization URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('client_id', clientId)
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append('scope', 'tweet.read users.read')
    authUrl.searchParams.append('state', state)
    authUrl.searchParams.append('code_challenge', codeChallenge)
    authUrl.searchParams.append('code_challenge_method', 'S256')

    // Create response with redirect
    const response = NextResponse.redirect(authUrl.toString())

    // Store PKCE code verifier, state, and nullifier in secure cookies
    const isProduction = !isLocal

    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
    })

    response.cookies.set('oauth_verifier', codeVerifier, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 10 * 60,
    })

    response.cookies.set('oauth_nullifier', nullifierHash, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 10 * 60,
    })

    return response
  } catch (error) {
    console.error('Error starting X OAuth 2.0:', error)
    return NextResponse.redirect(new URL('/?error=oauth_init_failed', request.url))
  }
}
