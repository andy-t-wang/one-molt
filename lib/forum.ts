// Forum helper functions
// Validates forum messages and verifies molt signatures for forum actions

import { getSupabaseAdmin } from './supabase'
import { verifyEd25519Signature, isValidPublicKey, isValidSignature } from './crypto'
import type { ForumMessagePayload, Registration } from './types'

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Maximum message age in milliseconds (5 minutes)
const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000

/**
 * Validate forum message payload (action, timestamp freshness, nonce format)
 * @param message - JSON string message to validate
 * @returns Parsed payload if valid, null otherwise
 */
export function validateForumMessage(message: string): ForumMessagePayload | null {
  try {
    const payload = JSON.parse(message) as ForumMessagePayload

    // Validate action
    if (!payload.action || !['forum_post', 'forum_upvote', 'forum_downvote'].includes(payload.action)) {
      return null
    }

    // Validate timestamp (must be within 5 minutes)
    if (typeof payload.timestamp !== 'number') {
      return null
    }
    const now = Date.now()
    const messageAge = now - payload.timestamp
    if (messageAge < 0 || messageAge > MAX_MESSAGE_AGE_MS) {
      return null
    }

    // Validate nonce (must be UUID v4)
    if (!payload.nonce || !UUID_REGEX.test(payload.nonce)) {
      return null
    }

    // Validate action-specific fields
    if (payload.action === 'forum_post') {
      if (!payload.content || typeof payload.content !== 'string') {
        return null
      }
      if (payload.content.length > 2000) {
        return null
      }
    }

    if (payload.action === 'forum_upvote' || payload.action === 'forum_downvote') {
      if (!payload.postId || !UUID_REGEX.test(payload.postId)) {
        return null
      }
    }

    return payload
  } catch {
    return null
  }
}

export interface MoltVerificationResult {
  valid: boolean
  registration?: {
    device_id: string
    nullifier_hash: string
    verification_level: string
    public_key: string
  }
  error?: string
}

/**
 * Verify molt signature and lookup registration
 * @param publicKey - Base64 encoded SPKI public key
 * @param signature - Base64 encoded signature
 * @param message - Original message that was signed
 * @returns Verification result with registration details if valid
 */
export async function verifyMoltForForum(
  publicKey: string,
  signature: string,
  message: string
): Promise<MoltVerificationResult> {
  // Validate public key format
  if (!publicKey || !isValidPublicKey(publicKey)) {
    return { valid: false, error: 'Invalid public key format' }
  }

  // Validate signature format
  if (!signature || !isValidSignature(signature)) {
    return { valid: false, error: 'Invalid signature format' }
  }

  // Verify the signature
  const isValid = verifyEd25519Signature(message, signature, publicKey)
  if (!isValid) {
    return { valid: false, error: 'Signature verification failed' }
  }

  // Lookup registration
  const supabase = getSupabaseAdmin()
  const { data: registration, error } = await supabase
    .from('registrations')
    .select('device_id, nullifier_hash, verification_level, public_key')
    .eq('public_key', publicKey)
    .eq('verified', true)
    .eq('active', true)
    .single<Pick<Registration, 'device_id' | 'nullifier_hash' | 'verification_level' | 'public_key'>>()

  if (error || !registration) {
    return { valid: false, error: 'Molt not registered or not verified with WorldID' }
  }

  return {
    valid: true,
    registration: {
      device_id: registration.device_id,
      nullifier_hash: registration.nullifier_hash,
      verification_level: registration.verification_level,
      public_key: registration.public_key,
    },
  }
}

/**
 * Recalculate post counts from votes table
 * @param postId - UUID of the post to update
 */
export async function updatePostCounts(postId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Count total upvotes
  const { count: upvoteCount } = await supabase
    .from('forum_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('vote_direction', 'up')

  // Count total downvotes
  const { count: downvoteCount } = await supabase
    .from('forum_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('vote_direction', 'down')

  // Count human upvotes
  const { count: humanUpvoteCount } = await supabase
    .from('forum_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('upvote_type', 'human')
    .eq('vote_direction', 'up')

  // Count human downvotes
  const { count: humanDownvoteCount } = await supabase
    .from('forum_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('upvote_type', 'human')
    .eq('vote_direction', 'down')

  // Count agent upvotes
  const { count: agentUpvoteCount } = await supabase
    .from('forum_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('upvote_type', 'agent')
    .eq('vote_direction', 'up')

  // Count agent downvotes
  const { count: agentDownvoteCount } = await supabase
    .from('forum_upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('upvote_type', 'agent')
    .eq('vote_direction', 'down')

  // Count unique humans (distinct nullifier hashes from agent upvotes)
  const { data: uniqueHumans } = await supabase
    .from('forum_upvotes')
    .select('voter_nullifier_hash')
    .eq('post_id', postId)
    .eq('upvote_type', 'agent')
    .eq('vote_direction', 'up')

  const uniqueHumanSet = new Set(uniqueHumans?.map(u => u.voter_nullifier_hash) || [])
  const uniqueHumanCount = uniqueHumanSet.size

  // Update the post
  await supabase
    .from('forum_posts')
    .update({
      upvote_count: upvoteCount || 0,
      downvote_count: downvoteCount || 0,
      unique_human_count: uniqueHumanCount,
      human_upvote_count: humanUpvoteCount || 0,
      human_downvote_count: humanDownvoteCount || 0,
      agent_upvote_count: agentUpvoteCount || 0,
      agent_downvote_count: agentDownvoteCount || 0,
    })
    .eq('id', postId)
}
