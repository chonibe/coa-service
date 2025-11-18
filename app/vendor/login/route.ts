import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function GET(request: NextRequest) {
  const redirectUrl = new URL("/", request.nextUrl.origin)
  return NextResponse.redirect(redirectUrl)
}

