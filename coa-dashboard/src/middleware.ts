import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Get the customer ID from the URL
  const customerId = req.nextUrl.searchParams.get('customer_id')

  // If no customer ID is provided, redirect to the main store
  if (!customerId) {
    const storeUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || 'https://thestreetlamp.com'
    return NextResponse.redirect(new URL('/account', storeUrl))
  }

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

  return res
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