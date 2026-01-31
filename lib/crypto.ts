// Ed25519 signature verification utilities
// Verifies signatures created by the OpenClaw OneMolt CLI tool

import crypto from 'crypto'

/**
 * Verifies an Ed25519 signature
 *
 * @param message - The message that was signed
 * @param signatureBase64 - The signature in base64 format
 * @param publicKeyBase64 - The public key in base64 DER format
 * @returns true if signature is valid, false otherwise
 */
export function verifyEd25519Signature(
  message: string,
  signatureBase64: string,
  publicKeyBase64: string
): boolean {
  try {
    // Decode the base64-encoded DER public key
    const publicKeyDer = Buffer.from(publicKeyBase64, 'base64')

    // Create a public key object from the DER data
    const publicKey = crypto.createPublicKey({
      key: publicKeyDer,
      type: 'spki',
      format: 'der',
    })

    // Decode the base64-encoded signature
    const signature = Buffer.from(signatureBase64, 'base64')

    // Convert message to buffer
    const messageBuffer = Buffer.from(message, 'utf8')

    // Verify the signature
    // For Ed25519, the first parameter (algorithm) should be null
    const isValid = crypto.verify(
      null,
      messageBuffer,
      publicKey,
      signature
    )

    return isValid
  } catch (error) {
    console.error('Ed25519 signature verification error:', error)
    return false
  }
}

/**
 * Validates that a string is a valid base64-encoded Ed25519 public key
 *
 * @param publicKeyBase64 - The public key to validate
 * @returns true if valid, false otherwise
 */
export function isValidPublicKey(publicKeyBase64: string): boolean {
  try {
    const publicKeyDer = Buffer.from(publicKeyBase64, 'base64')

    // Try to create a public key object
    crypto.createPublicKey({
      key: publicKeyDer,
      type: 'spki',
      format: 'der',
    })

    return true
  } catch (error) {
    return false
  }
}

/**
 * Validates that a string is a valid base64-encoded signature
 *
 * @param signatureBase64 - The signature to validate
 * @returns true if valid base64, false otherwise
 */
export function isValidSignature(signatureBase64: string): boolean {
  try {
    const signature = Buffer.from(signatureBase64, 'base64')
    // Ed25519 signatures are always 64 bytes
    return signature.length === 64
  } catch (error) {
    return false
  }
}

/**
 * Calculates SHA256 hash of a public key (for device ID)
 *
 * @param publicKeyBase64 - The public key in base64 format
 * @returns SHA256 hash as hex string
 */
export function calculateDeviceId(publicKeyBase64: string): string {
  const publicKeyDer = Buffer.from(publicKeyBase64, 'base64')
  return crypto.createHash('sha256').update(publicKeyDer).digest('hex')
}
