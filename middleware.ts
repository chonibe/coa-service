import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit'
import {
  addCorsHeaders,
  handleCorsPreflight,
} from '@/lib/middleware/cors'
import {
  getAffiliateArtistSlugFromSearchParams,
  AFFILIATE_ARTIST_COOKIE_NAME,
} from '@/lib/affiliate-tracking'

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach(({ name, value, options }) =>
    to.cookies.set(name, value, options)
  )
  return to
}

const BARE_DOMAIN = 'thestreetcollector.com'
const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function setAffiliateCookie(response: NextResponse, slug: string): void {
  response.cookies.set(AFFILIATE_ARTIST_COOKIE_NAME, slug, {
    path: '/',
    maxAge: AFFILIATE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function middleware(request: NextRequest) {
  let affiliateSlug: string | undefined
  try {
    const searchParams = request.nextUrl.searchParams
    const raw = getAffiliateArtistSlugFromSearchParams({
      artist: searchParams.get('artist'),
      utm_campaign: searchParams.get('utm_campaign'),
    })
    // Only use slug if safe length (avoid oversized/malformed params affecting response)
    if (raw && raw.length <= 200) affiliateSlug = raw
  } catch {
    // Malformed query string (e.g. bad encoding from fbclid) — skip affiliate cookie, continue
  }

  // Redirect bare domain to www so /products/* and /collections/* rewrites are served
  const host = request.headers.get('host') ?? ''
  if (host === BARE_DOMAIN) {
    try {
      const path = request.nextUrl.pathname + request.nextUrl.search
      const wwwUrl = new URL(`https://www.${BARE_DOMAIN}${path}`)
      const redirect = NextResponse.redirect(wwwUrl, 308)
      if (affiliateSlug) setAffiliateCookie(redirect, affiliateSlug)
      return redirect
    } catch {
      // If URL construction fails (e.g. very long search), redirect without query to avoid 422
      const redirect = NextResponse.redirect(new URL(`https://www.${BARE_DOMAIN}${request.nextUrl.pathname}`), 308)
      if (affiliateSlug) setAffiliateCookie(redirect, affiliateSlug)
      return redirect
    }
  }

  const supabaseResponse = await updateSession(request)

  // Set affiliate cookie on any request with artist/utm_campaign so experience vendor filter can use it
  if (affiliateSlug) setAffiliateCookie(supabaseResponse, affiliateSlug)

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
