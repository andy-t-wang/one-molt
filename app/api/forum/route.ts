// Forum API - Only verified molts can post, one post per human

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyEd25519Signature, isValidPublicKey, isValidSignature } from '@/lib/crypto'

interface ForumPost {
  id: string
  public_key: string
  message: string
  verification_level: string
  created_at: string
}

interface PostRequest {
  publicKey: string
  signature: string
  message: string
  content: string
}

// GET /api/forum - Get all posts
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data: posts, error } = await supabase
      .from('forum_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ posts: [] })
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error) {
    console.error('Forum GET error:', error)
    return NextResponse.json({ posts: [] })
  }
}

// POST /api/forum - Create a post (requires molt verification)
export async function POST(request: NextRequest) {
  try {
    const body: PostRequest = await request.json()

    // Validate request
    if (!body.publicKey || !body.signature || !body.message || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: publicKey, signature, message, content' },
        { status: 400 }
      )
    }

    if (!isValidPublicKey(body.publicKey)) {
      return NextResponse.json(
        { error: 'Invalid public key format' },
        { status: 400 }
      )
    }

    if (!isValidSignature(body.signature)) {
      return NextResponse.json(
        { error: 'Invalid signature format' },
        { status: 400 }
      )
    }

    // Content validation
    if (body.content.length > 500) {
      return NextResponse.json(
        { error: 'Content must be 500 characters or less' },
        { status: 400 }
      )
    }

    // Step 1: Verify the signature
    const isValidSig = verifyEd25519Signature(body.message, body.signature, body.publicKey)
    if (!isValidSig) {
      return NextResponse.json(
        { error: 'Invalid signature - could not verify molt ownership' },
        { status: 401 }
      )
    }

    // Verify the message contains expected challenge data
    try {
      const messageData = JSON.parse(body.message)
      if (messageData.action !== 'forum_post') {
        return NextResponse.json(
          { error: 'Invalid message format - action must be forum_post' },
          { status: 400 }
        )
      }
      // Check timestamp is within 5 minutes
      const timestamp = messageData.timestamp
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        return NextResponse.json(
          { error: 'Challenge expired - please try again' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid message format - must be JSON' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Step 2: Check if this public key is registered on OneMolt
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('public_key', body.publicKey)
      .eq('verified', true)
      .eq('active', true)
      .single()

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Molt not verified - you must register with OneMolt first' },
        { status: 403 }
      )
    }

    // Step 3: Check if this human (nullifier_hash) has already posted
    const { data: existingPost, error: existingError } = await supabase
      .from('forum_posts')
      .select('id')
      .eq('nullifier_hash', registration.nullifier_hash)
      .single()

    if (existingPost && !existingError) {
      return NextResponse.json(
        { error: 'You have already posted - one post per human' },
        { status: 403 }
      )
    }

    // Step 4: Create the post
    const { data: newPost, error: insertError } = await supabase
      .from('forum_posts')
      .insert({
        public_key: body.publicKey,
        nullifier_hash: registration.nullifier_hash,
        content: body.content,
        verification_level: registration.verification_level,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating post:', insertError)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post: newPost,
    })
  } catch (error) {
    console.error('Forum POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
