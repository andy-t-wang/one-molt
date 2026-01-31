// WorldID proof verification
// Verifies WorldID proofs against the WorldID Developer Portal API

import { verifyCloudProof } from '@worldcoin/idkit'
import type { ISuccessResult } from '@worldcoin/idkit'
import type { WorldIDProof } from './types'

/**
 * Verifies a WorldID proof with the WorldID API using the official SDK
 *
 * @param proof - The WorldID proof object
 * @param signal - Signal (used to bind proof to specific action, e.g., device ID)
 * @returns true if proof is valid, false otherwise
 */
export async function verifyWorldIDProof(
  proof: WorldIDProof,
  signal?: string
): Promise<{ success: boolean; error?: string }> {
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

  try {
    // Use the official WorldID SDK to verify the proof
    const verifyRes = await verifyCloudProof(
      {
        proof: proof.proof,
        merkle_root: proof.merkle_root,
        nullifier_hash: proof.nullifier_hash,
        verification_level: proof.verification_level,
      } as ISuccessResult,
      appId as `app_${string}`,
      action,
      signal
    )

    if (verifyRes.success) {
      return { success: true }
    } else {
      console.error('WorldID verification failed:', verifyRes)
      return {
        success: false,
        error: verifyRes.detail || 'WorldID verification failed',
      }
    }
  } catch (error) {
    console.error('WorldID verification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'WorldID verification failed',
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
  if (!proof || typeof proof !== "object") {
    return false;
  }

  const p = proof as Record<string, unknown>;

  return (
    typeof p.proof === "string" &&
    p.proof.length > 0 &&
    typeof p.merkle_root === "string" &&
    p.merkle_root.length > 0 &&
    typeof p.nullifier_hash === "string" &&
    p.nullifier_hash.length > 0 &&
    typeof p.verification_level === "string" &&
    p.verification_level.length > 0
  );
}

/**
 * Validates verification level
 *
 * @param level - The verification level string
 * @returns true if valid verification level
 */
export function isValidVerificationLevel(level: string): boolean {
  const validLevels = ["orb", "device", "face"];
  return validLevels.includes(level);
}
