import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('Middleware Triggered:', {
    path: req.nextUrl.pathname,
    shopifyCustomerId: req.cookies.get('shopify_customer_id')?.value,
    hasAccessToken: !!req.cookies.get('shopify_customer_access_token')
  })

  const res = NextResponse.next()

  // Check for Shopify customer authentication
  const shopifyCustomerId = req.cookies.get('shopify_customer_id')
  const shopifyCustomerAccessToken = req.cookies.get('shopify_customer_access_token')

  // Enhanced logging for dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('Dashboard Route Accessed:', {
      fullUrl: req.url,
      customerId: req.nextUrl.pathname.split('/').pop(),
      authStatus: {
        hasCustomerId: !!shopifyCustomerId,
        hasAccessToken: !!shopifyCustomerAccessToken
      }
    })
  }

  // Redirect to Shopify OAuth if no authentication for customer routes
  if ((!shopifyCustomerId || !shopifyCustomerAccessToken) && req.nextUrl.pathname.startsWith('/customer')) {
    console.log('Redirecting to Shopify OAuth: No authentication')
    return NextResponse.redirect(new URL('/api/auth/shopify', req.url))
  }

  // For customer dashboard routes, ensure user is properly authenticated
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!shopifyCustomerId) {
      console.log('Redirecting to Shopify OAuth: No customer ID for dashboard')
      return NextResponse.redirect(new URL('/api/auth/shopify', req.url))
    }
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/customer/:path*', '/dashboard/:path*']
}
