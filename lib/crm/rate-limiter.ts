/**
 * Rate Limiter
 * Implements Attio-style rate limiting: 100 req/sec for reads, 25 req/sec for writes
 */

export interface RateLimitConfig {
  readLimit: number // requests per second
  writeLimit: number // requests per second
  windowMs: number // time window in milliseconds
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  readLimit: 100,
  writeLimit: 25,
  windowMs: 1000, // 1 second
}

/**
 * Rate limit store (in-memory for now)
 * In production, use Redis or similar for distributed rate limiting
 */
class RateLimitStore {
  private requests: Map<string, number[]> = new Map()

  /**
   * Record a request
   */
  recordRequest(key: string, timestamp: number): void {
    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }
    const timestamps = this.requests.get(key)!
    timestamps.push(timestamp)

    // Clean up old timestamps (older than 1 second)
    const cutoff = timestamp - 1000
    const filtered = timestamps.filter((ts) => ts > cutoff)
    this.requests.set(key, filtered)
  }

  /**
   * Get request count in the current window
   */
  getRequestCount(key: string, windowMs: number): number {
    const timestamps = this.requests.get(key) || []
    const now = Date.now()
    const cutoff = now - windowMs
    return timestamps.filter((ts) => ts > cutoff).length
  }

  /**
   * Clear old entries (cleanup)
   */
  cleanup(): void {
    const now = Date.now()
    const cutoff = now - 60000 // Keep last minute

    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter((ts) => ts > cutoff)
      if (filtered.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, filtered)
      }
    }
  }
}

const rateLimitStore = new RateLimitStore()

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    rateLimitStore.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Check if a request should be rate limited
 * @param userId - User ID or IP address
 * @param method - HTTP method (GET for reads, POST/PUT/DELETE for writes)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and retryAfter timestamp
 */
export function checkRateLimit(
  userId: string,
  method: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; retryAfter?: number; remaining?: number } {
  const isRead = method === "GET" || method === "HEAD" || method === "OPTIONS"
  const limit = isRead ? config.readLimit : config.writeLimit
  const key = `${userId}:${isRead ? "read" : "write"}`

  const now = Date.now()
  rateLimitStore.recordRequest(key, now)

  const count = rateLimitStore.getRequestCount(key, config.windowMs)

  if (count > limit) {
    // Calculate retry after (next second)
    const retryAfter = Math.ceil((now + config.windowMs) / 1000)
    return {
      allowed: false,
      retryAfter,
      remaining: 0,
    }
  }

  return {
    allowed: true,
    remaining: limit - count,
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  userId: string,
  method: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Record<string, string> {
  const isRead = method === "GET" || method === "HEAD" || method === "OPTIONS"
  const limit = isRead ? config.readLimit : config.writeLimit
  const key = `${userId}:${isRead ? "read" : "write"}`

  const count = rateLimitStore.getRequestCount(key, config.windowMs)
  const remaining = Math.max(0, limit - count)

  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.ceil((Date.now() + config.windowMs) / 1000).toString(),
  }
}

/**
 * Client-side rate limit handler
 * Detects 429 responses and retries with exponential backoff
 */
export async function handleRateLimit<T>(
  requestFn: () => Promise<Response>
): Promise<Response> {
  let retries = 0
  const maxRetries = 3

  while (retries <= maxRetries) {
    const response = await requestFn()

    if (response.status !== 429) {
      return response
    }

    // Get retry-after header
    const retryAfterHeader = response.headers.get("Retry-After")
    let retryAfterMs = 1000 // Default 1 second

    if (retryAfterHeader) {
      // Retry-After can be seconds (number) or HTTP date
      const retryAfter = parseInt(retryAfterHeader, 10)
      if (!isNaN(retryAfter)) {
        retryAfterMs = retryAfter * 1000
      } else {
        // Try parsing as HTTP date
        const retryDate = new Date(retryAfterHeader)
        if (!isNaN(retryDate.getTime())) {
          retryAfterMs = Math.max(0, retryDate.getTime() - Date.now())
        }
      }
    } else {
      // Exponential backoff
      retryAfterMs = Math.min(1000 * Math.pow(2, retries), 10000)
    }

    if (retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs))
      retries++
    } else {
      // Max retries reached
      return response
    }
  }

  return await requestFn()
}

