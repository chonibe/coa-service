import { createHmac, timingSafeEqual } from "crypto"

export interface CollectorSessionPayload {
  shopifyCustomerId: string | null
  email: string | null
  collectorIdentifier?: string | null
  impersonated?: boolean
  issuedAt: number
}

const SESSION_COOKIE_NAME = "collector_session"
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 // 24 hours

const base64UrlEncode = (value: string) => Buffer.from(value).toString("base64url")
const base64UrlDecode = (value: string) => Buffer.from(value, "base64url").toString("utf8")

const getSecret = () => {
  const secret = process.env.COLLECTOR_SESSION_SECRET || process.env.VENDOR_SESSION_SECRET
  if (!secret) {
    throw new Error("COLLECTOR_SESSION_SECRET (or VENDOR_SESSION_SECRET) is required for collector sessions")
  }
  return secret
}

const sign = (payload: string) => {
  const hmac = createHmac("sha256", getSecret())
  hmac.update(payload)
  return hmac.digest("base64url")
}

export const createCollectorSessionToken = (payload: CollectorSessionPayload): string => {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export const verifyCollectorSessionToken = (token: string | undefined): CollectorSessionPayload | null => {
  if (!token) return null
  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) return null

  const expectedSignature = sign(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)
  if (signatureBuffer.length !== expectedBuffer.length) return null
  const isValid = timingSafeEqual(signatureBuffer, expectedBuffer)
  if (!isValid) return null

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    // Require either a shopifyCustomerId or an email
    if (!payload?.shopifyCustomerId && !payload?.email) return null
    return payload
  } catch (error) {
    console.error("[collector-session] parse error", error)
    return null
  }
}

export interface CollectorSessionCookieOptions {
  maxAge?: number
  domain?: string
}

export const buildCollectorSessionCookie = (
  payload: CollectorSessionPayload,
  options: CollectorSessionCookieOptions = {},
) => {
  const token = createCollectorSessionToken(payload)
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: options.maxAge ?? DEFAULT_MAX_AGE_SECONDS,
    domain: options.domain ?? (process.env.NODE_ENV === "production" ? ".thestreetlamp.com" : undefined),
  }
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    options: cookieOptions,
  }
}

export const clearCollectorSessionCookie = () => ({
  name: SESSION_COOKIE_NAME,
  options: { path: "/", maxAge: 0 },
})

export const COLLECTOR_SESSION_COOKIE_NAME = SESSION_COOKIE_NAME

// Lightweight helper to extract collector session from a cookie store (NextRequest cookies)
export const getCollectorSession = (cookieStore: { get: (key: string) => { value?: string } | undefined }) => {
  const token = cookieStore.get?.(COLLECTOR_SESSION_COOKIE_NAME)?.value
  return verifyCollectorSessionToken(token)
}

