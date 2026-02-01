// POST /api/v1/register/init
// Initiates a new registration session by validating signature and creating session token

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyEd25519Signature, isValidPublicKey, isValidSignature } from '@/lib/crypto'
import type { RegistrationInitRequest, RegistrationInitResponse, ApiError } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: RegistrationInitRequest = await request.json()

    // Validate request body
    if (!body.deviceId || !body.publicKey || !body.message || !body.signature) {
      return NextResponse.json<ApiError>(
        { error: 'Missing required fields: deviceId, publicKey, message, signature' },
        { status: 400 }
      )
    }

    // Validate public key format
    if (!isValidPublicKey(body.publicKey)) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid public key format' },
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

    // Verify signature proves ownership of private key
    const isValidSignatureProof = verifyEd25519Signature(
      body.message,
      body.signature,
      body.publicKey
    )

    if (!isValidSignatureProof) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid signature - signature verification failed' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if device already registered
    const { data: existingRegistration } = await supabase
      .from('registrations')
      .select('device_id, verified, active')
      .eq('device_id', body.deviceId)
      .single()

    if (existingRegistration) {
      if (existingRegistration.verified && existingRegistration.active) {
        return NextResponse.json<ApiError>(
          { error: 'Device already registered and verified' },
          { status: 409 }
        )
      }
    }

    // Check if public key already used by different device
    const { data: existingKey } = await supabase
      .from('registrations')
      .select('device_id, public_key')
      .eq('public_key', body.publicKey)
      .single()

    if (existingKey && existingKey.device_id !== body.deviceId) {
      return NextResponse.json<ApiError>(
        { error: 'Public key already registered to different device' },
        { status: 409 }
      )
    }

    // Generate session token
    const sessionToken = randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Get client info for audit
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create registration session
    const { error: insertError } = await supabase
      .from('registration_sessions')
      .insert({
        session_token: sessionToken,
        device_id: body.deviceId,
        public_key: body.publicKey,
        signature: body.signature,
        message: body.message,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        user_agent: userAgent,
      })

    if (insertError) {
      console.error('Failed to create registration session:', insertError)
      return NextResponse.json<ApiError>(
        { error: 'Failed to create registration session' },
        { status: 500 }
      )
    }

    // Build registration URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000'
    const registrationUrl = `${baseUrl}/register/${sessionToken}`

    const response: RegistrationInitResponse = {
      success: true,
      sessionToken,
      registrationUrl,
      expiresAt: expiresAt.toISOString(),
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Registration init error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
