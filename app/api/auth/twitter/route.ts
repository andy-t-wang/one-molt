// GET /api/auth/twitter
// Initiates Twitter OAuth 2.0 flow with PKCE

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

// Generate PKCE code verifier and challenge
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url')
  return { verifier, challenge }
}

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

    const clientId = process.env.TWITTER_CLIENT_ID
    if (!clientId) {
      return NextResponse.json(
        { error: 'Twitter OAuth not configured' },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify this nullifier exists
    const { data: registration } = await supabase
      .from('registrations')
      .select('nullifier_hash')
      .eq('nullifier_hash', nullifierHash)
      .eq('verified', true)
      .eq('active', true)
      .single()

    if (!registration) {
      return NextResponse.json(
        { error: 'Nullifier not found' },
        { status: 404 }
      )
    }

    // Generate PKCE and state
    const { verifier, challenge } = generatePKCE()
    const state = crypto.randomBytes(16).toString('hex')

    // Store OAuth state in database
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    await supabase
      .from('twitter_oauth_states')
      .upsert({
        state,
        nullifier_hash: nullifierHash,
        code_verifier: verifier,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'nullifier_hash'
      })

    // Build Twitter OAuth URL - always use non-www for consistency
    let baseUrl = request.headers.get('host') || 'onemolt.ai'
    baseUrl = baseUrl.replace(/^www\./, '') // Strip www. prefix
    const protocol = baseUrl.includes('localhost') ? 'http' : 'https'
    const redirectUri = `${protocol}://${baseUrl}/api/auth/twitter/callback`

    const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'users.read offline.access')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('code_challenge', challenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    return NextResponse.json({
      authUrl: authUrl.toString(),
    })
  } catch (error) {
    console.error('Twitter OAuth init error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
