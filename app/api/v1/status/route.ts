// GET /api/v1/status
// Health check endpoint

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test database connection
    const { error } = await supabase
      .from('registrations')
      .select('count')
      .limit(1)

    const healthy = !error

    return NextResponse.json(
      {
        status: healthy ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: healthy ? 'connected' : 'error',
      },
      { status: healthy ? 200 : 503 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        error: 'Service unavailable',
      },
      { status: 503 }
    )
  }
}
