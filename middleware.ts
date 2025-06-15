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

  console.log('🌐 Domain and Routing Analysis', logContext)

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

    console.log('🚦 Dashboard Route Detailed Analysis', dashboardContext)

    // Strict Authentication Validation
    const shopifyCustomerId = req.cookies.get('shopify_customer_id')?.value
    const shopifyCustomerAccessToken = req.cookies.get('shopify_customer_access_token')?.value

    // Comprehensive Authentication Checks
    if (!shopifyCustomerId) {
      console.warn('⚠️ Missing Customer ID', {
        ...dashboardContext,
        reason: 'No Shopify Customer ID found in cookies'
      })
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (!shopifyCustomerAccessToken) {
      console.warn('⚠️ Missing Access Token', {
        ...dashboardContext,
        reason: 'No Shopify Customer Access Token found'
      })
      return NextResponse.redirect(new URL('/api/auth/shopify', req.url))
    }

    // Case-Insensitive Customer ID Validation
    if (customerId.toLowerCase() !== shopifyCustomerId.toLowerCase()) {
      console.warn('🚫 Customer ID Mismatch', {
        ...dashboardContext,
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


