import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { LOGIN_INTENT_COOKIE } from "@/lib/vendor-auth"

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl
  const redirect = searchParams.get("redirect") || "/collector/dashboard"

  // Use main callback URL so Google OAuth redirect works properly
  let appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
  appUrl = (appUrl || "").replace(/\/$/, "")
  if (!appUrl.startsWith("http://") && !appUrl.startsWith("https://") && origin?.startsWith("http")) {
    appUrl = origin
  }
  const base = appUrl || origin

  const redirectTo = `${base}/auth/callback?redirect=${encodeURIComponent(redirect)}`

  try {
    new URL(redirectTo)
  } catch {
    console.error("[collector-google-start] Invalid redirectTo", redirectTo)
    return NextResponse.json({ error: "Invalid redirect URL configuration" }, { status: 500 })
  }

  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      scopes: "email profile openid",
      flowType: "pkce",
      queryParams: {
        // Override the site_url to ensure correct redirect back to production
        site_url: base,
      },
    },
  })

  if (error || !data?.url) {
    console.error("[collector-google-start] failed", error)
    return NextResponse.json({ error: error?.message || "Unable to start Google sign-in" }, { status: 400 })
  }

  const response = NextResponse.redirect(data.url)
  
  // Set login intent to collector since this is the collector-specific OAuth endpoint
  response.cookies.set(LOGIN_INTENT_COOKIE, 'collector', {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5, // 5 minutes
  })

  return response
}
