import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are required for collector Google sign-in")
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl
  const redirect = searchParams.get("redirect") || "/collector/dashboard"

  const redirectTo = `${origin}/auth/collector/callback?redirect=${encodeURIComponent(redirect)}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      scopes: "email profile openid",
      flowType: "pkce",
    },
  })

  if (error || !data?.url) {
    console.error("[collector-google-start] failed", error)
    return NextResponse.json({ error: error?.message || "Unable to start Google sign-in" }, { status: 400 })
  }

  return NextResponse.redirect(data.url)
}

