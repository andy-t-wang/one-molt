// GET /api/v1/register/[sessionToken]/status
// Polls registration session status

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { RegistrationStatusResponse, ApiError, RegistrationSession } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionToken: string }> }
) {
  try {
    const { sessionToken } = await params
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

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    if (now > expiresAt && session.status === 'pending') {
      // Update session status to expired
      await supabase
        .from('registration_sessions')
        .update({ status: 'expired' })
        .eq('session_token', sessionToken)

      session.status = 'expired'
    }

    // If completed, fetch registration details
    let registration = null
    if (session.status === 'completed') {
      const { data: reg } = await supabase
        .from('registrations')
        .select('id, device_id, public_key, verification_level, registered_at')
        .eq('device_id', session.device_id)
        .single()

      if (reg) {
        registration = {
          id: reg.id,
          deviceId: reg.device_id,
          publicKey: reg.public_key,
          verificationLevel: reg.verification_level,
          registeredAt: reg.registered_at,
        }
      }
    }

    const response: RegistrationStatusResponse = {
      status: session.status,
      deviceId: session.device_id,
      publicKey: session.public_key,
      createdAt: session.created_at,
      expiresAt: session.expires_at,
      registration: registration || undefined,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
