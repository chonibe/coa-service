import crypto from "crypto"

/**
 * Shared NFC token utilities.
 *
 * All NFC routes that need to sign or validate HMAC-SHA256 tokens should import
 * from this module instead of duplicating the helpers.
 */

// ---------------------------------------------------------------------------
// Base64-URL helpers
// ---------------------------------------------------------------------------

export const base64UrlEncode = (input: string): string =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

export const base64UrlDecode = (input: string): string => {
  const padded =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((input.length + 3) % 4)
  return Buffer.from(padded, "base64").toString()
}

// ---------------------------------------------------------------------------
// Signing secret
// ---------------------------------------------------------------------------

export const getSigningSecret = (): string => {
  const secret =
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) {
    throw new Error("Signing secret is not configured – set NEXTAUTH_SECRET, JWT_SECRET, or SUPABASE_SERVICE_ROLE_KEY")
  }

  return secret
}

// ---------------------------------------------------------------------------
// Sign & validate
// ---------------------------------------------------------------------------

export const signPayload = (payload: Record<string, unknown>): string => {
  const secret = getSigningSecret()
  const serialized = JSON.stringify(payload)
  const payloadB64 = base64UrlEncode(serialized)
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64")
  const signatureB64 = signature
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return `${payloadB64}.${signatureB64}`
}

/**
 * Validate an HMAC token string and return the decoded payload, or `null` if
 * the token is invalid or expired.
 */
export const validateToken = (token: string): Record<string, any> | null => {
  try {
    const [payloadB64, signatureB64] = token.split(".")
    if (!payloadB64 || !signatureB64) return null

    const secret = getSigningSecret()
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payloadB64)
      .digest("base64")
    const expectedSigUrl = expectedSig
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")

    if (expectedSigUrl !== signatureB64) return null

    const payloadStr = base64UrlDecode(payloadB64)
    const payload = JSON.parse(payloadStr)

    if (payload.exp && Date.now() > payload.exp) {
      return null
    }

    return payload
  } catch (err) {
    console.error("Token validation failed:", err)
    return null
  }
}
