import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { POST_LOGIN_REDIRECT_COOKIE, sanitizeRedirectTarget } from "@/lib/vendor-auth"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are required for Google sign-in")
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const DEFAULT_REDIRECT = "/vendor/dashboard"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const requestedRedirect = searchParams.get("redirect")
  const redirect = sanitizeRedirectTarget(requestedRedirect, origin, DEFAULT_REDIRECT)

  const redirectTo = `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      scopes: "email profile openid",
    },
  })

  if (error || !data?.url) {
    console.error("Failed to start Google sign-in:", error)
    return NextResponse.json({ error: error?.message || "Unable to start Google sign-in" }, { status: 400 })
  }

  const response = NextResponse.redirect(data.url)
  response.cookies.set(POST_LOGIN_REDIRECT_COOKIE, redirect, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5,
  })

  return response
}

