import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Check if the path is for an API route
  if (path.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Check if the path is for admin routes and enforce authentication
  if (path.startsWith("/admin/") && path !== "/admin/login") {
    // Get the token from the cookies
    const token = request.cookies.get("admin_token")?.value

    // If there's no token, redirect to the login page
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // Handle 404 errors by redirecting to a custom error page
  // This is a fallback for routes that don't exist
  try {
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.redirect(new URL("/error?code=404", request.url))
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all paths except for static files, api routes, and _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico)|api).*)",
  ],
}
