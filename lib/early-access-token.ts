/**
 * Early Access Token Utility
 * 
 * Generates and verifies HMAC-signed tokens for early access links.
 * Prevents unauthorized access by requiring a valid token in the URL.
 * 
 * Token format: base64url(JSON payload).base64url(HMAC signature)
 * Payload: { artistSlug, issuedAt, expiresAt }
 */

import { createHmac, timingSafeEqual } from 'crypto'

// ============================================
// Types
// ============================================

export interface EarlyAccessTokenPayload {
  /** Artist slug */
  artistSlug: string
  /** When the token was created (ms) */
  issuedAt: number
  /** When the token expires (ms) */
  expiresAt: number
}

// ============================================
// Constants
// ============================================

/** Token validity: 30 days */
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

// ============================================
// Secret Management
// ============================================

function getSigningSecret(): string {
  const secret = process.env.EARLY_ACCESS_TOKEN_SECRET || process.env.SUPABASE_JWT_SECRET
  if (!secret) {
    throw new Error('EARLY_ACCESS_TOKEN_SECRET or SUPABASE_JWT_SECRET must be set')
  }
  return secret
}

// ============================================
// Base64 URL Encoding/Decoding
// ============================================

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  // Add padding if needed
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf8')
}

// ============================================
// Token Generation
// ============================================

/**
 * Generate a secure token for an early access link
 */
export function generateEarlyAccessToken(artistSlug: string): string {
  const secret = getSigningSecret()
  const now = Date.now()
  const expiresAt = now + TOKEN_TTL_MS

  const payload: EarlyAccessTokenPayload = {
    artistSlug,
    issuedAt: now,
    expiresAt,
  }

  const serialized = JSON.stringify(payload)
  const payloadB64 = base64UrlEncode(serialized)
  const signature = createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64')
  const signatureB64 = signature
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${payloadB64}.${signatureB64}`
}

// ============================================
// Token Validation
// ============================================

/**
 * Validate an early access token and return the decoded payload, or null if invalid
 */
export function validateEarlyAccessToken(token: string): EarlyAccessTokenPayload | null {
  try {
    const [payloadB64, signatureB64] = token.split('.')
    if (!payloadB64 || !signatureB64) return null

    const secret = getSigningSecret()
    const expectedSig = createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64')
    const expectedSigUrl = expectedSig
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Use timing-safe comparison to prevent timing attacks
    if (expectedSigUrl.length !== signatureB64.length) return null
    if (!timingSafeEqual(Buffer.from(expectedSigUrl), Buffer.from(signatureB64))) {
      return null
    }

    const payloadStr = base64UrlDecode(payloadB64)
    const payload: EarlyAccessTokenPayload = JSON.parse(payloadStr)

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return null
    }

    return payload
  } catch (err) {
    console.error('[early-access-token] Validation failed:', err)
    return null
  }
}
