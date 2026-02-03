import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session"

/**
 * Check if the current admin user has Gmail sending permissions
 */
export async function GET() {
  try {
    const cookieStore = cookies()
    
    // Verify admin session
    const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminToken)
    
    if (!adminSession) {
      return NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 }
      )
    }

    // Get Supabase user session
    const supabase = createRouteClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "User session not found" },
        { status: 401 }
      )
    }

    // Check if user has Gmail provider tokens in metadata
    const providerToken = user.app_metadata?.provider_token
    const providerRefreshToken = user.app_metadata?.provider_refresh_token

    // Check if the user has Gmail permissions
    // Provider tokens are only available if Gmail scopes were granted
    const hasPermission = !!(providerToken || providerRefreshToken)

    return NextResponse.json({
      hasPermission,
      userId: user.id,
      email: user.email,
      // Don't expose the actual tokens, just their existence
      hasProviderToken: !!providerToken,
      hasRefreshToken: !!providerRefreshToken,
    })
  } catch (error: any) {
    console.error("[check-gmail-permissions] Error:", error)
    return NextResponse.json(
      { error: "Failed to check Gmail permissions" },
      { status: 500 }
    )
  }
}
