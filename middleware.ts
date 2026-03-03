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

export async function middleware(request: NextRequest) {
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
