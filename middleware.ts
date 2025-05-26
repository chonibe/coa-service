import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase"

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Get the customer ID from the URL path
  const customerId = path.split('/').pop()

  // Check if we're on the dashboard domain
  if (request.headers.get("host")?.includes("dashboard.thestreetlamp.com")) {
    // If we're on the root path, allow access
    if (path === "/") {
      return res
    }

    // If we're on the dashboard path without a customer ID, redirect to root
    if (path === "/dashboard" && !customerId) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    // If we have a customer ID, verify it exists in Supabase
    if (customerId) {
      if (!supabase) {
        console.error("Supabase client not initialized")
        return NextResponse.redirect(new URL("/", request.url))
      }

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // If not authenticated, redirect to Shopify login
        const storeUrl = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || "https://www.thestreetlamp.com"
        return NextResponse.redirect(new URL("/account/login", storeUrl))
      }

      // Verify the customer ID matches the authenticated user
      const { data: userData } = await supabase.auth.getUser()
      const userCustomerId = userData?.user?.user_metadata?.customer_id

      if (userCustomerId !== customerId) {
        return NextResponse.redirect(new URL("/", request.url))
      }
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
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
}
