import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Development mode flag
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Comprehensive authentication logging
  const authenticationDebug = {
    timestamp: new Date().toISOString(),
    path: req.nextUrl.pathname,
    method: req.method,
    cookies: Object.fromEntries(req.cookies.getAll().map(c => [c.name, c.name === 'shopify_customer_id' ? 'REDACTED' : c.value])),
    headers: Object.fromEntries(req.headers.entries())
  }

  console.log('MIDDLEWARE AUTHENTICATION DEBUG:', JSON.stringify(authenticationDebug, null, 2))

  const res = NextResponse.next()

  // Check for Shopify customer authentication
  const shopifyCustomerId = req.cookies.get('shopify_customer_id')
  const shopifyCustomerAccessToken = req.cookies.get('shopify_customer_access_token')

  // More detailed logging for authentication
  console.log('Authentication Check:', {
    hasCustomerId: !!shopifyCustomerId,
    hasAccessToken: !!shopifyCustomerAccessToken,
    isDevelopment
  })

  // Redirect to Shopify OAuth if no authentication for customer routes
  if ((!shopifyCustomerId || !shopifyCustomerAccessToken) && req.nextUrl.pathname.startsWith('/customer')) {
    // More flexible in development mode
    if (!isDevelopment) {
      console.warn('Redirecting to Shopify authentication', { path: req.nextUrl.pathname })
      return NextResponse.redirect(new URL('/api/auth/shopify', req.url))
    } else {
      console.warn('Development mode: Bypassing customer authentication', { path: req.nextUrl.pathname })
    }
  }

  // For customer dashboard routes, ensure user is properly authenticated
  if (req.nextUrl.pathname.startsWith('/customer/dashboard')) {
    if (!shopifyCustomerId) {
      // More flexible in development mode
      if (!isDevelopment) {
        console.warn('Redirecting to Shopify authentication for dashboard', { path: req.nextUrl.pathname })
        return NextResponse.redirect(new URL('/api/auth/shopify', req.url))
      } else {
        console.warn('Development mode: Bypassing dashboard authentication', { path: req.nextUrl.pathname })
      }
    }
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/customer/:path*']
}
