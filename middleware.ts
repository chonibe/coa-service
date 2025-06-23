import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Development mode flag
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Check for Shopify customer authentication
  const shopifyCustomerId = req.cookies.get('shopify_customer_id')
  const shopifyCustomerAccessToken = req.cookies.get('shopify_customer_access_token')

  // Redirect to Shopify OAuth if no authentication for customer routes
  if ((!shopifyCustomerId || !shopifyCustomerAccessToken) && req.nextUrl.pathname.startsWith('/customer')) {
    // More flexible in development mode
    if (!isDevelopment) {
      return NextResponse.redirect(new URL('/api/auth/shopify', req.url))
    } else {
      console.warn('Development mode: Bypassing customer authentication')
    }
  }

  // For customer dashboard routes, ensure user is properly authenticated
  if (req.nextUrl.pathname.startsWith('/customer/dashboard')) {
    if (!shopifyCustomerId) {
      // More flexible in development mode
      if (!isDevelopment) {
        return NextResponse.redirect(new URL('/api/auth/shopify', req.url))
      } else {
        console.warn('Development mode: Bypassing dashboard authentication')
      }
    }
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/customer/:path*']
}
