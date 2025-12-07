import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient as createRouteClient } from "@/lib/supabase-server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/vendor-auth"

/**
 * Debug endpoint to check Gmail sync status
 * Shows token availability, user info, and recent sync status
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteClient(cookieStore)

  try {
    // Get current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const userEmail = session.user.email

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      )
    }

    // ADMIN ONLY
    const email = userEmail.toLowerCase()
    if (!isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    // Get user data with tokens
    const serviceSupabase = createServiceClient()
    const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(userId)

    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: "Failed to get user data", details: userError },
        { status: 500 }
      )
    }

    const user = userData.user
    const providerToken = user.app_metadata?.provider_token as string | undefined
    const providerRefreshToken = user.app_metadata?.provider_refresh_token as string | undefined
    const lastSyncAt = user.app_metadata?.last_gmail_sync_at as string | undefined

    // Check if we have any messages in the database
    const { data: messages, error: messagesError } = await supabase
      .from("crm_messages")
      .select("id, created_at, direction, metadata")
      .order("created_at", { ascending: false })
      .limit(10)

    // Check conversations
    const { data: conversations, error: convError } = await supabase
      .from("crm_conversations")
      .select("id, platform, status, last_message_at")
      .eq("platform", "email")
      .order("last_message_at", { ascending: false })
      .limit(10)

    return NextResponse.json({
      user: {
        id: userId,
        email: email,
        isAdmin: true,
      },
      tokens: {
        hasAccessToken: !!providerToken,
        hasRefreshToken: !!providerRefreshToken,
        accessTokenLength: providerToken?.length || 0,
        refreshTokenLength: providerRefreshToken?.length || 0,
      },
      syncStatus: {
        lastSyncAt: lastSyncAt || null,
        needsSync: !lastSyncAt || (lastSyncAt && (Date.now() - new Date(lastSyncAt).getTime()) > 15 * 60 * 1000),
      },
      database: {
        recentMessages: messages?.length || 0,
        recentConversations: conversations?.length || 0,
        messagesError: messagesError?.message || null,
        conversationsError: convError?.message || null,
        sampleMessages: messages?.slice(0, 3) || [],
        sampleConversations: conversations?.slice(0, 3) || [],
      },
    })
  } catch (error: any) {
    console.error("[Gmail Sync Debug] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error", stack: error.stack },
      { status: 500 }
    )
  }
}




