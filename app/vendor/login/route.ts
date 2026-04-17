import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Legacy vendor login URL.
 *
 * Preserves any incoming query parameters (e.g. `?error=session_missing`) and
 * forwards to the canonical `/login?intent=vendor` so the login page can render
 * the right error copy and role-appropriate layout.
 */
export function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const redirectUrl = new URL("/login", appUrl)

  // Carry over any incoming query params (error codes, redirect, etc.)
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    redirectUrl.searchParams.set(key, value)
  }

  // Force vendor intent so the login page renders vendor copy
  if (!redirectUrl.searchParams.has("intent")) {
    redirectUrl.searchParams.set("intent", "vendor")
  }

  return NextResponse.redirect(redirectUrl)
}
