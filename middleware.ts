import { NextRequest, NextResponse } from "next/server"
import { rateLimitMiddleware, addRateLimitHeaders } from "@/lib/middleware/rate-limit"
import { corsMiddleware, addCorsHeaders, handleCorsPreflight } from "@/lib/middleware/cors"

export async function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    const corsResponse = handleCorsPreflight(request)
    if (corsResponse) {
      return corsResponse
    }
  }

  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    const rateLimitResponse = rateLimitMiddleware(request)
    if (rateLimitResponse) {
      return addCorsHeaders(rateLimitResponse, request)
    }
  }

  // Continue with the request
  const response = NextResponse.next()

  // Add CORS headers if needed
  if (request.nextUrl.pathname.startsWith("/api")) {
    return addCorsHeaders(response, request)
  }

  return response
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
}



