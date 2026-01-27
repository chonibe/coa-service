import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"

const deleteCookie = (response: NextResponse, name: string) => {
  response.cookies.set(name, "", { path: "/", maxAge: 0 })
}

/**
 * NEW RBAC-based callback handler
 * Uses user_roles table to determine redirect destination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = request.nextUrl
    
    console.log("[auth/callback] Incoming RBAC callback:", {
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries()),
      origin
    })
    
    const cookieStore = cookies()
    const supabase = createRouteClient(cookieStore)
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    // Handle OAuth errors
    if (error) {
      console.error("[auth/callback] OAuth error:", error, errorDescription)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}`, origin),
        { status: 307 }
      )
    }

    // Exchange code for session
    if (!code) {
      console.error("[auth/callback] No authorization code provided")
      return NextResponse.redirect(
        new URL("/login?error=missing_code", origin),
        { status: 307 }
      )
    }

    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !sessionData?.session?.user) {
      console.error("[auth/callback] Failed to exchange code:", exchangeError)
      return NextResponse.redirect(
        new URL("/login?error=authentication_failed", origin),
        { status: 307 }
      )
    }

    const user = sessionData.session.user
    const email = user.email?.toLowerCase() ?? null

    console.log(`[auth/callback] User authenticated: ${email}`)

    // Query user_roles table to get all roles for this user
    const serviceClient = createServiceClient()
    const { data: userRoles, error: rolesError } = await serviceClient
      .from("user_roles")
      .select("role, resource_id, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .is("expires_at", null)
      .or(`expires_at.gt.${new Date().toISOString()}`)

    if (rolesError) {
      console.error("[auth/callback] Error fetching user roles:", rolesError)
      // Continue without roles - will redirect to not_registered
    }

    const roles = userRoles?.map(r => r.role) || []
    
    console.log(`[auth/callback] User roles:`, {
      email,
      roles,
      roleCount: roles.length
    })

    // Determine redirect based on roles (priority: admin > vendor > collector)
    let redirectPath = "/login?error=not_registered"
    
    if (roles.includes("admin")) {
      // Admin users go to admin dashboard
      redirectPath = "/admin/dashboard"
      console.log(`[auth/callback] Redirecting admin to: ${redirectPath}`)
    } else if (roles.includes("vendor")) {
      // Vendor users go to vendor dashboard
      redirectPath = "/vendor/dashboard"
      console.log(`[auth/callback] Redirecting vendor to: ${redirectPath}`)
    } else if (roles.includes("collector")) {
      // Collector users go to collector dashboard
      redirectPath = "/collector/dashboard"
      console.log(`[auth/callback] Redirecting collector to: ${redirectPath}`)
    } else {
      // No roles found - user not registered
      console.log(`[auth/callback] No roles found for user ${email}`)
      await supabase.auth.signOut()
    }

    const redirectUrl = new URL(redirectPath, origin)
    const redirectResponse = NextResponse.redirect(redirectUrl, { status: 307 })

    return redirectResponse

  } catch (error: any) {
    console.error('[auth/callback] Unexpected error:', error)
    
    // Check if it's a redirect (expected behavior)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('An error occurred during login')}`, request.nextUrl.origin),
      { status: 307 }
    )
  }
}
