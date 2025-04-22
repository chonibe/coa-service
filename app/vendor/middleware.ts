import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Skip the login page and the Instagram authentication callback
  if (request.nextUrl.pathname === "/vendor/login" || request.nextUrl.pathname.startsWith("/api/auth/instagram")) {
    return NextResponse.next()
  }

  // Check if the vendor is authenticated
  const isAuthenticated = request.cookies.has("vendor_session") || request.cookies.has("instagram_session")

  if (!isAuthenticated) {
    // Redirect to the login page
    const loginUrl = new URL("/vendor/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/vendor/:path*"],
}
