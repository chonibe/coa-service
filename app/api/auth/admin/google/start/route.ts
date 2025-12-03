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

/**
 * Admin-only Google OAuth start
 * ALWAYS requests Gmail scopes for CRM email sync
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const redirectParam = searchParams.get("redirect") || "/admin/dashboard"

  const redirectTo = `${origin}/auth/admin/callback`
  
  console.log("[admin/google/start] OAuth redirect configuration:", {
    origin,
    redirectTo,
    fullUrl: request.url,
  })

  // ALWAYS request Gmail scopes for admin login
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      scopes: "email profile openid https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send",
      flowType: "pkce",
      queryParams: {
        prompt: "consent", // Always request consent to ensure Gmail permissions
        access_type: "offline", // Request refresh token
      },
    },
  })

  if (error || !data?.url) {
    console.error("Failed to start admin Google sign-in:", error)
    return NextResponse.json({ error: error?.message || "Unable to start Google sign-in" }, { status: 400 })
  }

  const response = NextResponse.redirect(data.url)

  // Store redirect destination
  if (redirectParam) {
    response.cookies.set("admin_post_login_redirect", redirectParam, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 5, // 5 minutes
    })
  }

  return response
}

