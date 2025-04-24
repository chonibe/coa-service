import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the path is for admin routes and enforce authentication
  const path = request.nextUrl.pathname

  if (path.startsWith("/admin/") && path !== "/admin/login") {
    // Get the token from the cookies
    const token = request.cookies.get("admin_token")?.value

    // If there's no token, redirect to the login page
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/admin/:path*"],
}
