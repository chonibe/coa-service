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
  AFFILIATE_SESSION_COOKIE_NAME,
  AFFILIATE_DISMISSED_COOKIE_NAME,
  AFFILIATE_PRODUCT_COOKIE_NAME,
  buildAffiliateQueryString,
} from '@/lib/affiliate-tracking'

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach(({ name, value, options }) =>
    to.cookies.set(name, value, options)
  )
  return to
}

const BARE_DOMAIN = 'thestreetcollector.com'
const CANONICAL_HOST = 'www.thestreetcollector.com'
const APP_HOST = 'app.thestreetcollector.com'
/** Redirect these hosts to canonical domain so product/collection links and cookies work */
const REDIRECT_TO_CANONICAL_HOSTS = ['thestreetlamp.com', 'www.thestreetlamp.com']
const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const META_ATTR_COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90 days
const META_FBCLID_COOKIE_NAME = 'sc_fbclid'
const META_FBC_COOKIE_NAME = 'sc_fbc'

function deriveFbcFromFbclid(fbclid: string): string {
  const ts = Math.floor(Date.now() / 1000)
  return `fb.1.${ts}.${fbclid}`
}

function setMetaAttributionCookies(response: NextResponse, fbclid?: string | null): void {
  if (!fbclid) return
  const value = fbclid.trim()
  if (!value || value.length > 500) return
  response.cookies.set(META_FBCLID_COOKIE_NAME, value, {
    path: '/',
    maxAge: META_ATTR_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  // Persist first-party FBC equivalent for server-side conversion attribution.
  response.cookies.set(META_FBC_COOKIE_NAME, deriveFbcFromFbclid(value), {
    path: '/',
    maxAge: META_ATTR_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

function setAffiliateCookie(response: NextResponse, slug: string): void {
  response.cookies.set(AFFILIATE_ARTIST_COOKIE_NAME, slug, {
    path: '/',
    maxAge: AFFILIATE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

/** Set cookie with affiliate query string so server can attribute session for tracking */
function setAffiliateSessionCookie(response: NextResponse, queryString: string): void {
  if (!queryString) return
  response.cookies.set(AFFILIATE_SESSION_COOKIE_NAME, queryString, {
    path: '/',
    maxAge: AFFILIATE_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

/** Clear the dismissed cookie so a new affiliate link is treated as first session for that artist */
function clearDismissedCookie(response: NextResponse): void {
  response.cookies.set(AFFILIATE_DISMISSED_COOKIE_NAME, '', { path: '/', maxAge: 0 })
}

export async function middleware(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fbclid = searchParams.get('fbclid')
  let affiliateSlug: string | undefined
  let affiliateQueryString: string | undefined
  try {
    const raw = getAffiliateArtistSlugFromSearchParams({
      artist: searchParams.get('artist'),
      utm_campaign: searchParams.get('utm_campaign'),
    })
    // Only use slug if safe length (avoid oversized/malformed params affecting response)
    if (raw && raw.length <= 200) affiliateSlug = raw
    // Build affiliate query string for session tracking (artist + UTM params)
    const qs = buildAffiliateQueryString({
      artist: searchParams.get('artist') || (raw ?? undefined),
      utm_source: searchParams.get('utm_source'),
      utm_medium: searchParams.get('utm_medium'),
      utm_campaign: searchParams.get('utm_campaign'),
      utm_content: searchParams.get('utm_content'),
    })
    if (qs) affiliateQueryString = qs
  } catch {
    // Malformed query string (e.g. bad encoding from fbclid) — skip affiliate cookie, continue
  }

  const host = request.headers.get('host') ?? ''

  // Redirect app subdomain to canonical www host.
  if (host === APP_HOST) {
    try {
      const path = request.nextUrl.pathname + request.nextUrl.search
      const dest = new URL(path, `https://${CANONICAL_HOST}`)
      const redirect = NextResponse.redirect(dest, 308)
      setMetaAttributionCookies(redirect, fbclid)
      if (affiliateSlug) {
        setAffiliateCookie(redirect, affiliateSlug)
        clearDismissedCookie(redirect)
      }
      if (affiliateQueryString) setAffiliateSessionCookie(redirect, affiliateQueryString)
      return redirect
    } catch {
      const redirect = NextResponse.redirect(new URL(`https://${CANONICAL_HOST}${request.nextUrl.pathname}`), 308)
      setMetaAttributionCookies(redirect, fbclid)
      if (affiliateSlug) {
        setAffiliateCookie(redirect, affiliateSlug)
        clearDismissedCookie(redirect)
      }
      if (affiliateQueryString) setAffiliateSessionCookie(redirect, affiliateQueryString)
      return redirect
    }
  }

  // Redirect thestreetlamp.com (and www) → www.thestreetcollector.com so product links get affiliate handling
  if (REDIRECT_TO_CANONICAL_HOSTS.includes(host)) {
    try {
      const path = request.nextUrl.pathname + request.nextUrl.search
      const dest = new URL(path, `https://${CANONICAL_HOST}`)
      const redirect = NextResponse.redirect(dest, 308)
      setMetaAttributionCookies(redirect, fbclid)
      if (affiliateSlug) {
        setAffiliateCookie(redirect, affiliateSlug)
        clearDismissedCookie(redirect)
      }
      if (affiliateQueryString) setAffiliateSessionCookie(redirect, affiliateQueryString)
      return redirect
    } catch {
      const redirect = NextResponse.redirect(new URL(`https://${CANONICAL_HOST}${request.nextUrl.pathname}`), 308)
      setMetaAttributionCookies(redirect, fbclid)
      if (affiliateSlug) {
        setAffiliateCookie(redirect, affiliateSlug)
        clearDismissedCookie(redirect)
      }
      if (affiliateQueryString) setAffiliateSessionCookie(redirect, affiliateQueryString)
      return redirect
    }
  }

  // Redirect bare domain to www so requests reach our app
  if (host === BARE_DOMAIN) {
    try {
      const path = request.nextUrl.pathname + request.nextUrl.search
      const wwwUrl = new URL(`https://www.${BARE_DOMAIN}${path}`)
      const redirect = NextResponse.redirect(wwwUrl, 308)
      setMetaAttributionCookies(redirect, fbclid)
      if (affiliateSlug) {
        setAffiliateCookie(redirect, affiliateSlug)
        clearDismissedCookie(redirect)
      }
      if (affiliateQueryString) setAffiliateSessionCookie(redirect, affiliateQueryString)
      return redirect
    } catch {
      const redirect = NextResponse.redirect(new URL(`https://www.${BARE_DOMAIN}${request.nextUrl.pathname}`), 308)
      setMetaAttributionCookies(redirect, fbclid)
      if (affiliateSlug) {
        setAffiliateCookie(redirect, affiliateSlug)
        clearDismissedCookie(redirect)
      }
      if (affiliateQueryString) setAffiliateSessionCookie(redirect, affiliateQueryString)
      return redirect
    }
  }

  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search

  // /experience-v2 and /experience-v2/* → /shop/experience-v2 (legacy experience)
  if (pathname === '/experience-v2' || pathname === '/experience-v2/' || pathname.startsWith('/experience-v2/')) {
    const rest = pathname === '/experience-v2' || pathname === '/experience-v2/' ? '' : pathname.slice('/experience-v2'.length)
    return NextResponse.redirect(new URL(`/shop/experience-v2${rest}${search}`, request.url), 308)
  }

  // /experience and /experience/* → /shop/experience (main experience)
  if (pathname === '/experience' || pathname === '/experience/' || pathname.startsWith('/experience/')) {
    const rest = pathname === '/experience' || pathname === '/experience/' ? '' : pathname.slice('/experience'.length)
    const dest = new URL(`/shop/experience${rest}${search}`, request.url)
    const redirect = NextResponse.redirect(dest, 308)
    setMetaAttributionCookies(redirect, fbclid)
    if (affiliateSlug) {
      setAffiliateCookie(redirect, affiliateSlug)
      clearDismissedCookie(redirect)
    }
    if (affiliateQueryString) setAffiliateSessionCookie(redirect, affiliateQueryString)
    return redirect
  }

  // Supabase auth: email link expired or invalid — redirect to login with friendly error
  const authError = searchParams.get('error')
  const authErrorCode = searchParams.get('error_code')
  const authErrorDesc = searchParams.get('error_description') ?? ''
  if (authError === 'access_denied' && (authErrorCode === 'otp_expired' || /expired|invalid/i.test(authErrorDesc))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'otp_expired')
    const redirect = NextResponse.redirect(loginUrl, 302)
    setMetaAttributionCookies(redirect, fbclid)
    if (affiliateSlug) {
      setAffiliateCookie(redirect, affiliateSlug)
      clearDismissedCookie(redirect)
    }
    if (affiliateQueryString) setAffiliateSessionCookie(redirect, affiliateQueryString)
    return redirect
  }

  // Shopify email tracking links (/_t/c/v3/...) have no app route → redirect to home instead of 404
  if (pathname.startsWith('/_t/c/')) {
    const dest = new URL('/', request.url)
    const redirect = NextResponse.redirect(dest, 302)
    setMetaAttributionCookies(redirect, fbclid)
    if (affiliateSlug) {
      setAffiliateCookie(redirect, affiliateSlug)
      clearDismissedCookie(redirect)
    }
    if (affiliateQueryString) setAffiliateSessionCookie(redirect, affiliateQueryString)
    return redirect
  }

  // Affiliate product links → main page (/); set cookie so Experience applies vendor filter when they open it
  if (pathname.startsWith('/products/')) {
    const dest = new URL('/', request.url)
    const redirect = NextResponse.redirect(dest, 308)
    setMetaAttributionCookies(redirect, fbclid)
    if (affiliateSlug) {
      setAffiliateCookie(redirect, affiliateSlug)
      clearDismissedCookie(redirect)
    } else {
      // No artist/utm in URL (e.g. /products/year-of-the-snake?fbclid=...) — set product handle so experience can resolve vendor → spotlight
      const productHandle = pathname.slice('/products/'.length).replace(/\/.*$/, '').trim()
      if (productHandle && productHandle.length <= 200) {
        redirect.cookies.set(AFFILIATE_PRODUCT_COOKIE_NAME, productHandle, {
          path: '/',
          maxAge: AFFILIATE_COOKIE_MAX_AGE,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        clearDismissedCookie(redirect)
      }
    }
    if (affiliateQueryString) setAffiliateSessionCookie(redirect, affiliateQueryString)
    return redirect
  }
  // Collection links → main landing (/); set cookie from collection handle so Experience gets artist filter (same as /products/*)
  if (pathname.startsWith('/collections/')) {
    const rest = pathname.slice('/collections/'.length).replace(/\/.*$/, '') // first segment only (e.g. tiago-hesp)
    const slugFromPath = rest && rest.length <= 200 ? rest : undefined
    const dest = new URL('/', request.url)
    const redirect = NextResponse.redirect(dest, 308)
    setMetaAttributionCookies(redirect, fbclid)
    const cookieSlug = affiliateSlug || slugFromPath
    if (cookieSlug) {
      setAffiliateCookie(redirect, cookieSlug)
      clearDismissedCookie(redirect)
    }
    if (affiliateQueryString || slugFromPath) {
      setAffiliateSessionCookie(
        redirect,
        affiliateQueryString || buildAffiliateQueryString({ artist: slugFromPath })
      )
    }
    return redirect
  }

  const supabaseResponse = await updateSession(request)
  setMetaAttributionCookies(supabaseResponse, fbclid)

  // If user previously dismissed the affiliate filter, clear affiliate cookies so second session has no filter
  const dismissed = request.cookies.get(AFFILIATE_DISMISSED_COOKIE_NAME)?.value
  if (dismissed) {
    supabaseResponse.cookies.set(AFFILIATE_ARTIST_COOKIE_NAME, '', { path: '/', maxAge: 0 })
    supabaseResponse.cookies.set(AFFILIATE_SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 })
    supabaseResponse.cookies.set(AFFILIATE_PRODUCT_COOKIE_NAME, '', { path: '/', maxAge: 0 })
    supabaseResponse.cookies.set(AFFILIATE_DISMISSED_COOKIE_NAME, '', { path: '/', maxAge: 0 })
  } else {
    // Set affiliate cookies on any request with artist/utm so experience and server can track
    if (affiliateSlug) {
      setAffiliateCookie(supabaseResponse, affiliateSlug)
      clearDismissedCookie(supabaseResponse)
    }
    if (affiliateQueryString) setAffiliateSessionCookie(supabaseResponse, affiliateQueryString)
  }

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
