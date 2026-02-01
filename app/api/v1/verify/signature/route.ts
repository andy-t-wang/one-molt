// POST /api/v1/verify/signature
// Verifies Ed25519 signature against registered public key

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyEd25519Signature, isValidPublicKey, isValidSignature } from '@/lib/crypto'
import type { SignatureVerificationRequest, SignatureVerificationResponse, ApiError, Registration } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: SignatureVerificationRequest = await request.json()

    // Validate request
    if (!body.message || !body.signature) {
      return NextResponse.json<ApiError>(
        { error: 'Missing required fields: message, signature' },
        { status: 400 }
      )
    }

    if (!body.deviceId && !body.publicKey) {
      return NextResponse.json<ApiError>(
        { error: 'Either deviceId or publicKey must be provided' },
        { status: 400 }
      )
    }

    // Validate signature format
    if (!isValidSignature(body.signature)) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid signature format' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    let publicKey = body.publicKey
    let deviceId = body.deviceId
    let registration: Registration | null = null

    // If only deviceId provided, lookup public key
    if (!publicKey && deviceId) {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('device_id', deviceId)
        .eq('verified', true)
        .eq('active', true)
        .single<Registration>()

      if (error || !data) {
        return NextResponse.json<SignatureVerificationResponse>(
          {
            verified: false,
            deviceId,
            worldIdVerified: false,
          },
          { status: 200 }
        )
      }

      publicKey = data.public_key
      registration = data
    }

    // If only publicKey provided, lookup registration
    if (publicKey && !deviceId) {
      // Validate public key format
      if (!isValidPublicKey(publicKey)) {
        return NextResponse.json<ApiError>(
          { error: 'Invalid public key format' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('public_key', publicKey)
        .eq('verified', true)
        .eq('active', true)
        .single<Registration>()

      if (!error && data) {
        registration = data
        deviceId = data.device_id
      }
    }

    // Verify signature
    if (!publicKey) {
      return NextResponse.json<ApiError>(
        { error: 'Public key not found' },
        { status: 404 }
      )
    }

    const isValid = verifyEd25519Signature(body.message, body.signature, publicKey)

    // Log verification attempt
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await supabase.from('verification_logs').insert({
      device_id: deviceId || 'unknown',
      public_key: publicKey,
      message: body.message,
      signature: body.signature,
      verified: isValid,
      verification_method: 'signature',
      user_agent: userAgent,
      registration_id: registration?.id || null,
    })

    // Build response
    const response: SignatureVerificationResponse = {
      verified: isValid,
      deviceId,
      publicKey,
      worldIdVerified: registration !== null,
      verificationLevel: registration?.verification_level,
      registeredAt: registration?.registered_at,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Signature verification error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
