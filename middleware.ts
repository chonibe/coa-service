import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
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

  return NextResponse.next()
}

// Update the matcher to explicitly exclude ALL API routes and certificate routes
export const config = {
  matcher: [
    "/admin/:path*",
    // Exclude all API routes and certificate routes from middleware processing
    "/((?!api|certificate|_next/static|_next/image|favicon.ico).*)",
  ],
}
