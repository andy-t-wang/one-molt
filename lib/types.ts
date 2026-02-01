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
