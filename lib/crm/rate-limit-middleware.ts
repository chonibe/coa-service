/**
 * Rate Limit Middleware for App Router
 * Adds rate limit checking and headers to Next.js App Router API routes
 */

import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getRateLimitHeaders } from "./rate-limiter"

/**
 * Get user identifier from request
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
 * Rate limit middleware wrapper for App Router
 */
export async function withRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const userId = getUserId(request)
  const method = request.method

  // Check rate limit
  const rateLimitCheck = checkRateLimit(userId, method)

  // Get rate limit headers
  const rateLimitHeaders = getRateLimitHeaders(userId, method)

  // If rate limited, return 429
  if (!rateLimitCheck.allowed) {
    const headers = new Headers(rateLimitHeaders)
    if (rateLimitCheck.retryAfter) {
      headers.set("Retry-After", rateLimitCheck.retryAfter.toString())
    }

    return NextResponse.json(
      {
        status_code: 429,
        type: "rate_limit_error",
        code: "rate_limit_exceeded",
        message: "Rate limit exceeded, please try again later",
      },
      {
        status: 429,
        headers,
      }
    )
  }

  // Call the handler
  const response = await handler(request)

  // Add rate limit headers to response
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Helper to add rate limit headers to any response
 */
export function addRateLimitHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const userId = getUserId(request)
  const method = request.method
  const headers = getRateLimitHeaders(userId, method)

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

