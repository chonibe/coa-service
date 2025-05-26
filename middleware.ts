import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Get the hostname
  const hostname = req.headers.get('host') || ''
  const isAdminDomain = hostname === 'admin.thestreetlamp.com'
  const isDashboardDomain = hostname === 'dashboard.thestreetlamp.com'

  // Handle admin domain specifically
  if (isAdminDomain) {
    // Check for admin session cookie
    const adminSession = req.cookies.get('admin_session')
    
    // If no admin session and not on login page, redirect to login
    if (!adminSession && !req.nextUrl.pathname.startsWith('/admin/login')) {
      const loginUrl = new URL('/admin/login', req.url)
      return NextResponse.redirect(loginUrl)
    }

    // If has admin session and on login page, redirect to admin dashboard
    if (adminSession && req.nextUrl.pathname.startsWith('/admin/login')) {
      const dashboardUrl = new URL('/admin', req.url)
      return NextResponse.redirect(dashboardUrl)
    }

    return res
  }

  // Handle dashboard domain
  if (isDashboardDomain) {
    // Get the customer ID from either account or customer_id parameter
    const customerId = req.nextUrl.searchParams.get('customer_id') || req.nextUrl.searchParams.get('account')

    // If we're on the root path, allow access without customer ID
    if (req.nextUrl.pathname === '/') {
      return res
    }

    // For other paths, require customer ID
    if (!customerId) {
      const storeUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || 'https://thestreetlamp.com'
      try {
        return NextResponse.redirect(new URL('/account', storeUrl))
      } catch (error) {
        console.error('Invalid store URL:', error)
        return NextResponse.redirect(new URL('/account', 'https://thestreetlamp.com'))
      }
    }

    // Check if user is already authenticated
    const { data: { session } } = await supabase.auth.getSession()

    // If not authenticated, sign in the customer
    if (!session) {
      // Sign in the customer using their Shopify ID
      const { error } = await supabase.auth.signInWithPassword({
        email: `${customerId}@shopify.com`,
        password: customerId
      })

      if (error) {
        // If sign in fails, try to sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${customerId}@shopify.com`,
          password: customerId,
          options: {
            data: {
              customer_id: customerId
            }
          }
        })

        if (signUpError) {
          console.error('Auth error:', signUpError)
          return NextResponse.redirect(new URL('/auth/error', req.url))
        }
      }
    }

    // If we're on the root path with an account parameter, redirect to the dashboard
    if (req.nextUrl.pathname === '/' && customerId) {
      try {
        return NextResponse.redirect(new URL(`/dashboard?customer_id=${customerId}`, req.url))
      } catch (error) {
        console.error('Invalid dashboard URL:', error)
        return NextResponse.redirect(new URL(`/dashboard?customer_id=${customerId}`, 'https://dashboard.thestreetlamp.com'))
      }
    }
  }

  return res
}

// Update the matcher to properly exclude API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
}
