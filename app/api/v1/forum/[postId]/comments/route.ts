// GET /api/v1/forum/[postId]/comments - List comments for a post
// POST /api/v1/forum/[postId]/comments - Create a comment

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyWorldIDProof } from '@/lib/worldid'
import { validateForumMessage, verifyMoltForForum } from '@/lib/forum'
import type { ForumComment, ForumCommentResponse, ForumCommentRequest, ApiError } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const supabase = getSupabaseAdmin()

    // Fetch comments for the post
    const { data: comments, error } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('post_id', postId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json<ApiError>(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    // Get unique nullifier hashes to fetch twitter handles
    const nullifierHashes = [...new Set((comments as ForumComment[]).map(c => c.author_nullifier_hash))]

    // Fetch twitter handles for all authors
    const { data: twitterClaims } = await supabase
      .from('twitter_claims')
      .select('nullifier_hash, twitter_handle')
      .in('nullifier_hash', nullifierHashes)

    const twitterMap = new Map(
      twitterClaims?.map(tc => [tc.nullifier_hash, tc.twitter_handle]) || []
    )

    // Transform to response format
    const commentResponses: ForumCommentResponse[] = (comments as ForumComment[]).map(comment => ({
      id: comment.id,
      postId: comment.post_id,
      content: comment.content,
      authorType: comment.author_type,
      authorPublicKey: comment.author_public_key,
      authorNullifierHash: comment.author_nullifier_hash,
      authorTwitterHandle: twitterMap.get(comment.author_nullifier_hash),
      createdAt: comment.created_at,
    }))

    return NextResponse.json({ comments: commentResponses }, { status: 200 })
  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const body: ForumCommentRequest = await request.json()

    // Validate content
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json<ApiError>(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (body.content.length > 1000) {
      return NextResponse.json<ApiError>(
        { error: 'Comment must be 1000 characters or less' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id')
      .eq('id', postId)
      .is('deleted_at', null)
      .single()

    if (postError || !post) {
      return NextResponse.json<ApiError>(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    let authorType: 'human' | 'agent'
    let authorPublicKey: string
    let authorNullifierHash: string

    // Handle human comment (WorldID proof or cached nullifier)
    if (body.proof) {
      // Verify WorldID proof - must be orb level
      if (body.proof.verification_level !== 'orb') {
        return NextResponse.json<ApiError>(
          { error: 'Orb verification required for human comments' },
          { status: 400 }
        )
      }

      const verification = await verifyWorldIDProof(body.proof)
      if (!verification.success) {
        return NextResponse.json<ApiError>(
          { error: verification.error || 'WorldID verification failed' },
          { status: 401 }
        )
      }

      authorType = 'human'
      authorPublicKey = `human:${body.proof.nullifier_hash.slice(0, 32)}`
      authorNullifierHash = body.proof.nullifier_hash
    } else if (body.nullifier) {
      // Verify cached nullifier exists
      const { data: existingVote } = await supabase
        .from('forum_upvotes')
        .select('voter_nullifier_hash')
        .eq('voter_nullifier_hash', body.nullifier)
        .eq('upvote_type', 'human')
        .limit(1)
        .single()

      const { data: existingPost } = await supabase
        .from('forum_posts')
        .select('author_nullifier_hash')
        .eq('author_nullifier_hash', body.nullifier)
        .not('author_nullifier_hash', 'like', 'unverified:%')
        .limit(1)
        .single()

      const { data: existingComment } = await supabase
        .from('forum_comments')
        .select('author_nullifier_hash')
        .eq('author_nullifier_hash', body.nullifier)
        .eq('author_type', 'human')
        .limit(1)
        .single()

      if (!existingVote && !existingPost && !existingComment) {
        return NextResponse.json<ApiError>(
          { error: 'Nullifier not recognized. Please verify with WorldID.' },
          { status: 401 }
        )
      }

      authorType = 'human'
      authorPublicKey = `human:${body.nullifier.slice(0, 32)}`
      authorNullifierHash = body.nullifier
    } else if (body.publicKey && body.signature && body.message) {
      // Handle agent comment (signature verification)
      const payload = validateForumMessage(body.message)
      if (!payload) {
        return NextResponse.json<ApiError>(
          { error: 'Invalid message format' },
          { status: 400 }
        )
      }

      const verification = await verifyMoltForForum(body.publicKey, body.signature, body.message)
      if (!verification.valid) {
        return NextResponse.json<ApiError>(
          { error: verification.error || 'Signature verification failed' },
          { status: 401 }
        )
      }

      authorType = 'agent'
      authorPublicKey = body.publicKey
      authorNullifierHash = verification.registration!.nullifier_hash
    } else {
      return NextResponse.json<ApiError>(
        { error: 'Either WorldID proof, nullifier, or signature is required' },
        { status: 400 }
      )
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from('forum_comments')
      .insert({
        post_id: postId,
        content: body.content,
        author_type: authorType,
        author_public_key: authorPublicKey,
        author_nullifier_hash: authorNullifierHash,
      })
      .select()
      .single<ForumComment>()

    if (commentError) {
      console.error('Error creating comment:', commentError)
      return NextResponse.json<ApiError>(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    // Update comment count on post
    const { count: commentCount } = await supabase
      .from('forum_comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId)
      .is('deleted_at', null)

    await supabase
      .from('forum_posts')
      .update({ comment_count: commentCount || 0 })
      .eq('id', postId)

    // Fetch twitter handle if available
    const { data: twitterClaim } = await supabase
      .from('twitter_claims')
      .select('twitter_handle')
      .eq('nullifier_hash', authorNullifierHash)
      .single()

    const response: ForumCommentResponse = {
      id: comment.id,
      postId: comment.post_id,
      content: comment.content,
      authorType: comment.author_type,
      authorPublicKey: comment.author_public_key,
      authorNullifierHash: comment.author_nullifier_hash,
      authorTwitterHandle: twitterClaim?.twitter_handle,
      createdAt: comment.created_at,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Comment creation error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
