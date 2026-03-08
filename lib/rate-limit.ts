/**
 * Simple in-memory rate limiter for API routes.
 * Keys by identifier (e.g. IP). Per serverless instance; not shared across Vercel workers.
 * Use for abuse prevention on checkout and payment endpoints.
 */

const store = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60 * 1000 // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

function cleanup() {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) store.delete(key)
  }
}

let cleanupTimer: ReturnType<typeof setInterval> | null = null
function scheduleCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS)
  if (cleanupTimer.unref) cleanupTimer.unref()
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit. Returns { success: false } if over limit.
 * @param identifier - e.g. IP address
 * @param limit - max requests per window
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number = WINDOW_MS
): RateLimitResult {
  scheduleCleanup()
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry) {
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.resetAt < now) {
    entry.count = 1
    entry.resetAt = now + windowMs
    return { success: true, remaining: limit - 1, resetAt: entry.resetAt }
  }

  entry.count += 1
  const remaining = Math.max(0, limit - entry.count)
  const success = entry.count <= limit
  return { success, remaining, resetAt: entry.resetAt }
}

/** Get client IP from NextRequest (Vercel/Next.js). */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}
