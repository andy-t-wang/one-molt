// GET /api/v1/short-url?nullifier=xxx
// Get or create a short URL code for a nullifier hash

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

// Generate a short code from nullifier hash (6 chars, alphanumeric)
function generateShortCode(nullifierHash: string): string {
  const hash = crypto.createHash('sha256').update(nullifierHash).digest('hex')
  // Use base36 (0-9, a-z) for URL-friendly codes
  const num = BigInt('0x' + hash.slice(0, 12))
  return num.toString(36).slice(0, 6).toLowerCase()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nullifierHash = searchParams.get('nullifier')

    if (!nullifierHash) {
      return NextResponse.json(
        { error: 'Missing nullifier parameter' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if this nullifier exists
    const { data: registration } = await supabase
      .from('registrations')
      .select('nullifier_hash')
      .eq('nullifier_hash', nullifierHash)
      .eq('verified', true)
      .eq('active', true)
      .limit(1)
      .single()

    if (!registration) {
      return NextResponse.json(
        { error: 'Nullifier not found' },
        { status: 404 }
      )
    }

    // Check if short URL already exists
    const { data: existing } = await supabase
      .from('short_urls')
      .select('code')
      .eq('nullifier_hash', nullifierHash)
      .single()

    if (existing) {
      const baseUrl = request.headers.get('host') || 'onemolt.ai'
      const protocol = baseUrl.includes('localhost') ? 'http' : 'https'
      return NextResponse.json({
        code: existing.code,
        shortUrl: `${protocol}://${baseUrl}/s/${existing.code}`,
      })
    }

    // Generate new short code
    let code = generateShortCode(nullifierHash)

    // Handle collisions by appending random chars
    let attempts = 0
    while (attempts < 5) {
      const { data: collision } = await supabase
        .from('short_urls')
        .select('code')
        .eq('code', code)
        .single()

      if (!collision) break

      // Add random suffix on collision
      code = generateShortCode(nullifierHash + attempts.toString())
      attempts++
    }

    // Insert the new short URL
    const { error: insertError } = await supabase
      .from('short_urls')
      .insert({
        code,
        nullifier_hash: nullifierHash,
      })

    if (insertError) {
      console.error('Error creating short URL:', insertError)
      return NextResponse.json(
        { error: 'Failed to create short URL' },
        { status: 500 }
      )
    }

    const baseUrl = request.headers.get('host') || 'onemolt.ai'
    const protocol = baseUrl.includes('localhost') ? 'http' : 'https'

    return NextResponse.json({
      code,
      shortUrl: `${protocol}://${baseUrl}/s/${code}`,
    })
  } catch (error) {
    console.error('Short URL error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
