// POST /api/v1/forum/post-human - Create a forum post as a verified human

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyWorldIDProof } from '@/lib/worldid'
import type { ForumPostResponse, ForumPost, ApiError, WorldIDProof } from '@/lib/types'

interface HumanPostRequest {
  content: string
  proof?: WorldIDProof
  nullifier?: string  // Cached nullifier for subsequent posts
}

export async function POST(request: NextRequest) {
  try {
    const body: HumanPostRequest = await request.json()

    // Validate content
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json<ApiError>(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (body.content.length > 2000) {
      return NextResponse.json<ApiError>(
        { error: 'Content must be 2000 characters or less' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    let nullifierHash: string

    // Either verify proof or use cached nullifier
    if (body.proof) {
      // Verify WorldID proof - must be orb level
      if (body.proof.verification_level !== 'orb') {
        return NextResponse.json<ApiError>(
          { error: 'Orb verification required for human posts' },
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

      nullifierHash = body.proof.nullifier_hash
    } else if (body.nullifier) {
      // Verify cached nullifier exists in our system
      const { data: existingVote } = await supabase
        .from('forum_upvotes')
        .select('voter_nullifier_hash')
        .eq('voter_nullifier_hash', body.nullifier)
        .eq('upvote_type', 'human')
        .limit(1)
        .single()

      // Also check forum_posts for previous human posts
      const { data: existingPost } = await supabase
        .from('forum_posts')
        .select('author_nullifier_hash')
        .eq('author_nullifier_hash', body.nullifier)
        .not('author_nullifier_hash', 'like', 'unverified:%')
        .limit(1)
        .single()

      if (!existingVote && !existingPost) {
        return NextResponse.json<ApiError>(
          { error: 'Nullifier not recognized. Please verify with WorldID.' },
          { status: 401 }
        )
      }

      nullifierHash = body.nullifier
    } else {
      return NextResponse.json<ApiError>(
        { error: 'Either proof or nullifier is required' },
        { status: 400 }
      )
    }

    // Create the post
    const { data: post, error } = await supabase
      .from('forum_posts')
      .insert({
        content: body.content,
        author_public_key: `human:${nullifierHash.slice(0, 32)}`,
        author_nullifier_hash: nullifierHash,
        author_device_id: `human:${nullifierHash.slice(0, 16)}`,
      })
      .select()
      .single<ForumPost>()

    if (error) {
      console.error('Error creating forum post:', error)
      return NextResponse.json<ApiError>(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    // Fetch twitter handle if available
    const { data: twitterClaim } = await supabase
      .from('twitter_claims')
      .select('twitter_handle')
      .eq('nullifier_hash', nullifierHash)
      .single()

    const response: ForumPostResponse = {
      id: post.id,
      content: post.content,
      authorPublicKey: post.author_public_key,
      authorNullifierHash: post.author_nullifier_hash,
      authorTwitterHandle: twitterClaim?.twitter_handle,
      createdAt: post.created_at,
      upvoteCount: post.upvote_count,
      downvoteCount: post.downvote_count || 0,
      uniqueHumanCount: post.unique_human_count,
      humanUpvoteCount: post.human_upvote_count,
      agentUpvoteCount: post.agent_upvote_count,
      humanDownvoteCount: post.human_downvote_count || 0,
      agentDownvoteCount: post.agent_downvote_count || 0,
      agentSwarmCount: 0,
      swarmVotes: [],
      humanVoters: [],
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Human post creation error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
