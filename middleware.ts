import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

// Define the routes that should be protected
const VENDOR_PROTECTED_ROUTES = ["/vendor/dashboard"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route should be protected
  const isVendorProtectedRoute = VENDOR_PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  if (isVendorProtectedRoute) {
    const token = request.cookies.get("vendor_token")?.value

    if (!token) {
      // Redirect to login if no token is found
      return NextResponse.redirect(new URL("/vendor/login", request.url))
    }

    try {
      // Verify the token
      const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || "your-jwt-secret-key")

      const { payload } = await jwtVerify(token, jwtSecret)

      // Check if the token is for a vendor
      if (payload.role !== "vendor") {
        return NextResponse.redirect(new URL("/vendor/login", request.url))
      }

      // Continue to the protected route
      return NextResponse.next()
    } catch (error) {
      // Token is invalid or expired
      return NextResponse.redirect(new URL("/vendor/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/vendor/:path*"],
}
