import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { REQUIRE_ACCOUNT_SELECTION_COOKIE, LOGIN_INTENT_COOKIE } from "@/lib/vendor-auth"
import { createClient as createRouteClient } from "@/lib/supabase-server"

const POST_LOGIN_COOKIE = "vendor_post_login_redirect"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const redirectParam = searchParams.get("redirect")
  const gmailParam = searchParams.get("gmail") === "true" // Check if Gmail scopes requested
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Supabase environment variables are required for Google sign-in" },
      { status: 500 }
    )
  }

  // Check if account selection is required (user logged out previously)
  const requireAccountSelection = cookieStore.get(REQUIRE_ACCOUNT_SELECTION_COOKIE)?.value === "true"

  // Ensure we use the correct origin for redirects
  // Validate and construct the redirect URL properly
  let appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
  
  // Ensure appUrl is a valid absolute URL
  if (!appUrl) {
    console.error("NEXT_PUBLIC_APP_URL is not set and origin is missing")
    return NextResponse.json(
      { error: "Application URL is not configured. Please set NEXT_PUBLIC_APP_URL environment variable." },
      { status: 500 }
    )
  }
  
  // Remove trailing slash and ensure it has a protocol
  appUrl = appUrl.replace(/\/$/, "")
  if (!appUrl.startsWith("http://") && !appUrl.startsWith("https://")) {
    // If origin doesn't have protocol, try to construct it
    if (origin && origin.startsWith("http")) {
      appUrl = origin
    } else {
      console.error(`Invalid appUrl format: ${appUrl}`)
      return NextResponse.json(
        { error: "Application URL is improperly formatted. It must start with http:// or https://" },
        { status: 500 }
      )
    }
  }
  
  // Construct the redirect URL
  const redirectTo = `${appUrl}/auth/callback`
  
  // Validate the redirect URL is properly formatted
  try {
    new URL(redirectTo)
  } catch (urlError) {
    console.error(`Invalid redirectTo URL: ${redirectTo}`, urlError)
    return NextResponse.json(
      { error: "Redirect URL is improperly formatted" },
      { status: 500 }
    )
  }

  // Only request Gmail scopes for explicit admin login or when gmail=true is set
  // This ensures collectors/vendors never get Gmail permission prompts
  const isAdminLogin = searchParams.get("admin") === "true"
  const isAdminRedirect = redirectParam?.startsWith("/admin/")
  
  // Gmail scopes are ONLY requested when:
  // 1. Explicitly requested via gmail=true param, OR
  // 2. This is an admin login (admin=true param) AND redirecting to admin portal
  const requestGmailScopes = gmailParam || (isAdminLogin && isAdminRedirect)

  // Build OAuth options
  const oauthOptions: {
    redirectTo: string
    scopes: string
    flowType: string
    queryParams?: Record<string, string>
  } = {
    redirectTo,
    // Request Gmail scopes for admin users or when explicitly requested
    scopes: requestGmailScopes
      ? "email profile openid https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send"
      : "email profile openid",
    flowType: "pkce",
    queryParams: {
      // Override the site_url to ensure correct redirect back to production
      site_url: appUrl,
    },
  }

  // Only use prompt=consent for Gmail scopes (sensitive permissions require consent)
  if (gmailParam) {
    if (requireAccountSelection) {
      oauthOptions.queryParams = {
        ...oauthOptions.queryParams,
        prompt: "select_account consent",
      }
    } else {
      oauthOptions.queryParams = {
        ...oauthOptions.queryParams,
        prompt: "consent",
      }
    }
  } else if (requireAccountSelection) {
    // For regular auth, only prompt for account selection if needed
    oauthOptions.queryParams = {
      ...oauthOptions.queryParams,
      prompt: "select_account",
    }
  }

  // Log the redirectTo URL for debugging (without exposing sensitive data)
  console.log("[auth/google/start] Starting OAuth with redirectTo:", redirectTo.replace(/\/[^\/]*$/, "/***"))
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: oauthOptions,
  })

  if (error || !data?.url) {
    console.error("[auth/google/start] Failed to start Google sign-in:", {
      error: error,
      errorMessage: error?.message,
      errorCode: (error as any)?.code,
      errorStatusCode: (error as any)?.status,
      redirectTo: redirectTo.replace(/\/[^\/]*$/, "/***"), // Log partial URL for debugging
      appUrl: appUrl.replace(/\/[^\/]*$/, "/***"), // Log partial URL for debugging
      hasNEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    })
    
    // Check if it's a URL formatting error
    if (error?.message?.toLowerCase().includes("url") || error?.message?.toLowerCase().includes("format")) {
      return NextResponse.json(
        { 
          error: "Redirect URL is improperly formatted",
          details: "Please ensure NEXT_PUBLIC_APP_URL is set correctly (e.g., https://app.thestreetcollector.com without trailing slash)",
          error_code: (error as any)?.code || "url_format_error"
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error?.message || "Unable to start Google sign-in",
        error_code: (error as any)?.code || "oauth_error"
      },
      { status: 400 }
    )
  }

  const response = NextResponse.redirect(data.url)

  // Set login intent based on redirect parameter
  let loginIntent = 'collector' // default to collector
  if (redirectParam) {
    if (redirectParam.includes('/admin/')) {
      loginIntent = 'admin'
    } else if (redirectParam.includes('/vendor/')) {
      loginIntent = 'vendor'
    } else if (redirectParam.includes('/collector/')) {
      loginIntent = 'collector'
    }
    
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

  // Set login intent cookie to track which role the user wants to use
  response.cookies.set(LOGIN_INTENT_COOKIE, loginIntent, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5, // 5 minutes (same as POST_LOGIN_COOKIE)
  })

  return response
}

