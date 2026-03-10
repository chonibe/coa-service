import { NextRequest, NextResponse } from "next/server"

/**
 * ALLOWED_ORIGINS (optional): Comma-separated list of origins allowed for CORS.
 * - Production: Use explicit origins only (e.g. https://app.example.com). Wildcard (*) and
 *   subdomain wildcards (*.example.com) from this env are ignored in production for security.
 * - Development: Wildcard subdomains (e.g. *.thestreetcollector.com) are allowed if set.
 * - Never set to * in production. Prefer explicit origins.
 * @see docs/VERCEL_ENV_VARIABLES.md
 */
export function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || []
  const defaultOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const isProduction = process.env.NODE_ENV === 'production'

  // In production, only allow explicit origins from env (no * or *.domain)
  const allowedOrigins = isProduction
    ? raw.filter((o) => o !== '*' && !o.startsWith('*.'))
    : raw

  const origins = new Set([
    defaultOrigin,
    'https://app.thestreetcollector.com',
    'https://thestreetcollector.com',
    'http://localhost:3000',
    'http://localhost:3001',
    ...allowedOrigins,
  ])

  return Array.from(origins)
}

/**
 * Validate if an origin is allowed
 */
export function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) {
    // Same-origin requests don't have an Origin header
    return true
  }
  
  return allowedOrigins.some(allowed => {
    // Exact match
    if (origin === allowed) {
      return true
    }
    
    // Wildcard subdomain support (e.g., *.example.com)
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2)
      try {
        const originUrl = new URL(origin)
        return originUrl.hostname === domain || originUrl.hostname.endsWith('.' + domain)
      } catch {
        return false
      }
    }
    
    return false
  })
}

/**
 * CORS middleware to validate and set CORS headers
 */
export function corsMiddleware(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const allowedOrigins = getAllowedOrigins()
  
  // For same-origin requests (no Origin header), allow
  if (!origin) {
    return null
  }
  
  // Validate origin
  if (!isOriginAllowed(origin, allowedOrigins)) {
    return NextResponse.json(
      { error: 'CORS policy: Origin not allowed' },
      { status: 403 }
    )
  }
  
  // Return null to continue with the request
  // The actual CORS headers will be set in the response handler
  return null
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin')
  const allowedOrigins = getAllowedOrigins()
  
  // If origin is allowed, set it in the response
  if (origin && isOriginAllowed(origin, allowedOrigins)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  } else if (!origin) {
    // Same-origin request - allow credentials
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const allowedOrigins = getAllowedOrigins()
  
  // Validate origin for preflight
  if (origin && !isOriginAllowed(origin, allowedOrigins)) {
    return NextResponse.json(
      { error: 'CORS policy: Origin not allowed' },
      { status: 403 }
    )
  }
  
  const response = new NextResponse(null, { status: 204 })
  return addCorsHeaders(response, request)
}

