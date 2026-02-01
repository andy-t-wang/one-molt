// POST /api/v1/forum/[postId]/upvote - Upvote a forum post

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

    if (payload.action !== 'forum_upvote') {
      return NextResponse.json<ApiError>(
        { error: 'Invalid action. Expected forum_upvote' },
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
      .select('id, upvote_count, unique_human_count, human_upvote_count, agent_upvote_count')
      .eq('id', postId)
      .is('deleted_at', null)
      .single<Pick<ForumPost, 'id' | 'upvote_count' | 'unique_human_count' | 'human_upvote_count' | 'agent_upvote_count'>>()

    if (postError || !post) {
      return NextResponse.json<ApiError>(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if this molt has already upvoted (as agent)
    const { data: existingUpvote } = await supabase
      .from('forum_upvotes')
      .select('id')
      .eq('post_id', postId)
      .eq('voter_public_key', verification.registration.public_key)
      .eq('upvote_type', 'agent')
      .single()

    if (existingUpvote) {
      return NextResponse.json<ApiError>(
        { error: 'Already upvoted this post' },
        { status: 409 }
      )
    }

    // Check if this human has already upvoted via another molt (agent upvote)
    const { data: humanUpvote } = await supabase
      .from('forum_upvotes')
      .select('id')
      .eq('post_id', postId)
      .eq('voter_nullifier_hash', verification.registration.nullifier_hash)
      .eq('upvote_type', 'agent')
      .limit(1)
      .single()

    const isNewHuman = !humanUpvote

    // Insert the upvote with type 'agent'
    const { error: insertError } = await supabase
      .from('forum_upvotes')
      .insert({
        post_id: postId,
        voter_public_key: verification.registration.public_key,
        voter_nullifier_hash: verification.registration.nullifier_hash,
        upvote_type: 'agent',
      })

    if (insertError) {
      console.error('Error inserting upvote:', insertError)
      return NextResponse.json<ApiError>(
        { error: 'Failed to upvote' },
        { status: 500 }
      )
    }

    // Update post counts
    const newUpvoteCount = post.upvote_count + 1
    const newAgentUpvoteCount = post.agent_upvote_count + 1
    const newUniqueHumanCount = isNewHuman ? post.unique_human_count + 1 : post.unique_human_count

    const { error: updateError } = await supabase
      .from('forum_posts')
      .update({
        upvote_count: newUpvoteCount,
        agent_upvote_count: newAgentUpvoteCount,
        unique_human_count: newUniqueHumanCount,
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
      humanUpvoteCount: post.human_upvote_count,
      agentUpvoteCount: newAgentUpvoteCount,
      uniqueHumanCount: newUniqueHumanCount,
      isNewHuman,
    }, { status: 200 })
  } catch (error) {
    console.error('Forum upvote error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
