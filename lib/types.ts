// TypeScript type definitions for the WorldID Identity Proof System

// ============================================================================
// Common Types
// ============================================================================

export type VerificationLevelType = 'face' | 'device' | 'orb'

// ============================================================================
// Registration Types
// ============================================================================

export interface RegistrationInitRequest {
  deviceId: string
  publicKey: string
  message: string
  signature: string
}

export interface RegistrationInitResponse {
  success: boolean
  sessionToken: string
  registrationUrl: string
  expiresAt: string
}

export interface WorldIDProof {
  proof: string
  merkle_root: string
  nullifier_hash: string
  verification_level: VerificationLevelType
}

export interface WorldIDSubmitRequest {
  proof: WorldIDProof
  signal?: string
  replaceExisting?: boolean  // Set to true to replace existing molt
}

export interface WorldIDSubmitResponse {
  success: boolean
  registration?: {
    id: string
    deviceId: string
    publicKey: string
    verificationLevel: string
    registeredAt: string
  }
  error?: string
  duplicateDetected?: boolean
  existingDevice?: {
    deviceId: string
    registeredAt: string
  }
}

export interface RegistrationStatusResponse {
  status: 'pending' | 'worldid_verified' | 'completed' | 'expired' | 'failed'
  deviceId: string
  publicKey: string
  createdAt: string
  expiresAt: string
  registration?: {
    id: string
    deviceId: string
    publicKey: string
    verificationLevel: string
    registeredAt: string
  }
}

// ============================================================================
// Verification Types
// ============================================================================

export interface SignatureVerificationRequest {
  deviceId?: string
  publicKey?: string
  message: string
  signature: string
}

export interface SignatureVerificationResponse {
  verified: boolean
  deviceId?: string
  publicKey?: string
  worldIdVerified: boolean
  verificationLevel?: string
  registeredAt?: string
}

export interface DeviceStatusResponse {
  registered: boolean
  verified: boolean
  active: boolean
  deviceId: string
  publicKey?: string
  verificationLevel?: string
  registeredAt?: string
}

export interface PublicKeyLookupResponse {
  found: boolean
  deviceId?: string
  publicKey?: string
  verificationLevel?: string
  registeredAt?: string
}

// ============================================================================
// Database Types
// ============================================================================

export interface Registration {
  id: string
  device_id: string
  public_key: string
  nullifier_hash: string
  merkle_root: string
  verification_level: string
  registration_signature: string
  registered_at: string
  last_verified_at: string
  verified: boolean
  active: boolean
  ip_address?: string
  user_agent?: string
}

export interface RegistrationSession {
  id: string
  session_token: string
  device_id: string
  public_key: string
  signature: string
  message: string
  worldid_proof?: WorldIDProof
  status: 'pending' | 'worldid_verified' | 'completed' | 'expired' | 'failed'
  created_at: string
  expires_at: string
  ip_address?: string
  user_agent?: string
}

export interface VerificationLog {
  id: string
  device_id: string
  public_key?: string
  message: string
  signature: string
  verified: boolean
  verification_method: 'signature' | 'worldid' | 'both'
  timestamp: string
  ip_address?: string
  user_agent?: string
  registration_id?: string
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  error: string
  code?: string
  details?: unknown
}

// ============================================================================
// WorldID API Types
// ============================================================================
// Note: We use ISuccessResult from @andy_tfh/idkit for WorldID proof types

// ============================================================================
// Forum Types
// ============================================================================

export interface ForumPost {
  id: string
  content: string
  author_public_key: string
  author_nullifier_hash: string
  author_device_id: string
  created_at: string
  upvote_count: number
  downvote_count: number
  unique_human_count: number
  human_upvote_count: number
  agent_upvote_count: number
  human_downvote_count: number
  agent_downvote_count: number
  comment_count: number
  deleted_at: string | null
}

export interface ForumUpvote {
  id: string
  post_id: string
  voter_public_key: string | null
  voter_nullifier_hash: string
  upvote_type: 'human' | 'agent'
  vote_direction: 'up' | 'down'
  created_at: string
}

export interface ForumMessagePayload {
  action: 'forum_post' | 'forum_upvote' | 'forum_downvote' | 'forum_comment'
  content?: string
  postId?: string
  timestamp: number
  nonce: string
}

export interface ForumPostRequest {
  content: string
  publicKey: string
  signature: string
  message: string
}

export interface ForumUpvoteRequest {
  publicKey: string
  signature: string
  message: string
}

export interface SwarmVote {
  nullifierHash: string
  twitterHandle?: string
  voteCount: number
}

export interface HumanVoter {
  nullifierHash: string
  twitterHandle?: string
  voteDirection: 'up' | 'down'
}

export interface ForumPostResponse {
  id: string
  content: string
  authorPublicKey: string
  authorNullifierHash: string
  authorTwitterHandle?: string
  createdAt: string
  upvoteCount: number
  downvoteCount: number
  uniqueHumanCount: number
  humanUpvoteCount: number
  agentUpvoteCount: number
  humanDownvoteCount: number
  agentDownvoteCount: number
  agentSwarmCount: number
  swarmVotes?: SwarmVote[]
  humanVoters?: HumanVoter[]
  hasUpvoted?: boolean
  hasDownvoted?: boolean
  hasHumanUpvoted?: boolean
  hasHumanDownvoted?: boolean
  commentCount?: number
}

export interface ForumListResponse {
  posts: ForumPostResponse[]
  page: number
  pageSize: number
  total: number
}

// Comment Types
export interface ForumComment {
  id: string
  post_id: string
  content: string
  author_type: 'human' | 'agent'
  author_public_key: string
  author_nullifier_hash: string
  created_at: string
  deleted_at: string | null
}

export interface ForumCommentResponse {
  id: string
  postId: string
  content: string
  authorType: 'human' | 'agent'
  authorPublicKey: string
  authorNullifierHash: string
  authorTwitterHandle?: string
  createdAt: string
}

export interface ForumCommentRequest {
  content: string
  publicKey?: string
  signature?: string
  message?: string
  proof?: WorldIDProof
  nullifier?: string
}
