/**
 * Claim Token Utility
 * 
 * Generates and verifies HMAC-signed tokens for email-based collection claims.
 * Used in the post-purchase flow to let guest buyers claim their collector account
 * via a secure email link without requiring an existing Supabase account.
 * 
 * Token format: base64url(JSON payload).base64url(HMAC signature)
 * Payload: { email, purchaseId, issuedAt, expiresAt }
 * 
 * @module lib/auth/claim-token
 * @see app/api/stripe/webhook/route.ts - Token generation after purchase
 * @see app/collector/welcome/page.tsx - Token verification on claim
 */

import { createHmac, timingSafeEqual } from "crypto"

// ============================================
// Types
// ============================================

export interface ClaimTokenPayload {
  /** Purchaser's email address */
  email: string
  /** Stripe session ID or order ID for linking */
  purchaseId: string
  /** When the token was created (ms) */
  issuedAt: number
  /** When the token expires (ms) */
  expiresAt: number
}

// ============================================
// Constants
// ============================================

/** Token validity: 7 days */
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

// ============================================
// Helpers
// ============================================

function getSecret(): string {
  // Reuse an existing secret to avoid adding new env vars
  const secret = process.env.COLLECTOR_SESSION_SECRET || process.env.VENDOR_SESSION_SECRET
  if (!secret) {
    throw new Error("COLLECTOR_SESSION_SECRET or VENDOR_SESSION_SECRET required for claim tokens")
  }
  return secret
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString("base64url")
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8")
}

function sign(payload: string): string {
  const hmac = createHmac("sha256", getSecret())
  hmac.update(payload)
  return hmac.digest("base64url")
}

// ============================================
// Public API
// ============================================

/**
 * Generate a signed claim token for a purchase.
 * 
 * @param email - Purchaser email
 * @param purchaseId - Stripe session ID or internal purchase ID
 * @returns Signed token string
 */
export function generateClaimToken(email: string, purchaseId: string): string {
  const payload: ClaimTokenPayload = {
    email: email.toLowerCase().trim(),
    purchaseId,
    issuedAt: Date.now(),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

/**
 * Verify and decode a claim token.
 * 
 * @param token - Token string to verify
 * @returns Decoded payload if valid, null if invalid/expired
 */
export function verifyClaimToken(token: string): ClaimTokenPayload | null {
  if (!token) return null

  const parts = token.split(".")
  if (parts.length !== 2) return null

  const [encodedPayload, signature] = parts
  if (!encodedPayload || !signature) return null

  // Verify signature
  const expectedSignature = sign(encodedPayload)
  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (sigBuffer.length !== expectedBuffer.length) return null
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null

  // Decode payload
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as ClaimTokenPayload
    
    // Check required fields
    if (!payload.email || !payload.purchaseId || !payload.issuedAt || !payload.expiresAt) {
      return null
    }

    // Check expiry
    if (Date.now() > payload.expiresAt) {
      console.log("[claim-token] Token expired for:", payload.email)
      return null
    }

    return payload
  } catch (error) {
    console.error("[claim-token] Failed to parse token:", error)
    return null
  }
}

/**
 * Build a claim URL for inclusion in emails.
 * 
 * @param email - Purchaser email
 * @param purchaseId - Purchase ID
 * @returns Full claim URL
 */
export function buildClaimUrl(email: string, purchaseId: string): string {
  const token = generateClaimToken(email, purchaseId)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.thestreetcollector.com"
  return `${baseUrl}/collector/welcome?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
}
