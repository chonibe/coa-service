import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl
  const isAdminDomain = hostname === 'admin.thestreetlamp.com'
  const isDashboardDomain = hostname === 'dashboard.thestreetlamp.com'

  // Handle admin domain
  if (isAdminDomain) {
    const adminSession = request.cookies.get('admin_session')
    if (!adminSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Handle dashboard domain
  if (isDashboardDomain) {
    // Allow access to the root path without customer ID
    if (pathname === '/') {
      return NextResponse.next()
    }

    // For dashboard routes, check for customer ID
    const customerId = request.nextUrl.searchParams.get('customer_id')
    if (!customerId) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Verify customer exists in Supabase
    if (!supabase) {
      console.error('Supabase client not initialized')
      return NextResponse.redirect(new URL('/', request.url))
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .single()

    if (error || !customer) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
