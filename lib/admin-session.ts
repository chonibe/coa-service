import { createHmac, timingSafeEqual } from "crypto"

const ADMIN_SESSION_COOKIE = "admin_session"
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 // 1 hour

interface AdminSessionPayload {
  email: string
  issuedAt: number
}

const getSecret = () => {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET environment variable is required for admin sessions")
  }
  return secret
}

const base64UrlEncode = (value: string) => Buffer.from(value).toString("base64url")
const base64UrlDecode = (value: string) => Buffer.from(value, "base64url").toString("utf8")

const sign = (payload: string) => {
  const hmac = createHmac("sha256", getSecret())
  hmac.update(payload)
  return hmac.digest("base64url")
}

export const createAdminSessionToken = (email: string): string => {
  const payload: AdminSessionPayload = {
    email,
    issuedAt: Date.now(),
  }
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export const verifyAdminSessionToken = (token: string | undefined): AdminSessionPayload | null => {
  if (!token) return null

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

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    if (!payload?.email) {
      return null
    }
    return payload
  } catch (error) {
    console.error("Failed to parse admin session payload:", error)
    return null
  }
}

export const buildAdminSessionCookie = (email: string) => {
  const token = createAdminSessionToken(email)
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    options: {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: DEFAULT_MAX_AGE_SECONDS,
    },
  }
}

export const clearAdminSessionCookie = () => ({
  name: ADMIN_SESSION_COOKIE,
  options: {
    path: "/",
    maxAge: 0,
  },
})

type CookieStoreLike = {
  get: (name: string) => { value?: string } | undefined
}

export const getAdminEmailFromCookieStore = (cookieStore: CookieStoreLike) => {
  const cookie = cookieStore.get(ADMIN_SESSION_COOKIE)
  const payload = verifyAdminSessionToken(cookie?.value)
  return payload?.email ?? null
}

export const ADMIN_SESSION_COOKIE_NAME = ADMIN_SESSION_COOKIE

