import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Check for Street Lamp authentication token and customer ID
  const streetLampToken = req.cookies.get('street_lamp_token')
  const customerId = req.cookies.get('customer_id')

  // Redirect to login if no token or customer ID for protected routes
  if ((!streetLampToken || !customerId) && req.nextUrl.pathname.startsWith('/customer')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If customer ID is present, ensure routing matches the customer's ID
  if (customerId && req.nextUrl.pathname.startsWith('/customer/dashboard')) {
    const pathParts = req.nextUrl.pathname.split('/')
    const requestedCustomerId = pathParts[pathParts.length - 1]
    
    if (requestedCustomerId !== customerId.value) {
      return NextResponse.redirect(new URL(`/customer/dashboard/${customerId.value}`, req.url))
    }
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/customer/:path*']
}
