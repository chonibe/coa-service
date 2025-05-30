import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple in-memory store for rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 60 // 60 requests per minute

export function middleware(request: NextRequest) {
  // Skip middleware for API routes except customer orders
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/customer/orders')) {
    return NextResponse.next()
  }

  // Apply rate limiting for customer orders API
  if (request.nextUrl.pathname.startsWith('/api/customer/orders')) {
    // Get IP from headers or use a fallback
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown'
    const now = Date.now()
    const windowStart = now - RATE_LIMIT_WINDOW

    // Clean up old entries
    for (const [key, value] of rateLimit.entries()) {
      if (value.resetTime < windowStart) {
        rateLimit.delete(key)
      }
    }

    // Get or create rate limit entry
    const rateLimitEntry = rateLimit.get(ip) || { count: 0, resetTime: now }
    
    // Check if rate limit is exceeded
    if (rateLimitEntry.count >= MAX_REQUESTS) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Update rate limit
    rateLimitEntry.count++
    rateLimit.set(ip, rateLimitEntry)

    // Add rate limit headers
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString())
    response.headers.set('X-RateLimit-Remaining', (MAX_REQUESTS - rateLimitEntry.count).toString())
    response.headers.set('X-RateLimit-Reset', (rateLimitEntry.resetTime + RATE_LIMIT_WINDOW).toString())
    
    return response
  }

  // Check if the request is for an admin page (except the login page)
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
    // Check if the user is authenticated
    const isAuthenticated = request.cookies.has("admin_session")

    if (!isAuthenticated) {
      // Redirect to the login page
      const loginUrl = new URL("/admin/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

// Update the matcher to properly exclude API routes
export const config = {
  matcher: [
    // Match admin routes except login and API routes
    "/admin/:path*",
    // Match customer orders API
    "/api/customer/orders",
    // Exclude API routes, certificate routes, and static files
    "/((?!api|certificate|_next/static|_next/image|favicon.ico).*)",
  ],
}
