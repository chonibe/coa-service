import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Normalize path to handle case variations
  const normalizedPath = req.nextUrl.pathname.toLowerCase()
  const originalPath = req.nextUrl.pathname

  // Comprehensive Domain Handling
  const host = req.headers.get('host') || ''
  const allowedDomains = [
    'dashboard.thestreetlamp.com',
    'street-collector-chonibes-projects.vercel.app',
    'localhost:3000'
  ]

  const logContext = {
    timestamp: new Date().toISOString(),
    requestDetails: {
      fullUrl: req.url,
      originalPath,
      normalizedPath,
      host,
      method: req.method
    },
    domainContext: {
      isAllowedDomain: allowedDomains.includes(host),
      allowedDomains
    }
  }

  console.log('🌐 Domain and Routing Analysis', JSON.stringify(logContext, null, 2))

  // Case-Insensitive Dashboard Route Handling
  if (normalizedPath.startsWith('/dashboard/')) {
    const customerId = originalPath.split('/')[2]
    
    const dashboardContext = {
      ...logContext,
      dashboardDetails: {
        requestedCustomerId: customerId,
        cookieCustomerId: req.cookies.get('shopify_customer_id')?.value
      }
    }

    console.log('🚦 Dashboard Route Detailed Analysis', JSON.stringify(dashboardContext, null, 2))

    // Comprehensive Authentication Checks with More Detailed Logging
    const shopifyCustomerId = req.cookies.get('shopify_customer_id')?.value
    const shopifyCustomerAccessToken = req.cookies.get('shopify_customer_access_token')?.value

    // Enhanced Logging for Authentication State
    console.log('🔐 Authentication State', JSON.stringify({
      hasCustomerId: !!shopifyCustomerId,
      hasAccessToken: !!shopifyCustomerAccessToken,
      requestedCustomerId: customerId
    }, null, 2))

    // More Flexible Authentication Logic
    if (!shopifyCustomerId || !shopifyCustomerAccessToken) {
      console.warn('⚠️ Authentication Required', JSON.stringify({
        reason: 'Missing customer ID or access token',
        redirectTo: '/login'
      }, null, 2))
      
      // Create a redirect response with the original destination as a query parameter
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirect', originalPath)
      
      return NextResponse.redirect(loginUrl)
    }

    // More Permissive Customer ID Validation
    if (customerId && customerId.toLowerCase() !== shopifyCustomerId.toLowerCase()) {
      console.warn('🚫 Customer ID Mismatch', JSON.stringify({
        requestedCustomerId: customerId,
        authenticatedCustomerId: shopifyCustomerId,
        action: 'Redirecting to authenticated customer dashboard'
      }, null, 2))
      
      return NextResponse.redirect(new URL(`/dashboard/${shopifyCustomerId}`, req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}


