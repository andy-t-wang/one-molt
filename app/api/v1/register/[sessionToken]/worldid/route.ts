// POST /api/v1/register/[sessionToken]/worldid
// Accepts WorldID proof and completes registration

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyWorldIDProof, isValidWorldIDProof } from '@/lib/worldid'
import type { WorldIDSubmitRequest, WorldIDSubmitResponse, ApiError, RegistrationSession } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionToken: string }> }
) {
  try {
    const { sessionToken } = await params
    const body: WorldIDSubmitRequest = await request.json()

    // Validate WorldID proof structure
    if (!body.proof || !isValidWorldIDProof(body.proof)) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid WorldID proof format' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Load session
    const { data: session, error: sessionError } = await supabase
      .from('registration_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single<RegistrationSession>()

    if (sessionError || !session) {
      return NextResponse.json<ApiError>(
        { error: 'Registration session not found' },
        { status: 404 }
      )
    }

    // Check session status
    if (session.status === 'completed') {
      return NextResponse.json<ApiError>(
        { error: 'Registration already completed' },
        { status: 409 }
      )
    }

    if (session.status === 'expired') {
      return NextResponse.json<ApiError>(
        { error: 'Registration session expired' },
        { status: 410 }
      )
    }

    // Allow retries for 'failed' and 'pending' status
    // This enables users to try WorldID verification multiple times

    // Check expiration
    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    if (now > expiresAt) {
      // Update session status to expired
      await supabase
        .from('registration_sessions')
        .update({ status: 'expired' })
        .eq('session_token', sessionToken)

      return NextResponse.json<ApiError>(
        { error: 'Registration session expired' },
        { status: 410 }
      )
    }

    // Verify signal matches device ID from session
    if (body.signal && body.signal !== session.device_id) {
      return NextResponse.json<ApiError>(
        { error: 'Signal mismatch - WorldID proof was created for a different device' },
        { status: 400 }
      )
    }

    // Check if this is a replacement request with an already-verified proof
    // WorldID proofs are single-use, so we store the verified proof in the session
    // and skip re-verification on replacement
    const sessionHasVerifiedProof = session.worldid_proof &&
      (session.worldid_proof as unknown as Record<string, unknown>).nullifier_hash === body.proof.nullifier_hash

    if (!sessionHasVerifiedProof) {
      // First time - verify with WorldID API
      const verificationResult = await verifyWorldIDProof(
        body.proof,
        session.device_id
      )

      if (!verificationResult.success) {
        // Update session with failed status
        await supabase
          .from('registration_sessions')
          .update({
            status: 'failed',
            worldid_proof: body.proof as unknown as Record<string, unknown>,
          })
          .eq('session_token', sessionToken)

        return NextResponse.json<ApiError>(
          { error: verificationResult.error || 'WorldID verification failed' },
          { status: 401 }
        )
      }

      // Store the verified proof in the session for potential replacement flow
      await supabase
        .from('registration_sessions')
        .update({
          worldid_proof: body.proof as unknown as Record<string, unknown>,
        })
        .eq('session_token', sessionToken)
    }

    // Get client info for audit
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if this public key (molt) is already registered
    // If so, we'll update it with the new WorldID verification
    const { data: existingMolt } = await supabase
      .from('registrations')
      .select('id, nullifier_hash, registered_at')
      .eq('public_key', session.public_key)
      .single()

    let registration

    if (existingMolt) {
      // This molt is already registered - update it with new WorldID proof
      const { data: updatedRegistration, error: updateError } = await supabase
        .from('registrations')
        .update({
          nullifier_hash: body.proof.nullifier_hash,
          merkle_root: body.proof.merkle_root,
          verification_level: body.proof.verification_level,
          registration_signature: session.signature,
          verified: true,
          active: true,
          user_agent: userAgent,
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', existingMolt.id)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update registration:', updateError)
        await supabase
          .from('registration_sessions')
          .update({ status: 'failed' })
          .eq('session_token', sessionToken)

        return NextResponse.json<ApiError>(
          { error: 'Failed to update molt registration. Please try again.' },
          { status: 500 }
        )
      }

      registration = updatedRegistration
    } else {
      // New molt registration
      const { data: newRegistration, error: insertError } = await supabase
        .from('registrations')
        .insert({
          device_id: session.device_id,
          public_key: session.public_key,
          nullifier_hash: body.proof.nullifier_hash,
          merkle_root: body.proof.merkle_root,
          verification_level: body.proof.verification_level,
          registration_signature: session.signature,
          verified: true,
          active: true,
          user_agent: userAgent,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create registration:', insertError)

        // Check if it's a duplicate key error on public_key
        if (insertError.code === '23505') {
          return NextResponse.json<ApiError>(
            { error: 'This molt is already registered. Try verifying again to update it.' },
            { status: 409 }
          )
        }

        await supabase
          .from('registration_sessions')
          .update({ status: 'failed' })
          .eq('session_token', sessionToken)

        return NextResponse.json<ApiError>(
          { error: 'Failed to complete registration' },
          { status: 500 }
        )
      }

      registration = newRegistration
    }

    // Update session status to completed
    await supabase
      .from('registration_sessions')
      .update({
        status: 'completed',
        worldid_proof: body.proof as unknown as Record<string, unknown>,
      })
      .eq('session_token', sessionToken)

    const response: WorldIDSubmitResponse = {
      success: true,
      registration: {
        id: registration.id,
        deviceId: registration.device_id,
        publicKey: registration.public_key,
        verificationLevel: registration.verification_level,
        registeredAt: registration.registered_at,
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('WorldID submission error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
