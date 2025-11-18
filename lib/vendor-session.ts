import { createHmac, timingSafeEqual } from "crypto"

export interface VendorSessionPayload {
  vendorName: string
  issuedAt: number
}

const SESSION_COOKIE_NAME = "vendor_session"
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 // 24 hours

const base64UrlEncode = (value: string) => Buffer.from(value).toString("base64url")
const base64UrlDecode = (value: string) => Buffer.from(value, "base64url").toString("utf8")

const getSecret = () => {
  const secret = process.env.VENDOR_SESSION_SECRET
  if (!secret) {
    throw new Error("VENDOR_SESSION_SECRET environment variable is required for vendor sessions")
  }
  return secret
}

const sign = (payload: string) => {
  const hmac = createHmac("sha256", getSecret())
  hmac.update(payload)
  return hmac.digest("base64url")
}

export const createVendorSessionToken = (vendorName: string): string => {
  const payload: VendorSessionPayload = {
    vendorName,
    issuedAt: Date.now(),
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export const verifyVendorSessionToken = (token: string | undefined): VendorSessionPayload | null => {
  if (!token) {
    return null
  }

  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = sign(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null
  }

  // Use timing safe comparison to prevent timing attacks
  const isValid = timingSafeEqual(signatureBuffer, expectedBuffer)
  if (!isValid) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    if (!payload?.vendorName) {
      return null
    }
    return payload
  } catch (error) {
    console.error("Failed to parse vendor session payload:", error)
    return null
  }
}

export interface VendorSessionCookieOptions {
  maxAge?: number
}

export const buildVendorSessionCookie = (
  vendorName: string,
  options: VendorSessionCookieOptions = {},
) => {
  const token = createVendorSessionToken(vendorName)

  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, // Changed from "strict" to "lax" to allow cookies on redirects
    maxAge: options.maxAge ?? DEFAULT_MAX_AGE_SECONDS,
  }
  
  // In production, ensure secure cookies work with HTTPS
  // Don't set domain - let browser handle it automatically
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    options: cookieOptions,
  }
}

export const clearVendorSessionCookie = () => ({
  name: SESSION_COOKIE_NAME,
  options: {
    path: "/",
    maxAge: 0,
  },
})

type CookieStoreLike = {
  get: (name: string) => { value?: string } | undefined
}

export const getVendorFromCookieStore = (cookieStore: CookieStoreLike) => {
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)
  const token = cookie?.value
  if (!token) {
    console.log(`[vendor-session] No cookie found with name: ${SESSION_COOKIE_NAME}`)
    return null
  }
  const payload = verifyVendorSessionToken(token)
  if (!payload) {
    console.log(`[vendor-session] Invalid or expired token`)
    return null
  }
  console.log(`[vendor-session] Valid vendor session: ${payload.vendorName}`)
  return payload.vendorName
}

export const VENDOR_SESSION_COOKIE_NAME = SESSION_COOKIE_NAME

