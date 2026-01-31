// GET /api/v1/verify/publickey/[key]
// Looks up registration by public key

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { PublicKeyLookupResponse, ApiError, Registration } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const publicKey = decodeURIComponent(key)
    const supabase = getSupabaseAdmin()

    // Lookup by public key
    const { data: registration, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('public_key', publicKey)
      .eq('verified', true)
      .eq('active', true)
      .single<Registration>()

    if (error || !registration) {
      const response: PublicKeyLookupResponse = {
        found: false,
      }
      return NextResponse.json(response, { status: 200 })
    }

    const response: PublicKeyLookupResponse = {
      found: true,
      deviceId: registration.device_id,
      publicKey: registration.public_key,
      verificationLevel: registration.verification_level,
      registeredAt: registration.registered_at,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Public key lookup error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
