import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Check for Shopify customer authentication
  const shopifyCustomerId = req.cookies.get('shopify_customer_id')
  const shopifyCustomerAccessToken = req.cookies.get('shopify_customer_access_token')

  // Redirect to Shopify OAuth if no authentication for customer routes
  if ((!shopifyCustomerId || !shopifyCustomerAccessToken) && req.nextUrl.pathname.startsWith('/customer')) {
    return NextResponse.redirect(new URL('/api/auth/shopify', req.url))
  }

  // For customer dashboard routes, ensure user is properly authenticated
  if (req.nextUrl.pathname.startsWith('/customer/dashboard')) {
    if (!shopifyCustomerId) {
      return NextResponse.redirect(new URL('/api/auth/shopify', req.url))
    }
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/customer/:path*']
}
