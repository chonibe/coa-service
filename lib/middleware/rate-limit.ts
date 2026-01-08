import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getRateLimitHeaders, RateLimitConfig } from "@/lib/crm/rate-limiter"

/**
 * Get user identifier from request (IP address or user ID)
 */
function getUserId(request: NextRequest): string {
  // Try to get user ID from auth header or session
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    // Extract user ID from token if possible
    // For now, use IP address as fallback
  }

  // Use IP address as identifier
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.ip || "unknown"

  return ip
}

/**
 * Rate limit configuration for different endpoint types
 */
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - stricter limits
  auth: {
    readLimit: 10, // 10 requests per second
    writeLimit: 5, // 5 requests per second
    windowMs: 1000,
  },
  // Webhook endpoints - moderate limits
  webhook: {
    readLimit: 50,
    writeLimit: 20,
    windowMs: 1000,
  },
  // API endpoints - default limits
  api: {
    readLimit: 100,
    writeLimit: 25,
    windowMs: 1000,
  },
  // Public endpoints - stricter limits
  public: {
    readLimit: 30,
    writeLimit: 10,
    windowMs: 1000,
  },
}

/**
 * Determine rate limit config based on path
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Authentication endpoints
  if (
    pathname.includes("/auth") ||
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/logout")
  ) {
    return RATE_LIMIT_CONFIGS.auth
  }

  // Webhook endpoints
  if (pathname.includes("/webhooks")) {
    return RATE_LIMIT_CONFIGS.webhook
  }

  // Public endpoints (no auth required)
  if (
    pathname.includes("/public") ||
    pathname.includes("/track") ||
    pathname.includes("/certificate")
  ) {
    return RATE_LIMIT_CONFIGS.public
  }

  // Default API limits
  return RATE_LIMIT_CONFIGS.api
}

/**
 * Rate limiting middleware for API routes
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const userId = getUserId(request)
  const method = request.method
  const pathname = request.nextUrl.pathname

  // Get appropriate rate limit config
  const config = getRateLimitConfig(pathname)

  // Check rate limit
  const rateLimitCheck = checkRateLimit(userId, method, config)

  // If rate limited, return 429
  if (!rateLimitCheck.allowed) {
    const headers = new Headers(getRateLimitHeaders(userId, method, config))
    if (rateLimitCheck.retryAfter) {
      headers.set("Retry-After", rateLimitCheck.retryAfter.toString())
    }

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Too many requests, please try again later",
        retryAfter: rateLimitCheck.retryAfter,
      },
      {
        status: 429,
        headers,
      }
    )
  }

  // Return null to continue with the request
  return null
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const userId = getUserId(request)
  const method = request.method
  const pathname = request.nextUrl.pathname
  const config = getRateLimitConfig(pathname)

  const headers = getRateLimitHeaders(userId, method, config)
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

