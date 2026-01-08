import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const redirectUrl = new URL("/login", appUrl)
  return NextResponse.redirect(redirectUrl)
}

