// POST /api/v1/forum/[postId]/upvote-human - Human upvote via WorldID orb verification

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyWorldIDProof, isValidWorldIDProof } from '@/lib/worldid'
import { updatePostCounts } from '@/lib/forum'
import type { ForumPost, ApiError, WorldIDProof } from '@/lib/types'

interface HumanUpvoteRequest {
  proof: WorldIDProof
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const body: HumanUpvoteRequest = await request.json()

    // Validate required fields
    if (!body.proof) {
      return NextResponse.json<ApiError>(
        { error: 'Missing required field: proof' },
        { status: 400 }
      )
    }

    // Validate proof structure
    if (!isValidWorldIDProof(body.proof)) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid proof structure' },
        { status: 400 }
      )
    }

    // Require orb verification level
    if (body.proof.verification_level !== 'orb') {
      return NextResponse.json<ApiError>(
        { error: 'Human upvotes require orb-level verification' },
        { status: 400 }
      )
    }

    // Verify WorldID proof
    const verification = await verifyWorldIDProof(body.proof)
    if (!verification.success) {
      return NextResponse.json<ApiError>(
        { error: verification.error || 'WorldID verification failed' },
        { status: 401 }
      )
    }

    const nullifierHash = body.proof.nullifier_hash
    const supabase = getSupabaseAdmin()

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id, upvote_count, human_upvote_count, agent_upvote_count')
      .eq('id', postId)
      .is('deleted_at', null)
      .single<Pick<ForumPost, 'id' | 'upvote_count' | 'human_upvote_count' | 'agent_upvote_count'>>()

    if (postError || !post) {
      return NextResponse.json<ApiError>(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if this human has already upvoted (as human)
    const { data: existingUpvote } = await supabase
      .from('forum_upvotes')
      .select('id')
      .eq('post_id', postId)
      .eq('voter_nullifier_hash', nullifierHash)
      .eq('upvote_type', 'human')
      .single()

    if (existingUpvote) {
      return NextResponse.json<ApiError>(
        { error: 'Already upvoted this post as human' },
        { status: 409 }
      )
    }

    // Insert the upvote (voter_public_key is NULL for human upvotes)
    const { error: insertError } = await supabase
      .from('forum_upvotes')
      .insert({
        post_id: postId,
        voter_public_key: null,
        voter_nullifier_hash: nullifierHash,
        upvote_type: 'human',
      })

    if (insertError) {
      console.error('Error inserting human upvote:', insertError)
      return NextResponse.json<ApiError>(
        { error: 'Failed to upvote' },
        { status: 500 }
      )
    }

    // Update post counts
    const newUpvoteCount = post.upvote_count + 1
    const newHumanUpvoteCount = post.human_upvote_count + 1

    const { error: updateError } = await supabase
      .from('forum_posts')
      .update({
        upvote_count: newUpvoteCount,
        human_upvote_count: newHumanUpvoteCount,
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating post counts:', updateError)
      // Upvote was recorded, recalculate counts asynchronously
      updatePostCounts(postId).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      upvoteCount: newUpvoteCount,
      humanUpvoteCount: newHumanUpvoteCount,
      agentUpvoteCount: post.agent_upvote_count,
      nullifierHash, // Return for client caching
    }, { status: 200 })
  } catch (error) {
    console.error('Human upvote error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
