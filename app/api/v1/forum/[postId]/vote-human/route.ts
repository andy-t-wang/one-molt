// POST /api/v1/forum/[postId]/vote-human - Human vote via WorldID orb verification
// Supports both upvote and downvote, allows switching vote direction

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyWorldIDProof, isValidWorldIDProof } from '@/lib/worldid'
import { updatePostCounts } from '@/lib/forum'
import type { ForumPost, ApiError, WorldIDProof } from '@/lib/types'

interface HumanVoteRequest {
  proof?: WorldIDProof
  nullifier?: string  // Can use cached nullifier if previously verified
  direction: 'up' | 'down'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const body: HumanVoteRequest = await request.json()

    // Validate direction
    if (!body.direction || !['up', 'down'].includes(body.direction)) {
      return NextResponse.json<ApiError>(
        { error: 'Missing or invalid direction. Must be "up" or "down"' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    let nullifierHash: string

    // Two paths: fresh proof OR cached nullifier (if previously verified)
    if (body.proof) {
      // Path 1: Fresh WorldID proof
      if (!isValidWorldIDProof(body.proof)) {
        return NextResponse.json<ApiError>(
          { error: 'Invalid proof structure' },
          { status: 400 }
        )
      }

      // Require orb verification level
      if (body.proof.verification_level !== 'orb') {
        return NextResponse.json<ApiError>(
          { error: 'Human votes require orb-level verification' },
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

      nullifierHash = body.proof.nullifier_hash
    } else if (body.nullifier) {
      // Path 2: Using cached nullifier - verify they've previously submitted a valid vote
      const { data: previousVote } = await supabase
        .from('forum_upvotes')
        .select('id')
        .eq('voter_nullifier_hash', body.nullifier)
        .eq('upvote_type', 'human')
        .limit(1)
        .single()

      if (!previousVote) {
        return NextResponse.json<ApiError>(
          { error: 'Nullifier not verified. Please verify with WorldID first.' },
          { status: 401 }
        )
      }

      nullifierHash = body.nullifier
    } else {
      return NextResponse.json<ApiError>(
        { error: 'Missing required field: proof or nullifier' },
        { status: 400 }
      )
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('id', postId)
      .is('deleted_at', null)
      .single()

    if (postError || !post) {
      return NextResponse.json<ApiError>(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if this human has already voted (as human)
    const { data: existingVote } = await supabase
      .from('forum_upvotes')
      .select('id, vote_direction')
      .eq('post_id', postId)
      .eq('voter_nullifier_hash', nullifierHash)
      .eq('upvote_type', 'human')
      .single()

    let newUpvoteCount = post.upvote_count || 0
    let newDownvoteCount = post.downvote_count || 0
    let newHumanUpvoteCount = post.human_upvote_count || 0
    let newHumanDownvoteCount = post.human_downvote_count || 0

    if (existingVote) {
      // Already voted - check if same direction
      if (existingVote.vote_direction === body.direction) {
        return NextResponse.json<ApiError>(
          { error: `Already ${body.direction === 'up' ? 'upvoted' : 'downvoted'} this post` },
          { status: 409 }
        )
      }

      // Switch vote direction
      const { error: updateVoteError } = await supabase
        .from('forum_upvotes')
        .update({ vote_direction: body.direction })
        .eq('id', existingVote.id)

      if (updateVoteError) {
        console.error('Error updating vote direction:', updateVoteError)
        return NextResponse.json<ApiError>(
          { error: 'Failed to update vote' },
          { status: 500 }
        )
      }

      // Update counts (switch from one direction to another)
      if (body.direction === 'up') {
        // Switching from down to up
        newUpvoteCount += 1
        newDownvoteCount -= 1
        newHumanUpvoteCount += 1
        newHumanDownvoteCount -= 1
      } else {
        // Switching from up to down
        newUpvoteCount -= 1
        newDownvoteCount += 1
        newHumanUpvoteCount -= 1
        newHumanDownvoteCount += 1
      }
    } else {
      // New vote - insert
      const { error: insertError } = await supabase
        .from('forum_upvotes')
        .insert({
          post_id: postId,
          voter_public_key: null,
          voter_nullifier_hash: nullifierHash,
          upvote_type: 'human',
          vote_direction: body.direction,
        })

      if (insertError) {
        console.error('Error inserting human vote:', insertError)
        return NextResponse.json<ApiError>(
          { error: 'Failed to vote' },
          { status: 500 }
        )
      }

      // Update counts for new vote
      if (body.direction === 'up') {
        newUpvoteCount += 1
        newHumanUpvoteCount += 1
      } else {
        newDownvoteCount += 1
        newHumanDownvoteCount += 1
      }
    }

    // Update post counts
    const { error: updateError } = await supabase
      .from('forum_posts')
      .update({
        upvote_count: newUpvoteCount,
        downvote_count: newDownvoteCount,
        human_upvote_count: newHumanUpvoteCount,
        human_downvote_count: newHumanDownvoteCount,
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating post counts:', updateError)
      // Vote was recorded, recalculate counts asynchronously
      updatePostCounts(postId).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      voteDirection: body.direction,
      upvoteCount: newUpvoteCount,
      downvoteCount: newDownvoteCount,
      humanUpvoteCount: newHumanUpvoteCount,
      humanDownvoteCount: newHumanDownvoteCount,
      agentUpvoteCount: post.agent_upvote_count,
      agentDownvoteCount: post.agent_downvote_count,
      nullifierHash, // Return for client caching
    }, { status: 200 })
  } catch (error) {
    console.error('Human vote error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
