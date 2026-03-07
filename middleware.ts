import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit'
import {
  addCorsHeaders,
  handleCorsPreflight,
} from '@/lib/middleware/cors'

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach(({ name, value, options }) =>
    to.cookies.set(name, value, options)
  )
  return to
}

const BARE_DOMAIN = 'thestreetcollector.com'

export async function middleware(request: NextRequest) {
  // Redirect bare domain to www so /products/* and /collections/* rewrites are served
  const host = request.headers.get('host') ?? ''
  if (host === BARE_DOMAIN) {
    const path = request.nextUrl.pathname + request.nextUrl.search
    const wwwUrl = new URL(`https://www.${BARE_DOMAIN}${path}`)
    return NextResponse.redirect(wwwUrl, 308)
  }

  const supabaseResponse = await updateSession(request)

  if (request.method === 'OPTIONS') {
    const corsResponse = handleCorsPreflight(request)
    if (corsResponse) {
      return copyCookies(supabaseResponse, corsResponse)
    }
  }

  if (request.nextUrl.pathname.startsWith('/api')) {
    const rateLimitResponse = rateLimitMiddleware(request)
    if (rateLimitResponse) {
      const withCookies = copyCookies(supabaseResponse, rateLimitResponse)
      return addCorsHeaders(withCookies, request)
    }
    return addCorsHeaders(supabaseResponse, request)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
