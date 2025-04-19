import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  // Get the base URL from different sources
  const requestUrl = request.url
  const nextUrl = request.nextUrl.toString()
  const origin = request.nextUrl.origin
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || "Not set"

  // Log all URL information for debugging
  console.log("Request URL:", requestUrl)
  console.log("Next URL:", nextUrl)
  console.log("Origin:", origin)
  console.log("NEXT_PUBLIC_APP_URL:", envUrl)

  return NextResponse.json({
    requestUrl,
    nextUrl,
    origin,
    envUrl,
    headers: Object.fromEntries(request.headers.entries()),
    // Try to construct the correct URL
    correctCronUrl: `${origin}/api/cron/sync-shopify-orders`,
  })
}
