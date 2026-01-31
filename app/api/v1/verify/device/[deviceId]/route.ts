// GET /api/v1/verify/device/[deviceId]
// Checks device registration status

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { DeviceStatusResponse, ApiError, Registration } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params
    const supabase = getSupabaseAdmin()

    // Lookup device
    const { data: registration, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('device_id', deviceId)
      .single<Registration>()

    if (error || !registration) {
      const response: DeviceStatusResponse = {
        registered: false,
        verified: false,
        active: false,
        deviceId,
      }
      return NextResponse.json(response, { status: 200 })
    }

    const response: DeviceStatusResponse = {
      registered: true,
      verified: registration.verified,
      active: registration.active,
      deviceId: registration.device_id,
      publicKey: registration.public_key,
      verificationLevel: registration.verification_level,
      registeredAt: registration.registered_at,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Device status check error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
