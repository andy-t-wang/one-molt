// GET /api/v1/molt/[id]
// Unified endpoint to check molt verification status by device ID, public key, or nullifier hash
// When querying by nullifier_hash, returns all molts registered to that human

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
  worldId: {
    verified: boolean
    verificationLevel?: string
    nullifierHash?: string
    registeredAt?: string
    lastVerifiedAt?: string
  }
  queryType: 'device_id' | 'public_key'
}

interface HumanMoltsResponse {
  verified: boolean
  nullifierHash: string
  molts: MoltInfo[]
  queryType: 'nullifier_hash'
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

    // If not found by public_key, try nullifier_hash (returns all molts for this human)
    if (error || !registration) {
      const { data: molts, error: nullifierError } = await supabase
        .from('registrations')
        .select('*')
        .eq('nullifier_hash', decodedId)
        .eq('verified', true)
        .eq('active', true)
        .order('registered_at', { ascending: false })

      if (!nullifierError && molts && molts.length > 0) {
        const response: HumanMoltsResponse = {
          verified: true,
          nullifierHash: decodedId,
          molts: molts.map((m: Registration) => ({
            deviceId: m.device_id,
            publicKey: m.public_key,
            verificationLevel: m.verification_level,
            registeredAt: m.registered_at,
            lastVerifiedAt: m.last_verified_at,
          })),
          queryType: 'nullifier_hash',
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
