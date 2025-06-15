import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('🔍 Middleware Debug: Dashboard Route Access', {
    fullUrl: req.url,
    pathname: req.nextUrl.pathname,
    host: req.headers.get('host'),
    shopifyCustomerId: req.cookies.get('shopify_customer_id')?.value,
    accessToken: !!req.cookies.get('shopify_customer_access_token'),
    method: req.method
  })

  // Specific dashboard route handling
  if (req.nextUrl.pathname.startsWith('/dashboard/')) {
    const customerId = req.nextUrl.pathname.split('/')[2]
    
    console.log('🚦 Dashboard Route Details', {
      customerId,
      authenticationStatus: {
        hasCustomerId: !!customerId,
        cookieCustomerId: req.cookies.get('shopify_customer_id')?.value
      }
    })

    // Enhanced authentication check
    const shopifyCustomerId = req.cookies.get('shopify_customer_id')?.value
    const shopifyCustomerAccessToken = req.cookies.get('shopify_customer_access_token')?.value

    if (!shopifyCustomerId || !shopifyCustomerAccessToken) {
      console.warn('⚠️ Unauthorized Dashboard Access Attempt', {
        reason: 'Missing authentication',
        requestedRoute: req.nextUrl.pathname
      })

      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Validate customer ID match
    if (customerId !== shopifyCustomerId) {
      console.warn('🚫 Customer ID Mismatch', {
        requestedId: customerId,
        authenticatedId: shopifyCustomerId
      })

      return NextResponse.redirect(new URL('/dashboard/' + shopifyCustomerId, req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}

