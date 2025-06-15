import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Enhanced Logging for Comprehensive Debugging
  const logContext = {
    timestamp: new Date().toISOString(),
    requestDetails: {
      fullUrl: req.url,
      pathname: req.nextUrl.pathname,
      host: req.headers.get('host'),
      method: req.method
    },
    authenticationContext: {
      shopifyCustomerId: req.cookies.get('shopify_customer_id')?.value,
      hasAccessToken: !!req.cookies.get('shopify_customer_access_token'),
      shopifyDomain: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN
    }
  }

  console.log('🔍 Middleware Debug: Comprehensive Route Access', logContext)

  // Specific dashboard route handling with enhanced validation
  if (req.nextUrl.pathname.startsWith('/dashboard/')) {
    const customerId = req.nextUrl.pathname.split('/')[2]
    
    const dashboardAccessContext = {
      ...logContext,
      dashboardDetails: {
        requestedCustomerId: customerId,
        cookieCustomerId: req.cookies.get('shopify_customer_id')?.value
      }
    }

    console.log('🚦 Dashboard Route Detailed Analysis', dashboardAccessContext)

    // Strict Authentication Validation
    const shopifyCustomerId = req.cookies.get('shopify_customer_id')?.value
    const shopifyCustomerAccessToken = req.cookies.get('shopify_customer_access_token')?.value

    // Comprehensive Authentication Checks
    if (!shopifyCustomerId) {
      console.warn('⚠️ Missing Customer ID', {
        ...dashboardAccessContext,
        reason: 'No Shopify Customer ID found in cookies'
      })
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (!shopifyCustomerAccessToken) {
      console.warn('⚠️ Missing Access Token', {
        ...dashboardAccessContext,
        reason: 'No Shopify Customer Access Token found'
      })
      return NextResponse.redirect(new URL('/api/auth/shopify', req.url))
    }

    // Customer ID Validation and Redirection
    if (customerId !== shopifyCustomerId) {
      console.warn('🚫 Customer ID Mismatch', {
        ...dashboardAccessContext,
        reason: 'Requested customer ID does not match authenticated customer ID'
      })
      return NextResponse.redirect(new URL(`/dashboard/${shopifyCustomerId}`, req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}


