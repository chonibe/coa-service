import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Skip the login page
  if (request.nextUrl.pathname === "/vendor/login") {
    return NextResponse.next()
  }

  // Check if the vendor is authenticated
  const isAuthenticated = request.cookies.has("vendor_session")

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
