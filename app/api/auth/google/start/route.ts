import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { REQUIRE_ACCOUNT_SELECTION_COOKIE } from "@/lib/vendor-auth"

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
  const cookieStore = cookies()

  // Check if account selection is required (user logged out previously)
  const requireAccountSelection = cookieStore.get(REQUIRE_ACCOUNT_SELECTION_COOKIE)?.value === "true"

  const redirectTo = `${origin}/auth/callback`

  // Build OAuth options
  const oauthOptions: {
    redirectTo: string
    scopes: string
    flowType: string
    queryParams?: Record<string, string>
  } = {
    redirectTo,
    scopes: "email profile openid",
    flowType: "pkce",
  }

  // If account selection is required, force Google to show account selector
  if (requireAccountSelection) {
    oauthOptions.queryParams = {
      prompt: "select_account",
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: oauthOptions,
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

