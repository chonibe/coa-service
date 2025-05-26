import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Get the customer ID from either account or customer_id parameter
  const customerId = req.nextUrl.searchParams.get('customer_id') || req.nextUrl.searchParams.get('account')

  // If no customer ID is provided, redirect to the main store
  if (!customerId) {
    const storeUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || 'https://thestreetlamp.com'
    return NextResponse.redirect(new URL('/account', storeUrl))
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
    return NextResponse.redirect(new URL(`/dashboard?customer_id=${customerId}`, req.url))
  }

  const hostname = req.headers.get('host') || ''
  const path = req.nextUrl.pathname

  // Only handle root path
  if (path !== '/') {
    return res
  }

  // Handle different domains
  if (hostname === 'dashboard.thestreetlamp.com') {
    return NextResponse.rewrite(new URL('/dashboard/welcome', req.url))
  }

  if (hostname === 'admin.thestreetlamp.com') {
    return NextResponse.rewrite(new URL('/admin', req.url))
  }

  if (hostname === 'artist.thestreetlamp.com') {
    return NextResponse.rewrite(new URL('/artist', req.url))
  }

  // Default to main site
  return NextResponse.redirect('https://www.thestreetlamp.com')
}

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