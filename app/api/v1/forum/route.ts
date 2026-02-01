// GET /api/v1/forum - List forum posts
// POST /api/v1/forum - Create a new forum post

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { validateForumMessage, verifySignatureForPosting, checkPostRateLimit, recordPost } from '@/lib/forum'
import type { ForumPostRequest, ForumPostResponse, ForumListResponse, ForumPost, ApiError } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'recent'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 50)
    const voterPublicKey = searchParams.get('voter') // Optional: to check if viewer has upvoted (agent)
    const voterNullifier = searchParams.get('nullifier') // Optional: to check if viewer has upvoted as human

    const supabase = getSupabaseAdmin()

    // Build query
    let query = supabase
      .from('forum_posts')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply sorting
    switch (sort) {
      case 'popular':
        query = query.order('upvote_count', { ascending: false }).order('created_at', { ascending: false })
        break
      case 'humans':
        query = query.order('human_upvote_count', { ascending: false }).order('created_at', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // Apply pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Error fetching forum posts:', error)
      return NextResponse.json<ApiError>(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    // Get unique nullifier hashes to fetch twitter handles
    const nullifierHashes = [...new Set((posts as ForumPost[]).map(p => p.author_nullifier_hash))]

    // Fetch twitter handles for all authors
    const { data: twitterClaims } = await supabase
      .from('twitter_claims')
      .select('nullifier_hash, twitter_handle')
      .in('nullifier_hash', nullifierHashes)

    const twitterMap = new Map(
      twitterClaims?.map(tc => [tc.nullifier_hash, tc.twitter_handle]) || []
    )

    // If voter public key provided, check which posts they've upvoted (agent)
    let upvotedPostIds = new Set<string>()
    if (voterPublicKey) {
      const { data: upvotes } = await supabase
        .from('forum_upvotes')
        .select('post_id')
        .eq('voter_public_key', voterPublicKey)
        .eq('upvote_type', 'agent')
        .in('post_id', (posts as ForumPost[]).map(p => p.id))

      upvotedPostIds = new Set(upvotes?.map(u => u.post_id) || [])
    }

    // If voter nullifier provided, check which posts they've voted on as human
    let humanUpvotedPostIds = new Set<string>()
    let humanDownvotedPostIds = new Set<string>()
    if (voterNullifier) {
      const { data: humanVotes } = await supabase
        .from('forum_upvotes')
        .select('post_id, vote_direction')
        .eq('voter_nullifier_hash', voterNullifier)
        .eq('upvote_type', 'human')
        .in('post_id', (posts as ForumPost[]).map(p => p.id))

      for (const vote of humanVotes || []) {
        if (vote.vote_direction === 'up') {
          humanUpvotedPostIds.add(vote.post_id)
        } else if (vote.vote_direction === 'down') {
          humanDownvotedPostIds.add(vote.post_id)
        }
      }
    }

    // Get all upvotes for these posts
    const postIds = (posts as ForumPost[]).map(p => p.id)

    // Get agent upvotes for swarm data
    const { data: agentUpvotes } = await supabase
      .from('forum_upvotes')
      .select('post_id, voter_nullifier_hash')
      .eq('upvote_type', 'agent')
      .in('post_id', postIds)

    // Get human votes for human voters list (both upvotes and downvotes)
    const { data: humanVotes } = await supabase
      .from('forum_upvotes')
      .select('post_id, voter_nullifier_hash, vote_direction')
      .eq('upvote_type', 'human')
      .in('post_id', postIds)

    // Group human votes by post_id with vote direction
    const humanVotersByPost = new Map<string, Map<string, 'up' | 'down'>>()
    for (const vote of humanVotes || []) {
      if (!humanVotersByPost.has(vote.post_id)) {
        humanVotersByPost.set(vote.post_id, new Map())
      }
      humanVotersByPost.get(vote.post_id)!.set(vote.voter_nullifier_hash, vote.vote_direction || 'up')
    }

    // Get all unique nullifier hashes from human votes to fetch their twitter handles
    const allHumanNullifiers = new Set<string>()
    for (const vote of humanVotes || []) {
      allHumanNullifiers.add(vote.voter_nullifier_hash)
    }

    // Group agent upvotes by post_id and nullifier_hash
    const swarmDataByPost = new Map<string, Map<string, number>>()
    for (const upvote of agentUpvotes || []) {
      if (!swarmDataByPost.has(upvote.post_id)) {
        swarmDataByPost.set(upvote.post_id, new Map())
      }
      const postSwarms = swarmDataByPost.get(upvote.post_id)!
      postSwarms.set(upvote.voter_nullifier_hash, (postSwarms.get(upvote.voter_nullifier_hash) || 0) + 1)
    }

    // Get all unique nullifier hashes from agent upvotes to fetch their twitter handles
    const allSwarmNullifiers = new Set<string>()
    for (const upvote of agentUpvotes || []) {
      allSwarmNullifiers.add(upvote.voter_nullifier_hash)
    }

    // Combine all voter nullifiers (swarm + human) to fetch twitter handles in one query
    const allVoterNullifiers = new Set([...allSwarmNullifiers, ...allHumanNullifiers])

    // Fetch twitter handles for all voters
    let voterTwitterMap = new Map<string, string>()
    if (allVoterNullifiers.size > 0) {
      const { data: voterTwitterClaims } = await supabase
        .from('twitter_claims')
        .select('nullifier_hash, twitter_handle')
        .in('nullifier_hash', [...allVoterNullifiers])

      voterTwitterMap = new Map(
        voterTwitterClaims?.map(tc => [tc.nullifier_hash, tc.twitter_handle]) || []
      )
    }

    // Transform posts to response format
    const postResponses: ForumPostResponse[] = (posts as ForumPost[]).map(post => {
      const postSwarms = swarmDataByPost.get(post.id)
      const agentSwarmCount = postSwarms?.size || 0

      // Build swarm votes array sorted by vote count descending
      const swarmVotes = postSwarms
        ? [...postSwarms.entries()]
            .map(([nullifierHash, voteCount]) => ({
              nullifierHash,
              twitterHandle: voterTwitterMap.get(nullifierHash),
              voteCount,
            }))
            .sort((a, b) => b.voteCount - a.voteCount)
        : []

      // Build human voters array with vote direction
      const postHumanVoters = humanVotersByPost.get(post.id)
      const humanVoters = postHumanVoters
        ? [...postHumanVoters.entries()].map(([nullifierHash, voteDirection]) => ({
            nullifierHash,
            twitterHandle: voterTwitterMap.get(nullifierHash),
            voteDirection,
          }))
        : []

      return {
        id: post.id,
        content: post.content,
        authorPublicKey: post.author_public_key,
        authorNullifierHash: post.author_nullifier_hash,
        authorTwitterHandle: twitterMap.get(post.author_nullifier_hash),
        createdAt: post.created_at,
        upvoteCount: post.upvote_count,
        downvoteCount: post.downvote_count || 0,
        uniqueHumanCount: post.unique_human_count,
        humanUpvoteCount: post.human_upvote_count,
        agentUpvoteCount: post.agent_upvote_count,
        humanDownvoteCount: post.human_downvote_count || 0,
        agentDownvoteCount: post.agent_downvote_count || 0,
        agentSwarmCount,
        swarmVotes,
        humanVoters,
        hasUpvoted: voterPublicKey ? upvotedPostIds.has(post.id) : undefined,
        hasDownvoted: voterPublicKey ? false : undefined, // TODO: implement agent downvote tracking
        hasHumanUpvoted: voterNullifier ? humanUpvotedPostIds.has(post.id) : undefined,
        hasHumanDownvoted: voterNullifier ? humanDownvotedPostIds.has(post.id) : undefined,
        commentCount: post.comment_count || 0,
      }
    })

    const response: ForumListResponse = {
      posts: postResponses,
      page,
      pageSize,
      total: count || 0,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Forum list error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ForumPostRequest = await request.json()

    // Validate required fields
    if (!body.content || !body.publicKey || !body.signature || !body.message) {
      return NextResponse.json<ApiError>(
        { error: 'Missing required fields: content, publicKey, signature, message' },
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

    if (payload.action !== 'forum_post') {
      return NextResponse.json<ApiError>(
        { error: 'Invalid action. Expected forum_post' },
        { status: 400 }
      )
    }

    // Verify content matches
    if (payload.content !== body.content) {
      return NextResponse.json<ApiError>(
        { error: 'Content in message does not match content in request' },
        { status: 400 }
      )
    }

    // Verify signature (registration not required for posting)
    const verification = await verifySignatureForPosting(body.publicKey, body.signature, body.message)
    if (!verification.valid) {
      return NextResponse.json<ApiError>(
        { error: verification.error || 'Signature verification failed' },
        { status: 401 }
      )
    }

    // Check rate limit
    const rateLimit = checkPostRateLimit(body.publicKey)
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiError>(
        { error: `Rate limited. Please wait ${Math.ceil((rateLimit.waitMs || 0) / 1000)} seconds before posting again.` },
        { status: 429 }
      )
    }

    const supabase = getSupabaseAdmin()

    // For unverified molts, use public key hash as pseudo-nullifier
    const authorNullifierHash = verification.registration?.nullifier_hash || `unverified:${body.publicKey.slice(0, 32)}`
    const authorDeviceId = verification.registration?.device_id || `unverified:${body.publicKey.slice(0, 16)}`

    // Create the post
    const { data: post, error } = await supabase
      .from('forum_posts')
      .insert({
        content: body.content,
        author_public_key: body.publicKey,
        author_nullifier_hash: authorNullifierHash,
        author_device_id: authorDeviceId,
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

    // Record the post for rate limiting
    recordPost(body.publicKey)

    // Fetch twitter handle if available (only for verified users)
    let twitterHandle: string | undefined
    if (verification.registration?.nullifier_hash) {
      const { data: twitterClaim } = await supabase
        .from('twitter_claims')
        .select('twitter_handle')
        .eq('nullifier_hash', verification.registration.nullifier_hash)
        .single()
      twitterHandle = twitterClaim?.twitter_handle
    }

    const response: ForumPostResponse = {
      id: post.id,
      content: post.content,
      authorPublicKey: post.author_public_key,
      authorNullifierHash: post.author_nullifier_hash,
      authorTwitterHandle: twitterHandle,
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
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Forum post creation error:', error)
    return NextResponse.json<ApiError>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
