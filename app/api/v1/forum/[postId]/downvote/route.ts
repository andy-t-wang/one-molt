// POST /api/v1/forum/[postId]/downvote - Downvote a forum post (agent vote)

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { validateForumMessage, verifyMoltForForum, updatePostCounts } from '@/lib/forum'
import type { ForumUpvoteRequest, ForumPost, ApiError } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const body: ForumUpvoteRequest = await request.json()

    // Validate required fields
    if (!body.publicKey || !body.signature || !body.message) {
      return NextResponse.json<ApiError>(
        { error: 'Missing required fields: publicKey, signature, message' },
        { status: 400 }
      )
    }

    // Validate message payload
    const payload = validateForumMessage(body.message)
    if (!payload) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid message format. Must include action, timestamp (< 5 min old), and nonce (UUID)' },
        { status: 400 }
      )
    }

    if (payload.action !== 'forum_downvote') {
      return NextResponse.json<ApiError>(
        { error: 'Invalid action. Expected forum_downvote' },
        { status: 400 }
      )
    }

    // Verify postId in message matches URL
    if (payload.postId !== postId) {
      return NextResponse.json<ApiError>(
        { error: 'Post ID in message does not match URL' },
        { status: 400 }
      )
    }

    // Verify molt signature and registration
    const verification = await verifyMoltForForum(body.publicKey, body.signature, body.message)
    if (!verification.valid || !verification.registration) {
      return NextResponse.json<ApiError>(
        { error: verification.error || 'Verification failed' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id, upvote_count, downvote_count, unique_human_count, human_upvote_count, human_downvote_count, agent_upvote_count, agent_downvote_count')
      .eq('id', postId)
      .is('deleted_at', null)
      .single<Pick<ForumPost, 'id' | 'upvote_count' | 'downvote_count' | 'unique_human_count' | 'human_upvote_count' | 'human_downvote_count' | 'agent_upvote_count' | 'agent_downvote_count'>>()

    if (postError || !post) {
      return NextResponse.json<ApiError>(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if this molt has already voted (as agent)
    const { data: existingVote } = await supabase
      .from('forum_upvotes')
      .select('id, vote_direction')
      .eq('post_id', postId)
      .eq('voter_public_key', verification.registration.public_key)
      .eq('upvote_type', 'agent')
      .single()

    let newUpvoteCount = post.upvote_count
    let newDownvoteCount = post.downvote_count || 0
    let newAgentUpvoteCount = post.agent_upvote_count
    let newAgentDownvoteCount = post.agent_downvote_count || 0
    let newUniqueHumanCount = post.unique_human_count

    if (existingVote) {
      // Already voted - check if already downvoted
      if (existingVote.vote_direction === 'down') {
        return NextResponse.json<ApiError>(
          { error: 'Already downvoted this post' },
          { status: 409 }
        )
      }

      // Switch from upvote to downvote
      const { error: updateVoteError } = await supabase
        .from('forum_upvotes')
        .update({ vote_direction: 'down' })
        .eq('id', existingVote.id)

      if (updateVoteError) {
        console.error('Error updating vote direction:', updateVoteError)
        return NextResponse.json<ApiError>(
          { error: 'Failed to update vote' },
          { status: 500 }
        )
      }

      // Update counts (switching from up to down)
      newUpvoteCount -= 1
      newDownvoteCount += 1
      newAgentUpvoteCount -= 1
      newAgentDownvoteCount += 1

      // Check if we need to decrement unique human count
      // (if this was the only upvote from this human)
      const { data: otherHumanUpvotes } = await supabase
        .from('forum_upvotes')
        .select('id')
        .eq('post_id', postId)
        .eq('voter_nullifier_hash', verification.registration.nullifier_hash)
        .eq('upvote_type', 'agent')
        .eq('vote_direction', 'up')
        .neq('id', existingVote.id)
        .limit(1)

      if (!otherHumanUpvotes || otherHumanUpvotes.length === 0) {
        newUniqueHumanCount = Math.max(0, newUniqueHumanCount - 1)
      }
    } else {
      // Insert the downvote with type 'agent' and direction 'down'
      const { error: insertError } = await supabase
        .from('forum_upvotes')
        .insert({
          post_id: postId,
          voter_public_key: verification.registration.public_key,
          voter_nullifier_hash: verification.registration.nullifier_hash,
          upvote_type: 'agent',
          vote_direction: 'down',
        })

      if (insertError) {
        console.error('Error inserting downvote:', insertError)
        return NextResponse.json<ApiError>(
          { error: 'Failed to downvote' },
          { status: 500 }
        )
      }

      // Update counts for new downvote
      newDownvoteCount += 1
      newAgentDownvoteCount += 1
    }

    // Update post counts
    const { error: updateError } = await supabase
      .from('forum_posts')
      .update({
        upvote_count: newUpvoteCount,
        downvote_count: newDownvoteCount,
        agent_upvote_count: newAgentUpvoteCount,
        agent_downvote_count: newAgentDownvoteCount,
        unique_human_count: newUniqueHumanCount,
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating post counts:', updateError)
      // Vote was recorded, recalculate counts asynchronously
      updatePostCounts(postId).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      upvoteCount: newUpvoteCount,
      downvoteCount: newDownvoteCount,
      humanUpvoteCount: post.human_upvote_count,
      humanDownvoteCount: post.human_downvote_count || 0,
      agentUpvoteCount: newAgentUpvoteCount,
      agentDownvoteCount: newAgentDownvoteCount,
      uniqueHumanCount: newUniqueHumanCount,
    }, { status: 200 })
  } catch (error) {
    console.error('Forum downvote error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
