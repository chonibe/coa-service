import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session"
import { getUserActiveRoles } from "@/lib/rbac/role-helpers"

/**
 * GET /api/admin/messaging/settings/admin-users
 * Get list of admin users with their Gmail permission status
 */
export async function GET() {
  try {
    const cookieStore = cookies()
    const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(adminToken)
    
    if (!adminSession) {
      return NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 }
      )
    }

    const supabase = createClient()
    const routeClient = createRouteClient(cookieStore)
    
    // Get current user
    const { data: { user: currentUser } } = await routeClient.auth.getUser()
    const currentUserId = currentUser?.id

    // Get all users with admin role from user_roles
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .eq("is_active", true)

    if (rolesError) {
      console.error("[admin-users] Error fetching admin roles:", rolesError)
      return NextResponse.json(
        { error: "Failed to fetch admin users" },
        { status: 500 }
      )
    }

    if (!adminRoles || adminRoles.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Get user details for each admin
    const userPromises = adminRoles.map(async (role) => {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(role.user_id)
        
        if (userError || !userData.user) {
          console.warn(`[admin-users] Could not fetch user ${role.user_id}:`, userError)
          return null
        }

        const user = userData.user
        
        // Check if user has Gmail permissions
        const hasGmailPermission = !!(
          user.app_metadata?.provider_token || 
          user.app_metadata?.provider_refresh_token
        )

        return {
          id: user.id,
          email: user.email || "Unknown",
          hasGmailPermission,
          isCurrentUser: user.id === currentUserId,
          lastAuthorized: user.app_metadata?.provider_token 
            ? new Date(user.last_sign_in_at || user.updated_at || "").toISOString()
            : undefined,
        }
      } catch (error) {
        console.error(`[admin-users] Error processing user ${role.user_id}:`, error)
        return null
      }
    })

    const users = (await Promise.all(userPromises))
      .filter((user): user is NonNullable<typeof user> => user !== null)
      .sort((a, b) => {
        // Sort: current user first, then by Gmail permission, then by email
        if (a.isCurrentUser) return -1
        if (b.isCurrentUser) return 1
        if (a.hasGmailPermission !== b.hasGmailPermission) {
          return a.hasGmailPermission ? -1 : 1
        }
        return a.email.localeCompare(b.email)
      })

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error("[admin-users] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
