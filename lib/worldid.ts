// WorldID proof verification
// Verifies WorldID proofs against the WorldID Developer Portal API

import type { WorldIDProof, WorldIDVerifyRequest, WorldIDVerifyResponse } from './types'

/**
 * Verifies a WorldID proof with the WorldID API
 *
 * @param proof - The WorldID proof object
 * @param signal - Optional signal (used to bind proof to specific action)
 * @returns true if proof is valid, false otherwise
 */
export async function verifyWorldIDProof(
  proof: WorldIDProof,
  signal?: string
): Promise<{ success: boolean; error?: string }> {
  const apiUrl = process.env.WORLDID_API_URL || 'https://developer.worldcoin.org/api/v2/verify'
  const appId = process.env.NEXT_PUBLIC_WORLDID_APP_ID
  const action = process.env.NEXT_PUBLIC_WORLDID_ACTION

  if (!appId) {
    console.error('Missing NEXT_PUBLIC_WORLDID_APP_ID environment variable')
    return { success: false, error: 'WorldID configuration error' }
  }

  if (!action) {
    console.error('Missing NEXT_PUBLIC_WORLDID_ACTION environment variable')
    return { success: false, error: 'WorldID configuration error' }
  }

  const requestBody: WorldIDVerifyRequest = {
    app_id: appId,
    action: action,
    signal: signal || '',
    proof: proof.proof,
    merkle_root: proof.merkle_root,
    nullifier_hash: proof.nullifier_hash,
    verification_level: proof.verification_level,
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const result: WorldIDVerifyResponse = await response.json()

    if (!response.ok) {
      console.error('WorldID API error:', result)
      return {
        success: false,
        error: result.detail || `WorldID verification failed with status ${response.status}`,
      }
    }

    if (result.success !== true) {
      console.error('WorldID verification failed:', result)
      return {
        success: false,
        error: result.detail || 'WorldID verification failed',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('WorldID API request error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'WorldID API request failed',
    }
  }
}

/**
 * Validates WorldID proof structure
 *
 * @param proof - The proof object to validate
 * @returns true if proof has all required fields
 */
export function isValidWorldIDProof(proof: unknown): proof is WorldIDProof {
  if (!proof || typeof proof !== 'object') {
    return false
  }

  const p = proof as Record<string, unknown>

  return (
    typeof p.proof === 'string' &&
    p.proof.length > 0 &&
    typeof p.merkle_root === 'string' &&
    p.merkle_root.length > 0 &&
    typeof p.nullifier_hash === 'string' &&
    p.nullifier_hash.length > 0 &&
    typeof p.verification_level === 'string' &&
    p.verification_level.length > 0
  )
}

/**
 * Validates verification level
 *
 * @param level - The verification level string
 * @returns true if valid verification level
 */
export function isValidVerificationLevel(level: string): boolean {
  const validLevels = ['orb', 'device', 'face']
  return validLevels.includes(level)
}
