import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { LOGIN_INTENT_COOKIE } from "@/lib/vendor-auth"

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl
  const redirect = searchParams.get("redirect") || "/shop/experience"

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
    console.error("[collector-facebook-start] Invalid redirectTo", redirectTo)
    return NextResponse.json({ error: "Invalid redirect URL configuration" }, { status: 500 })
  }

  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo,
      scopes: "email public_profile",
      flowType: "pkce",
      queryParams: {
        site_url: base,
      },
    },
  })

  if (error || !data?.url) {
    console.error("[collector-facebook-start] failed", error)
    return NextResponse.json({
      error: error?.message || "Unable to start Facebook sign-in. Ensure Facebook is enabled in Supabase Auth.",
    }, { status: 400 })
  }

  const response = NextResponse.redirect(data.url)

  response.cookies.set(LOGIN_INTENT_COOKIE, "collector", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5, // 5 minutes
  })

  return response
}
