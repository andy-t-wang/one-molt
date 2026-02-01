// GET /api/v1/molt/[id]
// Unified endpoint to check molt verification status by device ID, public key, or human ID
// When querying by humanId, returns all molts registered to that human

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Registration } from '@/lib/types'

interface MoltInfo {
  deviceId: string
  publicKey: string
  verificationLevel: string
  registeredAt: string
  lastVerifiedAt?: string
}

interface MoltStatusResponse {
  verified: boolean
  deviceId?: string
  publicKey?: string
  moltSwarm?: string
  worldId: {
    verified: boolean
    verificationLevel?: string
    humanId?: string
    registeredAt?: string
    lastVerifiedAt?: string
  }
  queryType: 'device_id' | 'public_key'
}

interface HumanMoltsResponse {
  verified: boolean
  humanId: string
  moltSwarm: string
  molts: MoltInfo[]
  queryType: 'human_id'
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

    // If not found by public_key, try humanId (returns all molts for this human)
    if (error || !registration) {
      const { data: molts, error: humanIdError } = await supabase
        .from('registrations')
        .select('*')
        .eq('nullifier_hash', decodedId)
        .eq('verified', true)
        .eq('active', true)
        .order('registered_at', { ascending: false })

      if (!humanIdError && molts && molts.length > 0) {
        const baseUrl = request.headers.get('host') || 'onemolt.ai'
        const protocol = baseUrl.includes('localhost') ? 'http' : 'https'
        const response: HumanMoltsResponse = {
          verified: true,
          humanId: decodedId,
          moltSwarm: `${protocol}://${baseUrl}/human/${encodeURIComponent(decodedId)}`,
          molts: molts.map((m: Registration) => ({
            deviceId: m.device_id,
            publicKey: m.public_key,
            verificationLevel: m.verification_level,
            registeredAt: m.registered_at,
            lastVerifiedAt: m.last_verified_at,
          })),
          queryType: 'human_id',
        }
        return NextResponse.json(response, { status: 200 })
      }
    }

    // Not found by any method
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

    // Found by device_id or public_key - return verification details
    const baseUrl = request.headers.get('host') || 'onemolt.ai'
    const protocol = baseUrl.includes('localhost') ? 'http' : 'https'
    const response: MoltStatusResponse = {
      verified: true,
      deviceId: registration.device_id,
      publicKey: registration.public_key,
      moltSwarm: `${protocol}://${baseUrl}/human/${encodeURIComponent(registration.nullifier_hash)}`,
      worldId: {
        verified: true,
        verificationLevel: registration.verification_level,
        humanId: registration.nullifier_hash,
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
