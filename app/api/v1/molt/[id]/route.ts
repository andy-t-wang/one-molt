// GET /api/v1/molt/[id]
// Unified endpoint to check molt verification status by device ID or public key

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Registration } from '@/lib/types'

interface MoltStatusResponse {
  verified: boolean
  deviceId?: string
  publicKey?: string
  worldId: {
    verified: boolean
    verificationLevel?: string
    nullifierHash?: string
    registeredAt?: string
    lastVerifiedAt?: string
  }
  queryType: 'device_id' | 'public_key'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const decodedId = decodeURIComponent(id)
    const supabase = getSupabaseAdmin()

    // Try to find by device_id first (most common)
    let { data: registration, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('device_id', decodedId)
      .eq('verified', true)
      .eq('active', true)
      .single<Registration>()

    let queryType: 'device_id' | 'public_key' = 'device_id'

    // If not found by device_id, try public_key
    if (error || !registration) {
      const result = await supabase
        .from('registrations')
        .select('*')
        .eq('public_key', decodedId)
        .eq('verified', true)
        .eq('active', true)
        .single<Registration>()

      registration = result.data
      error = result.error
      queryType = 'public_key'
    }

    // Not found
    if (error || !registration) {
      const response: MoltStatusResponse = {
        verified: false,
        worldId: {
          verified: false,
        },
        queryType,
      }
      return NextResponse.json(response, { status: 200 })
    }

    // Found - return verification details
    const response: MoltStatusResponse = {
      verified: true,
      deviceId: registration.device_id,
      publicKey: registration.public_key,
      worldId: {
        verified: true,
        verificationLevel: registration.verification_level,
        nullifierHash: registration.nullifier_hash,
        registeredAt: registration.registered_at,
        lastVerifiedAt: registration.last_verified_at,
      },
      queryType,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Molt status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
