import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJWT } from "@/lib/jwt"

export async function middleware(request: NextRequest) {
  // Check if the request is for an admin page (except the login page)
  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
    // Check if the user is authenticated
    const isAuthenticated = request.cookies.has("admin_session")

    if (!isAuthenticated) {
      // Redirect to the login page
      const loginUrl = new URL("/admin/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Check if the request is for a vendor dashboard page
  if (request.nextUrl.pathname.startsWith("/vendor") && !request.nextUrl.pathname.startsWith("/vendor/login")) {
    const token = request.cookies.get("vendor_token")?.value

    if (!token) {
      // Redirect to the vendor login page
      const loginUrl = new URL("/vendor/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Verify the JWT token
    const verified = await verifyJWT(token)

    if (!verified) {
      // Redirect to the vendor login page
      const loginUrl = new URL("/vendor/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Check if the request is for an admin payouts page
  if (request.nextUrl.pathname.startsWith("/admin/vendors/payouts")) {
    // Check if the user is authenticated
    const isAuthenticated = request.cookies.has("admin_session")

    if (!isAuthenticated) {
      // Redirect to the admin login page
      const loginUrl = new URL("/admin/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

// Update the matcher to explicitly exclude ALL API routes and certificate routes
export const config = {
  matcher: [
    "/admin/:path*",
    "/vendor/:path*",
    "/admin/vendors/payouts",
    // Exclude all API routes and certificate routes from middleware processing
    "/((?!api|certificate|_next/static|_next/image|favicon.ico).*)",
  ],
}
