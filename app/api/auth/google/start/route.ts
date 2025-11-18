import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

const POST_LOGIN_COOKIE = "vendor_post_login_redirect"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const redirectParam = searchParams.get("redirect")

  const redirectTo = `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      scopes: "email profile openid",
      flowType: "pkce",
    },
  })

  if (error || !data?.url) {
    console.error("Failed to start Google sign-in:", error)
    return NextResponse.json({ error: error?.message || "Unable to start Google sign-in" }, { status: 400 })
  }

  const response = NextResponse.redirect(data.url)

  if (redirectParam) {
    response.cookies.set(POST_LOGIN_COOKIE, redirectParam, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 5,
    })
  } else {
    response.cookies.set(POST_LOGIN_COOKIE, "", {
      path: "/",
      maxAge: 0,
    })
  }

  return response
}

